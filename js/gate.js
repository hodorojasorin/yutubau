// Ecran cu parolă, generic. Pune în pagină, înaintea conținutului:
//   <div class="clap-screen" data-key="cheie-sessionStorage" data-sum="sha256 al parolei" data-sum2="fnv1a al parolei" hidden>…</div>
//   <script src="js/gate.js"></script>
// Parola se verifică după amprenta ei (nu stă scrisă în pagină). Odată introdusă, ține până închizi tabul.
(function () {
  "use strict";
  var scr = document.querySelector(".clap-screen[data-key]");
  if (!scr) return;
  var KEY = scr.dataset.key, SUM = scr.dataset.sum, SUM2 = scr.dataset.sum2;
  var form = scr.querySelector("form"), inp = scr.querySelector("input"), note = scr.querySelector(".clap-note"), back = scr.querySelector(".clap-back");
  function ok() { try { return sessionStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  if (ok()) return;
  function fnv(s) {
    var h = 0x811c9dc5, b = new TextEncoder().encode(s);
    for (var i = 0; i < b.length; i++) { h ^= b[i]; h = Math.imul(h, 0x01000193) >>> 0; }
    return ("0000000" + h.toString(16)).slice(-8);
  }
  function check(v) {
    if (window.crypto && crypto.subtle && window.isSecureContext) {
      return crypto.subtle.digest("SHA-256", new TextEncoder().encode(v)).then(function (buf) {
        return [].map.call(new Uint8Array(buf), function (x) { return ("0" + x.toString(16)).slice(-2); }).join("") === SUM;
      });
    }
    return Promise.resolve(fnv(v) === SUM2);
  }
  scr.hidden = false;
  document.documentElement.classList.add("gated");
  setTimeout(function () { inp.focus(); }, 60);
  // cât timp ecranul e deschis, tastele nu ajung la prezentarea din spate
  function guard(e) { if (!scr.hidden && !scr.contains(e.target)) e.stopPropagation(); }
  addEventListener("keydown", guard, true);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    check(inp.value.trim().toLowerCase()).then(function (good) {
      if (good) {
        try { sessionStorage.setItem(KEY, "1"); } catch (x) {}
        scr.hidden = true;
        document.documentElement.classList.remove("gated");
        removeEventListener("keydown", guard, true);
        document.dispatchEvent(new CustomEvent("gate:open"));
      } else {
        note.hidden = false;
        inp.value = "";
        inp.focus();
      }
    });
  });
  if (back) back.addEventListener("click", function () { location.href = "index.html"; });
})();
