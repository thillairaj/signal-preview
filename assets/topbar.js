/* Shared top bar behaviour for The Signal deep pages (Nov 15, 2026).
   Dependency free. The bar markup is emitted by
   patch-global-topbar.py (and by the family builders that import it)
   and styled by assets/design-system.css; this script carries only
   the behaviour: the Learn mega menu (click, outside click, Esc,
   aria-expanded), the mobile full screen menu (button, close, Esc,
   aria-expanded), and the Breaking dot in the bar, which lights while
   any breaking item is inside its 24 hour active window (read from
   data/breaking.json, resolved relative to this script so every page
   depth works). Defensive throughout: a missing element or a failed
   fetch leaves the static bar in place and never throws. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function initMega() {
    var btn = $("[data-tb-learn]"), panel = $("[data-tb-mega]");
    if (!btn || !panel) return;
    var wrap = btn.closest(".ds-mega-wrap") || btn.parentNode;
    function setOpen(open, focusFirst) {
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open && focusFirst) {
        var first = panel.querySelector("a");
        if (first) first.focus();
      }
    }
    btn.addEventListener("click", function (ev) {
      setOpen(panel.hidden, ev.detail === 0);
    });
    document.addEventListener("click", function (ev) {
      if (!panel.hidden && !wrap.contains(ev.target)) setOpen(false, false);
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !panel.hidden) { setOpen(false, false); btn.focus(); }
    });
    $$("a", panel).forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false, false); });
    });
  }

  function initMobileMenu() {
    var btn = $("[data-tb-menu-btn]"), menu = $("[data-tb-mobile]");
    if (!btn || !menu) return;
    var closeBtn = $("[data-tb-mm-close]", menu);
    function setMenu(open) {
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open && closeBtn) closeBtn.focus();
      if (!open) btn.focus();
    }
    btn.addEventListener("click", function () { setMenu(menu.hidden); });
    if (closeBtn) closeBtn.addEventListener("click", function () { setMenu(false); });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !menu.hidden) setMenu(false);
    });
    $$("a, button", menu).forEach(function (el) {
      el.addEventListener("click", function () { if (el !== closeBtn) menu.hidden = true; });
    });
  }

  function initBreakingDot() {
    var dot = $("[data-tb-bk-dot]");
    if (!dot) return;
    var scriptEl = document.currentScript ||
      document.querySelector('script[src*="topbar.js"]');
    var base = "";
    if (scriptEl && scriptEl.src) {
      base = scriptEl.src.replace(/assets\/topbar\.js.*$/, "");
    }
    fetch(base + "data/breaking.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var now = window.__BREAKING_NOW__ ? new Date(window.__BREAKING_NOW__) : new Date();
        var active = (data.items || []).some(function (it) {
          var t = Date.parse(it.published || "");
          return !isNaN(t) && t <= now.getTime() && (now.getTime() - t) < 24 * 3600 * 1000;
        });
        dot.hidden = !active;
      })
      .catch(function () { /* dot stays hidden */ });
  }

  function init() {
    try { initMega(); } catch (e) { /* menu is progressive enhancement */ }
    try { initMobileMenu(); } catch (e) { /* as above */ }
    try { initBreakingDot(); } catch (e) { /* dot stays hidden */ }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
