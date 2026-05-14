(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  var PATHS = {
    argument: '<path d="M4 5h16v10H9l-5 4V5Z"/><path d="M8 9h8M8 12h5"/>',
    arabic: '<path d="M7 7v6a4 4 0 0 0 8 0V7"/><path d="M5 17h14"/><path d="M9 4h.01M15 4h.01"/>',
    arrowLeft: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    award: '<path d="M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z"/><path d="m9 14-2 7 5-3 5 3-2-7"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H7a3 3 0 0 0-3 3V5.5Z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>',
    brain: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M8 14a6 6 0 1 1 8 0c-.9.7-1.3 1.7-1.3 3H9.3c0-1.3-.4-2.3-1.3-3Z"/><path d="M10 9h4M12 7v4"/>',
    briefcase: '<path d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1"/><path d="M4 7h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z"/><path d="M4 12h16"/>',
    chart: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="m7 15 4-4 3 3 5-7"/>',
    code: '<path d="m9 18-6-6 6-6"/><path d="m15 6 6 6-6 6"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 6-4 2 2-6 4-2Z"/>',
    database: '<ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5"/><path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
    document: '<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>',
    domain: '<path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16"/><path d="M9 21v-4h3v4"/><path d="M8 7h1M12 7h1M8 11h1M12 11h1M17 9h3v12"/>',
    earth: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>',
    email: '<path d="M4 6h16v12H4V6Z"/><path d="m4 7 8 6 8-6"/>',
    external: '<path d="M14 4h6v6"/><path d="m10 14 10-10"/><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4"/>',
    flask: '<path d="M9 3h6"/><path d="M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"/><path d="M8 15h8"/>',
    github: '<path d="M9 19c-4 1.4-4-2-5.6-2.4"/><path d="M15 22v-3.5c.1-1-.3-1.7-.8-2.1 2.7-.3 5.6-1.4 5.6-6A4.7 4.7 0 0 0 18.5 7c.1-.3.6-1.7-.1-3.4 0 0-1.1-.4-3.5 1.3a12 12 0 0 0-6.4 0C6.1 3.2 5 3.6 5 3.6 4.3 5.3 4.8 6.7 4.9 7a4.7 4.7 0 0 0-1.3 3.4c0 4.6 2.8 5.7 5.5 6-.5.4-.9 1.2-.8 2.1V22"/>',
    graph: '<circle cx="5" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="12" cy="19" r="2"/><path d="m7 11 3.5-4M13.5 7 17 11M17 13l-3.5 4M10.5 17 7 13"/>',
    group: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7.1 7.1l1.1-1.1"/>',
    map: '<path d="M12 21s7-4.6 7-11a7 7 0 0 0-14 0c0 6.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    monitor: '<path d="M4 5h16v11H4V5Z"/><path d="M8 21h8M12 16v5"/>',
    acl: '<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H8a3 3 0 0 0-3 3V5.5Z"/><path d="M5 19.5A2.5 2.5 0 0 1 7.5 17H20"/><path d="M9 13l2.2-6h1.6L15 13M10 11h4"/>',
    linkedin: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 10v6"/><path d="M8 8h.01"/><path d="M12 16v-3.4c0-1.7 1-2.6 2.4-2.6s2.6.9 2.6 3V16"/><path d="M12 10v6"/>',
    pdf: '<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h5"/><path d="M8 16h1.5a1.5 1.5 0 0 0 0-3H8v4M12 13v4h1a2 2 0 0 0 0-4h-1M17 13h-2v4"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.5 2.1L8 9.5a16 16 0 0 0 6.5 6.5l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.6.5 2.5.6A2 2 0 0 1 22 16.9Z"/>',
    publications: '<path d="M7 4h10v13H7V4Z"/><path d="M4 7h10v13H4V7Z"/><path d="M8 11h5M8 15h4"/>',
    python: '<path d="M8 11H6a3 3 0 0 0-3 3v1a3 3 0 0 0 3 3h3v-2H7"/><path d="M16 13h2a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-3v2h2"/><path d="M8 11V6a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v7"/><path d="M16 13v5a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3v-7"/><path d="M10 6h.01M14 18h.01"/>',
    rocket: '<path d="M5 15c-1 1-2 4-2 4s3-1 4-2"/><path d="M9 15 4 10l4-1 7-7 3 3-7 7-1 4Z"/><path d="M14 4l6 6"/>',
    school: '<path d="m22 10-10-5-10 5 10 5 10-5Z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
    searchDoc: '<path d="M6 3h8l4 4v6"/><path d="M14 3v5h5"/><path d="M6 21V3"/><circle cx="16" cy="17" r="3"/><path d="m19 20 2 2"/>',
    scholar: '<path d="m22 10-10-5-10 5 10 5 10-5Z"/><path d="M6 12v4.5c3 2 9 2 12 0V12"/><path d="M19 11.5v5"/><circle cx="19" cy="18" r="1.4"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>',
    timeline: '<path d="M4 6h6"/><path d="M4 12h12"/><path d="M4 18h8"/><circle cx="18" cy="6" r="2"/><circle cx="20" cy="18" r="2"/><path d="M18 8v8"/>',
    translate: '<path d="M4 5h7"/><path d="M8 5v14"/><path d="M5 9c1 3 3 5 6 6"/><path d="M11 9c-1 3-3 5-6 6"/><path d="M14 19l4-10 4 10"/><path d="M15.5 15h5"/>',
    trophy: '<path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4a3 3 0 0 0 3 3"/><path d="M17 6h3a3 3 0 0 1-3 3"/>',
    web: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18Z"/>'
  };

  var MAP = {
    'mdi-abjad-arabic': 'arabic',
    'mdi-account-group-outline': 'group',
    'mdi-account-supervisor-circle-outline': 'group',
    'mdi-account-tie-outline': 'briefcase',
    'mdi-alpha-a-box-outline': 'acl',
    'mdi-alpha-a-circle-outline': 'acl',
    'mdi-arrow-left': 'arrowLeft',
    'mdi-arrow-right': 'arrowRight',
    'mdi-arrow-top-right': 'external',
    'mdi-bank-outline': 'domain',
    'mdi-book-education-outline': 'book',
    'mdi-book-open-page-variant-outline': 'book',
    'mdi-book-open-variant': 'book',
    'mdi-bookshelf': 'book',
    'mdi-briefcase': 'briefcase',
    'mdi-briefcase-outline': 'briefcase',
    'mdi-bullhorn-outline': 'argument',
    'mdi-calendar-outline': 'timeline',
    'mdi-calendar-star': 'award',
    'mdi-chart-bubble': 'graph',
    'mdi-chart-line': 'chart',
    'mdi-chat-processing-outline': 'argument',
    'mdi-code-braces': 'code',
    'mdi-code-tags': 'code',
    'mdi-cog-outline': 'spark',
    'mdi-compass-outline': 'compass',
    'mdi-database-cog-outline': 'database',
    'mdi-database-outline': 'database',
    'mdi-database-search-outline': 'database',
    'mdi-domain': 'domain',
    'mdi-door': 'domain',
    'mdi-earth': 'earth',
    'mdi-email': 'email',
    'mdi-email-outline': 'email',
    'mdi-eye-outline': 'spark',
    'mdi-file-chart-outline': 'document',
    'mdi-file-document-outline': 'document',
    'mdi-file-document-multiple-outline': 'publications',
    'mdi-file-pdf-box': 'pdf',
    'mdi-file-search-outline': 'searchDoc',
    'mdi-flask-outline': 'flask',
    'mdi-format-quote-close': 'argument',
    'mdi-forum-outline': 'argument',
    'mdi-gavel': 'argument',
    'mdi-github': 'github',
    'mdi-graph-outline': 'graph',
    'mdi-handshake-outline': 'group',
    'mdi-head-cog-outline': 'brain',
    'mdi-image-outline': 'document',
    'mdi-information-outline': 'spark',
    'mdi-language-python': 'python',
    'mdi-lightbulb-on-outline': 'brain',
    'mdi-link-variant': 'link',
    'mdi-google-scholar': 'scholar',
    'mdi-linkedin': 'linkedin',
    'mdi-map-marker': 'map',
    'mdi-map-marker-outline': 'map',
    'mdi-marker': 'spark',
    'mdi-medal-outline': 'award',
    'mdi-memory': 'code',
    'mdi-message-text-outline': 'argument',
    'mdi-monitor-dashboard': 'monitor',
    'mdi-office-building': 'domain',
    'mdi-open-in-new': 'external',
    'mdi-phone': 'phone',
    'mdi-play-circle-outline': 'monitor',
    'mdi-presentation': 'monitor',
    'mdi-presentation-play': 'monitor',
    'mdi-robot-outline': 'brain',
    'mdi-rocket-launch-outline': 'rocket',
    'mdi-school': 'school',
    'mdi-school-outline': 'school',
    'mdi-source-branch': 'graph',
    'mdi-star-four-points-outline': 'spark',
    'mdi-teach': 'school',
    'mdi-text-box-check-outline': 'document',
    'mdi-text-box-search-outline': 'searchDoc',
    'mdi-timeline-text-outline': 'timeline',
    'mdi-tools': 'spark',
    'mdi-transit-connection-variant': 'graph',
    'mdi-translate': 'translate',
    'mdi-trophy-award': 'trophy',
    'mdi-web': 'web'
  };

  function iconKey(el) {
    for (var i = 0; i < el.classList.length; i += 1) {
      var cls = el.classList[i];
      if (cls !== 'mdi' && cls.indexOf('mdi-') === 0) return MAP[cls] || 'spark';
    }
    return 'spark';
  }

  function makeSvg(key, source) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('aria-hidden', source.getAttribute('aria-hidden') || 'true');
    svg.classList.add('lts-icon');
    Array.prototype.forEach.call(source.classList, function (cls) {
      if (cls.indexOf('fs-') === 0 || cls.indexOf('text-') === 0) svg.classList.add(cls);
    });
    svg.innerHTML = PATHS[key] || PATHS.spark;
    return svg;
  }

  function collect(root) {
    var icons = [];
    if (root && root.nodeType === 1 && root.matches && root.matches('i.mdi')) icons.push(root);
    if (root && root.querySelectorAll) {
      icons = icons.concat(Array.prototype.slice.call(root.querySelectorAll('i.mdi')));
    }
    return icons;
  }

  function replace(root) {
    collect(root || document).forEach(function (el) {
      if (!el.parentNode) return;
      el.replaceWith(makeSvg(iconKey(el), el));
    });
  }

  window.LTSIcons = { replace: replace };

  document.addEventListener('DOMContentLoaded', function () {
    replace(document);
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        Array.prototype.forEach.call(mutation.addedNodes, function (node) {
          replace(node);
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });
}());
