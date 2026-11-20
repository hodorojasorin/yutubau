// Proiectul 05 · Colocviu: lucrurile pe care le apeși în slide-uri (taburi, ingrediente, portofoliu.zip, bife, QR, „ridicați mâna”).
// Sunetele sunt mici bipuri făcute în browser și pornesc doar după primul click.
(function () {
  "use strict";
  var P = document.getElementById("p-colocviu");
  if (!P) return;
  var $ = function (s, r) {
    return (r || document).querySelector(s);
  };
  var $$ = function (s, r) {
    return [].slice.call((r || document).querySelectorAll(s));
  };

  // ---------- sunete ----------
  var AC = null;
  function ac() {
    if (!AC) {
      try {
        AC = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        return null;
      }
    }
    if (AC.state === "suspended") AC.resume();
    return AC;
  }
  function beep(f, d, type, v, delay) {
    var a = ac();
    if (!a) return;
    var t = a.currentTime + (delay || 0),
      o = a.createOscillator(),
      g = a.createGain();
    o.type = type || "triangle";
    o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(v || 0.1, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (d || 0.14));
    o.connect(g);
    g.connect(a.destination);
    o.start(t);
    o.stop(t + (d || 0.14) + 0.03);
  }
  function pop(k) {
    beep(392 * Math.pow(1.1225, k || 0), 0.13, "triangle", 0.09);
  }
  function tada() {
    [523, 659, 784, 1047].forEach(function (f, i) {
      beep(f, 0.2, "triangle", 0.09, i * 0.09);
    });
  }
  function nope() {
    beep(220, 0.18, "square", 0.05);
    beep(185, 0.22, "square", 0.05, 0.12);
  }

  // ---------- 0 · „ridicați mâna”: fiecare click pe o întrebare = mai multe mâini ----------
  var HANDS = ["", "✋ câțiva", "✋✋ mulți", "✋✋✋ aproape toți"];
  $$("[data-poll]").forEach(function (box) {
    var qs = $$(".pq", box),
      s = box.closest(".slide");
    qs.forEach(function (q, i) {
      var out = $(".pq-hands", q);
      q.dataset.lv = 0;
      q.addEventListener("click", function () {
        var lv = (+q.dataset.lv + 1) % HANDS.length;
        q.dataset.lv = lv;
        out.textContent = HANDS[lv];
        qs.forEach(function (x) {
          x.classList.toggle("now", x === q);
        });
        var all = qs.every(function (x) {
          return +x.dataset.lv > 0;
        });
        if (all && !s.classList.contains("all-ok")) tada();
        else pop(i * 2 + lv);
        s.classList.toggle("all-ok", all);
      });
    });
    box.coFinal = function () {
      s.classList.add("all-ok");
    };
  });

  // ---------- 1 · literele din titlu sar când le atingi ----------
  $$(".pf-row b").forEach(function (b, i) {
    b.addEventListener("click", function () {
      b.classList.remove("boing");
      void b.offsetWidth;
      b.classList.add("boing");
      pop(i % 8);
      setTimeout(function () {
        b.classList.remove("boing");
      }, 450);
    });
  });

  // ---------- 2 · Canva sau site ----------
  $$("[data-tabs]").forEach(function (w) {
    var tabs = $$(".tab", w),
      panes = $$(".pane", w);
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) {
          x.classList.toggle("on", x === t);
        });
        panes.forEach(function (p) {
          p.classList.toggle("on", p.dataset.pane === t.dataset.tab);
        });
        pop(i * 3);
      });
    });
    var grid = $(".tpl-grid", w),
      msg = $(".shuffle-msg", w),
      lines = ["tot același șablon 😅", "altă culoare, aceeași prezentare", "6 prezentări, același șablon", "încă o dată? tot la fel"],
      n = 0;
    var sh = $("[data-shuffle]", w);
    if (sh)
      sh.addEventListener("click", function () {
        grid.style.setProperty("--hue", Math.floor(Math.random() * 360));
        msg.textContent = lines[n++ % lines.length];
        msg.classList.remove("wink");
        void msg.offsetWidth;
        msg.classList.add("wink");
        nope();
      });
  });

  // ---------- 3 · ingredientele multimedia ----------
  $$("[data-mix]").forEach(function (m) {
    var chips = $$(".chip", m),
      t = $(".mix-t", m);
    function upd(sound) {
      var n = chips.filter(function (c) {
        return c.classList.contains("on");
      }).length;
      m.style.setProperty("--n", n);
      var full = n === chips.length;
      m.classList.toggle("full", full);
      t.innerHTML = full ? "o singură experiență ✨" : 'apasă pe ingrediente <span class="mono">' + n + "/" + chips.length + "</span>";
      if (sound) full ? tada() : pop(n);
    }
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        c.classList.toggle("on");
        upd(true);
      });
    });
    m.coFinal = function () {
      chips.forEach(function (c) {
        c.classList.add("on");
      });
      upd(false);
    };
  });

  // ---------- 4 · cele trei feluri de creativitate (Boden) ----------
  var BODEN = [
    "<b>Le pun împreună.</b> Lucruri care există deja, legate într-un fel nou. La mine: site + film + design.",
    "<b>Împing limitele.</b> Explorezi tot ce se poate într-un stil pe care îl știi. La mine: fiecare proiect adaugă ceva.",
    "<b>Schimb regula.</b> Transformi chiar regulile jocului. La mine: prezentarea nu mai e un șir de slide-uri, ci o experiență.",
  ];
  $$("[data-boden]").forEach(function (w) {
    var out = $(".boden-out", w),
      tabs = $$(".tab", w);
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tabs.forEach(function (x) {
          x.classList.toggle("on", x === t);
        });
        out.innerHTML = BODEN[+t.dataset.b];
        out.classList.remove("wink");
        void out.offsetWidth;
        out.classList.add("wink");
        pop(+t.dataset.b * 3);
      });
    });
    out.innerHTML = BODEN[0];
  });

  // ---------- 5 · portofoliu.zip ----------
  $$("[data-zip]").forEach(function (z) {
    var files = $$(".zf", z),
      folder = $(".zip-folder", z),
      nEl = $(".zip-n", z),
      steps = $$(".zip-steps li", z),
      AT = [1, 2, 4, 5];
    function upd(sound) {
      var n = files.filter(function (f) {
        return f.classList.contains("in");
      }).length;
      nEl.textContent = n === files.length ? "gata ✓" : n + " / " + files.length;
      steps.forEach(function (s, i) {
        s.classList.toggle("on", n >= AT[i]);
      });
      var full = n === files.length;
      z.classList.toggle("full", full);
            folder.classList.remove("gulp");
      void folder.offsetWidth;
      folder.classList.add("gulp");
      if (sound) full ? tada() : pop(n * 2);
    }
    files.forEach(function (f) {
      f.addEventListener("click", function () {
        var a = f.getBoundingClientRect(),
          b = folder.getBoundingClientRect();
        f.style.setProperty("--dx", b.left + b.width / 2 - (a.left + a.width / 2) + "px");
        f.style.setProperty("--dy", b.top + b.height * 0.35 - (a.top + a.height / 2) + "px");
        f.classList.add("in");
        setTimeout(function () {
          upd(true);
        }, 420);
      });
    });
    // click pe dosar = o iei de la capăt
    folder.addEventListener("click", function () {
      if (!z.classList.contains("full")) return;
      files.forEach(function (f) {
        f.classList.remove("in");
      });
      upd(false);
      pop(0);
    });
    z.coFinal = function () {
      files.forEach(function (f) {
        f.classList.add("in");
      });
      upd(false);
    };
  });

  // ---------- 7 · ocol sau upgrade ----------
  $$("[data-switch]").forEach(function (b) {
    var s = b.closest(".slide");
    b.addEventListener("click", function () {
      var on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", on);
      s.classList.toggle("is-up", on);
      on ? tada() : pop(0);
    });
    b.coFinal = function () {
      b.setAttribute("aria-pressed", "true");
      s.classList.add("is-up");
    };
  });

  // ---------- 8 · rețeta ----------
  $$("[data-recipe]").forEach(function (r) {
    var ings = $$(".ing", r);
    function upd(sound) {
      var n = ings.filter(function (x) {
        return x.classList.contains("on");
      }).length;
      var full = n === ings.length;
      r.classList.toggle("full", full);
      if (sound) full ? tada() : pop(n * 2);
    }
    ings.forEach(function (x) {
      x.addEventListener("click", function () {
        x.classList.toggle("on");
        upd(true);
      });
    });
    r.coFinal = function () {
      ings.forEach(function (x) {
        x.classList.add("on");
      });
      upd(false);
    };
  });

  // ---------- 9 · cardul se înclină după mouse ----------
  $$("[data-tilt]").forEach(function (c) {
    c.addEventListener("pointermove", function (e) {
      var r = c.getBoundingClientRect(),
        x = (e.clientX - r.left) / r.width,
        y = (e.clientY - r.top) / r.height;
      c.style.setProperty("--ry", ((x - 0.5) * 22).toFixed(1) + "deg");
      c.style.setProperty("--rx", ((0.5 - y) * 18).toFixed(1) + "deg");
      c.style.setProperty("--gx", (x * 100).toFixed(0) + "%");
      c.style.setProperty("--gy", (y * 100).toFixed(0) + "%");
    });
    c.addEventListener("pointerleave", function () {
      ["--ry", "--rx", "--gx", "--gy"].forEach(function (p) {
        c.style.removeProperty(p);
      });
    });
  });

  // ---------- 10 · anatomia: cifrele de pe fereastră ----------
  $$("[data-anat]").forEach(function (a) {
    var hs = $$(".hs", a),
      li = $$(".anat-list li", a);
    function pick(i) {
      var same = li[i].classList.contains("on");
      hs.forEach(function (h, j) {
        h.classList.toggle("on", !same && j === i);
      });
      li.forEach(function (l, j) {
        l.classList.toggle("on", !same && j === i);
      });
      a.classList.toggle("sel", !same);
      pop(i * 2);
    }
    hs.forEach(function (h, i) {
      h.addEventListener("click", function () {
        pick(i);
      });
    });
    li.forEach(function (l, i) {
      l.addEventListener("click", function () {
        pick(i);
      });
    });
  });

  // ---------- 11 · Wallas: teorie sau la mine ----------
  $$("[data-wallas]").forEach(function (b) {
    var w = $(".co-wallas", b.closest(".slide"));
    b.addEventListener("click", function () {
      var on = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", on);
      w.classList.toggle("mine", on);
      pop(on ? 6 : 0);
    });
  });

  // ---------- 13 · bifele „nou și adecvat” ----------
  $$("[data-checks]").forEach(function (c) {
    var cks = $$(".ck", c),
      s = c.closest(".slide");
    function upd(sound) {
      var n = cks.filter(function (x) {
        return x.classList.contains("on");
      }).length;
      var all = n === cks.length;
      s.classList.toggle("all-ok", all);
      if (sound) all ? tada() : pop(n);
    }
    cks.forEach(function (x) {
      x.addEventListener("click", function () {
        x.classList.toggle("on");
        x.setAttribute("aria-pressed", x.classList.contains("on"));
        upd(true);
      });
    });
    c.coFinal = function () {
      cks.forEach(function (x) {
        x.classList.add("on");
      });
      upd(false);
    };
  });

  // ---------- 14 · codul QR și adresa care se scrie singură ----------
  function qr(id, url) {
    var el = document.getElementById(id);
    if (!el || typeof qrcode === "undefined") return;
    try {
      var q = qrcode(0, "M");
      q.addData(url);
      q.make();
      el.innerHTML = q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
    } catch (e) {}
  }
  qr("co-qr", "https://university.sorinarseni.com");
  // ---------- 16 · Instagram (networking) ----------
  qr("co-igqr", "https://www.instagram.com/sorinarseni/");
  var typeEl = document.getElementById("co-type");
  if (typeEl) {
    var full = typeEl.textContent,
      tt = null;
    var cs = typeEl.closest(".slide");
    new MutationObserver(function () {
      if (!cs.classList.contains("active") || document.documentElement.classList.contains("co-pdf")) return;
      clearInterval(tt);
      var i = 0;
      typeEl.textContent = "";
      typeEl.classList.add("typing");
      tt = setInterval(function () {
        i++;
        typeEl.textContent = full.slice(0, i);
        if (i >= full.length) {
          clearInterval(tt);
          setTimeout(function () {
            typeEl.classList.remove("typing");
          }, 900);
        }
      }, 55);
    }).observe(cs, { attributes: true, attributeFilter: ["class"] });
  }

  // starea finală a tuturor jucăriilor (pentru PDF)
  window.coFinal = function () {
    $$("[data-poll],[data-mix],[data-zip],[data-switch],[data-recipe],[data-checks]").forEach(function (el) {
      if (el.coFinal) el.coFinal();
    });
    if (typeEl) {
      typeEl.textContent = full;
      typeEl.classList.remove("typing");
    }
  };
})();
