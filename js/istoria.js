// Motorul prezentărilor-„drum”: proiectul 06 (Istoria Multimediei) și 07 (Istoria Camerei).
// O pagină își poate da setările în window.IM_CFG (deck, numele epocilor, întrebările de quiz)
// și stații interactive noi în window.IM_EXT, încărcate înaintea acestui fișier.
// Scena 1920×1080 · un drum șerpuit leagă slide-urile · camera „zboară” de la o stație la alta.
// Muzica: bucle pe epoci (audio/im-*.m4a), sunetele de tranziție sunt sintetizate aici, în WebAudio.
(function () {
  "use strict";
  var CFG = window.IM_CFG || {};
  var DECK = CFG.deck || "im";
  var W = 1920, H = 1080;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var stage = $("#stage"), cam = $("#cam"), world = $("#world"), vp = $("#vp");
  var SL = $$(".sl");
  var N = SL.length;
  var cur = 0, busy = false, seen = {};
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- scalarea scenei ----------
  function fit() {
    var k = Math.min(innerWidth / W, innerHeight / H);
    stage.style.setProperty("--k", k);
  }
  addEventListener("resize", fit);
  fit();

  // ---------- pregătirea slide-urilor ----------
  function lum(hex) {
    var m = /#([0-9a-f]{6})/i.exec(hex || "");
    if (!m) return 1;
    var n = parseInt(m[1], 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  var nodes = SL.map(function (s, i) {
    s.style.top = i * H + "px";
    var acc = (s.getAttribute("style").match(/--acc:\s*(#[0-9a-f]{6})/i) || [])[1];
    if (acc && lum(acc) < 0.35) s.style.setProperty("--emfg", "#fff3d6");
    var p = (s.dataset.node || "960,540").split(",").map(Number);
    return { x: p[0], y: p[1] + i * H, st: s.dataset.st };
  });
  world.style.height = N * H + "px";
  // litere de colaj: index pentru animația de cădere
  $$(".collage").forEach(function (c) { $$("i", c).forEach(function (el, k) { el.style.setProperty("--n", k); }); });

  // ---------- drumul ----------
  var road = $("#road"), pBase = $("#road-base"), pDash = $("#road-dash"), pProg = $("#road-prog");
  road.setAttribute("width", W);
  road.setAttribute("height", N * H);
  road.setAttribute("viewBox", "0 0 " + W + " " + N * H);
  function seg(A, B, i) {
    var yb = (i + 1) * H - 92, yt = (i + 1) * H + 92;
    var w1 = A.x < 960 ? 46 : -46, w2 = B.x < 960 ? 46 : -46;
    return " C " + (A.x + w1) + " " + (A.y + (yb - A.y) * 0.35) + ", " + (A.x - w1) + " " + (yb - 110) + ", " + A.x + " " + yb +
      " C " + A.x + " " + (yb + 150) + ", " + B.x + " " + (yt - 150) + ", " + B.x + " " + yt +
      " C " + (B.x + w2) + " " + (yt + 110) + ", " + (B.x - w2) + " " + (B.y - (B.y - yt) * 0.35) + ", " + B.x + " " + B.y;
  }
  var dFull = "M " + nodes[0].x + " " + nodes[0].y;
  var prefix = [dFull];
  for (var i = 0; i < N - 1; i++) {
    dFull += seg(nodes[i], nodes[i + 1], i);
    prefix.push(dFull);
  }
  [pBase, pDash, pProg].forEach(function (p) { p.setAttribute("d", dFull); });
  var tmp = document.createElementNS("http://www.w3.org/2000/svg", "path");
  road.appendChild(tmp);
  var LEN = prefix.map(function (d) { tmp.setAttribute("d", d); return tmp.getTotalLength(); });
  road.removeChild(tmp);
  var TOTAL = pProg.getTotalLength();
  pProg.style.strokeDasharray = TOTAL + " " + TOTAL;
  var gN = $("#road-nodes");
  nodes.forEach(function (n, i) {
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("class", "node" + (n.st ? " st" : ""));
    var r = n.st ? 44 : 22;
    g.innerHTML = '<circle class="o" cx="' + n.x + '" cy="' + n.y + '" r="' + r + '"/><circle class="i" cx="' + n.x + '" cy="' + n.y + '" r="' + (r - 9) + '"/>' +
      (n.st ? '<text x="' + n.x + '" y="' + (n.y + 2) + '">' + n.st + "</text>" : "");
    gN.appendChild(g);
    n.g = g;
  });
  var trav = $("#traveler");
  function setProgress(len) {
    pProg.style.strokeDashoffset = TOTAL - len;
    var p = pProg.getPointAtLength(Math.max(0, Math.min(TOTAL, len)));
    trav.style.transform = "translate(" + p.x + "px," + p.y + "px)";
  }

  // ---------- HUD ----------
  var dots = $("#dots");
  SL.forEach(function (s, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.title = s.dataset.name;
    if (s.dataset.st) { b.className = "st"; b.textContent = s.dataset.st; }
    b.addEventListener("click", function () { go(i); });
    dots.appendChild(b);
  });
  var dotEls = $$("button", dots);
  function pad(n) { return String(n).padStart(2, "0"); }
  var recT0 = 0, recOn = false;
  function recStart() { if (!recOn) { recOn = true; recT0 = Date.now(); } }
  function elapsed() { return recOn ? Math.floor((Date.now() - recT0) / 1000) : 0; }
  setInterval(function () { var s = elapsed(); $("#rec-t").textContent = pad(Math.floor(s / 60)) + ":" + pad(s % 60); }, 500);
  $("#rec").addEventListener("click", function () { recOn = true; recT0 = Date.now(); });

  // ---------- navigarea ----------
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function visible(a, b) {
    var lo = Math.min(a, b) - 1, hi = Math.max(a, b) + 1;
    SL.forEach(function (s, j) { s.classList.toggle("far", j < lo || j > hi); });
  }
  function hud(i) {
    $("#count").textContent = pad(i + 1) + " / " + pad(N);
    dotEls.forEach(function (d, j) { d.classList.toggle("cur", j === i); d.classList.toggle("seen", !!seen[j] && j !== i); });
    nodes.forEach(function (n, j) { n.g.classList.toggle("done", j <= i); });
    vp.style.setProperty("--vpbg", getComputedStyle(SL[i]).getPropertyValue("--bg"));
    try { history.replaceState(null, "", "#" + (i + 1)); } catch (e) {}
  }
  var anims = [];
  function go(i, instant) {
    i = Math.max(0, Math.min(N - 1, i));
    if (i === cur && !instant) return;
    var from = cur, dist = Math.abs(i - from);
    leave(from);
    anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
    anims = [];
    cur = i;
    seen[i] = true;
    hud(i);
    var y0 = -from * H, y1 = -i * H;
    var dur = instant || reduce ? 0 : Math.min(2300, 1050 + 260 * (dist - 1));
    if (!dur) {
      world.style.transform = "translateY(" + y1 + "px)";
      cam.style.transform = "";
      setProgress(LEN[i]);
      SL.forEach(function (s) { s.classList.remove("on"); });
      visible(i, i);
      SL[i].classList.add("on");
      enter(i);
      return;
    }
    visible(from, i);
    busy = true;
    if (A.ctx) sfx.whoosh(dur / 1000);
    world.style.transform = "translateY(" + y1 + "px)";
    anims.push(world.animate([{ transform: "translateY(" + y0 + "px)" }, { transform: "translateY(" + y1 + "px)" }], { duration: dur, easing: "cubic-bezier(.65,0,.35,1)" }));
    var zoom = dist > 1 ? Math.max(0.42, 0.82 - 0.09 * dist) : 0.8;
    anims.push(cam.animate([{ transform: "scale(1) rotate(0deg)" }, { transform: "scale(" + zoom + ") rotate(" + (i > from ? -1.2 : 1.2) + "deg)", offset: 0.5 }, { transform: "scale(1) rotate(0deg)" }], { duration: dur, easing: "ease-in-out" }));
    var l0 = LEN[from], l1 = LEN[i], t0 = performance.now(), arrived = false;
    (function step(now) {
      var t = Math.min(1, (now - t0) / dur);
      setProgress(l0 + (l1 - l0) * ease(t));
      if (!arrived && t > 0.56) {
        arrived = true;
        SL[i].classList.add("on");
        enter(i);
      }
      if (t < 1 && cur === i) requestAnimationFrame(step);
      else if (cur === i) {
        busy = false;
        SL.forEach(function (s, j) { if (j !== i) s.classList.remove("on"); });
        visible(i, i);
      }
    })(t0);
  }
  function next() {
    if (window.IMQuiz && SL[cur].dataset.int === "quiz" && IMQuiz.next()) return;
    go(cur + 1);
  }
  function prev() {
    if (window.IMQuiz && SL[cur].dataset.int === "quiz" && IMQuiz.prev()) return;
    go(cur - 1);
  }

  // ---------- AUDIO ----------
  var LOOPS = { 0: "im-e0", 1: "im-e1", 2: "im-e2", 3: "im-e3", 4: "im-e4", 5: "im-e5", 6: "im-e6", quiz: "im-quiz" };
  var LOOPLEN = { "im-e0": 22.857143, "im-e1": 24, "im-e2": 20, "im-e3": 19.2, "im-e4": 16, "im-e5": 17.142857, "im-e6": 15.737705, "im-quiz": 15, "im-win": 4.2 };
  var ERANAME = CFG.eraname || { 0: "Preistorie · tobă și fluier", 1: "Ev Mediu · laută și ney", 2: "Secolul XIX · cutie muzicală", 3: "Cinema mut · ragtime", 4: "Anii '50 · jazz", 5: "Computerul · synth și 8-bit", 6: "Acum · deep house de ședință foto", quiz: "Quiz · tic-tac" };
  var A = { ctx: null, bufs: {}, cur: null, era: null, muted: false, vol: 0.34, soft: 1, ducked: false };
  function ensureAudio() {
    if (!A.ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      A.ctx = new C();
      A.master = A.ctx.createGain();
      A.master.connect(A.ctx.destination);
      A.music = A.ctx.createGain();
      A.music.gain.value = A.vol;
      A.music.connect(A.master);
      A.fx = A.ctx.createGain();
      A.fx.gain.value = 0.75;
      A.fx.connect(A.master);
      var len = A.ctx.sampleRate * 2, nb = A.ctx.createBuffer(1, len, A.ctx.sampleRate), d = nb.getChannelData(0);
      for (var k = 0; k < len; k++) d[k] = Math.random() * 2 - 1;
      A.noise = nb;
      recStart();
    }
    if (A.ctx.state === "suspended") A.ctx.resume();
    return A.ctx;
  }
  function load(name) {
    if (!A.bufs[name]) {
      A.bufs[name] = fetch("audio/" + name + ".m4a")
        .then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
        .then(function (b) { return new Promise(function (res, rej) { A.ctx.decodeAudioData(b, res, rej); }); })
        .catch(function () { delete A.bufs[name]; return null; });
    }
    return A.bufs[name];
  }
  function musicLevel() { return A.vol * A.soft * (A.ducked ? 0.18 : 1); }
  function applyLevel() { if (A.ctx) A.music.gain.setTargetAtTime(musicLevel(), A.ctx.currentTime, 0.25); }
  function playEra(era, soft) {
    if (!A.ctx) return;
    A.soft = soft ? 0.6 : 1;
    applyLevel();
    if (era === A.era) return;
    A.era = era;
    var name = LOOPS[era];
    if (!name) return;
    var el = $("#era-name");
    el.textContent = "♪ " + (ERANAME[era] || "");
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.remove("show"); }, 4200);
    load(name).then(function (buf) {
      if (!buf || A.era !== era) return;
      var L = LOOPLEN[name], ctx = A.ctx, now = ctx.currentTime;
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.loopStart = 0.3 * L;
      src.loopEnd = Math.min(buf.duration - 0.01, 1.3 * L);
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(1, now + 1.4);
      src.connect(g);
      g.connect(A.music);
      src.start(now, 0.3 * L);
      var old = A.cur;
      if (old) {
        old.g.gain.cancelScheduledValues(now);
        old.g.gain.setValueAtTime(old.g.gain.value || 1, now);
        old.g.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
        try { old.src.stop(now + 1.6); } catch (e) {}
      }
      A.cur = { src: src, g: g };
    });
  }
  function duck(on) { A.ducked = !!on; applyLevel(); }
  function setMute(m) {
    A.muted = m;
    $("#snd").textContent = m ? "🔇" : "🔊";
    $("#snd").classList.toggle("on", !m && !!A.ctx);
    if (A.ctx) A.master.gain.setTargetAtTime(m ? 0 : 1, A.ctx.currentTime, 0.08);
  }
  function oneShot(name, vol) {
    if (!ensureAudio()) return;
    load(name).then(function (buf) {
      if (!buf) return;
      var s = A.ctx.createBufferSource(), g = A.ctx.createGain();
      g.gain.value = vol || 0.9;
      s.buffer = buf;
      s.connect(g);
      g.connect(A.fx);
      s.start();
    });
  }

  // ---------- efecte sonore sintetizate ----------
  var sfx = (function () {
    function C() { return A.ctx; }
    function out(vol) { var g = C().createGain(); g.gain.value = vol; g.connect(A.fx); return g; }
    function env(g, t, a, d, peak) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    }
    function tone(f, dur, type, vol, f2, delay) {
      if (!C()) return;
      var t = C().currentTime + (delay || 0), o = C().createOscillator(), g = C().createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
      env(g, t, 0.005, dur, vol || 0.3);
      o.connect(g);
      g.connect(A.fx);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
    function noise(dur, type, f, q, vol, delay, f2) {
      if (!C()) return;
      var t = C().currentTime + (delay || 0), s = C().createBufferSource(), fl = C().createBiquadFilter(), g = C().createGain();
      s.buffer = A.noise;
      fl.type = type || "bandpass";
      fl.frequency.setValueAtTime(f || 1000, t);
      if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
      fl.Q.value = q || 1;
      env(g, t, 0.004, dur, vol || 0.3);
      s.connect(fl);
      fl.connect(g);
      g.connect(A.fx);
      s.start(t, Math.random());
      s.stop(t + dur + 0.05);
    }
    var api = {
      tone: tone,
      noise: noise,
      whoosh: function (d) {
        if (!C()) return;
        var t = C().currentTime, s = C().createBufferSource(), fl = C().createBiquadFilter(), g = C().createGain();
        s.buffer = A.noise;
        s.loop = true;
        fl.type = "bandpass";
        fl.Q.value = 1.2;
        fl.frequency.setValueAtTime(250, t);
        fl.frequency.exponentialRampToValueAtTime(2600, t + d * 0.5);
        fl.frequency.exponentialRampToValueAtTime(400, t + d);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.32, t + d * 0.5);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        s.connect(fl);
        fl.connect(g);
        g.connect(A.fx);
        s.start(t);
        s.stop(t + d + 0.1);
      },
      pop: function () { tone(520, 0.14, "sine", 0.35, 260); },
      drum: function () { tone(110, 0.5, "sine", 0.8, 48); noise(0.08, "lowpass", 900, 0.7, 0.4); tone(160, 0.3, "sine", 0.3, 70, 0.32); },
      shimmer: function () { [2093, 2637, 3136, 3951, 4699].forEach(function (f, k) { tone(f, 1.2, "sine", 0.07, null, k * 0.07); }); },
      thud: function () { tone(70, 0.4, "sine", 0.9, 40); noise(0.12, "lowpass", 500, 0.8, 0.5); tone(420, 0.09, "square", 0.08, 300, 0.01); },
      shutter: function () { noise(0.03, "highpass", 3000, 0.7, 0.6); noise(0.05, "bandpass", 1800, 2, 0.4, 0.07); },
      whirr: function () { for (var k = 0; k < 14; k++) noise(0.02, "bandpass", 2500, 3, 0.25, k * (0.09 - k * 0.004)); },
      tick: function (v) { noise(0.015, "bandpass", 3200, 4, v || 0.25); },
      needle: function () { noise(0.6, "bandpass", 2200, 0.6, 0.12); tone(90, 0.15, "sine", 0.4, 60); for (var k = 0; k < 9; k++) noise(0.01, "highpass", 2000, 1, 0.3, Math.random() * 0.6); },
      proj: function (d) { d = d || 1.2; for (var k = 0; k < d * 18; k++) noise(0.018, "bandpass", 1800 + Math.random() * 400, 3, 0.16, k / 18); },
      stat: function (d) { noise(d || 0.9, "highpass", 600, 0.5, 0.22); },
      beep: function () { tone(1000, 0.9, "sine", 0.22); },
      blip: function () { tone(880, 0.06, "square", 0.08); tone(1320, 0.06, "square", 0.08, null, 0.07); },
      type: function () { noise(0.02, "highpass", 2500, 0.8, 0.35); tone(1400, 0.03, "square", 0.04); },
      glitch: function () { for (var k = 0; k < 10; k++) tone(200 + Math.random() * 1800, 0.04, "square", 0.07, null, k * 0.035); tone(1760, 0.25, "sine", 0.18, null, 0.42); tone(2637, 0.4, "sine", 0.14, null, 0.5); },
      ping: function () { tone(1568, 0.25, "sine", 0.22); tone(2093, 0.4, "sine", 0.18, null, 0.12); },
      sparkle: function () { [1047, 1319, 1568, 2093, 2637].forEach(function (f, k) { tone(f, 0.5, "triangle", 0.1, null, k * 0.06); }); },
      rise: function () { tone(220, 0.9, "sawtooth", 0.07, 880); noise(0.9, "bandpass", 300, 1, 0.12, 0, 4000); },
      correct: function () { [523, 659, 784, 1047].forEach(function (f, k) { tone(f, 0.25, "triangle", 0.2, null, k * 0.08); }); },
      wrong: function () { tone(180, 0.45, "sawtooth", 0.12, 120); },
      join: function () { tone(660, 0.08, "sine", 0.25, 990); tone(990, 0.12, "sine", 0.2, null, 0.08); },
      modem: function () {
        if (!C()) return;
        [697, 1209, 852, 1336, 941, 1477, 770, 1209].forEach(function (f, k) { tone(f, 0.09, "sine", 0.12, null, (k >> 1) * 0.13); });
        tone(2100, 0.7, "sine", 0.12, null, 0.6);
        for (var k = 0; k < 12; k++) tone(1200 + Math.random() * 1200, 0.09, "sawtooth", 0.05, 900 + Math.random() * 1500, 1.35 + k * 0.08);
        noise(1.2, "bandpass", 1800, 0.4, 0.12, 2.3);
      },
      fire: (function () {
        var node = null, timer = null;
        return {
          on: function () {
            if (!C() || node) return;
            var s = C().createBufferSource(), fl = C().createBiquadFilter(), g = C().createGain();
            s.buffer = A.noise; s.loop = true; fl.type = "lowpass"; fl.frequency.value = 520; g.gain.value = 0.09;
            s.connect(fl); fl.connect(g); g.connect(A.fx); s.start();
            node = { s: s, g: g };
            timer = setInterval(function () { if (Math.random() < 0.55) noise(0.012, "highpass", 1500, 1, 0.12 + Math.random() * 0.25); }, 90);
          },
          off: function () {
            if (!node) return;
            node.g.gain.setTargetAtTime(0, C().currentTime, 0.2);
            var n = node; setTimeout(function () { try { n.s.stop(); } catch (e) {} }, 800);
            node = null; clearInterval(timer);
          },
        };
      })(),
    };
    return api;
  })();
  var STING = { 3: "drum", 4: "shimmer", 5: "thud", 6: "shutter", 7: "whirr", 8: "needle", 9: "proj", 10: "stat", 11: "blip", 12: "glitch", 13: "proj", 14: "pop", 15: "rise", 16: "sparkle" };

  // ---------- intrare / ieșire din slide ----------
  var INT = {};
  if (window.IM_EXT) for (var ek in IM_EXT) INT[ek] = IM_EXT[ek];
  function enter(i) {
    var s = SL[i], k = s.dataset.int;
    var era = s.dataset.era;
    if (A.ctx) {
      playEra(era === "quiz" ? "quiz" : +era, s.dataset.soft === "1");
      var st = "sting" in s.dataset ? s.dataset.sting : CFG.deck ? "" : STING[i];
      if (st && sfx[st]) setTimeout(function () { if (cur === i) sfx[st](); }, 80);
      // pregătim muzica stației următoare
      var nx = SL[i + 1];
      if (nx) { var ne = nx.dataset.era; load(LOOPS[ne === "quiz" ? "quiz" : +ne]); }
    }
    if (k && INT[k]) {
      if (!INT[k]._init) { INT[k]._init = true; INT[k].init && INT[k].init(s); }
      INT[k].enter && INT[k].enter(s);
    }
    $$("video[data-auto]", s).forEach(function (v) { v.play().catch(function () {}); });
    sendState(true);
  }
  function leave(i) {
    var s = SL[i], k = s.dataset.int;
    if (k && INT[k] && INT[k]._init && INT[k].leave) INT[k].leave(s);
    $$("video", s).forEach(function (v) { try { v.pause(); } catch (e) {} });
  }

  // imaginile/filmele de pe Wikimedia: dacă nu se încarcă, rămâne un fundal hașurat, nu o imagine spartă
  $$("img").forEach(function (im) {
    im.addEventListener("error", function () { (im.closest(".cut,.poster,.disc,.strip-frame,.polar-img,.fb") || im.parentNode).classList.add("noimg"); });
  });

  // ---------- 00 · titlul ----------
  $("#start-btn").addEventListener("click", function () {
    ensureAudio();
    setMute(false);
    playEra(0);
    sfx.sparkle();
    recStart();
    this.classList.add("on");
    this.innerHTML = "<b>✓</b> Sunetul e pornit <small>apasă → ca să mergem</small>";
  });

  // ---------- 01 · cele cinci elemente ----------
  $$(".el").forEach(function (el) {
    el.addEventListener("click", function () {
      ensureAudio();
      var s = el.dataset.snd;
      if (s === "beep") sfx.tone(660, 0.3, "triangle", 0.25), sfx.tone(880, 0.3, "triangle", 0.2, null, 0.15);
      else if (s === "projector") sfx.proj(0.6);
      else if (sfx[s]) sfx[s]();
      el.classList.remove("hit");
      void el.offsetWidth;
      el.classList.add("hit");
    });
  });

  // ---------- 02 · harta ----------
  (function () {
    var path = $(".map-road .mr-base"), box = $("#map-flags");
    var L = path.getTotalLength();
    var cols = ["#ffd21f", "#c8ff2e", "#ff2f8e", "#ff9500", "#22d98a", "#fff3d6", "#ffd21f", "#ff6a13", "#c8ff2e", "#ff2f8e"];
    var stations = SL.map(function (s, i) { return { s: s, i: i }; }).filter(function (o) { return o.s.dataset.st; });
    stations.forEach(function (o, k) {
      var p = path.getPointAtLength(L * (0.03 + 0.94 * (k / (stations.length - 1))));
      var b = document.createElement("button");
      b.type = "button";
      b.className = "flag";
      b.style.left = p.x + "px";
      b.style.top = p.y + "px";
      b.style.setProperty("--n", k);
      var yr = (($(".yr", o.s) || {}).firstChild || {}).textContent || "";
      b.innerHTML = '<span class="fl" style="--c:' + cols[k] + ";--rot:" + (k % 2 ? 3 : -3) + 'deg"><small>stația ' + pad(k + 1) + "</small><b>" + yr.trim() + "</b><span>" + (o.s.dataset.short || o.s.dataset.name) + '</span></span><span class="stick"></span><span class="dot"></span>';
      b.addEventListener("click", function () { go(o.i); });
      box.appendChild(b);
    });
  })();

  // ---------- 03 · peștera ----------
  INT.cave = {
    init: function (s) {
      var cv = $("#cave");
      this.cv = cv;
      cv.addEventListener("pointermove", function (e) {
        var r = cv.getBoundingClientRect();
        cv.style.setProperty("--x", ((e.clientX - r.left) / r.width) * 100 + "%");
        cv.style.setProperty("--y", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
      $$(".cave-ui .pill", s).forEach(function (b) {
        b.addEventListener("click", function () {
          ensureAudio();
          var t = b.dataset.mode === "torch";
          cv.classList.toggle("torch", t);
          if (t) sfx.fire.on(); else sfx.fire.off();
        });
      });
    },
    leave: function () { this.cv.classList.remove("torch"); if (A.ctx) sfx.fire.off(); },
  };

  // ---------- 04 · camera obscura ----------
  INT.obscura = {
    init: function (s) {
      var self = this, btn = $(".obs-btn", s), box = $(".obs-cam", s), v = $("#obs-video");
      btn.addEventListener("click", function () {
        ensureAudio();
        sfx.shimmer();
        if (self.stream) { self.stop(); return; }
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { btn.textContent = "📷 camera nu e disponibilă aici"; return; }
        navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false }).then(function (st) {
          self.stream = st;
          v.srcObject = st;
          v.play();
          box.hidden = false;
          btn.textContent = "⏹ Ieși din camera obscură";
        }).catch(function () { btn.textContent = "📷 n-am primit acces la cameră"; });
      });
      this.stop = function () {
        if (self.stream) self.stream.getTracks().forEach(function (t) { t.stop(); });
        self.stream = null;
        box.hidden = true;
        btn.textContent = "📷 Intră tu în camera obscură";
      };
    },
    leave: function () { this.stop && this.stop(); },
  };

  // ---------- 05 · presa ----------
  INT.press = {
    init: function (s) {
      var word = "MULTIMEDIA", types = $("#press-types"), sheet = $("#press-sheet"), stack = $("#press-stack"), n = 0, lock = false, press = $(".press", s);
      types.innerHTML = word.split("").map(function (c) { return "<i>" + c + "</i>"; }).join("");
      $(".press-btn", s).addEventListener("click", function () {
        if (lock) return;
        lock = true;
        ensureAudio();
        press.classList.add("slam");
        setTimeout(function () { sfx.thud(); sheet.classList.add("printed"); }, 170);
        setTimeout(function () {
          press.classList.remove("slam");
          n++;
          $("#press-n").textContent = n;
          var p = document.createElement("i");
          p.style.setProperty("--r", (Math.random() * 16 - 8).toFixed(1) + "deg");
          p.style.setProperty("--x", (Math.random() * 10 - 5).toFixed(0) + "px");
          p.style.setProperty("--y", (-Math.min(n, 12) * 3).toFixed(0) + "px");
          stack.appendChild(p);
          if (stack.children.length > 14) stack.removeChild(stack.firstChild);
          sfx.tone(300, 0.08, "triangle", 0.12, 600);
        }, 520);
        setTimeout(function () { sheet.classList.remove("printed"); lock = false; }, 820);
      });
    },
  };

  // ---------- 06 · fotografia ----------
  INT.photo = {
    init: function (s) {
      var dev = $(".dev", s), clock = $(".clock", s), flash = $(".flash", s), self = this;
      this.reset = function () { clearInterval(self.t); dev.style.transition = "none"; dev.style.opacity = 0; clock.style.setProperty("--a", "0deg"); $("b", clock).textContent = "0 h"; };
      $$("[data-shot]", s).forEach(function (b) {
        b.addEventListener("click", function () {
          ensureAudio();
          self.reset();
          if (b.dataset.shot === "phone") {
            flash.classList.remove("go"); void flash.offsetWidth; flash.classList.add("go");
            sfx.shutter();
            return;
          }
          dev.style.opacity = 1;
          void dev.offsetWidth;
          dev.style.transition = "opacity 8s linear, filter 8s";
          dev.style.opacity = 0;
          var h = 0;
          self.t = setInterval(function () {
            h++;
            clock.style.setProperty("--a", h * 30 + "deg");
            $("b", clock).textContent = h + " h";
            sfx.tick(0.4);
            if (h >= 8) { clearInterval(self.t); sfx.shutter(); $("b", clock).textContent = "gata!"; }
          }, 1000);
        });
      });
    },
    leave: function () { clearInterval(this.t); },
  };

  // ---------- 07 · zootropul ----------
  INT.zoe = {
    init: function (s) {
      var F = 12, view = $("#zoe-view"), vx = view.getContext("2d"), strip = $("#zoe-strip"), sx = strip.getContext("2d");
      strip.width = 120 * F * 2;
      strip.height = 120;
      function bird(c, k, x, y, sc) {
        var ph = (k / F) * Math.PI * 2, wing = Math.sin(ph) * 0.9, bob = Math.cos(ph) * 8;
        c.save();
        c.translate(x, y + bob * sc);
        c.scale(sc, sc);
        c.lineJoin = "round";
        c.lineWidth = 5;
        c.strokeStyle = "#120c2b";
        // aripa din spate
        c.fillStyle = "#6a2cff";
        c.beginPath(); c.moveTo(-6, -4); c.quadraticCurveTo(-10, -40 * wing - 6, 24, -62 * wing - 4); c.quadraticCurveTo(14, -18 * wing, 12, -2); c.closePath(); c.fill(); c.stroke();
        // corpul
        c.fillStyle = "#ff2f8e";
        c.beginPath(); c.ellipse(0, 0, 34, 20, -0.08, 0, Math.PI * 2); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(-30, -2); c.lineTo(-52, -12); c.lineTo(-48, 6); c.closePath(); c.fill(); c.stroke();
        // capul
        c.beginPath(); c.arc(30, -14, 15, 0, Math.PI * 2); c.fill(); c.stroke();
        c.fillStyle = "#ffd21f"; c.beginPath(); c.moveTo(43, -16); c.lineTo(58, -11); c.lineTo(43, -7); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = "#120c2b"; c.beginPath(); c.arc(33, -17, 3, 0, Math.PI * 2); c.fill();
        // aripa din față
        c.fillStyle = "#c8ff2e";
        c.beginPath(); c.moveTo(-4, -2); c.quadraticCurveTo(0, -46 * wing - 8, 34, -70 * wing - 6); c.quadraticCurveTo(22, -20 * wing, 18, 2); c.closePath(); c.fill(); c.stroke();
        c.restore();
      }
      for (var r = 0; r < 2; r++) for (var k = 0; k < F; k++) {
        var x0 = (r * F + k) * 120;
        sx.fillStyle = k % 2 ? "#fff3d6" : "#ffe9b8";
        sx.fillRect(x0, 0, 120, 120);
        bird(sx, k, x0 + 58, 70, 0.95);
        sx.fillStyle = "#120c2b";
        sx.fillRect(x0 + 116, 0, 4, 120);
      }
      var ang = 0, vel = 0, hold = false, drag = null, lastF = -1, lastTick = 0, self = this;
      function frame(k) {
        vx.fillStyle = "#fff3d6";
        vx.fillRect(0, 0, 420, 300);
        vx.fillStyle = "rgba(18,12,43,.06)";
        for (var y = 0; y < 300; y += 24) vx.fillRect(0, y, 420, 2);
        bird(vx, k, 200, 175, 2.4);
      }
      frame(0);
      function loop(now) {
        if (!self.run) return;
        if (hold) vel = Math.min(0.42, vel + 0.006);
        else if (!drag) vel *= 0.985;
        if (Math.abs(vel) < 0.0008) vel = 0;
        ang += vel;
        var f = ((Math.floor(ang) % F) + F) % F;
        if (f !== lastF) {
          frame(f);
          lastF = f;
          if (A.ctx && now - lastTick > 45 && Math.abs(vel) > 0.03) { sfx.tick(0.12); lastTick = now; }
        }
        var off = (((ang % F) + F) % F) * 72;
        strip.style.transform = "translateX(" + -off + "px)";
        $("#zoe-fps").textContent = Math.round(Math.abs(vel) * 60);
        requestAnimationFrame(loop);
      }
      this.start = function () { if (!self.run) { self.run = true; requestAnimationFrame(loop); } };
      var btn = $(".zoe-btn", s);
      function down(e) { e.preventDefault(); ensureAudio(); hold = true; btn.classList.add("down"); }
      function up() { hold = false; btn.classList.remove("down"); }
      btn.addEventListener("pointerdown", down);
      addEventListener("pointerup", up);
      btn.addEventListener("pointerleave", up);
      var wrap = $(".zoe-strip", s);
      wrap.addEventListener("pointerdown", function (e) { ensureAudio(); drag = { x: e.clientX, t: performance.now() }; wrap.setPointerCapture(e.pointerId); });
      wrap.addEventListener("pointermove", function (e) {
        if (!drag) return;
        var k = parseFloat(stage.style.getPropertyValue("--k")) || 1;
        var dx = (e.clientX - drag.x) / k, now = performance.now(), dt = Math.max(8, now - drag.t);
        vel = Math.max(-0.5, Math.min(0.5, (-dx / 72) * (16 / dt)));
        ang += -dx / 72;
        drag.x = e.clientX;
        drag.t = now;
      });
      wrap.addEventListener("pointerup", function () { drag = null; });
    },
    enter: function () { this.start(); },
    leave: function () { this.run = false; },
  };

  // ---------- 08 · prima voce ----------
  INT.voice = {
    init: function (s) {
      var cv = $("#soot"), c = cv.getContext("2d"), au = $("#voice"), btn = $("#voice-btn"), st = $("#voice-st"), self = this;
      cv.width = 1420;
      cv.height = 120;
      function bg() {
        c.fillStyle = "#1a1410";
        c.fillRect(0, 0, cv.width, cv.height);
        c.strokeStyle = "rgba(255,243,214,.12)";
        c.lineWidth = 1;
        for (var y = 14; y < cv.height; y += 18) { c.beginPath(); c.moveTo(0, y); c.lineTo(cv.width, y); c.stroke(); }
      }
      bg();
      var lastX = 0, lastY = 60, seed = Math.random() * 100;
      function draw(p) {
        var x1 = p * cv.width;
        c.strokeStyle = "#ffe7b0";
        c.lineWidth = 1.6;
        c.shadowColor = "#ffcf6a";
        c.shadowBlur = 4;
        c.beginPath();
        c.moveTo(lastX, lastY);
        for (var x = lastX; x <= x1; x += 1.5) {
          var t = x / cv.width, syl = Math.abs(Math.sin(t * Math.PI * 11 + seed));
          var amp = 34 * syl * (0.6 + 0.4 * Math.sin(t * 40));
          var y = 60 + amp * Math.sin(x * 0.9 + Math.sin(x * 0.13) * 3) + (Math.random() - 0.5) * 4;
          c.lineTo(x, y);
          lastY = y;
        }
        c.stroke();
        lastX = x1;
      }
      var raf;
      function tick() {
        if (au.paused) return;
        var d = au.duration || 13;
        draw(Math.min(1, au.currentTime / d));
        raf = requestAnimationFrame(tick);
      }
      function stopAll() { cancelAnimationFrame(raf); duck(false); if (!self.failed) btn.textContent = "▶ Ascultă din nou"; }
      au.addEventListener("playing", function () { clearTimeout(self.wd); duck(true); bg(); lastX = 0; tick(); btn.textContent = "⏸ Se aude…"; st.textContent = "9 aprilie 1860 · Paris · redare: First Sounds, 2008"; });
      au.addEventListener("error", function () { self.failed = true; });
      au.addEventListener("ended", stopAll);
      au.addEventListener("pause", stopAll);
      // dacă înregistrarea reală nu se încarcă, cântăm melodia (reconstrucție)
      function synth() {
        if (!ensureAudio() || self.synthing) return;
        self.synthing = true;
        btn.textContent = "♪ Reconstrucția melodiei…";
        st.textContent = "fără internet: reconstrucție a melodiei, nu înregistrarea";
        duck(true);
        bg(); lastX = 0;
        var notes = [60, 60, 60, 62, 64, 62, 60, 64, 62, 62, 60], t = 0, dur = 0.55, t0 = performance.now();
        notes.forEach(function (m, k) {
          var f = 440 * Math.pow(2, (m - 69) / 12) * 0.5;
          var d = k === 3 || k === 7 ? dur * 2 : dur;
          sfx.tone(f, d * 0.95, "sawtooth", 0.06, null, t);
          sfx.tone(f * 2, d * 0.95, "sine", 0.05, null, t);
          t += d;
        });
        sfx.noise(t, "bandpass", 2400, 0.5, 0.05);
        (function anim(now) {
          var p = (now - t0) / (t * 1000);
          draw(Math.min(1, p));
          if (p < 1) requestAnimationFrame(anim); else { duck(false); self.synthing = false; btn.textContent = "▶ Ascultă din nou"; }
        })(t0);
      }
      btn.addEventListener("click", function () {
        ensureAudio();
        if (!au.paused) { au.pause(); return; }
        if (self.failed) { synth(); return; }
        btn.textContent = "⏳ Se încarcă…";
        sfx.needle();
        var p = au.play();
        // dacă înregistrarea reală nu pornește în 5 secunde (fără internet), cântăm reconstrucția
        clearTimeout(self.wd);
        self.wd = setTimeout(function () { if (au.paused || au.currentTime === 0) { try { au.pause(); } catch (e) {} self.failed = true; synth(); } }, 5000);
        if (p && p.catch) p.catch(function () { clearTimeout(self.wd); self.failed = true; synth(); });
      });
      var srcs = $$("source", au), bad = 0;
      srcs.forEach(function (so) { so.addEventListener("error", function () { if (++bad >= srcs.length) { self.failed = true; } }); });
      this.au = au;
    },
    leave: function () { clearTimeout(this.wd); if (this.au && !this.au.paused) this.au.pause(); duck(false); },
  };

  // ---------- 09 · cinema ----------
  INT.cinema = {
    init: function (s) {
      var reel = $("#reel"), v = $("#roundhay"), btn = $(".reel-btn", s), self = this;
      this.v = v; this.reel = reel;
      btn.addEventListener("click", function () {
        ensureAudio();
        if (reel.classList.contains("play")) { self.stop(); return; }
        if (v.readyState === 0) v.load();
        v.playbackRate = 0.5;
        v.play().then(function () {
          reel.classList.add("play");
          btn.textContent = "⏹ Oprește proiectorul";
          self.pt = setInterval(function () { sfx.proj(0.5); }, 500);
          sfx.proj(0.5);
        }).catch(function () { $(".reel-screen", s).classList.add("noimg"); btn.textContent = "filmul nu s-a încărcat"; });
      });
      this.stop = function () { v.pause(); reel.classList.remove("play"); clearInterval(self.pt); btn.textContent = "🎞️ Rulează filmul din 1888"; };
    },
    enter: function () { if (this.v && this.v.readyState === 0) { this.v.preload = "auto"; this.v.load(); } },
    leave: function () { this.stop && this.stop(); },
  };

  // ---------- 10 · televizorul ----------
  INT.tv = {
    init: function (s) {
      var tv = $("#tv"), cv = $("#tv-c"), c = cv.getContext("2d"), self = this, img = c.createImageData(160, 120);
      cv.width = 160; cv.height = 120;
      function noise() {
        if (!tv.classList.contains("static")) return;
        for (var k = 0; k < img.data.length; k += 4) { var v = Math.random() * 255; img.data[k] = img.data[k + 1] = img.data[k + 2] = v * 0.85; img.data[k + 3] = 255; }
        c.putImageData(img, 0, 0);
        requestAnimationFrame(noise);
      }
      this.off = function () { clearTimeout(self.t); tv.classList.remove("on", "static", "bars"); };
      $$(".knob", s).forEach(function (k) {
        k.addEventListener("click", function () {
          ensureAudio();
          if (tv.classList.contains("on")) { self.off(); sfx.pop(); return; }
          tv.classList.add("on", "static");
          sfx.stat(1.1);
          noise();
          self.t = setTimeout(function () { tv.classList.remove("static"); tv.classList.add("bars"); sfx.beep(); }, 1200);
        });
      });
    },
    leave: function () { this.off && this.off(); },
  };

  // ---------- 11 · NLS + pixeli ----------
  INT.demo = {
    init: function (s) {
      var P = {
        acasă: '<p>Bună! Asta e o pagină „vie”, ca în demo-ul din 1968.</p><p>Click pe <a data-go="mouse">mouse-ul</a> lui Engelbart.</p><p>Sau pe o <a data-go="link">legătură</a> spre alt text.</p><p>Ori pe <a data-go="video">videoconferință</a>.</p>',
        mouse: '<p>Primul mouse: o <b>cutie de lemn</b> cu două rotițe și un buton.</p><p>I-au zis „mouse” pentru că firul arăta ca o coadă 🐭</p><p><a class="back" data-go="acasă">← înapoi</a></p>',
        link: '<p>Asta e un <b>hyperlink</b>: dai click și sari la altă idee.</p><p>Ideea vine din memex-ul lui <a data-go="bush">Vannevar Bush</a>.</p><p><a class="back" data-go="acasă">← înapoi</a></p>',
        bush: '<p>1945, „As We May Think”: un birou care leagă documentele prin <b>piste asociative</b>.</p><p>Peste 46 de ani: <a data-go="web">Web-ul</a>.</p><p><a class="back" data-go="acasă">← înapoi</a></p>',
        web: '<p>1991, info.cern.ch: exact ce faci acum. <b>Click → altă pagină.</b></p><p><a class="back" data-go="acasă">← acasă</a></p>',
        video: '<p>În timpul demo-ului, Engelbart lucra pe ecran cu colegii lui aflați la Menlo Park, <b>în direct, prin video</b>.</p><p>Zoom-ul, cu 50 de ani înainte.</p><p><a class="back" data-go="acasă">← înapoi</a></p>',
      };
      var body = $("#nls-body"), path = $("#nls-path");
      function show(k) {
        body.innerHTML = P[k];
        path.textContent = k;
        body.classList.remove("blink"); void body.offsetWidth; body.classList.add("blink");
      }
      body.addEventListener("click", function (e) {
        var a = e.target.closest("a[data-go]");
        if (!a) return;
        ensureAudio();
        sfx.blip();
        show(a.dataset.go);
      });
      show("acasă");
      var cv = $("#pix"), c = cv.getContext("2d"), hi = false;
      function art(sz) {
        cv.width = cv.height = sz;
        var k = sz / 100;
        c.save(); c.scale(k, k);
        var g = c.createLinearGradient(0, 0, 0, 100); g.addColorStop(0, "#6a2cff"); g.addColorStop(1, "#ff2f8e");
        c.fillStyle = g; c.fillRect(0, 0, 100, 100);
        c.fillStyle = "#ffd21f"; c.beginPath(); c.arc(70, 30, 14, 0, 7); c.fill();
        c.fillStyle = "#120c2b"; c.beginPath(); c.moveTo(0, 80); c.lineTo(30, 46); c.lineTo(52, 70); c.lineTo(72, 52); c.lineTo(100, 82); c.lineTo(100, 100); c.lineTo(0, 100); c.fill();
        c.fillStyle = "#c8ff2e"; c.font = "bold 13px Inter, sans-serif"; c.fillText("1975", 8, 18);
        c.restore();
      }
      art(100);
      $("#pix-btn").addEventListener("click", function () {
        ensureAudio(); sfx.blip();
        hi = !hi;
        art(hi ? 960 : 100);
        this.textContent = hi ? "înapoi la 0,01 MP" : "vs. 48 MP";
      });
    },
  };

  // ---------- 12 · acum ----------
  INT.now = {
    init: function (s) {
      var self = this, www = $("#www");
      $(".win-btn", s).addEventListener("click", function () {
        ensureAudio();
        duck(true);
        www.classList.remove("loaded");
        www.classList.add("loading");
        sfx.modem();
        setTimeout(function () { www.classList.remove("loading"); www.classList.add("loaded"); duck(false); sfx.ping(); }, 3500);
      });
      var ring = $("#yt-ring"), tt = $("#yt-t"), C = 326.7;
      $(".yt-play", s).addEventListener("click", function () {
        ensureAudio();
        if (self.yt) { cancelAnimationFrame(self.yt); self.yt = 0; ring.style.strokeDashoffset = 0; tt.textContent = "0:19"; return; }
        sfx.pop();
        var t0 = performance.now();
        (function f(now) {
          var e = (now - t0) / 1000, left = Math.max(0, 19 - e);
          ring.style.strokeDashoffset = (C * e) / 19;
          tt.textContent = "0:" + pad(Math.ceil(left));
          if (left > 0) self.yt = requestAnimationFrame(f); else { self.yt = 0; sfx.ping(); tt.textContent = "gata! 🐘"; }
        })(t0);
      });
      // „AI”: din zgomot spre imagine
      var cv = $("#ai-c"), c = cv.getContext("2d"), tg = document.createElement("canvas");
      cv.width = tg.width = 400; cv.height = tg.height = 260;
      var g = tg.getContext("2d");
      (function paint() {
        var sky = g.createLinearGradient(0, 0, 0, 260); sky.addColorStop(0, "#ff9500"); sky.addColorStop(1, "#ff2f8e");
        g.fillStyle = sky; g.fillRect(0, 0, 400, 260);
        g.fillStyle = "#ffd21f"; g.beginPath(); g.arc(310, 70, 34, 0, 7); g.fill();
        g.fillStyle = "#6a2cff"; g.beginPath(); g.moveTo(0, 170); g.lineTo(400, 170); g.lineTo(400, 260); g.lineTo(0, 260); g.fill();
        g.strokeStyle = "#120c2b"; g.lineWidth = 6;
        g.beginPath(); g.moveTo(180, 170); g.lineTo(40, 260); g.moveTo(220, 170); g.lineTo(360, 260); g.stroke();
        for (var k = 0; k < 6; k++) { var y = 175 + k * k * 3.2; g.beginPath(); g.moveTo(200 - (y - 160) * 1.3, y); g.lineTo(200 + (y - 160) * 1.3, y); g.lineWidth = 3; g.stroke(); }
        g.fillStyle = "#120c2b"; g.fillRect(150, 70, 100, 96); g.fillRect(186, 36, 26, 40);
        g.fillStyle = "#c8ff2e"; g.beginPath(); g.arc(200, 108, 26, 0, 7); g.fill();
        g.fillStyle = "#120c2b"; g.beginPath(); g.arc(200, 108, 10, 0, 7); g.fill();
        g.fillStyle = "#fff3d6"; g.beginPath(); g.arc(214, 22, 12, 0, 7); g.arc(232, 12, 9, 0, 7); g.fill();
        g.fillStyle = "#fff3d6"; g.font = "800 18px JetBrains Mono, monospace"; g.fillText("generat · 2026", 14, 28);
      })();
      var T = g.getImageData(0, 0, 400, 260).data, out = c.createImageData(400, 260);
      function noiseFrame() { for (var k = 0; k < out.data.length; k += 4) { out.data[k] = Math.random() * 255; out.data[k + 1] = Math.random() * 255; out.data[k + 2] = Math.random() * 255; out.data[k + 3] = 255; } c.putImageData(out, 0, 0); }
      noiseFrame();
      var prompt = "un tren intră în gară, 1895, 4K, cu sunet", pr = $("#ai-prompt");
      $(".ai-btn", s).addEventListener("click", function () {
        if (self.gen) return;
        ensureAudio();
        self.gen = true;
        pr.textContent = "";
        var k = 0;
        var ty = setInterval(function () {
          pr.textContent = prompt.slice(0, ++k);
          sfx.type();
          if (k >= prompt.length) {
            clearInterval(ty);
            sfx.glitch();
            var t0 = performance.now();
            (function step(now) {
              var p = Math.min(1, (now - t0) / 2600), q = p * p, blk = Math.max(1, Math.round(24 * (1 - p)));
              for (var y = 0; y < 260; y += blk) for (var x = 0; x < 400; x += blk) {
                var i = (y * 400 + x) * 4, n = (1 - q) * 255;
                var r = T[i] * q + Math.random() * n, gg = T[i + 1] * q + Math.random() * n, b = T[i + 2] * q + Math.random() * n;
                for (var yy = y; yy < Math.min(260, y + blk); yy++) for (var xx = x; xx < Math.min(400, x + blk); xx++) {
                  var j = (yy * 400 + xx) * 4; out.data[j] = r; out.data[j + 1] = gg; out.data[j + 2] = b; out.data[j + 3] = 255;
                }
              }
              c.putImageData(out, 0, 0);
              if (p < 1) requestAnimationFrame(step); else { self.gen = false; sfx.ping(); }
            })(t0);
          }
        }, 45);
      });
    },
    leave: function () { duck(false); },
  };

  // ---------- 13 · filmul Lumière ----------
  INT.film = {
    init: function (s) {
      var v = $("#train"), film = $(".film", s), play = $("#film-play"), big = $(".film-big", s), scrub = $("#scrub"), bar = $("#scrub-p"), tEl = $("#film-t"), mode = $("#film-mode"), self = this;
      var chaps = $$("#chap li");
      this.v = v;
      chaps.forEach(function (li) {
        var mk = document.createElement("span");
        mk.className = "mk";
        mk.dataset.t = li.dataset.t;
        scrub.appendChild(mk);
        li.addEventListener("click", function () { seek(+li.dataset.t); if (v.paused) toggle(); });
      });
      function placeMarks() { var d = v.duration || 49; $$(".mk", scrub).forEach(function (m) { m.style.left = (100 * m.dataset.t) / d + "%"; }); }
      placeMarks();
      v.addEventListener("loadedmetadata", placeMarks);
      function seek(t) { if (v.readyState === 0) v.load(); try { v.currentTime = t; } catch (e) {} }
      function toggle() {
        ensureAudio();
        if (v.paused) {
          if (v.readyState === 0) v.load();
          v.play().then(function () { film.classList.add("playing"); play.textContent = "⏸ Pauză"; if (film.classList.contains("old")) self.pj(); }).catch(function () { $(".film-frame", s).classList.add("noimg"); play.textContent = "filmul nu s-a încărcat"; });
        } else v.pause();
      }
      v.addEventListener("pause", function () { play.textContent = "▶ Play"; clearInterval(self.pt); });
      v.addEventListener("ended", function () { film.classList.remove("playing"); });
      this.pj = function () { clearInterval(self.pt); self.pt = setInterval(function () { if (!v.paused) sfx.proj(0.5); }, 500); };
      play.addEventListener("click", toggle);
      big.addEventListener("click", toggle);
      scrub.addEventListener("click", function (e) { var r = scrub.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * (v.duration || 49)); });
      mode.addEventListener("click", function () {
        ensureAudio();
        var old = film.classList.toggle("old");
        mode.textContent = old ? "Mod 2020 (curat)" : "Mod 1896";
        if (old) { sfx.proj(0.8); if (!v.paused) self.pj(); } else clearInterval(self.pt);
      });
      v.addEventListener("timeupdate", function () {
        var t = v.currentTime, d = v.duration || 49;
        bar.style.width = (100 * t) / d + "%";
        tEl.textContent = Math.floor(t / 60) + ":" + pad(Math.floor(t % 60));
        var ci = 0;
        chaps.forEach(function (li, k) { if (t >= +li.dataset.t) ci = k; });
        chaps.forEach(function (li, k) { li.classList.toggle("cur", k === ci && t > 0); });
      });
    },
    enter: function () { if (this.v && this.v.readyState === 0) { this.v.preload = "auto"; this.v.load(); } },
    leave: function () { if (this.v) this.v.pause(); clearInterval(this.pt); },
  };

  // ---------- 15 · quiz (logica e în istoria-quiz.js) ----------
  INT.quiz = {
    enter: function () { if (window.IMQuiz) IMQuiz.enter(); },
    leave: function () { if (window.IMQuiz) IMQuiz.leave(); },
  };

  // ---------- 16 · final ----------
  $("#again").addEventListener("click", function () { go(0); });

  // ---------- butoanele din HUD ----------
  $("#snd").addEventListener("click", function () {
    if (!A.ctx) { ensureAudio(); setMute(false); var s = SL[cur]; playEra(s.dataset.era === "quiz" ? "quiz" : +s.dataset.era); return; }
    setMute(!A.muted);
  });
  $("#fs").addEventListener("click", toggleFS);
  function toggleFS() {
    var d = document;
    if (!d.fullscreenElement && !d.webkitFullscreenElement) (d.documentElement.requestFullscreen || d.documentElement.webkitRequestFullscreen).call(d.documentElement);
    else (d.exitFullscreen || d.webkitExitFullscreen).call(d);
  }

  // ---------- tastatură, click, swipe ----------
  addEventListener("keydown", function (e) {
    if (e.target.closest && e.target.closest("input,textarea")) return;
    var k = e.key;
    if (k === "Escape" && !$("#rm-modal").hidden) { closeRemote(); return; }
    if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].indexOf(k) > -1) {
      if ((k === " " || k === "Enter") && e.target.closest && e.target.closest("button,a")) return;
      e.preventDefault(); ensureAudio(); if (!A.muted) setMute(false); next();
    } else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].indexOf(k) > -1) { e.preventDefault(); prev(); }
    else if (k === "Home") go(0);
    else if (k === "End") go(N - 1);
    else if (k === "m" || k === "M") $("#snd").click();
    else if (k === "f" || k === "F") toggleFS();
    else if (k === "t" || k === "T") ($("#rm-modal").hidden ? openRemote : closeRemote)();
  });
  var tx = null;
  stage.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 70) (dx < 0 ? next : prev)();
    tx = null;
  });

  // ---------- telecomanda (același protocol ca remote.html de pe site) ----------
  var rm = { bus: null, phones: {}, id: null };
  function loadJS(src, test, cb, fail) {
    if (test()) return cb();
    var s = document.createElement("script");
    s.src = src;
    s.onload = cb;
    s.onerror = fail || function () {};
    document.head.appendChild(s);
  }
  function rid() { var a = "abcdefghjkmnpqrstuvwxyz23456789", s = "srn-"; for (var k = 0; k < 8; k++) s += a[Math.floor(Math.random() * a.length)]; return s; }
  function siteURL(file) {
    if (location.protocol === "file:") return "https://university.sorinarseni.com/" + file;
    return new URL(file, location.href).href;
  }
  function openRemote() {
    $("#rm-modal").hidden = false;
    if (rm.bus) return;
    try { rm.id = sessionStorage.getItem("rm-id:" + DECK) || rid(); sessionStorage.setItem("rm-id:" + DECK, rm.id); } catch (e) { rm.id = rid(); }
    loadJS("js/vendor/qrcode.js", function () { return typeof qrcode !== "undefined"; }, function () {
      loadJS("js/bus.js", function () { return typeof SRNBus !== "undefined"; }, function () {
        loadJS("js/remote-actions.js", function () { return typeof SRNActions !== "undefined"; }, function () {}, function () {});
        function drawQR() {
          SRNBus.phoneURL("remote.html", { id: rm.id }).then(function (url) {
            if (!url) { $("#rm-qr").innerHTML = '<p class="m-howto"><b>Pornește serverul pe laptop</b>VS Code → Terminal → <code>npm start</code>, apoi deschide prezentarea de pe <code>localhost:8000</code></p>'; return; }
            rm.reach = SRNBus.reach(url); rmStatus();
            var q = qrcode(0, "M"); q.addData(url); q.make();
            $("#rm-qr").innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true }).replace(/fill="white"/g, 'fill="#c8ff2e"');
          });
        }
        drawQR();
        SRNBus.ipPicker($("#rm-ips"), drawQR);
        if (rm.bus) return;
        rm.bus = SRNBus.host(rm.id.replace(/^srn-/, "rm-"), {
          onStatus: rmStatus,
          onMessage: function (m, from) {
            if (!m || typeof m !== "object") return;
            var fresh = !rm.phones[from] || Date.now() - rm.phones[from] > 12000;
            rm.phones[from] = Date.now();
            if (m.t === "go") (m.d > 0 ? next : prev)();
            else if (m.t === "goto") go(+m.i || 0);
            else if (m.t === "reset") { recOn = true; recT0 = Date.now(); }
            else if (m.t === "act" && window.SRNActions) { SRNActions.run(SL[cur], +m.k, m.l); setTimeout(function () { sendState(true); }, 600); }
            if (fresh) { rmStatus(); if (!$("#rm-modal").hidden) setTimeout(closeRemote, 900); }
            sendState(true);
          },
        });
      }, function () { $("#rm-st").textContent = "nu s-a putut încărca telecomanda"; });
    }, function () { $("#rm-qr").textContent = "nu s-a putut încărca"; });
  }
  function rmPhones() { var now = Date.now(); return Object.keys(rm.phones).filter(function (k) { return now - rm.phones[k] < 12000; }).length; }
  function rmStatus() {
    if (!rm.bus) return;
    var on = rmPhones() > 0;
    $("#rm-open").classList.toggle("on", on);
    $("#rm-st").textContent = on ? "📱 Telefonul e conectat" : rm.bus.mode === "none" ? "Serverul de pe laptop nu e pornit" : rm.bus.online() ? "Gata · " + (rm.reach || "scanează codul") : "Se conectează… (serverul e pornit?)";
  }
  setInterval(rmStatus, 4000);
  function closeRemote() { $("#rm-modal").hidden = true; }
  $("#rm-open").addEventListener("click", openRemote);
  $("#rm-close").addEventListener("click", closeRemote);
  $("#rm-modal").addEventListener("click", function (e) { if (e.target.id === "rm-modal") closeRemote(); });
  // notițele vorbitorului (<div class="sn" hidden> din fiecare slide) ajung pe telecomandă
  var NOTES = SL.map(function (s) {
    var box = $(".sn", s);
    if (!box) return null;
    return [].map.call(box.children, function (el) {
      var t = "";
      [].forEach.call(el.childNodes, function (n) { t += n.nodeType === 1 && n.tagName === "B" ? "**" + n.textContent + "**" : n.textContent; });
      return { k: el.dataset.k || "", t: t.replace(/\s+/g, " ").trim() };
    });
  });
  var lastMsg = "";
  function sendState(force) {
    if (!rm.bus || !rmPhones()) return;
    var s = SL[cur], nx = SL[cur + 1];
    var msg = { t: "state", i: cur, n: N, name: s.dataset.name, q: "", next: nx ? nx.dataset.name : "", title: document.title, sec: elapsed(), open: true, notes: NOTES[cur], acts: window.SRNActions ? SRNActions.list(SL[cur]) : null };
    var key = JSON.stringify(msg);
    if (!force && key === lastMsg) return;
    lastMsg = key;
    rm.bus.send(msg);
  }
  setInterval(sendState, 1000);

  // ---------- pornire ----------
  window.IM = {
    go: go, next: next, prev: prev,
    get cur() { return cur; },
    sfx: sfx, ensureAudio: ensureAudio, playEra: playEra, oneShot: oneShot, duck: duck,
    siteURL: siteURL, loadJS: loadJS,
    slide: function (i) { return SL[i]; },
    deck: DECK,
  };
  var start = parseInt((location.hash || "").slice(1), 10);
  go(isFinite(start) && start > 0 ? start - 1 : 0, true);
  setMute(false);
  $("#snd").classList.remove("on");
})();
