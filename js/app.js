(function () {
  "use strict";

  function updateNavbarState() {
    var navbar = document.getElementById("navbar");
    if (!navbar) return;
    var scrolled = window.scrollY >= 40 || document.documentElement.scrollTop >= 40;
    navbar.classList.toggle("nav-sticky", scrolled);
  }

  function closeMobileNav(link) {
    var menu = link.closest(".navbar-collapse");
    if (!menu || !menu.classList.contains("show") || !window.bootstrap) return;
    window.bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false }).hide();
  }

  function initNavLinks() {
    document.querySelectorAll(".navbar-collapse .nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        closeMobileNav(link);
      });
    });
  }

  function createTabs(options) {
    var tablist = options && options.tablist;
    if (!tablist) return null;

    var tabs = Array.prototype.slice.call(tablist.querySelectorAll(options.tabSelector || '[role="tab"]'));
    var entries = tabs.map(function (tab) {
      var panelId = options.getPanelId(tab);
      return { tab: tab, panel: panelId ? document.getElementById(panelId) : null };
    }).filter(function (entry) {
      return entry.panel;
    });

    if (!entries.length) return null;

    tablist.setAttribute("role", "tablist");

    function activate(target, moveFocus) {
      entries.forEach(function (entry) {
        var active = entry === target;
        entry.tab.classList.toggle("active", active);
        entry.tab.setAttribute("role", "tab");
        entry.tab.setAttribute("aria-selected", active ? "true" : "false");
        entry.tab.tabIndex = active ? 0 : -1;
        entry.panel.classList.toggle("active", active);
        entry.panel.classList.toggle("show", active);
        entry.panel.hidden = !active;
        entry.panel.setAttribute("role", "tabpanel");
        if (entry.tab.id) entry.panel.setAttribute("aria-labelledby", entry.tab.id);
      });
      if (moveFocus) target.tab.focus();
      if (typeof options.onActivate === "function") options.onActivate(target);
    }

    entries.forEach(function (entry, index) {
      entry.tab.addEventListener("click", function () {
        activate(entry, false);
      });
      entry.tab.addEventListener("keydown", function (event) {
        var nextIndex;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % entries.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + entries.length) % entries.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = entries.length - 1;
        else return;
        event.preventDefault();
        activate(entries[nextIndex], true);
      });
    });

    var initial = entries.find(function (entry) {
      return entry.tab.classList.contains("active") || entry.tab.getAttribute("aria-selected") === "true";
    }) || entries[0];
    activate(initial, false);

    return { activate: activate, entries: entries };
  }

  function initSectionNavigator() {
    var menu = document.querySelector(".home-section-nav");
    if (!menu) return;
    createTabs({
      tablist: menu,
      tabSelector: "[data-home-panel]",
      getPanelId: function (tab) { return tab.dataset.homePanel; }
    });
  }

  function initProfileTabs() {
    var tablist = document.getElementById("kaf-tabs");
    if (!tablist) return;
    createTabs({
      tablist: tablist,
      tabSelector: ".kaf-tab",
      getPanelId: function (tab) { return tab.dataset.panel; }
    });
  }

  function initTooltips() {
    if (!window.bootstrap || typeof window.bootstrap.Tooltip !== "function") return;
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(function (el) {
      new window.bootstrap.Tooltip(el);
    });
  }

  function init() {
    updateNavbarState();
    initNavLinks();
    initSectionNavigator();
    initProfileTabs();
    initTooltips();
  }

  window.LTS = window.LTS || {};
  window.LTS.createTabs = createTabs;
  window.addEventListener("scroll", updateNavbarState, { passive: true });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
