// Quiz pe telefon: se conectează la prezentarea de pe ecranul mare (quiz.html?id=srn-q…)
(function () {
  "use strict";
  var $ = function (s) { return document.getElementById(s); };
  var qs = new URLSearchParams(location.search);
  var host = (qs.get("id") || "").toLowerCase();
  var EMO = ["🎥", "📷", "🎞️", "📺", "📼", "💾", "🎧", "🎙️", "🕹️", "📱", "🖥️", "📻", "🎬", "💿"];
  var OPT = [{ c: "#ff3b5c", s: "▲" }, { c: "#2f55ff", s: "◆" }, { c: "#e08a00", s: "●" }, { c: "#10a35f", s: "■" }];
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  var pid = store("im-quiz-pid");
  if (!pid) { pid = "p" + Math.random().toString(36).slice(2, 10); store("im-quiz-pid", pid); }
  var me = { name: store("im-quiz-name") || "", emoji: store("im-quiz-emo") || EMO[Math.floor(Math.random() * EMO.length)] };
  var bus = null, joined = false, welcomed = false, cur = null, timer = 0, hostAt = 0, t0 = Date.now(), wasOn = 0;

  function show(id) { [].forEach.call(document.querySelectorAll(".scr"), function (s) { s.hidden = s.id !== id; }); }
  function status(t, kind) { var el = $("st"); el.className = "st" + (kind ? " " + kind : ""); el.lastChild.textContent = t; }
  function buzz(p) { if (navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} }

  // ---------- fără cod în link: îl scrii de mână ----------
  if (!/^srn-q[a-z0-9]{4,12}$/.test(host)) {
    show("s-code");
    status("aștept codul", "");
    $("code-go").addEventListener("click", function () {
      var c = $("code").value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      if (c.length < 4) { $("code").focus(); return; }
      location.search = "?id=srn-q" + c;
    });
    return;
  }

  // ---------- alegerea numelui ----------
  var emoBox = $("emo");
  EMO.forEach(function (e) {
    var b = document.createElement("button");
    b.type = "button";
    b.textContent = e;
    if (e === me.emoji) b.className = "on";
    b.addEventListener("click", function () {
      me.emoji = e;
      [].forEach.call(emoBox.children, function (x) { x.className = x === b ? "on" : ""; });
    });
    emoBox.appendChild(b);
  });
  $("name").value = me.name;
  function doJoin() {
    var n = $("name").value.replace(/\s+/g, " ").trim();
    if (!n) { $("name").focus(); return; }
    me.name = n.slice(0, 16);
    store("im-quiz-name", me.name);
    store("im-quiz-emo", me.emoji);
    joined = true;
    send({ t: "join", pid: pid, name: me.name, emoji: me.emoji });
    $("me-emo").textContent = me.emoji;
    $("me-name").textContent = me.name;
    show("s-wait");
  }
  $("join").addEventListener("click", doJoin);
  $("name").addEventListener("keydown", function (e) { if (e.key === "Enter") doJoin(); });

  // ---------- conexiunea ----------
  // telefonul spune „salut” la câteva secunde; ecranul mare răspunde „hi”
  function send(m) { if (bus) bus.send(m); }
  function check() {
    if (!bus) return;
    var on = bus.online();
    if (bus.mode === "none") status("scanează codul de pe ecranul mare", "err");
    else if (Date.now() - hostAt < 12000) status("conectat", "ok");
    else if (!on) status(Date.now() - t0 > 9000 ? "nu găsesc laptopul · ești pe același Wi-Fi?" : "se conectează…", Date.now() - t0 > 9000 ? "err" : "");
    else status(Date.now() - t0 > 8000 ? "ecranul mare nu răspunde" : "se conectează…", Date.now() - t0 > 8000 ? "err" : "");
  }
  function connect() {
    bus = SRNBus.client(host.replace(/^srn-q/, "q-"), {
      onMessage: onMsg,
      onStatus: function () {
        var on = bus.online();
        if (on && !wasOn) { send({ t: "hello" }); if (joined) send({ t: "join", pid: pid, name: me.name, emoji: me.emoji }); }
        wasOn = on;
        check();
      },
    });
    setInterval(function () { send({ t: "hello" }); check(); }, 5000);
  }

  // ---------- mesajele de la ecranul mare ----------
  function onMsg(m) {
    if (!m || typeof m !== "object") return;
    var first = Date.now() - hostAt > 12000;
    hostAt = Date.now();
    if (first) { check(); if (joined && !welcomed) send({ t: "join", pid: pid, name: me.name, emoji: me.emoji }); }
    if (m.t === "hi") return;
    if (m.t === "welcome") welcomed = true;
    if (m.t === "welcome") { joined = true; me.name = m.name; me.emoji = m.emoji; $("me-emo").textContent = m.emoji; $("me-name").textContent = m.name; if (!cur) show("s-wait"); }
    else if (m.t === "lobby") { $("wait-n").textContent = m.n + " în joc"; if (joined) show("s-wait"); }
    else if (m.t === "q") question(m);
    else if (m.t === "got") show("s-sent");
    else if (m.t === "res") result(m);
    else if (m.t === "end") end(m);
  }
  function question(m) {
    cur = m;
    $("q-num").textContent = m.i + 1 + " / " + m.n;
    $("q-text").textContent = m.text;
    var box = $("opts");
    box.innerHTML = "";
    m.opts.forEach(function (t, k) {
      var b = document.createElement("button");
      b.type = "button";
      b.style.setProperty("--c", OPT[k].c);
      b.innerHTML = "<span>" + OPT[k].s + "</span>";
      b.appendChild(document.createTextNode(t));
      b.addEventListener("click", function () { send({ t: "ans", i: m.i, a: k }); buzz(30); show("s-sent"); });
      box.appendChild(b);
    });
    if (m.done) { show("s-sent"); return; }
    show("s-q");
    buzz(60);
    var end = Date.now() + m.left * 1000;
    clearInterval(timer);
    timer = setInterval(function () {
      var left = Math.max(0, (end - Date.now()) / 1000);
      $("q-sec").textContent = Math.ceil(left);
      $("q-bar").style.transform = "scaleX(" + left / m.dur + ")";
      if (left <= 0) clearInterval(timer);
    }, 100);
  }
  function result(m) {
    clearInterval(timer);
    var v = $("verdict");
    v.className = "verdict" + (m.ok ? "" : m.none ? " none" : " bad");
    v.textContent = m.ok ? "✓" : m.none ? "⏱" : "✗";
    $("res-t").textContent = m.ok ? "Corect!" : m.none ? "N-ai apucat…" : "Nu chiar…";
    $("res-pts").textContent = m.ok ? "+" + m.pts + " puncte" : "+0";
    $("res-more").innerHTML = (m.ok ? "" : "Răspunsul corect: <b></b><br>") + "Total: <b>" + m.score + "</b> · locul <b>" + m.rank + "</b> din " + m.of;
    if (!m.ok) $("res-more").querySelector("b").textContent = m.opt;
    show("s-res");
    buzz(m.ok ? [40, 60, 40] : 200);
  }
  function end(m) {
    clearInterval(timer);
    var medal = ["🥇", "🥈", "🥉"][m.rank - 1] || "🎬";
    $("end-medal").textContent = medal;
    $("end-t").textContent = "Locul " + m.rank + " din " + m.of;
    $("end-pts").textContent = m.score + " puncte";
    $("end-top").innerHTML = "";
    m.top.forEach(function (p, k) {
      var li = document.createElement("li");
      li.textContent = ["🥇", "🥈", "🥉"][k] + " " + p.emoji + " " + p.name + " · " + p.score;
      $("end-top").appendChild(li);
    });
    show("s-end");
    buzz([80, 60, 80, 60, 200]);
  }

  show("s-join");
  connect();
})();
