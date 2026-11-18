// Legătura laptop ↔ telefoane (telecomanda și quiz-ul), fără WebRTC.
//
// Mod „cloud” (implicit): mesajele trec prin câteva brokere MQTT publice, pe wss, ca într-un chat.
// Laptopul și telefoanele se conectează la toate deodată; ce ajunge de două ori se ignoră.
// Merge pe orice rețea cu internet (Wi-Fi, date mobile, rețele diferite) și nu cere cont.
//
// Mod „laptop”: dacă pagina e deschisă de pe serverul de pe laptop (node server.js),
// mesajele trec direct prin laptop. Merge și fără internet, cu telefoanele în aceeași rețea.
//
// SRNBus.host(cameră, { onMessage(msg, deLa), onStatus() })   → laptopul
// SRNBus.client(cameră, { onMessage(msg), onStatus() })      → telefonul
// SRNBus.phoneURL("remote.html", { id: … })  → Promise cu adresa pentru codul QR
(function () {
  "use strict";
  if (window.SRNBus) return;

  var BROKERS = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt",
    "wss://mqtt.eclipseprojects.io:443/mqtt",
    "wss://test.mosquitto.org:8081/mqtt",
  ];
  var NS = "srnuniv/v1/";
  var SITE = "https://university.sorinarseni.com/";
  var qs = new URLSearchParams(location.search);
  var OVERRIDE = qs.get("bus"); // pentru teste: ?bus=ws://127.0.0.1:9001
  if (OVERRIDE) BROKERS = OVERRIDE.split(",");

  var enc = new TextEncoder(),
    dec = new TextDecoder();
  function rid(n) {
    var a = "abcdefghjkmnpqrstuvwxyz23456789",
      s = "";
    for (var i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)];
    return s;
  }

  // ---------- un client MQTT 3.1.1 minim (QoS 0) peste WebSocket ----------
  function Mqtt(url, topics, onMsg, onState) {
    var self = this,
      ws = null,
      buf = new Uint8Array(0),
      ping = 0,
      wait = 800,
      closed = false;
    self.up = false;
    self.name = url;
    function str(s) {
      var b = enc.encode(s),
        o = new Uint8Array(2 + b.length);
      o[0] = b.length >> 8;
      o[1] = b.length & 255;
      o.set(b, 2);
      return o;
    }
    function cat(list) {
      var n = 0,
        p = 0;
      list.forEach(function (a) {
        n += a.length;
      });
      var o = new Uint8Array(n);
      list.forEach(function (a) {
        o.set(a, p);
        p += a.length;
      });
      return o;
    }
    function pkt(first, body) {
      var l = [],
        n = body.length;
      do {
        var d = n % 128;
        n = Math.floor(n / 128);
        if (n > 0) d |= 128;
        l.push(d);
      } while (n > 0);
      return cat([new Uint8Array([first]), new Uint8Array(l), body]);
    }
    function raw(b) {
      if (ws && ws.readyState === 1) ws.send(b);
    }
    function retry() {
      if (closed) return;
      setTimeout(connect, wait);
      wait = Math.min(wait * 2, 15000);
    }
    function connect() {
      if (closed) return;
      try {
        ws = new WebSocket(url, ["mqtt"]);
      } catch (e) {
        return retry();
      }
      ws.binaryType = "arraybuffer";
      buf = new Uint8Array(0);
      var guard = setTimeout(function () {
        if (!self.up) try { ws.close(); } catch (e) {}
      }, 9000);
      ws.onopen = function () {
        // CONNECT: sesiune curată, keepalive 40 s, id de client de cel mult 23 de caractere
        raw(pkt(0x10, cat([str("MQTT"), new Uint8Array([4, 2, 0, 40]), str("srn" + rid(14))])));
      };
      ws.onmessage = function (ev) {
        if (typeof ev.data === "string") return;
        buf = cat([buf, new Uint8Array(ev.data)]);
        parse();
      };
      ws.onclose = function () {
        clearTimeout(guard);
        clearInterval(ping);
        var was = self.up;
        self.up = false;
        if (was) onState();
        retry();
      };
      ws.onerror = function () {};
    }
    function parse() {
      while (buf.length >= 2) {
        var mul = 1,
          n = 0,
          i = 1,
          d;
        do {
          if (i >= buf.length) return;
          d = buf[i++];
          n += (d & 127) * mul;
          mul *= 128;
        } while (d & 128);
        if (buf.length < i + n) return;
        var first = buf[0],
          type = first >> 4,
          body = buf.slice(i, i + n);
        buf = buf.slice(i + n);
        if (type === 2) {
          // CONNACK
          if (body[1] !== 0) {
            try { ws.close(); } catch (e) {}
            return;
          }
          var parts = [new Uint8Array([0, 1])];
          topics.forEach(function (t) {
            parts.push(str(t), new Uint8Array([0]));
          });
          raw(pkt(0x82, cat(parts))); // SUBSCRIBE
          clearInterval(ping);
          ping = setInterval(function () {
            raw(new Uint8Array([0xc0, 0])); // PINGREQ
          }, 25000);
        } else if (type === 9) {
          // SUBACK: de acum primim mesaje
          wait = 800;
          self.up = true;
          onState();
        } else if (type === 3) {
          // PUBLISH
          var tl = (body[0] << 8) | body[1],
            off = 2 + tl;
          if ((first >> 1) & 3) off += 2;
          try {
            onMsg(dec.decode(body.subarray(2, 2 + tl)), dec.decode(body.subarray(off)));
          } catch (e) {}
        }
      }
    }
    self.publish = function (topic, text) {
      if (!self.up) return false;
      raw(pkt(0x30, cat([str(topic), enc.encode(text)])));
      return true;
    };
    self.close = function () {
      closed = true;
      clearInterval(ping);
      try { ws && ws.close(); } catch (e) {}
    };
    connect();
  }

  // ---------- modul „laptop”: serverul de pe laptop (SSE + POST) ----------
  function Local(topics, onMsg, onState) {
    var self = this;
    self.up = false;
    self.name = "laptop";
    var es = new EventSource(
      "/bus/s?" +
        topics
          .map(function (t) {
            return "t=" + encodeURIComponent(t);
          })
          .join("&"),
    );
    es.onopen = function () {
      self.up = true;
      onState();
    };
    es.onerror = function () {
      if (self.up) {
        self.up = false;
        onState();
      }
    };
    es.onmessage = function (e) {
      try {
        var d = JSON.parse(e.data);
        onMsg(d.t, d.m);
      } catch (x) {}
    };
    self.publish = function (topic, text) {
      fetch("/bus/p?t=" + encodeURIComponent(topic), { method: "POST", body: text, keepalive: true }).catch(function () {});
      return true;
    };
    self.close = function () {
      es.close();
    };
  }

  // ---------- în ce mod suntem ----------
  var modeP = null;
  function mode() {
    if (modeP) return modeP;
    modeP = new Promise(function (res) {
      var cloud = {
        local: false,
        base: location.protocol === "file:" ? SITE : new URL(".", location.href).href,
      };
      if (OVERRIDE || location.protocol !== "http:") return res(cloud);
      var done = false;
      var t = setTimeout(function () {
        if (!done) { done = true; res(cloud); }
      }, 1500);
      fetch("/bus/info", { cache: "no-store" })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (j) {
          if (done) return;
          done = true;
          clearTimeout(t);
          if (j && j.ok) {
            var host = (j.ips && j.ips[0]) || location.hostname;
            res({ local: true, base: "http://" + host + ":" + (j.port || location.port) + "/", ips: j.ips || [] });
          } else res(cloud);
        })
        .catch(function () {
          if (!done) { done = true; clearTimeout(t); res(cloud); }
        });
    });
    return modeP;
  }

  function phoneURL(file, params) {
    return mode().then(function (m) {
      var u = new URL(file, m.base);
      Object.keys(params || {}).forEach(function (k) {
        u.searchParams.set(k, params[k]);
      });
      if (OVERRIDE) u.searchParams.set("bus", OVERRIDE);
      return u.href;
    });
  }

  // ---------- camera: laptopul și telefoanele ei ----------
  function open(room, role, opts) {
    opts = opts || {};
    var id = (role === "host" ? "h" : "c") + rid(10);
    var base = NS + room;
    var subs = role === "host" ? [base + "/c"] : [base + "/h", base + "/p/" + id];
    var links = [],
      seen = {},
      seenList = [],
      api = null;
    function deliver(topic, text) {
      var e;
      try {
        e = JSON.parse(text);
      } catch (x) {
        return;
      }
      if (!e || !e.k || seen[e.k]) return;
      seen[e.k] = 1;
      seenList.push(e.k);
      if (seenList.length > 400) delete seen[seenList.shift()];
      if (e.f === id) return;
      if (opts.onMessage) opts.onMessage(e.m, e.f);
    }
    function state() {
      if (opts.onStatus) opts.onStatus(api.online());
    }
    function pub(topic, msg) {
      var text = JSON.stringify({ k: rid(12), f: id, m: msg }),
        ok = false;
      links.forEach(function (l) {
        if (l.publish(topic, text)) ok = true;
      });
      return ok;
    }
    api = {
      id: id,
      mode: "…",
      online: function () {
        return links.filter(function (l) {
          return l.up;
        }).length;
      },
      // telefonul → laptop; laptopul → toate telefoanele
      send: function (msg) {
        return pub(role === "host" ? base + "/h" : base + "/c", msg);
      },
      // laptopul → un singur telefon
      sendTo: function (cid, msg) {
        return pub(base + "/p/" + cid, msg);
      },
      close: function () {
        links.forEach(function (l) {
          l.close();
        });
        links = [];
      },
    };
    mode().then(function (m) {
      api.mode = m.local ? "laptop" : "cloud";
      if (m.local) links.push(new Local(subs, deliver, state));
      else
        BROKERS.forEach(function (u) {
          links.push(new Mqtt(u, subs, deliver, state));
        });
      state();
    });
    return api;
  }

  window.SRNBus = {
    host: function (room, opts) {
      return open(room, "host", opts);
    },
    client: function (room, opts) {
      return open(room, "client", opts);
    },
    mode: mode,
    phoneURL: phoneURL,
    rid: rid,
  };
})();
