// Telecomanda pe telefon: se conectează la prezentarea deschisă pe laptop (codul vine din QR: remote.html?id=…)
(function () {
  var qs = new URLSearchParams(location.search);
  var id = qs.get("id");
  var $ = function (s) {
    return document.getElementById(s);
  };
  if (!id || !/^srn-[a-z0-9]{4,16}$/.test(id)) {
    $("noid").hidden = false;
    return;
  }
  var OPTS = qs.get("peerhost")
    ? { host: qs.get("peerhost"), port: +qs.get("peerport") || 9000, path: "/", secure: false }
    : {};

  var peer = null,
    conn = null,
    state = null,
    gotAt = 0,
    tries = 0,
    timer = null;

  function status(t, kind) {
    var el = $("st");
    el.className = "st" + (kind ? " " + kind : "");
    el.lastChild.textContent = t;
  }
  function fmt(s) {
    s = Math.max(0, s | 0);
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }
  function render() {
    if (!state) return;
    var n = state.n,
      i = state.i;
    $("cnt").textContent = String(i + 1).padStart(2, "0");
    $("tot").textContent = "/ " + String(n).padStart(2, "0");
    $("name").textContent = state.name || "Slide " + (i + 1);
    var q = $("q");
    q.hidden = !state.q;
    q.lastChild.textContent = state.q || "";
    $("next").innerHTML = state.next ? "Urmează: <b></b>" : "Ultimul slide";
    if (state.next) $("next").firstElementChild.textContent = state.next;
    $("prev").disabled = i <= 0;
    $("nextb").disabled = i >= n - 1;
    $("hint").hidden = i > 0;
    if (state.title) document.title = "📱 " + state.title;
  }
  function tick() {
    if (!state) return;
    var s = state.sec + (Date.now() - gotAt) / 1000;
    var t = $("time");
    t.textContent = fmt(s);
    t.classList.toggle("late", s >= 7 * 60);
  }
  setInterval(tick, 250);

  function send(m) {
    if (conn && conn.open) {
      conn.send(m);
      return true;
    }
    status("Nu e conectat. Se reîncearcă…", "err");
    connect();
    return false;
  }
  function go(d) {
    if (!send({ t: "go", d: d })) return;
    if (navigator.vibrate) navigator.vibrate(12);
    var c = $("card");
    c.classList.add(d > 0 ? "bump-l" : "bump-r");
    setTimeout(function () {
      c.classList.remove("bump-l", "bump-r");
    }, 160);
  }

  // ---- legătura cu laptopul ----
  function connect() {
    if (timer) return;
    if (!peer || peer.destroyed) {
      peer = new Peer(OPTS);
      peer.on("open", dial);
      peer.on("disconnected", function () {
        if (!peer.destroyed) peer.reconnect();
      });
      peer.on("error", function (e) {
        if (e.type === "peer-unavailable") {
          status("Prezentarea nu răspunde. Redeschide codul QR pe laptop.", "err");
          later(3000);
        } else if (e.type === "network" || e.type === "server-error" || e.type === "socket-error") {
          status("Fără internet. Se reîncearcă…", "err");
          later(3000);
        } else {
          status("Eroare: " + e.type, "err");
          later(4000);
        }
      });
    } else if (peer.open) dial();
  }
  function later(ms) {
    if (timer) return;
    timer = setTimeout(function () {
      timer = null;
      if (++tries > 40) return status("Nu se poate conecta. Folosește tastatura laptopului.", "err");
      connect();
    }, ms);
  }
  function dial() {
    if (conn && conn.open) return;
    status("Se conectează la prezentare…", "");
    conn = peer.connect(id, { reliable: true });
    conn.on("open", function () {
      tries = 0;
      status("Conectat", "ok");
      conn.send({ t: "hello" });
    });
    conn.on("data", function (m) {
      if (m && m.t === "state") {
        state = m;
        gotAt = Date.now();
        render();
        tick();
      }
    });
    conn.on("close", function () {
      status("Conexiunea s-a închis. Se reîncearcă…", "err");
      conn = null;
      later(1500);
    });
  }
  connect();

  // ---- butoane, swipe, tastatură ----
  $("prev").addEventListener("click", function () {
    go(-1);
  });
  $("nextb").addEventListener("click", function () {
    go(1);
  });
  $("time").addEventListener("click", function () {
    if (confirm("Pornești cronometrul de la 00:00?")) send({ t: "reset" });
  });
  var sx = 0,
    sy = 0,
    st = 0;
  document.addEventListener(
    "touchstart",
    function (e) {
      if (e.target.closest && e.target.closest("button")) return (st = 0);
      var t = e.changedTouches[0];
      sx = t.clientX;
      sy = t.clientY;
      st = Date.now();
    },
    { passive: true },
  );
  document.addEventListener(
    "touchend",
    function (e) {
      if (!st) return;
      var t = e.changedTouches[0],
        dx = t.clientX - sx,
        dy = t.clientY - sy;
      st = 0;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) go(dx < 0 ? 1 : -1);
      else if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.2) go(dy < 0 ? 1 : -1);
    },
    { passive: true },
  );
  addEventListener("keydown", function (e) {
    if (["ArrowRight", "ArrowDown", "PageDown", " "].indexOf(e.key) > -1) go(1);
    else if (["ArrowLeft", "ArrowUp", "PageUp"].indexOf(e.key) > -1) go(-1);
  });

  // ecranul telefonului nu se stinge cât timp ții telecomanda deschisă
  var lock = null;
  function wake() {
    if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;
    navigator.wakeLock.request("screen").then(
      function (l) {
        lock = l;
      },
      function () {},
    );
  }
  wake();
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      wake();
      if (!conn || !conn.open) connect();
    }
  });
})();
