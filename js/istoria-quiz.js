// Quiz-ul live: ecranul mare e „gazda”, colegii intră de pe telefon prin codul QR (quiz.html).
// Mesajele trec prin serverul de pe laptop (js/bus.js + server.js): în VS Code, Terminal → npm start.
// Repetiție fără colegi: în lobby apeși B și intră 5 boți.
(function () {
  "use strict";
  var root = document.getElementById("quiz");
  if (!root || !window.IM) return;
  var DUR = 20;
  var Q = [
    { q: "Cine a inventat cuvântul „multimedia”?", o: ["Steve Jobs, 1984", "Bob Goldstein, 1966", "Marshall McLuhan, 1964", "Tim Berners-Lee, 1991"], c: 1, w: "<b>Bob Goldstein</b>, în iulie 1966, pentru show-ul „LightWorks at L'Oursin”. Variety a scris despre el pe 10 august 1966." },
    { q: "Cât a durat expunerea primei fotografii (Niépce, 1826)?", o: ["1 secundă", "8 minute", "8 ore", "8 zile"], c: 2, w: "<b>8 ore</b>, pe o placă de cositor cu bitum de Iudeea. Telefonul tău: cam 1/1000 de secundă." },
    { q: "Ce puteai face, în 1860, cu prima voce înregistrată?", o: ["S-o asculți la gramofon", "Doar s-o privești, ca linie pe hârtie", "S-o dai la radio", "S-o pui pe disc"], c: 1, w: "Fonautograful doar <b>desena</b> sunetul. Înregistrarea a fost redată abia în <b>2008</b>." },
    { q: "Spectatorii din 1895 chiar au fugit din sală de frica trenului Lumière?", o: ["Da, e bine documentat", "Da, a venit și poliția", "Nu există nicio dovadă de epocă", "Doar la proiecția din București"], c: 2, w: "E <b>mitul fondator</b> al cinemaului: nicio relatare de epocă despre panică (Martin Loiperdinger, 2004)." },
    { q: "Când a avut loc prima emisiune a Televiziunii Moldovei?", o: ["30 aprilie 1958", "27 august 1991", "8 octombrie 1939", "1 ianuarie 1970"], c: 0, w: "<b>30 aprilie 1958, ora 19:00.</b> 8 octombrie 1939 e ziua în care a pornit Radio Moldova." },
    { q: "Ce a arătat Douglas Engelbart, în premieră, în 1968?", o: ["Smartphone-ul", "CD-ROM-ul", "Mouse-ul și hypertextul", "Primul site web"], c: 2, w: "„Mama tuturor demo-urilor”, 9 decembrie 1968: <b>mouse, hypertext, ferestre, videoconferință</b>." },
  ];
  var OPT = [
    { c: "#ff3b5c", s: "▲" },
    { c: "#2f55ff", s: "◆" },
    { c: "#e08a00", s: "●" },
    { c: "#10a35f", s: "■" },
  ];
  var CHIP = ["#ffd21f", "#c8ff2e", "#ff9500", "#a98bff", "#22d98a", "#ff2f8e", "#fff3d6"];
  var EMO = ["🎥", "📷", "🎞️", "📺", "📼", "💾", "🎧", "🎙️", "🕹️", "📱", "🖥️", "📻", "🎬", "💿"];
  var BOTS = ["Ana", "Ion", "Mihai", "Cristina", "Dan", "Elena", "Vlad", "Irina", "Radu", "Maria", "Nicu", "Diana"];

  var state = "lobby", qi = -1, qStart = 0, timer = null, raf = 0, players = {}, order = [], byCid = {}, bus = null, code = null, linkUrl = "", linkHost = "", offline = 0, noServer = false, reachTxt = "scanează codul";

  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function list() { return order.map(function (p) { return players[p]; }); }
  function ranked() { return list().slice().sort(function (a, b) { return b.score - a.score || a.joined - b.joined; }); }
  function send(p, m) { if (p.cid && bus) bus.sendTo(p.cid, m); }
  function bcast(m) { list().forEach(function (p) { send(p, m); }); }
  function answered() { return list().filter(function (p) { return p.ans[qi] != null; }).length; }

  // ---------- conexiunea ----------
  function newCode() { var a = "abcdefghjkmnpqrstuvwxyz23456789", s = ""; for (var k = 0; k < 6; k++) s += a[Math.floor(Math.random() * a.length)]; return s; }
  function startPeer() {
    if (bus) return;
    try { code = sessionStorage.getItem("im-quiz-code") || newCode(); sessionStorage.setItem("im-quiz-code", code); } catch (e) { code = newCode(); }
    IM.loadJS("js/vendor/qrcode.js", function () { return typeof qrcode !== "undefined"; }, function () {
      IM.loadJS("js/bus.js", function () { return typeof SRNBus !== "undefined"; }, function () {
        drawLink();
        if (bus) return;
        bus = SRNBus.host("q-" + code, { onMessage: onMsg, onStatus: busSt });
        setInterval(function () { offline = bus.online() ? 0 : offline + 1; busSt(); }, 4000);
      }, function () { setSt("nu s-a putut încărca legătura: apasă B pentru boți de repetiție"); });
    }, function () { setSt("nu s-a putut încărca generatorul QR"); });
  }
  function drawLink() {
    SRNBus.phoneURL("quiz.html", { id: "srn-q" + code }).then(function (url) {
      noServer = !url;
      linkUrl = url || "";
      if (url) { var u = new URL(url); linkHost = u.host + u.pathname; reachTxt = SRNBus.reach(url); busSt(); }
      if (state === "lobby") render();
    });
  }
  function busSt() {
    if (!bus) return;
    if (bus.mode === "none") setSt("serverul de pe laptop nu e pornit · B = boți de repetiție");
    else if (bus.online()) setSt("gata · " + reachTxt);
    else setSt(offline > 1 ? "serverul s-a oprit? rulează npm start" : "se conectează…");
  }
  function setSt(t) { var el = root.querySelector(".q-st"); if (el) el.textContent = t; root._st = t; }
  function onMsg(m, from) {
    if (!m || typeof m !== "object" || !from) return;
    if (m.t === "hello") bus.sendTo(from, { t: "hi" });
    else if (m.t === "join") join(from, m);
    else if (m.t === "ans") answer(byCid[from], m.i, m.a);
  }
  function join(cid, m) {
    var pid = String(m.pid || "").slice(0, 40) || "p" + Math.random();
    var name = String(m.name || "Anonim").replace(/\s+/g, " ").trim().slice(0, 16) || "Anonim";
    var p = players[pid];
    if (!p) {
      p = players[pid] = { pid: pid, name: name, emoji: EMO.indexOf(m.emoji) > -1 ? m.emoji : EMO[order.length % EMO.length], color: CHIP[order.length % CHIP.length], score: 0, ans: {}, pts: {}, joined: Date.now() };
      order.push(pid);
      IM.sfx.join();
    } else p.name = name;
    if (p.cid) delete byCid[p.cid];
    p.cid = cid;
    byCid[cid] = pid;
    send(p, { t: "welcome", name: p.name, emoji: p.emoji });
    if (state === "q") sendQ(p);
    else if (state === "reveal") sendRes(p);
    else if (state === "podium") sendEnd(p);
    else send(p, { t: "lobby", n: order.length });
    if (state === "lobby") render();
    else updCount();
  }
  function answer(pid, i, a) {
    var p = players[pid];
    if (!p || state !== "q" || i !== qi || p.ans[qi] != null) return;
    a = +a;
    if (!(a >= 0 && a < 4)) return;
    var t = (Date.now() - qStart) / 1000;
    if (t > DUR + 0.6) return;
    p.ans[qi] = a;
    var ok = a === Q[qi].c;
    p.pts[qi] = ok ? Math.round(1000 * (1 - 0.5 * Math.min(1, t / DUR))) : 0;
    send(p, { t: "got" });
    IM.sfx.tick(0.35);
    updCount();
    if (answered() >= order.length && order.length) setTimeout(reveal, 500);
  }

  // ---------- boți pentru repetiție ----------
  function addBots(n) {
    for (var k = 0; k < n; k++) {
      var pid = "bot" + order.length + "_" + Math.random().toString(36).slice(2, 6);
      players[pid] = { pid: pid, bot: true, name: BOTS[order.length % BOTS.length] + " 🤖", emoji: EMO[order.length % EMO.length], color: CHIP[order.length % CHIP.length], score: 0, ans: {}, pts: {}, joined: Date.now() + k };
      order.push(pid);
    }
    IM.sfx.join();
    render();
  }
  function botsPlay() {
    list().forEach(function (p) {
      if (!p.bot) return;
      var delay = 2000 + Math.random() * 11000;
      setTimeout(function () {
        if (state !== "q") return;
        var a = Math.random() < 0.62 ? Q[qi].c : Math.floor(Math.random() * 4);
        answer(p.pid, qi, a);
      }, delay);
    });
  }

  // ---------- desfășurarea ----------
  function startQ(i) {
    qi = i;
    state = "q";
    qStart = Date.now();
    render();
    list().forEach(sendQ);
    botsPlay();
    IM.sfx.rise();
    clearInterval(timer);
    var lastSec = DUR;
    timer = setInterval(function () {
      var left = DUR - (Date.now() - qStart) / 1000;
      var sec = Math.ceil(left);
      if (sec !== lastSec) { lastSec = sec; if (sec <= 5 && sec > 0) IM.sfx.tick(0.6); }
      if (left <= 0) reveal();
    }, 100);
    cancelAnimationFrame(raf);
    (function frame() {
      if (state !== "q") return;
      var left = Math.max(0, DUR - (Date.now() - qStart) / 1000);
      var bar = root.querySelector(".q-timer i"), sec = root.querySelector(".q-sec");
      if (bar) { bar.style.transform = "scaleX(" + left / DUR + ")"; bar.parentNode.classList.toggle("late", left < 6); }
      if (sec) sec.textContent = Math.ceil(left);
      raf = requestAnimationFrame(frame);
    })();
  }
  function sendQ(p) {
    var left = Math.max(0, DUR - (Date.now() - qStart) / 1000);
    send(p, { t: "q", i: qi, n: Q.length, text: Q[qi].q, opts: Q[qi].o, dur: DUR, left: left, done: p.ans[qi] != null });
  }
  function reveal() {
    if (state !== "q") return;
    clearInterval(timer);
    state = "reveal";
    list().forEach(function (p) { p.score += p.pts[qi] || 0; });
    render();
    IM.sfx.correct();
    list().forEach(sendRes);
  }
  function sendRes(p) {
    var r = ranked(), rank = r.indexOf(p) + 1;
    send(p, { t: "res", i: qi, ok: p.ans[qi] === Q[qi].c, none: p.ans[qi] == null, pts: p.pts[qi] || 0, score: p.score, rank: rank, of: r.length, correct: Q[qi].c, opt: Q[qi].o[Q[qi].c] });
  }
  function podium() {
    state = "podium";
    render();
    IM.playEra(6);
    IM.oneShot("im-win", 0.9);
    confetti();
    list().forEach(sendEnd);
  }
  function sendEnd(p) {
    var r = ranked();
    send(p, { t: "end", rank: r.indexOf(p) + 1, of: r.length, score: p.score, top: r.slice(0, 3).map(function (x) { return { name: x.name, emoji: x.emoji, score: x.score }; }) });
  }

  // ---------- desenarea pe ecranul mare ----------
  function updCount() {
    var el = root.querySelector(".q-ans");
    if (el) el.innerHTML = "<b>" + answered() + "</b> / " + order.length + " au răspuns";
    var c = root.querySelector(".q-count");
    if (c) c.innerHTML = "<b>" + order.length + "</b> în joc";
  }
  function render() {
    if (state === "lobby") {
      var qr = '<span class="q-wait">se pregătește codul…</span>';
      if (noServer) qr = '<p class="q-howto"><b>Pornește serverul pe laptop</b>VS Code → Terminal →<br><code>npm start</code><br>apoi deschide prezentarea de pe <code>localhost:8000</code></p>';
      else if (typeof qrcode !== "undefined" && linkUrl) { var q = qrcode(0, "M"); q.addData(linkUrl); q.make(); qr = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }).replace(/fill="white"/g, 'fill="#c8ff2e"').replace(/fill:\s*white/g, "fill:#c8ff2e"); }
      var chips = list().map(function (p) { return '<span class="q-chip" style="--c:' + p.color + '"><span>' + p.emoji + "</span>" + esc(p.name) + "</span>"; }).join("");
      root.innerHTML =
        '<div class="q-lobby">' +
        '<h2 class="q-title">QUIZ!<small>6 întrebări · 20 de secunde · contează și viteza ⚡</small></h2>' +
        '<ol class="q-steps"><li style="--rot:-2deg"><b>1</b>scanezi codul</li><li style="--rot:1.5deg"><b>2</b>îți scrii numele</li><li style="--rot:-1deg"><b>3</b>răspunzi rapid pe telefon</li></ol>' +
        '<p class="q-count"><b>' + order.length + "</b> în joc</p>" +
        '<div class="q-players">' + (chips || '<span class="q-empty">Așteptăm primul curajos… 👀</span>') + "</div>" +
        '<div class="q-qrbox"><div class="q-qr">' + qr + "</div><p>Scanează cu camera telefonului</p>" +
        '' + (linkHost ? '<p style="font-size:17px;font-weight:600">sau intră pe <b>' + esc(linkHost) + "</b><br>și scrie codul</p>" : "") + '<code>' + (code || "······").toUpperCase() + '</code><p class="q-st mono">' + (root._st || "se conectează…") + '</p><p class="q-ips mono"></p></div>' +
        '<div class="q-go"><button type="button" class="pill hot" data-act="start">▶ Pornește quiz-ul</button><small>→ / spațiu · B = 5 boți pentru repetiție</small></div>' +
        "</div>";
    } else if (state === "q" || state === "reveal") {
      var Qd = Q[qi], tot = Math.max(1, order.length), counts = [0, 0, 0, 0];
      list().forEach(function (p) { if (p.ans[qi] != null) counts[p.ans[qi]]++; });
      var opts = Qd.o.map(function (t, k) {
        return '<div class="q-opt' + (k === Qd.c ? " ok" : "") + '" style="--c:' + OPT[k].c + '"><span class="sh">' + OPT[k].s + '</span><span class="tx">' + esc(t) + '</span><span class="n">' + counts[k] + '</span><i class="bar" style="width:' + (state === "reveal" ? (100 * counts[k]) / tot : 0) + '%"></i></div>';
      }).join("");
      var top = ranked().slice(0, 3).map(function (p, k) { return "<div>" + ["🥇", "🥈", "🥉"][k] + " " + esc(p.name) + " · " + p.score + "</div>"; }).join("");
      root.innerHTML =
        '<div class="q-q' + (state === "reveal" ? " reveal" : "") + '">' +
        '<div class="q-top"><span class="q-num">Întrebarea ' + (qi + 1) + " / " + Q.length + '</span><span class="q-ans"></span></div>' +
        '<h2 class="q-text">' + esc(Qd.q) + "</h2>" +
        (state === "q" ? '<span class="q-sec">' + DUR + '</span><div class="q-timer"><i></i></div>' : "") +
        '<div class="q-opts">' + opts + "</div>" +
        (state === "reveal" ? '<p class="q-why">' + Qd.w + "</p>" + (top ? '<div class="q-mini">' + top + "</div>" : "") : "") +
        "</div>";
      if (state === "reveal") root.querySelector(".q-ans").style.display = "none";
      updCount();
    } else if (state === "podium") {
      var r = ranked(), slots = [r[1], r[0], r[2]], hs = ["250px", "360px", "190px"], nums = ["2", "1", "3"], cols = ["#c8ff2e", "#ffd21f", "#ff9500"], dl = ["0.5s", "1.1s", "0.2s"];
      var pod = slots.map(function (p, k) {
        if (!p) return '<div class="pod"></div>';
        return '<div class="pod"><div class="who" style="--dl:' + dl[k] + '"><span>' + p.emoji + "</span>" + esc(p.name) + "<small>" + p.score + ' p</small></div><div class="blk" style="--h:' + hs[k] + ";--c:" + cols[k] + ";--dl:" + dl[k] + '">' + nums[k] + "</div></div>";
      }).join("");
      var rest = r.slice(3, 10).map(function (p, k) { return "<li>" + (k + 4) + ". " + p.emoji + " " + esc(p.name) + " · " + p.score + "</li>"; }).join("");
      root.innerHTML =
        '<div class="q-board"><h2>Podiumul 🏆</h2>' +
        (r.length ? '<div class="podium">' + pod + "</div>" : '<p class="q-empty" style="position:absolute;left:230px;top:300px">N-a jucat nimeni… data viitoare! 😅</p>') +
        (rest ? '<ol class="q-rest">' + rest + "</ol>" : "") +
        '<canvas id="confetti" width="1920" height="1080"></canvas></div>';
    }
    if (state === "lobby" && window.SRNBus) SRNBus.ipPicker(root.querySelector(".q-ips"), drawLink);
    var b = root.querySelector("[data-act=start]");
    if (b) b.addEventListener("click", function () { IM.ensureAudio(); startQ(0); });
  }

  function confetti() {
    var cv = document.getElementById("confetti");
    if (!cv) return;
    var c = cv.getContext("2d"), P = [], cols = ["#c8ff2e", "#ffd21f", "#ff2f8e", "#ff9500", "#22d98a", "#a98bff", "#fff3d6"];
    for (var k = 0; k < 260; k++) P.push({ x: Math.random() * 1920, y: -Math.random() * 900, w: 10 + Math.random() * 14, h: 6 + Math.random() * 10, vy: 3 + Math.random() * 5, vx: -2 + Math.random() * 4, r: Math.random() * 6, vr: -0.2 + Math.random() * 0.4, c: cols[k % cols.length] });
    var t0 = performance.now();
    (function f(now) {
      if (!document.getElementById("confetti")) return;
      c.clearRect(0, 0, 1920, 1080);
      P.forEach(function (p) {
        p.y += p.vy; p.x += p.vx + Math.sin((now + p.r * 400) / 300); p.r += p.vr;
        c.save(); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.c; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); c.restore();
      });
      if (now - t0 < 7000) requestAnimationFrame(f); else c.clearRect(0, 0, 1920, 1080);
    })(t0);
  }

  // tasta B în lobby = boți de repetiție
  addEventListener("keydown", function (e) {
    if ((e.key === "b" || e.key === "B") && state === "lobby" && IM.slide(IM.cur) === root.closest(".sl")) addBots(5);
  });

  window.IMQuiz = {
    enter: function () {
      startPeer();
      var qs = new URLSearchParams(location.search);
      if (qs.get("bots") && !order.length) addBots(+qs.get("bots") || 5);
      render();
    },
    leave: function () {},
    next: function () {
      if (state === "lobby") { IM.ensureAudio(); startQ(0); return true; }
      if (state === "q") { reveal(); return true; }
      if (state === "reveal") { if (qi + 1 < Q.length) startQ(qi + 1); else podium(); return true; }
      return false;
    },
    prev: function () { return state === "q" || state === "reveal"; },
    reset: function () { state = "lobby"; qi = -1; list().forEach(function (p) { p.score = 0; p.ans = {}; p.pts = {}; }); render(); bcast({ t: "lobby", n: order.length }); },
  };
  render();
})();
