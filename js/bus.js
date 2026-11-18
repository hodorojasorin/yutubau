// Legătura laptop ↔ telefoane (telecomanda și quiz-ul), prin serverul de pe laptop.
//
// Pe laptop, în terminalul din VS Code:   npm start   (sau: node server.js)
// apoi prezentarea se deschide de pe http://localhost:8000/…
// Codul QR arată adresa laptopului în rețea; telefoanele trebuie să fie în aceeași rețea Wi-Fi
// (sau pe hotspotul tău). Nu trece nimic prin internet.
//
// SRNBus.host(cameră, { onMessage(msg, deLa), onStatus() })   → laptopul
// SRNBus.client(cameră, { onMessage(msg), onStatus() })      → telefonul
// SRNBus.phoneURL("remote.html", { id: … })  → Promise cu adresa pentru codul QR (sau null fără server)
// SRNBus.ipPicker(element, cândSeSchimbă)     → butoane „altă rețea”, dacă laptopul are mai multe adrese
(function () {
  "use strict";
  if (window.SRNBus) return;
  var NS = "srnuniv/v1/";

  function rid(n) {
    var a = "abcdefghjkmnpqrstuvwxyz23456789",
      s = "";
    for (var i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)];
    return s;
  }
  function store(k, v) {
    try {
      if (v === undefined) return sessionStorage.getItem(k);
      sessionStorage.setItem(k, v);
    } catch (e) {}
    return null;
  }

  // ---------- e pornit serverul de pe laptop? ----------
  var modeP = null;
  function mode() {
    if (modeP) return modeP;
    modeP = new Promise(function (res) {
      var none = { local: false, ips: [] };
      if (location.protocol !== "http:") return res(none);
      var done = false;
      var t = setTimeout(function () {
        if (!done) { done = true; res(none); }
      }, 2000);
      fetch("/bus/info", { cache: "no-store" })
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (j) {
          if (done) return;
          done = true;
          clearTimeout(t);
          res(j && j.ok ? { local: true, ips: j.ips || [], port: j.port || location.port } : none);
        })
        .catch(function () {
          if (!done) { done = true; clearTimeout(t); res(none); }
        });
    });
    return modeP;
  }
  function chosenIP(m) {
    var ip = store("srn-ip");
    if (ip && m.ips.indexOf(ip) > -1) return ip;
    return m.ips[0] || location.hostname;
  }

  // adresa pe care o deschide telefonul (null dacă serverul nu e pornit)
  function phoneURL(file, params) {
    return mode().then(function (m) {
      if (!m.local) return null;
      var u = new URL(file, "http://" + chosenIP(m) + ":" + m.port + "/");
      Object.keys(params || {}).forEach(function (k) {
        u.searchParams.set(k, params[k]);
      });
      return u.href;
    });
  }

  // dacă laptopul e în mai multe rețele: butoane ca să alegi adresa din codul QR
  function ipPicker(el, onChange) {
    if (!el) return;
    mode().then(function (m) {
      if (!m.local || m.ips.length < 2) {
        el.innerHTML = "";
        return;
      }
      var cur = chosenIP(m);
      el.innerHTML = "";
      var lab = document.createElement("span");
      lab.textContent = "Telefonul nu deschide? Altă rețea: ";
      el.appendChild(lab);
      m.ips.forEach(function (ip) {
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = ip;
        b.className = ip === cur ? "on" : "";
        b.addEventListener("click", function () {
          store("srn-ip", ip);
          ipPicker(el, onChange);
          if (onChange) onChange();
        });
        el.appendChild(b);
      });
    });
  }

  // ---------- legătura cu serverul: ascultare (SSE) și trimitere (POST) ----------
  function Local(topics, onMsg, onState) {
    var self = this;
    self.up = false;
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
      if (!self.up) return false;
      fetch("/bus/p?t=" + encodeURIComponent(topic), { method: "POST", body: text, keepalive: true }).catch(function () {});
      return true;
    };
    self.close = function () {
      es.close();
    };
  }

  // ---------- camera: laptopul și telefoanele ei ----------
  function open(room, role, opts) {
    opts = opts || {};
    var id = (role === "host" ? "h" : "c") + rid(10);
    var base = NS + room;
    var subs = role === "host" ? [base + "/c"] : [base + "/h", base + "/p/" + id];
    var link = null,
      api = null;
    function deliver(topic, text) {
      var e;
      try {
        e = JSON.parse(text);
      } catch (x) {
        return;
      }
      if (!e || e.f === id) return;
      if (opts.onMessage) opts.onMessage(e.m, e.f);
    }
    function state() {
      if (opts.onStatus) opts.onStatus(api.online());
    }
    function pub(topic, msg) {
      return !!link && link.publish(topic, JSON.stringify({ f: id, m: msg }));
    }
    api = {
      id: id,
      mode: "…", // „laptop” când serverul răspunde, „none” când pagina nu e deschisă de pe server
      online: function () {
        return link && link.up ? 1 : 0;
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
        if (link) link.close();
        link = null;
      },
    };
    mode().then(function (m) {
      api.mode = m.local ? "laptop" : "none";
      if (m.local) link = new Local(subs, deliver, state);
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
    ipPicker: ipPicker,
    rid: rid,
    // textul pentru când prezentarea e deschisă de pe internet, nu de pe laptop
    HOWTO: "Pornește serverul pe laptop: în VS Code, Terminal → npm start, apoi deschide prezentarea de pe http://localhost:8000",
  };
})();
