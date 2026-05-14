(function () {
  'use strict';

  var NAV_ITEMS = [
    { key: 'home', label: 'Home', path: '/' },
    { key: 'research', label: 'Research', path: 'research/research.html' },
    { key: 'members', label: 'Members', path: 'members/members.html' },
    { key: 'publications', label: 'Publications', path: 'publications/publications.html' },
    { key: 'teaching', label: 'Teaching', path: 'teaching/teaching.html' }
  ];

  function basePrefix() {
    var configured = document.body && document.body.dataset.basePath;
    if (typeof configured === 'string' && configured.length) return configured;

    var path = window.location.pathname || '';
    return /\/(research|members|publications|teaching)\//.test(path) ? '../' : '';
  }

  function activeSection() {
    var body = document.body;
    if (body.dataset.activeNav) return body.dataset.activeNav;
    if (body.classList.contains('site-home')) return 'home';
    if (body.classList.contains('research-page-body')) return 'research';
    if (body.classList.contains('members-page-body') || body.classList.contains('member-profile-body')) return 'members';
    if (body.classList.contains('publications-page-body')) return 'publications';
    if (body.classList.contains('teaching-page-body')) return 'teaching';
    return '';
  }

  function resolvePath(item, prefix) {
    if (item.key === 'home') return '/';
    return prefix + item.path;
  }

  function brandLabMarkup() {
    return '<span class="brand-lab-seal" aria-hidden="true">LAB</span>';
  }

  function navMarkup(prefix, active) {
    var logo = prefix + 'images/optimized/argsbase-wordmark-transparent.png';
    var home = '/';
    var links = NAV_ITEMS.map(function (item) {
      var isActive = item.key === active;
      return '<li class="nav-item"><a class="nav-link' + (isActive ? ' active' : '') + '" href="' + resolvePath(item, prefix) + '">' + item.label + '</a></li>';
    }).join('');

    return '<nav class="navbar navbar-expand-lg fixed-top sticky" id="navbar">'
      + '<div class="container-fluid custom-container">'
      + '<a aria-label="ArgsBase Lab homepage" class="navbar-brand logo brand-lockup" href="' + home + '">'
      + '<img alt="ArgsBase Lab" class="brand-wordmark-img" width="420" height="150" src="' + logo + '"/>'
      + brandLabMarkup()
      + '</a>'
      + '<button aria-controls="navbarCollapse" aria-label="Toggle navigation" class="navbar-toggler" data-bs-target="#navbarCollapse" data-bs-toggle="collapse" type="button">'
      + '<span aria-hidden="true" class="navbar-toggle-bars"><span></span><span></span><span></span></span>'
      + '</button>'
      + '<div class="collapse navbar-collapse" id="navbarCollapse"><ul class="navbar-nav ms-auto navbar-center">' + links + '</ul></div>'
      + '</div></nav>';
  }

  function footerMarkup(prefix) {
    var logo = prefix + 'images/optimized/argsbase-wordmark-transparent.png';
    return '<footer class="site-footer" id="contact"><div class="container">'
      + '<div class="site-footer-grid">'
      + '<div class="site-footer-brand">'
      + '<a aria-label="ArgsBase Lab homepage" class="logo-line footer-brand-lockup" href="/">'
      + '<img alt="ArgsBase Lab" class="brand-wordmark-img" width="420" height="150" src="' + logo + '"/>'
      + brandLabMarkup()
      + '</a>'
      + '<p>AI for reasoning, critical thinking, and society.</p>'
      + '</div>'
      + '<div><h3>Navigate</h3><ul>'
      + NAV_ITEMS.map(function (item) { return '<li><a href="' + resolvePath(item, prefix) + '">' + item.label + '</a></li>'; }).join('')
      + '</ul></div>'
      + '<div><h3>Affiliations</h3><ul>'
      + '<li><a href="https://www.rug.nl/" rel="noopener noreferrer" target="_blank">University of Groningen</a></li>'
      + '<li><a href="https://www.rug.nl/research/clcg/research/cl/?lang=en" rel="noopener noreferrer" target="_blank">Computational Linguistics</a></li>'
      + '<li><a href="https://www.webis.de" rel="noopener noreferrer" target="_blank">Webis</a></li>'
      + '</ul></div>'
      + '<div><h3>Contact</h3><ul>'
      + '<li>Oude Kijk in \'t Jatstraat 26<br/>9712 EK Groningen</li>'
      + '<li><a href="mailto:team@argsbase.net">team@argsbase.net</a></li>'
      + '<li><a href="https://x.com/GroNlp" rel="noopener noreferrer" target="_blank">GroNLP on X</a></li>'
      + '</ul></div>'
      + '</div><div class="site-footer-bottom"><span>ArgsBase Lab · University of Groningen</span><span>Updated May 2026</span></div>'
      + '</div></footer>';
  }

  function renderShell() {
    var prefix = basePrefix();
    var active = activeSection();
    var nav = document.querySelector('[data-lts-shell="nav"]');
    var footer = document.querySelector('[data-lts-shell="footer"]');
    if (nav) nav.outerHTML = navMarkup(prefix, active);
    if (footer) footer.outerHTML = footerMarkup(prefix);
  }

  renderShell();
}());
