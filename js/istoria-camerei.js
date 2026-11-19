// Proiectul 07 · Istoria Camerei
// Setările prezentării și stațiile interactive noi. Motorul (drumul, muzica, telecomanda, quiz-ul)
// e același ca la proiectul 06: js/istoria.js și js/istoria-quiz.js, încărcate după fișierul ăsta.
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  window.IM_CFG = {
    deck: "ic",
    eraname: {
      0: "Intro · tobă și fluier",
      1: "Camera obscură · laută și ney",
      2: "Secolul XIX · cutie muzicală",
      3: "Cinema mut · ragtime",
      4: "Anii '30–'50 · jazz",
      5: "Digitalul · synth și 8-bit",
      6: "Acum · deep house de ședință foto",
      quiz: "Quiz · tic-tac",
    },
    quiz: [
      { q: "Ce înseamnă, în latină, „camera obscura”?", o: ["Aparat de fotografiat", "Cameră întunecată", "Lentilă ascunsă", "Cutie cu oglinzi"], c: 1, w: "<b>„Cameră întunecată”.</b> Lumina intră printr-o gaură și desenează lumea, întoarsă, pe peretele opus. De aici vine cuvântul „cameră”." },
      { q: "De ce nu se vede nicio trăsură pe bulevardul fotografiat de Daguerre în 1838?", o: ["Era noapte", "Expunerea a durat minute: ce se mișca n-a rămas pe placă", "Daguerre le-a șters", "Strada era închisă"], c: 1, w: "Expunerea a durat <b>câteva minute</b>. A rămas doar omul care și-a lustruit ghetele stând pe loc: <b>primul om fotografiat</b>." },
      { q: "Câte camere a folosit Muybridge ca să fotografieze calul în galop (1878)?", o: ["1", "4", "12", "24"], c: 2, w: "<b>12 camere</b>, declanșate pe rând de fire întinse peste pistă. Da: calul are, o clipă, toate copitele în aer." },
      { q: "Câte poze puteai face cu primul Kodak (1888) până să-l trimiți la fabrică?", o: ["12", "36", "100", "1000"], c: 2, w: "<b>100.</b> Camera costa 25 $, iar developarea plus filmul nou, încă 10 $. „Apeși butonul, noi facem restul.”" },
      { q: "Cu câte cadre pe secundă filma cinematograful Lumière?", o: ["8", "16", "24", "60"], c: 1, w: "<b>16 cadre/s</b>: două ture de manivelă pe secundă. 24 de cadre au devenit standard abia odată cu sunetul." },
      { q: "Câte negative alb-negru filma deodată camera Technicolor din 1932?", o: ["1", "2", "3", "4"], c: 2, w: "<b>3.</b> O prismă împărțea lumina în roșu, verde și albastru, fiecare pe peliculă alb-negru. Culoarea se recompunea la copiere." },
      { q: "Ce rezoluție avea prima cameră digitală (Kodak, 1975)?", o: ["0,01 MP", "0,3 MP", "1 MP", "12 MP"], c: 0, w: "<b>100 × 100 pixeli</b> = 0,01 MP, alb-negru. Scrierea pe casetă dura 23 de secunde." },
    ],
  };

  function S() { return window.IM.sfx; }
  function au() { return window.IM.ensureAudio(); }

  // ---------- webcam-ul (stațiile 8 și 9). Imaginea nu pleacă din browser. ----------
  var camStream = null, camP = null;
  function getCam() {
    if (camStream && camStream.active) return Promise.resolve(camStream);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.reject(new Error("fără cameră"));
    if (!camP) {
      camP = navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false }).then(
        function (st) { camStream = st; camP = null; return st; },
        function (e) { camP = null; throw e; }
      );
    }
    return camP;
  }
  function stopCam() {
    if (camStream) camStream.getTracks().forEach(function (t) { t.stop(); });
    camStream = null;
  }

  var X = (window.IM_EXT = {});

  // ---------- 3 · Daguerre și Talbot ----------
  X.dag = {
    init: function (s) {
      var fr = $(".dag-frame", s), btn = $(".dag-btn", s), neg = $(".neg", s), nb = $(".neg-btn", s), lbl = $(".neg-lbl", s);
      this.reset = function () {
        fr.classList.remove("zoom");
        btn.textContent = "🔍 Găsește omul";
        neg.classList.remove("is-neg");
        nb.textContent = "🔁 Arată negativul";
        lbl.textContent = "pozitiv · oricâte copii";
      };
      btn.addEventListener("click", function () {
        au();
        var on = fr.classList.toggle("zoom");
        if (on) { S().shimmer(); setTimeout(function () { if (fr.classList.contains("zoom")) S().ping(); }, 1100); } else S().pop();
        btn.textContent = on ? "↩ Toată strada" : "🔍 Găsește omul";
      });
      nb.addEventListener("click", function () {
        au();
        S().shutter();
        var n = neg.classList.toggle("is-neg");
        nb.textContent = n ? "🔁 Arată pozitivul" : "🔁 Arată negativul";
        lbl.textContent = n ? "negativ · 1835" : "pozitiv · oricâte copii";
      });
    },
    leave: function () { this.reset && this.reset(); },
  };

  // ---------- 4 · Muybridge: 12 camere, 12 fire ----------
  X.muy = {
    init: function (s) {
      var camsBox = $(".muy-cams", s), wiresBox = $(".muy-wires", s), frames = $(".muy-frames", s), horse = $(".muy-horse", s), btn = $(".muy-btn", s), nEl = $(".muy-n", s), gif = $(".muy-gif", s), track = $(".muy-track", s), self = this;
      var POSE = [[-14, -6], [-6, -12], [4, -16], [12, -10], [6, -2], [-4, 2], [-12, -4], [-4, -12], [8, -18], [14, -8], [2, 0], [-8, -2]];
      for (var k = 0; k < 12; k++) {
        var c = document.createElement("span");
        c.className = "muy-cam";
        c.innerHTML = '<svg viewBox="0 0 64 48"><use href="#i-cam" /></svg><b>' + (k + 1) + "</b>";
        camsBox.appendChild(c);
        var w = document.createElement("i");
        w.style.left = ((k + 0.5) / 12) * 100 + "%";
        wiresBox.appendChild(w);
        var f = document.createElement("span");
        f.className = "muy-f";
        f.style.setProperty("--r", POSE[k][0] + "deg");
        f.style.setProperty("--y", POSE[k][1] + "px");
        f.innerHTML = "<i>🐎</i><b>" + (k + 1) + "</b>";
        frames.appendChild(f);
      }
      var cams = $$(".muy-cam", s), wires = $$("i", wiresBox), fs = $$(".muy-f", s);
      this.reset = function () {
        cancelAnimationFrame(self.raf);
        self.on = false;
        cams.forEach(function (c) { c.classList.remove("fl"); });
        wires.forEach(function (w) { w.classList.remove("muy-cut"); });
        fs.forEach(function (f) { f.classList.remove("muy-ok"); });
        horse.style.transform = "";
        nEl.textContent = "0";
        gif.classList.remove("on");
        btn.textContent = "🏇 Pornește calul";
      };
      btn.addEventListener("click", function () {
        if (self.on) return;
        au();
        self.reset();
        self.on = true;
        btn.textContent = "🏇 Galop…";
        var Wd = track.clientWidth, t0 = performance.now(), dur = 2600, fired = 0, lastHoof = 0;
        (function step(now) {
          var p = Math.min(1, (now - t0) / dur);
          var x = -140 + p * (Wd + 200);
          horse.style.transform = "translateX(" + x + "px) scaleX(-1)";
          if (now - lastHoof > 110 && p < 0.97) { lastHoof = now; S().tone(80 + Math.random() * 30, 0.05, "sine", 0.35); }
          while (fired < 12 && x + 70 >= ((fired + 0.5) / 12) * Wd) {
            cams[fired].classList.add("fl");
            wires[fired].classList.add("muy-cut");
            fs[fired].classList.add("muy-ok");
            S().shutter();
            fired++;
            nEl.textContent = fired;
          }
          if (p < 1) self.raf = requestAnimationFrame(step);
          else {
            self.on = false;
            gif.classList.add("on");
            S().sparkle();
            btn.textContent = "🏇 Încă o dată";
          }
        })(t0);
      });
    },
    leave: function () { this.reset && this.reset(); },
  };

  // ---------- 5 · Kodak: 100 de cadre, apoi la fabrică ----------
  X.kodak = {
    init: function (s) {
      var btn = $(".kd-btn", s), nEl = $(".kd-n", s), cost = $(".kd-cost", s), pics = $(".kd-pics", s), box = $(".kd-box", s), wrap = $(".kd", s), self = this;
      var EM = ["🏠", "🌳", "🐕", "👒", "⛵", "🚂", "👶", "🐈", "🌻", "⛪", "🎩", "🚲", "🐎", "🌊", "👵", "🍎", "🎻", "🏰"];
      var n = 100, paid = 25, hold = null, rep = null, away = false;
      function fire() {
        if (away || n <= 0) return false;
        n--;
        nEl.textContent = n;
        S().shutter();
        box.classList.remove("snap"); void box.offsetWidth; box.classList.add("snap");
        var p = document.createElement("span");
        p.className = "kd-pic";
        p.style.setProperty("--r", (Math.random() * 24 - 12).toFixed(0) + "deg");
        p.textContent = EM[Math.floor(Math.random() * EM.length)];
        pics.insertBefore(p, pics.firstChild);
        while (pics.children.length > 16) pics.removeChild(pics.lastChild);
        if (n === 0) {
          stop();
          wrap.classList.add("full");
          btn.textContent = "📦 Trimite camera la Rochester (+10 $)";
          S().ping();
        }
        return true;
      }
      function stop() { clearTimeout(hold); clearInterval(rep); hold = rep = null; btn.classList.remove("down"); }
      function send() {
        away = true;
        wrap.classList.remove("full");
        wrap.classList.add("away");
        btn.textContent = "🚂 Camera e la fabrică…";
        S().whoosh(1.4);
        self.t = setTimeout(function () {
          paid += 10;
          cost.textContent = paid + " $";
          n = 100;
          nEl.textContent = n;
          $$(".kd-pic", pics).forEach(function (p) { p.classList.add("kd-ok"); });
          wrap.classList.remove("away");
          away = false;
          btn.textContent = "📸 Apasă butonul";
          S().correct();
        }, 2200);
      }
      btn.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        au();
        if (away) return;
        if (n === 0) { send(); return; }
        btn.classList.add("down");
        try { btn.setPointerCapture(e.pointerId); } catch (x) {}
        if (!fire()) return;
        hold = setTimeout(function () { rep = setInterval(function () { if (!fire()) stop(); }, 95); }, 420);
      });
      ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (ev) { btn.addEventListener(ev, stop); });
      // tastatura (Enter / spațiu pe buton): câte o poză
      btn.addEventListener("click", function (e) {
        if (e.detail !== 0) return;
        au();
        if (n === 0 && !away) send();
        else fire();
      });
      this.stop = stop;
    },
    leave: function () { this.stop && this.stop(); },
  };

  // ---------- 6 · Cinematograful: manivela ----------
  X.crank = {
    init: function (s) {
      var v = $("#crank-v"), wheel = $(".ck-wheel", s), arm = $(".ck-arm", s), spdEl = $(".ck-spd", s), fpsEl = $(".ck-fps", s), stEl = $(".ck-st", s), auto = $(".ck-auto", s), scr = $(".ck-screen", s), self = this;
      var ang = 0, last = null, acc = 0, rate = 0, autoOn = false, frameAcc = 0, prev = 0, failed = false;
      this.v = v;
      function center() { var r = wheel.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
      function warm() { if (v.readyState === 0) { v.preload = "auto"; v.load(); } }
      wheel.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        au();
        warm();
        wheel.setPointerCapture(e.pointerId);
        var c = center();
        last = Math.atan2(e.clientY - c.y, e.clientX - c.x);
        wheel.classList.add("grab");
      });
      wheel.addEventListener("pointermove", function (e) {
        if (last === null) return;
        var c = center(), a = Math.atan2(e.clientY - c.y, e.clientX - c.x), d = a - last;
        if (d > Math.PI) d -= 2 * Math.PI;
        if (d < -Math.PI) d += 2 * Math.PI;
        last = a;
        ang += d;
        acc += Math.abs(d) / (2 * Math.PI);
      });
      function release() { last = null; wheel.classList.remove("grab"); }
      wheel.addEventListener("pointerup", release);
      wheel.addEventListener("pointercancel", release);
      // tastatura: săgețile învârt manivela câte un sfert de tură
      wheel.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault(); e.stopPropagation();
        au(); warm();
        ang += Math.PI / 2; acc += 0.25;
      });
      function autoDown(e) { e.preventDefault(); au(); warm(); autoOn = true; auto.classList.add("down"); try { auto.setPointerCapture(e.pointerId); } catch (x) {} }
      function autoUp() { autoOn = false; auto.classList.remove("down"); }
      auto.addEventListener("pointerdown", autoDown);
      ["pointerup", "pointercancel", "lostpointercapture"].forEach(function (ev) { auto.addEventListener(ev, autoUp); });
      auto.addEventListener("click", function (e) { if (e.detail === 0) { au(); warm(); autoOn = !autoOn; auto.classList.toggle("down", autoOn); } });
      v.addEventListener("error", function () { failed = true; scr.classList.add("noimg"); }, true);
      function loop(now) {
        if (!self.run) return;
        var dt = Math.min(0.1, (now - (prev || now)) / 1000) || 0.016;
        prev = now;
        if (autoOn) { acc += 2 * dt; ang += 2 * dt * 2 * Math.PI; }
        var inst = acc / dt;
        acc = 0;
        rate += (inst - rate) * Math.min(1, dt * 3.5);
        if (rate < 0.02) rate = 0;
        arm.style.transform = "rotate(" + ((ang * 180) / Math.PI).toFixed(1) + "deg)";
        spdEl.textContent = rate.toFixed(1).replace(".", ",");
        var fps = Math.round(rate * 8);
        fpsEl.textContent = fps;
        var st = rate < 0.08 ? ["", "nemișcat"] : fps < 13 ? ["slow", "prea încet 🐢"] : fps <= 19 ? ["ok", "ca în 1895 ✓"] : ["fast", "prea repede 🏃"];
        if (stEl.textContent !== st[1]) { stEl.textContent = st[1]; stEl.className = "ck-st mono " + st[0]; }
        if (rate >= 0.08 && !failed) {
          var pr = Math.max(0.1, Math.min(4, rate / 2));
          if (Math.abs(v.playbackRate - pr) > 0.02) v.playbackRate = pr;
          if (v.paused) v.play().catch(function () {});
          scr.classList.add("on");
          frameAcc += rate * dt * 8;
          if (frameAcc >= 1) { frameAcc %= 1; if (window.IM && fps < 60) S().tick(0.14); }
        } else {
          if (!v.paused) v.pause();
          scr.classList.remove("on");
        }
        requestAnimationFrame(loop);
      }
      this.start = function () { if (!self.run) { self.run = true; prev = 0; requestAnimationFrame(loop); } };
      this.stop = function () { self.run = false; autoUp(); release(); rate = 0; try { v.pause(); } catch (e) {} scr.classList.remove("on"); };
    },
    enter: function () { this.start(); if (this.v && this.v.readyState === 0) { this.v.preload = "auto"; this.v.load(); } },
    leave: function () { this.stop && this.stop(); },
  };

  // ---------- 7 · Technicolor: trei benzi alb-negru ----------
  X.rgb = {
    init: function (s) {
      var main = $("#rgb-c"), mc = main.getContext("2d"), W = 480, H = 320, wrap = $(".rgb", s), self = this;
      var src = document.createElement("canvas");
      src.width = W; src.height = H;
      var g = src.getContext("2d");
      // un peisaj cu culori curate: fiecare bandă „vede” altceva
      (function paint() {
        var sky = g.createLinearGradient(0, 0, 0, 220);
        sky.addColorStop(0, "#1e6bff"); sky.addColorStop(1, "#8fd3ff");
        g.fillStyle = sky; g.fillRect(0, 0, W, H);
        var arcs = ["#ff2a2a", "#ff9500", "#ffe100", "#22c84a", "#1e4bff", "#8a2cff"];
        g.lineWidth = 13;
        arcs.forEach(function (c, k) { g.strokeStyle = c; g.beginPath(); g.arc(150, 250, 190 - k * 13, Math.PI, 2 * Math.PI); g.stroke(); });
        g.fillStyle = "#ffe14a"; g.beginPath(); g.arc(400, 70, 40, 0, 7); g.fill();
        g.fillStyle = "#ffffff"; g.beginPath(); g.arc(300, 60, 20, 0, 7); g.arc(322, 52, 24, 0, 7); g.arc(346, 62, 18, 0, 7); g.fill();
        g.fillStyle = "#1fae3c"; g.beginPath(); g.moveTo(0, 230); g.quadraticCurveTo(140, 180, 260, 225); g.quadraticCurveTo(380, 265, 480, 210); g.lineTo(480, 320); g.lineTo(0, 320); g.fill();
        g.fillStyle = "#14802b"; g.beginPath(); g.moveTo(0, 280); g.quadraticCurveTo(220, 240, 480, 290); g.lineTo(480, 320); g.lineTo(0, 320); g.fill();
        g.fillStyle = "#7a3d12"; g.fillRect(372, 150, 16, 90);
        g.fillStyle = "#18b04a"; g.beginPath(); g.arc(380, 140, 44, 0, 7); g.fill();
        g.fillStyle = "#ff1f1f";
        [[60, 268], [96, 286], [140, 262], [200, 292], [250, 270], [300, 296], [430, 282]].forEach(function (p) {
          g.beginPath(); g.arc(p[0], p[1], 11, 0, 7); g.fill();
        });
        g.fillStyle = "#ffe100";
        [[60, 268], [96, 286], [140, 262], [200, 292], [250, 270], [300, 296], [430, 282]].forEach(function (p) {
          g.beginPath(); g.arc(p[0], p[1], 4, 0, 7); g.fill();
        });
        g.fillStyle = "#ff2fd0"; g.fillRect(200, 186, 70, 50);
        g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(192, 188); g.lineTo(235, 156); g.lineTo(278, 188); g.fill();
        g.fillStyle = "#1e1e1e"; g.fillRect(226, 206, 18, 30);
      })();
      var D = g.getImageData(0, 0, W, H).data;
      // cele trei negative: tonuri inversate, ca pe pelicula alb-negru
      $$(".rgb-neg", s).forEach(function (b) {
        var ch = +b.dataset.ch, cv = $("canvas", b), c = cv.getContext("2d"), t = document.createElement("canvas");
        t.width = W; t.height = H;
        var tc = t.getContext("2d"), img = tc.createImageData(W, H);
        for (var i = 0; i < D.length; i += 4) { var v = 255 - D[i + ch]; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
        tc.putImageData(img, 0, 0);
        c.drawImage(t, 0, 0, cv.width, cv.height);
      });
      var on = [false, false, false], out = mc.createImageData(W, H);
      function render() {
        for (var i = 0; i < D.length; i += 4) {
          out.data[i] = on[0] ? D[i] : 0;
          out.data[i + 1] = on[1] ? D[i + 1] : 0;
          out.data[i + 2] = on[2] ? D[i + 2] : 0;
          out.data[i + 3] = 255;
        }
        mc.putImageData(out, 0, 0);
        $$(".rgb-neg", s).forEach(function (b) { b.classList.toggle("on", on[+b.dataset.ch]); });
        wrap.classList.toggle("lit", on[0] || on[1] || on[2]);
        wrap.classList.toggle("full", on[0] && on[1] && on[2]);
      }
      render();
      $$(".rgb-neg", s).forEach(function (b) {
        b.addEventListener("click", function () {
          au();
          var ch = +b.dataset.ch;
          on[ch] = !on[ch];
          S().tone([523, 659, 784][ch], 0.18, "triangle", 0.18);
          render();
        });
      });
      $(".rgb-btn", s).addEventListener("click", function () {
        au();
        clearTimeout(self.t1); clearTimeout(self.t2); clearTimeout(self.t3);
        on = [false, false, false]; render();
        self.t1 = setTimeout(function () { on[0] = true; render(); S().tone(523, 0.2, "triangle", 0.18); }, 250);
        self.t2 = setTimeout(function () { on[1] = true; render(); S().tone(659, 0.2, "triangle", 0.18); }, 700);
        self.t3 = setTimeout(function () { on[2] = true; render(); S().sparkle(); }, 1150);
      });
      this.reset = function () { clearTimeout(self.t1); clearTimeout(self.t2); clearTimeout(self.t3); };
    },
    leave: function () { this.reset && this.reset(); },
  };

  // ---------- 8 · Videorecorderul: înregistrezi și redai imediat ----------
  X.vtr = {
    init: function (s) {
      var live = $("#vtr-live"), play = $("#vtr-play"), rec = $(".vtr-rec", s), pb = $(".vtr-pb", s), st = $(".vtr-st", s), box = $(".vtr", s), cnt = $(".vtr-cnt", s), self = this;
      // fără webcam: o imagine de test animată, ca să meargă și așa
      function fake() {
        var cv = document.createElement("canvas");
        cv.width = 480; cv.height = 360;
        if (!cv.captureStream) return null;
        var c = cv.getContext("2d"), t0 = performance.now();
        (function draw(now) {
          if (!self.fakeOn) return;
          var t = (now - t0) / 1000;
          ["#c0c0c0", "#c0c000", "#00c0c0", "#00c000", "#c000c0", "#c00000", "#0000c0"].forEach(function (col, k) { c.fillStyle = col; c.fillRect(k * 69, 0, 69, 360); });
          c.fillStyle = "#120c2b"; c.fillRect(90, 120, 300, 120);
          c.fillStyle = "#fff3d6"; c.font = "800 34px Inter, sans-serif"; c.textAlign = "center";
          c.fillText("CHICAGO · 1956", 240, 172);
          c.font = "700 26px JetBrains Mono, monospace";
          c.fillText("00:00:0" + Math.floor(t % 10) + ":" + String(Math.floor((t * 25) % 25)).padStart(2, "0"), 240, 214);
          c.fillStyle = "#ffd21f"; c.beginPath(); c.arc(240 + Math.sin(t * 2) * 150, 300, 22, 0, 7); c.fill();
          requestAnimationFrame(draw);
        })(t0);
        return cv.captureStream(25);
      }
      function source() {
        return getCam().catch(function () {
          self.fakeOn = true;
          var f = fake();
          if (!f) throw new Error("nimic de filmat");
          st.textContent = "fără webcam: înregistrăm imaginea de test";
          return f;
        });
      }
      function mime() {
        var c = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
        for (var k = 0; k < c.length; k++) if (window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c[k])) return c[k];
        return "";
      }
      rec.addEventListener("click", function () {
        au();
        if (self.busy) return;
        if (!window.MediaRecorder) { st.textContent = "browserul ăsta nu poate înregistra video"; return; }
        self.busy = true;
        rec.disabled = true;
        st.textContent = "pornim camera…";
        source().then(function (stream) {
          if (!self.busy) return;
          live.srcObject = stream;
          live.hidden = false;
          play.hidden = true;
          live.play().catch(function () {});
          box.classList.remove("play");
          box.classList.add("live", "rec");
          var chunks = [], m = mime(), mr;
          try { mr = m ? new MediaRecorder(stream, { mimeType: m }) : new MediaRecorder(stream); } catch (e) { mr = new MediaRecorder(stream); }
          self.mr = mr;
          mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
          mr.onstop = function () {
            box.classList.remove("rec");
            rec.disabled = false;
            self.busy = false;
            cnt.textContent = "";
            if (!chunks.length) { st.textContent = "n-a mers înregistrarea, mai încearcă"; return; }
            if (self.url) URL.revokeObjectURL(self.url);
            self.url = URL.createObjectURL(new Blob(chunks, { type: mr.mimeType || "video/webm" }));
            play.src = self.url;
            pb.disabled = false;
            st.textContent = "e pe bandă! apasă ▶ ca s-o redai imediat";
            S().ping();
          };
          mr.start(250);
          st.textContent = "⏺ înregistrăm…";
          var left = 5;
          cnt.textContent = left;
          S().beep();
          self.ct = setInterval(function () {
            left--;
            if (left > 0) { cnt.textContent = left; S().tick(0.4); }
            else { clearInterval(self.ct); if (mr.state !== "inactive") mr.stop(); }
          }, 1000);
        }).catch(function () {
          self.busy = false;
          rec.disabled = false;
          st.textContent = "camera nu a pornit: dă voie browserului s-o folosească";
        });
      });
      pb.addEventListener("click", function () {
        au();
        if (!self.url) return;
        clearTimeout(self.ap);
        live.hidden = true;
        play.hidden = false;
        box.classList.remove("live");
        box.classList.add("play");
        try { play.currentTime = 0; } catch (e) {}
        S().stat(0.35);
        play.play().catch(function () {});
        st.textContent = "▶ redare de pe bandă";
      });
      play.addEventListener("ended", function () {
        box.classList.remove("play");
        st.textContent = "1956: întâi liniște… apoi aplauze 👏";
        // aplauze sintetizate
        self.ap = setTimeout(function () {
          for (var k = 0; k < 70; k++) S().noise(0.025, "bandpass", 1300 + Math.random() * 1800, 1.4, 0.1 + Math.random() * 0.12, Math.random() * 2.6);
        }, 900);
      });
      this.stop = function () {
        clearInterval(self.ct);
        clearTimeout(self.ap);
        if (self.mr && self.mr.state !== "inactive") { try { self.mr.stop(); } catch (e) {} }
        self.busy = false;
        self.fakeOn = false;
        rec.disabled = false;
        try { live.pause(); play.pause(); } catch (e) {}
        live.srcObject = null;
        box.classList.remove("live", "rec", "play");
        stopCam();
      };
    },
    leave: function () { this.stop && this.stop(); },
  };

  // ---------- 9 · Sasson: 100 × 100 pixeli, 23 de secunde pe casetă ----------
  X.sasson = {
    init: function (s) {
      var tv = $("#sas-tv"), tc = tv.getContext("2d"), btn = $(".sas-btn", s), ff = $(".sas-ff", s), hi = $(".sas-hi", s), bar = $(".sas-bar i", s), tEl = $(".sas-t", s), wrap = $(".sas", s), self = this;
      var vid = document.createElement("video");
      vid.muted = true; vid.playsInline = true;
      var lo = document.createElement("canvas"); lo.width = lo.height = 100;
      var big = document.createElement("canvas"); big.width = big.height = 600;
      var shown = "none";
      function scene(c, n) {
        var k = n / 100;
        c.save(); c.scale(k, k);
        var gr = c.createLinearGradient(0, 0, 0, 100); gr.addColorStop(0, "#6a2cff"); gr.addColorStop(1, "#ff2f8e");
        c.fillStyle = gr; c.fillRect(0, 0, 100, 100);
        c.fillStyle = "#ffd21f"; c.beginPath(); c.arc(70, 30, 14, 0, 7); c.fill();
        c.fillStyle = "#120c2b"; c.beginPath(); c.moveTo(0, 80); c.lineTo(30, 46); c.lineTo(52, 70); c.lineTo(72, 52); c.lineTo(100, 82); c.lineTo(100, 100); c.lineTo(0, 100); c.fill();
        c.fillStyle = "#c8ff2e"; c.font = "bold 13px Inter, sans-serif"; c.fillText("1975", 8, 18);
        c.restore();
      }
      function grab() {
        var lc = lo.getContext("2d"), bc = big.getContext("2d");
        return getCam().then(function (st) {
          vid.srcObject = st;
          return vid.play().then(function () { return new Promise(function (r) { setTimeout(r, 350); }); });
        }).then(function () {
          var w = vid.videoWidth, h = vid.videoHeight, m = Math.min(w, h), sx = (w - m) / 2, sy = (h - m) / 2;
          // în oglindă, ca un selfie
          [[lc, 100], [bc, 600]].forEach(function (o) { o[0].save(); o[0].translate(o[1], 0); o[0].scale(-1, 1); o[0].drawImage(vid, sx, sy, m, m, 0, 0, o[1], o[1]); o[0].restore(); });
          return true;
        }).catch(function () {
          scene(lc, 100); scene(bc, 600);
          return false;
        }).then(function (real) {
          stopCam();
          vid.srcObject = null;
          var d = lc.getImageData(0, 0, 100, 100);
          for (var i = 0; i < d.data.length; i += 4) {
            var y = 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2];
            y = Math.round(y / 16) * 16; // puține nuanțe de gri
            d.data[i] = d.data[i + 1] = d.data[i + 2] = y;
          }
          lc.putImageData(d, 0, 0);
          return real;
        });
      }
      function show(which) {
        shown = which;
        if (which === "lo") { tv.width = tv.height = 100; tc.drawImage(lo, 0, 0); tv.classList.remove("hi"); hi.textContent = "vs. telefonul de azi"; }
        else if (which === "hi") { tv.width = tv.height = 600; tc.drawImage(big, 0, 0); tv.classList.add("hi"); hi.textContent = "înapoi la 0,01 MP"; }
        wrap.classList.toggle("has", which !== "none");
      }
      this.reset = function () {
        cancelAnimationFrame(self.raf);
        self.busy = false;
        wrap.classList.remove("run");
        btn.disabled = false;
        ff.disabled = true;
        ff.textContent = "⏩ ×10";
      };
      btn.addEventListener("click", function () {
        au();
        if (self.busy) return;
        self.busy = true;
        btn.disabled = true;
        hi.disabled = true;
        show("none");
        tc.clearRect(0, 0, tv.width, tv.height);
        S().shutter();
        wrap.classList.add("snap");
        setTimeout(function () { wrap.classList.remove("snap"); }, 400);
        grab().then(function (real) {
          if (!self.busy) return;
          wrap.classList.add("run");
          ff.disabled = false;
          self.speed = 1;
          var t = 0, prev = performance.now(), lastSec = 23;
          (function step(now) {
            var dt = (now - prev) / 1000;
            prev = now;
            t += dt * self.speed;
            var left = Math.max(0, 23 - t);
            bar.style.width = Math.min(100, (t / 23) * 100) + "%";
            tEl.textContent = Math.ceil(left) + " s";
            if (Math.ceil(left) < lastSec) { lastSec = Math.ceil(left); S().tick(0.22); }
            if (t < 23) { self.raf = requestAnimationFrame(step); return; }
            wrap.classList.remove("run");
            ff.disabled = true;
            ff.textContent = "⏩ ×10";
            btn.disabled = false;
            hi.disabled = false;
            self.busy = false;
            show("lo");
            S().ping();
            if (!real) tEl.textContent = "fără webcam: un peisaj";
          })(prev);
        });
      });
      ff.addEventListener("click", function () { au(); self.speed = self.speed > 1 ? 1 : 10; ff.textContent = self.speed > 1 ? "▶ ×1" : "⏩ ×10"; S().blip(); });
      hi.addEventListener("click", function () { au(); S().blip(); show(shown === "hi" ? "lo" : "hi"); });
    },
    leave: function () { if (this.reset) this.reset(); stopCam(); },
  };

  // ---------- 10 · cursa megapixelilor ----------
  X.mp = {
    init: function (s) {
      var rows = $$(".mp-row", s), btn = $(".mp-btn", s), self = this, MIN = 0.004, MAX = 200;
      function pct(v) { return (Math.log10(v / MIN) / Math.log10(MAX / MIN)) * 100; }
      this.reset = function () {
        (self.ts || []).forEach(clearTimeout);
        self.ts = [];
        rows.forEach(function (r) { r.classList.remove("go"); $("i", r).style.width = "0%"; });
        s.querySelector(".mp").classList.remove("done");
      };
      btn.addEventListener("click", function () {
        au();
        self.reset();
        rows.forEach(function (r, k) {
          self.ts.push(setTimeout(function () {
            r.classList.add("go");
            $("i", r).style.width = pct(+r.dataset.mp).toFixed(1) + "%";
            S().tone(330 * Math.pow(1.26, k), 0.16, "square", 0.08);
          }, 200 + k * 520));
        });
        self.ts.push(setTimeout(function () { s.querySelector(".mp").classList.add("done"); S().sparkle(); }, 200 + rows.length * 520 + 400));
      });
    },
    leave: function () { this.reset && this.reset(); },
  };
})();
