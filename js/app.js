(function () {
  'use strict';

  function updateNavbarState() {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;

    var scrolled = window.scrollY >= 40 || document.documentElement.scrollTop >= 40;
    navbar.classList.toggle('nav-sticky', scrolled);
  }

  function closeMobileNav(link) {
    var menu = link.closest('.navbar-collapse');
    if (!menu || !menu.classList.contains('show') || !window.bootstrap) return;

    window.bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false }).hide();
  }

  function initNavLinks() {
    document.querySelectorAll('.navbar-collapse .nav-link').forEach(function (link) {
      link.addEventListener('click', function () { closeMobileNav(link); });
    });
  }

  function initSectionNavigator() {
    var menu = document.getElementById('pills-tab');
    var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-target-section]'));
    var sections = buttons.map(function (button) {
      return { button: button, target: document.querySelector(button.dataset.targetSection) };
    }).filter(function (item) { return item.target; });

    if (!menu || !sections.length) return;

    var placeholder = document.createElement('div');
    var stickyStart = 0;
    var ticking = false;

    function headerOffset() {
      return (document.getElementById('navbar') || {}).offsetHeight || 64;
    }

    function setActive(item) {
      sections.forEach(function (section) {
        var active = section === item;
        section.button.classList.toggle('active', active);
        section.button.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    function measureStickyStart() {
      var wasSticky = menu.classList.contains('pills-tab-sticky');
      if (wasSticky) menu.classList.remove('pills-tab-sticky');
      stickyStart = window.scrollY + menu.getBoundingClientRect().top - headerOffset() - 12;
      if (wasSticky) menu.classList.add('pills-tab-sticky');
    }

    function syncStickyState() {
      if (window.innerWidth < 768) {
        menu.classList.remove('pills-tab-sticky');
        if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
        return;
      }

      if (!stickyStart) measureStickyStart();
      var shouldStick = window.scrollY >= stickyStart;

      if (shouldStick && !menu.classList.contains('pills-tab-sticky')) {
        placeholder.className = 'pills-tab-placeholder';
        placeholder.style.height = menu.offsetHeight + 'px';
        menu.parentNode.insertBefore(placeholder, menu);
        menu.classList.add('pills-tab-sticky');
      }

      if (!shouldStick && menu.classList.contains('pills-tab-sticky')) {
        menu.classList.remove('pills-tab-sticky');
        if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
      }
    }

    function syncActiveSection() {
      var marker = headerOffset() + menu.offsetHeight + 80;
      var active = sections[0];

      sections.forEach(function (section) {
        if (section.target.getBoundingClientRect().top <= marker) active = section;
      });

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80) {
        active = sections[sections.length - 1];
      }

      setActive(active);
    }

    function sync() {
      ticking = false;
      syncStickyState();
      syncActiveSection();
    }

    function requestSync() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(sync);
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', function (event) {
        var section = document.querySelector(button.dataset.targetSection);
        if (!section) return;

        event.preventDefault();
        window.scrollTo({
          top: Math.max(0, window.scrollY + section.getBoundingClientRect().top - headerOffset() - menu.offsetHeight - 18),
          behavior: 'smooth'
        });
      });
    });

    window.addEventListener('scroll', requestSync, { passive: true });
    window.addEventListener('resize', function () { stickyStart = 0; requestSync(); });
    window.addEventListener('load', function () { stickyStart = 0; requestSync(); });
    requestSync();
  }

  function initProfileTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll('#kaf-tabs .kaf-tab'));
    var panels = Array.prototype.slice.call(document.querySelectorAll('.kaf-panel'));
    if (!tabs.length || !panels.length) return;

    function activate(id) {
      tabs.forEach(function (tab) {
        var active = tab.dataset.panel === id;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
      });

      panels.forEach(function (panel) {
        panel.classList.toggle('active', panel.id === id);
      });
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () { activate(tab.dataset.panel); });
    });
  }

  function initTooltips() {
    if (!window.bootstrap || typeof window.bootstrap.Tooltip !== 'function') return;

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

  window.addEventListener('scroll', updateNavbarState, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
