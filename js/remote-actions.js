// Telecomanda: ce se poate apăsa pe slide-ul curent.
// Laptopul trimite lista pe telefon, iar telefonul „apasă” de la distanță, ca și cum ai da click pe laptop.
// Merge la orice proiect fără setări: caută singur butoanele din slide.
//   data-rm="off"      → nu apare pe telecomandă (ex. „Share”)
//   data-rm            → apare, chiar dacă nu e <button> (ex. un dosar pe care dai click)
//   data-rm-label="…"  → textul de pe telecomandă (altfel: aria-label, apoi textul butonului)
//   data-rm-group="…"  → titlul grupului (altfel: titlul ferestrei .win-bar, dacă există)
(function () {
  var SEL = 'button, [role="button"], input[type="checkbox"], input[type="radio"], [data-rm]';

  function clean(t) {
    return String(t || "").replace(/\s+/g, " ").trim();
  }
  function visible(el) {
    if (el.closest('[hidden], .sn, [aria-hidden="true"], .rm-btn, .rm-modal')) return false;
    if (!el.getClientRects().length) return false;
    var cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none";
  }
  function controls(slide) {
    if (!slide) return [];
    return [].filter.call(slide.querySelectorAll(SEL), function (el) {
      if (el.closest('[data-rm="off"]')) return false;
      return visible(el);
    });
  }
  function label(el) {
    var t = el.getAttribute("data-rm-label") || el.getAttribute("aria-label") || el.title;
    if (!t) {
      // „🎬montaj.mp4” → „🎬 montaj.mp4”: între bucățile butonului punem un spațiu
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT),
        parts = [];
      while (w.nextNode()) parts.push(w.currentNode.nodeValue);
      t = parts.join(" ");
    }
    t = clean(t);
    if (t.length > 46) t = t.slice(0, 44) + "…";
    return t || "•";
  }
  function group(el) {
    var g = el.closest("[data-rm-group]");
    if (g) return clean(g.getAttribute("data-rm-group"));
    var w = el.closest(".win");
    var b = w && w.querySelector(".win-bar span");
    return b ? clean(b.textContent) : "";
  }
  function isOn(el) {
    if (el.getAttribute("aria-pressed") === "true" || el.getAttribute("aria-selected") === "true" || el.checked) return true;
    var c = typeof el.className === "string" ? el.className : "";
    return /(^|\s)(on|in|sel|active|done)(\s|$)/.test(c);
  }
  function list(slide) {
    return controls(slide).map(function (el, k) {
      var o = { k: k, t: label(el) },
        g = group(el);
      if (g) o.g = g;
      if (isOn(el)) o.on = 1;
      if (el.disabled || getComputedStyle(el).pointerEvents === "none") o.off = 1;
      return o;
    });
  }
  // k = poziția în listă; t = eticheta (dacă lista s-a schimbat între timp, căutăm după ea)
  function run(slide, k, t) {
    var c = controls(slide),
      el = c[k];
    if (t && (!el || label(el) !== t)) {
      el = c.filter(function (x) {
        return label(x) === t;
      })[0];
    }
    if (!el) return false;
    el.click();
    return true;
  }
  window.SRNActions = { list: list, run: run };
})();
