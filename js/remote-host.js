// Telecomanda: prezentarea (laptopul) primește comenzi de la telefon.
// Legătura e directă (WebRTC prin PeerJS); serverul public PeerJS face doar „prezentarea” celor două dispozitive.
// Laptopul arată un cod QR, telefonul îl scanează și deschide remote.html.
(function () {
  var P = document.querySelector(".project");
  if (!P) return;
  var slides = [].slice.call(P.querySelectorAll(".slide"));
  if (!slides.length) return;

  // pentru teste locale: ?peerhost=127.0.0.1&peerport=9000 folosește un server PeerJS propriu
  var qs = new URLSearchParams(location.search);
  var OPTS = qs.get("peerhost")
    ? { host: qs.get("peerhost"), port: +qs.get("peerport") || 9000, path: "/", secure: false }
    : {};
  var KEY = "rm-id:" + location.pathname;
  var ON = "rm-on:" + location.pathname;

  function store(k, v) {
    try {
      if (v === undefined) return sessionStorage.getItem(k);
      sessionStorage.setItem(k, v);
    } catch (e) {}
  }
  function newId() {
    var a = "abcdefghjkmnpqrstuvwxyz23456789",
      s = "srn-";
    for (var i = 0; i < 8; i++) s += a[Math.floor(Math.random() * a.length)];
    return s;
  }
  var id = store(KEY) || newId();
  store(KEY, id);

  // ---- butonul discret și fereastra cu QR ----
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "rm-btn";
  btn.title = "Controlează slide-urile de pe telefon (tasta T)";
  btn.innerHTML = "<i></i>📱 Telecomandă";
  document.body.appendChild(btn);

  var modal = document.createElement("div");
  modal.className = "rm-modal";
  modal.hidden = true;
  modal.innerHTML =
    '<div class="rm-card" role="dialog" aria-modal="true" aria-labelledby="rm-t">' +
    '<h2 id="rm-t">Telecomanda de pe telefon</h2>' +
    "<p>Scanează codul cu camera telefonului. Apoi dai swipe sau apeși ← → ca să schimbi slide-urile.</p>" +
    '<div class="rm-qr" id="rm-qr"><span class="rm-wait">se pregătește…</span></div>' +
    '<span class="rm-status" id="rm-status"><i></i><span>Se conectează la server…</span></span>' +
    '<a class="rm-link" id="rm-link" target="_blank" rel="noopener"></a>' +
    '<div class="rm-actions"><button type="button" class="rm-new" id="rm-new">Cod nou</button>' +
    '<button type="button" class="rm-close" id="rm-close">Gata</button></div>' +
    "</div>";
  document.body.appendChild(modal);
  var $ = function (s) {
    return modal.querySelector(s);
  };

  function status(text, kind) {
    var el = $("#rm-status");
    el.className = "rm-status" + (kind ? " " + kind : "");
    el.lastChild.textContent = text;
  }
  function openModal() {
    modal.hidden = false;
    start();
  }
  function closeModal() {
    modal.hidden = true;
  }
  btn.addEventListener("click", openModal);
  $("#rm-close").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeModal();
  });
  $("#rm-new").addEventListener("click", function () {
    id = newId();
    store(KEY, id);
    restart();
  });
  addEventListener("keydown", function (e) {
    if (e.target.closest && e.target.closest("input,textarea")) return;
    if (e.key === "t" || e.key === "T") modal.hidden ? openModal() : closeModal();
    else if (e.key === "Escape" && !modal.hidden) {
      e.stopImmediatePropagation();
      closeModal();
    }
  }, true);

  // ---- bibliotecile se încarcă doar când e nevoie ----
  function load(src, test, cb) {
    if (test()) return cb();
    var s = document.createElement("script");
    s.src = src;
    s.onload = cb;
    s.onerror = function () {
      status("Nu s-a putut încărca telecomanda", "err");
    };
    document.head.appendChild(s);
  }
  function libs(cb) {
    load("js/vendor/qrcode.js", function () {
      return typeof qrcode !== "undefined";
    }, function () {
      load("js/vendor/peerjs.min.js", function () {
        return typeof Peer !== "undefined";
      }, cb);
    });
  }
  function remoteUrl() {
    var u = new URL("remote.html", location.href);
    u.searchParams.set("id", id);
    if (OPTS.host) {
      u.searchParams.set("peerhost", OPTS.host);
      u.searchParams.set("peerport", OPTS.port);
    }
    return u.href;
  }
  function drawQR() {
    var url = remoteUrl();
    var q = qrcode(0, "M");
    q.addData(url);
    q.make();
    $("#rm-qr").innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    var a = $("#rm-link");
    a.href = url;
    a.textContent = url;
  }

  // ---- legătura ----
  var peer = null,
    conns = [],
    retry = 0,
    startAt = Date.now();
  function setOn() {
    var on = conns.some(function (c) {
      return c.open;
    });
    btn.classList.toggle("on", on);
    btn.lastChild.textContent = on ? "📱 conectat" : "📱 Telecomandă";
    if (on) status("Telefonul e conectat", "ok");
    else if (peer && peer.open) status("Gata. Scanează codul", "");
  }
  function start() {
    if (peer) return;
    store(ON, "1");
    libs(function () {
      drawQR();
      if (peer) return;
      peer = new Peer(id, OPTS);
      peer.on("open", function () {
        retry = 0;
        setOn();
      });
      peer.on("connection", function (c) {
        conns.push(c);
        c.on("open", function () {
          setOn();
          send(true);
          setTimeout(closeModal, 900);
        });
        c.on("data", onData);
        c.on("close", function () {
          conns = conns.filter(function (x) {
            return x !== c;
          });
          setOn();
        });
      });
      peer.on("disconnected", function () {
        if (peer && !peer.destroyed) peer.reconnect();
      });
      peer.on("error", function (e) {
        if (e.type === "unavailable-id" && retry < 5) {
          // după o reîncărcare, serverul mai ține codul vechi câteva secunde
          retry++;
          status("Se reconectează…", "");
          setTimeout(restart, 2500);
        } else if (e.type === "peer-unavailable") {
          /* telefon vechi, ignorăm */
        } else {
          status("Fără conexiune: folosește tastatura", "err");
        }
      });
    });
  }
  function restart() {
    if (peer) {
      try {
        peer.destroy();
      } catch (e) {}
    }
    peer = null;
    conns = [];
    setOn();
    $("#rm-qr").innerHTML = '<span class="rm-wait">se pregătește…</span>';
    start();
  }

  // ---- slide-ul curent și comenzile ----
  function current() {
    var best = 0,
      bi = 0;
    slides.forEach(function (s, j) {
      var r = s.getBoundingClientRect();
      var vis = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
      if (vis > best) {
        best = vis;
        bi = j;
      }
    });
    return bi;
  }
  // la apăsări rapide, scroll-ul încă nu a ajuns: pornim de la slide-ul spre care mergem deja
  var target = -1,
    targetAt = 0;
  function here() {
    return target > -1 && Date.now() - targetAt < 900 ? target : current();
  }
  function go(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    target = i;
    targetAt = Date.now();
    slides[i].scrollIntoView({ behavior: "smooth" });
  }
  // cronometrul: dacă prezentarea are deja unul în bară (colocviu), telefonul arată exact același timp
  function elapsed() {
    var el = document.getElementById("co-tc");
    if (el) {
      var p = el.textContent.trim().split(":").map(Number);
      if (p.length === 3 && p.every(isFinite)) return p[0] * 3600 + p[1] * 60 + p[2];
    }
    return Math.floor((Date.now() - startAt) / 1000);
  }
  function resetTime() {
    startAt = Date.now();
    var rec = document.getElementById("co-rec");
    if (rec) rec.click();
  }
  function onData(m) {
    if (!m || typeof m !== "object") return;
    if (m.t === "go") go(here() + (m.d > 0 ? 1 : -1));
    else if (m.t === "goto") go(+m.i || 0);
    else if (m.t === "reset") resetTime();
    send(true);
  }
  function txt(el) {
    return el ? el.textContent.replace(/\s+/g, " ").replace(/^\?\s*/, "").trim() : "";
  }
  var last = "";
  function send(force) {
    if (!conns.length) return;
    var i = here(),
      s = slides[i],
      nx = slides[i + 1];
    var msg = {
      t: "state",
      i: i,
      n: slides.length,
      name: s.dataset.name || txt(s.querySelector("h1,h2")),
      q: txt(s.querySelector(".co-next")),
      next: nx ? nx.dataset.name || txt(nx.querySelector("h1,h2")) : "",
      title: document.title,
      sec: elapsed(),
      open: P.classList.contains("open"),
    };
    var key = JSON.stringify(msg);
    if (!force && key === last) return;
    last = key;
    conns.forEach(function (c) {
      if (c.open) c.send(msg);
    });
  }
  var tick = false;
  addEventListener(
    "scroll",
    function () {
      if (tick) return;
      tick = true;
      setTimeout(function () {
        tick = false;
        send();
      }, 180);
    },
    { passive: true },
  );
  setInterval(send, 1000);

  // după o reîncărcare a paginii, telecomanda pornește singură (telefonul se reconectează)
  if (store(ON) === "1") start();
})();
