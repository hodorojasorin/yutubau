// Legătura laptop ↔ telefoane (telecomanda și quiz-ul), prin serverul de pe laptop.
//
// Pe laptop, în terminalul din VS Code:
//   npm start        → telefoanele din aceeași rețea Wi-Fi ca laptopul
//   npm run online   → telefoane din orice rețea (tunel https://…trycloudflare.com spre laptop)
// apoi prezentarea se deschide de pe http://localhost:8000/…
// Codul QR arată singur adresa potrivită (tunelul, dacă e pornit, altfel IP-ul din rețea).
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
      // pe localhost, pe IP-ul din rețea sau prin tunel (https://…trycloudflare.com): întrebăm serverul;
      // pe site-ul public (GitHub Pages) /bus/info nu există și rămânem fără telecomandă
      if (location.protocol === "file:") return res(none);
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

  // informațiile proaspete de la server (tunelul poate porni după ce s-a deschis prezentarea)
  function info() {
    return fetch("/bus/info", { cache: "no-store" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .catch(function () {
        return null;
      });
  }
  // dacă tunelul încă pornește, așteptăm până la ~40 s, apoi rămânem pe rețeaua locală
  function publicBase(tries) {
    return info().then(function (j) {
      if (!j) return null;
      if (j.tunnel === "up" && j.public) return j.public.replace(/\/?$/, "/");
      if (j.tunnel === "starting" && tries < 26)
        return new Promise(function (r) {
          setTimeout(r, 1500);
        }).then(function () {
          return publicBase(tries + 1);
        });
      return null;
    });
  }
  // adresa pe care o deschide telefonul (null dacă serverul nu e pornit)
  function phoneURL(file, params) {
    return mode().then(function (m) {
      if (!m.local) return null;
      return publicBase(0).then(function (pub) {
        var u = new URL(file, pub || "http://" + chosenIP(m) + ":" + m.port + "/");
        Object.keys(params || {}).forEach(function (k) {
          u.searchParams.set(k, params[k]);
        });
        return u.href;
      });
    });
  }
  // „orice rețea” (tunel https) sau „același Wi-Fi”
  function reach(url) {
    return /^https:/.test(url || "") ? "din orice rețea" : "telefonul pe același Wi-Fi ca laptopul";
  }

  // dacă laptopul e în mai multe rețele: butoane ca să alegi adresa din codul QR
  function ipPicker(el, onChange) {
    if (!el) return;
    Promise.all([mode(), info()]).then(function (r) {
      var m = r[0],
        j = r[1];
      if (!m.local || m.ips.length < 2 || (j && j.tunnel === "up")) {
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

  // ---------- legătura cu serverul ----------
  // ascultare: „ai ceva nou?” (GET /bus/poll, așteaptă până vine un mesaj); trimitere: POST /bus/p.
  // Fiecare răspuns e o cerere încheiată, așa că trece și prin tunelul Cloudflare.
  function Local(topics, onMsg, onState) {
    var self = this,
      since = -1,
      stop = false,
      fails = 0;
    self.up = false;
    var q = topics
      .map(function (t) {
        return "t=" + encodeURIComponent(t);
      })
      .join("&");
    function loop() {
      if (stop) return;
      var ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
      var guard = setTimeout(function () {
        if (ctl) ctl.abort();
      }, 35000);
      fetch("/bus/poll?" + q + "&since=" + since + "&_=" + Date.now(), { cache: "no-store", signal: ctl ? ctl.signal : undefined })
        .then(function (r) {
          if (!r.ok) throw new Error("http " + r.status);
          return r.json();
        })
        .then(function (j) {
          clearTimeout(guard);
          fails = 0;
          if (since >= 0 && !j.reset)
            (j.msgs || []).forEach(function (x) {
              onMsg(x.t, x.m);
            });
          since = j.seq;
          if (!self.up) {
            self.up = true;
            onState();
          }
          loop();
        })
        .catch(function () {
          clearTimeout(guard);
          fails++;
          if (self.up && fails > 1) {
            self.up = false;
            onState();
          }
          setTimeout(loop, Math.min(4000, 400 * fails));
        });
    }
    loop();
    self.publish = function (topic, text) {
      if (!self.up) return false;
      fetch("/bus/p?t=" + encodeURIComponent(topic), { method: "POST", body: text, keepalive: true, cache: "no-store" }).catch(function () {});
      return true;
    };
    self.close = function () {
      stop = true;
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
    reach: reach,
    ipPicker: ipPicker,
    rid: rid,
    // textul pentru când prezentarea e deschisă de pe internet, nu de pe laptop
    HOWTO: "Pornește serverul pe laptop: în VS Code, Terminal → npm start, apoi deschide prezentarea de pe http://localhost:8000",
  };
})();
