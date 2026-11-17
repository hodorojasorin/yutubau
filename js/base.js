// Comun pentru toate prezentările: titlurile .fx-chars se împart în litere (urcă pe rând din mască)
(function () {
  var root = document.documentElement;
  // împarte titlurile în litere
  [].slice
    .call(document.querySelectorAll(".fx-chars"))
    .forEach(function (el) {
      var c = 0;
      el.setAttribute(
        "aria-label",
        el.textContent.replace(/\s+/g, " ").trim(),
      );
      (function walk(node) {
        [].slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            var frag = document.createDocumentFragment();
            n.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) {
                frag.appendChild(document.createTextNode(" "));
                return;
              }
              var w = document.createElement("span");
              w.className = "ch-w";
              w.setAttribute("aria-hidden", "true");
              part.split("").forEach(function (ch) {
                var sp = document.createElement("span");
                sp.className = "ch";
                sp.style.setProperty("--c", c++);
                sp.textContent = ch;
                w.appendChild(sp);
              });
              frag.appendChild(w);
            });
            n.parentNode.replaceChild(frag, n);
          } else if (n.nodeType === 1) walk(n);
        });
      })(el);
    });

  // animația de intrare pornește doar după ce scriptul a rulat
  root.classList.add("anim");
})();
