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
  var bus = null,
    state = null,
    gotAt = 0,
    started = Date.now();

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
    $("hint").hidden = i > 0 || !!(state.notes && state.notes.length);
    renderNotes();
    if (state.title) document.title = "📱 " + state.title;
  }
  // notițele vorbitorului: ce spui, ce apeși, cum treci la slide-ul următor
  var notesKey = "";
  function renderNotes() {
    var box = $("notes"), list = (state && state.notes) || [];
    var key = state.i + "|" + JSON.stringify(list);
    if (key === notesKey) return;
    notesKey = key;
    box.innerHTML = "";
    document.body.classList.toggle("has-notes", list.length > 0);
    box.hidden = !list.length;
    $("aa").hidden = !list.length;
    list.forEach(function (n) {
      var p = document.createElement("p");
      p.className = "n n-" + (n.k || "pt");
      String(n.t || "").split("**").forEach(function (part, k) {
        if (!part) return;
        if (k % 2) { var b = document.createElement("b"); b.textContent = part; p.appendChild(b); }
        else p.appendChild(document.createTextNode(part));
      });
      box.appendChild(p);
    });
    box.scrollTop = 0;
  }
  var SIZES = ["", "big", "huge"], size = 0;
  try { size = Math.max(0, SIZES.indexOf(localStorage.getItem("rm-notes-size") || "")); } catch (e) {}
  function applySize() { SIZES.forEach(function (c) { if (c) document.body.classList.remove("notes-" + c); }); if (SIZES[size]) document.body.classList.add("notes-" + SIZES[size]); }
  applySize();
  $("aa").addEventListener("click", function () {
    size = (size + 1) % SIZES.length;
    applySize();
    try { localStorage.setItem("rm-notes-size", SIZES[size]); } catch (e) {}
  });
  function tick() {
    if (!state) return;
    var s = state.sec + (Date.now() - gotAt) / 1000;
    var t = $("time");
    t.textContent = fmt(s);
    t.classList.toggle("late", s >= 7 * 60);
  }
  setInterval(tick, 250);

  function send(m) {
    if (bus && bus.send(m)) return true;
    status("Nu e conectat. Se reîncearcă…", "err");
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
  // telefonul spune „salut” la câteva secunde; laptopul răspunde cu slide-ul curent
  function hello() {
    if (bus && bus.online()) bus.send({ t: "hello" });
  }
  function check() {
    if (!bus) return;
    var fresh = Date.now() - gotAt < 9000;
    if (bus.mode === "none") status("Scanează codul QR de pe laptop", "err");
    else if (fresh) status("Conectat", "ok");
    else if (!bus.online()) status(Date.now() - started > 9000 ? "Nu găsesc laptopul. Ești pe același Wi-Fi?" : "Se conectează…", Date.now() - started > 9000 ? "err" : "");
    else if (gotAt) status("Prezentarea nu mai răspunde…", "err");
    else status(Date.now() - started > 8000 ? "Prezentarea nu răspunde. Redeschide codul QR pe laptop." : "Se conectează la prezentare…", Date.now() - started > 8000 ? "err" : "");
  }
  bus = SRNBus.client(id.replace(/^srn-/, "rm-"), {
    onMessage: function (m) {
      if (m && m.t === "state") {
        state = m;
        gotAt = Date.now();
        render();
        tick();
        check();
      }
    },
    onStatus: function () {
      hello();
      check();
    },
  });
  setInterval(function () {
    hello();
    check();
  }, 3000);

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
    st = 0,
    inNotes = false;
  document.addEventListener(
    "touchstart",
    function (e) {
      if (e.target.closest && e.target.closest("button")) return (st = 0);
      var t = e.changedTouches[0];
      // în notițe, swipe-ul în sus/jos derulează textul; slide-urile se schimbă doar cu swipe stânga/dreapta
      inNotes = !!(e.target.closest && e.target.closest(".notes"));
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
      else if (!inNotes && Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.2) go(dy < 0 ? 1 : -1);
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
  // pe http (în rețeaua laptopului) Wake Lock nu e voie; un video mut, în buclă, ține ecranul aprins
  var ns = null;
  function noSleep() {
    if (lock || ns) return;
    ns = document.createElement("video");
    ns.setAttribute("playsinline", "");
    ns.setAttribute("muted", "");
    ns.muted = true;
    ns.loop = true;
    ns.src = "img/nosleep.mp4";
    ns.style.cssText = "position:fixed;left:0;bottom:0;width:2px;height:2px;opacity:0.01;pointer-events:none";
    document.body.appendChild(ns);
    var p = ns.play();
    if (p && p.catch) p.catch(function () { ns.remove(); ns = null; });
  }
  document.addEventListener("touchend", noSleep, { passive: true });
  document.addEventListener("click", noSleep);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      wake();
      hello();
    }
  });
})();
