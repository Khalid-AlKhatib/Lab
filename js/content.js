(function () {
  "use strict";

  function getDataBasePrefix() {
    return (document.body && document.body.dataset.basePath) || "";
  }

  var DATA_BASE_PREFIX = getDataBasePrefix();

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call(
      (root || document).querySelectorAll(selector),
    );
  }

  function dataUrl(file) {
    return DATA_BASE_PREFIX + "data/" + file;
  }

  var offlineDataPromise = null;
  var newsDataCache = null;

  function localData(key) {
    return window.LTS_DATA && window.LTS_DATA[key];
  }

  function ensureOfflineData() {
    if (window.location.protocol !== "file:") return Promise.resolve();
    if (window.LTS_DATA) return Promise.resolve();
    if (offlineDataPromise) return offlineDataPromise;

    offlineDataPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = dataUrl("site-data.js") + "?v=20260620-5";
      script.onload = resolve;
      script.onerror = function () {
        reject(new Error("Failed to load offline data bundle"));
      };
      document.head.appendChild(script);
    });
    return offlineDataPromise;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(
      /[&<>"]/g,
      function (char) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char];
      },
    );
  }


  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }

  function safeUrl(value, options) {
    var raw = String(value == null ? "" : value).trim();
    var allowFragment = !options || options.allowFragment !== false;
    if (!raw || /[\u0000-\u001F\u007F]/.test(raw) || raw.indexOf("\\") !== -1) return "";
    if (allowFragment && raw.charAt(0) === "#") return raw;

    var schemeMatch = raw.match(/^([a-z][a-z0-9+.-]*:|\/\/)/i);
    if (!schemeMatch) return raw;

    try {
      var parsed = new URL(raw, window.location.href);
      if (["http:", "https:", "mailto:", "tel:"].indexOf(parsed.protocol) === -1) return "";
      return raw;
    } catch (error) {
      return "";
    }
  }

  function siteAssetUrl(value) {
    var url = safeUrl(value, { allowFragment: false });
    if (!url) return "";
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|\.\.?\/)/i.test(url)) return url;
    return DATA_BASE_PREFIX + url;
  }

  function linkAttributes(value, options) {
    var url = safeUrl(value, options);
    if (!url) return null;
    var external = /^(https?:)?\/\//i.test(url) || /^https?:/i.test(url);
    return {
      href: url,
      target: external ? "_blank" : "_self",
      rel: external ? "noopener noreferrer" : ""
    };
  }

  function fetchJson(path) {
    return fetch(path).then(function (res) {
      if (!res.ok) throw new Error("Failed to load " + path);
      return res.json();
    });
  }

  function loadData(file, key) {
    return ensureOfflineData().then(function () {
      var fallback = localData(key);
      var hasFallback = typeof fallback !== "undefined";
      if (window.location.protocol === "file:" && hasFallback) return fallback;

      return fetchJson(dataUrl(file)).catch(function (error) {
        if (hasFallback) return fallback;
        throw error;
      });
    });
  }

  function renderNewsItem(item) {
    var attrs = linkAttributes(item.url);
    var tag = attrs ? "a" : "div";
    var href = attrs
      ? ' href="' + escapeAttr(attrs.href) + '" target="' + attrs.target + '"' +
        (attrs.rel ? ' rel="' + attrs.rel + '"' : "")
      : "";
    var extraClass = attrs ? "" : " news-item-static";

    return (
      "<li><" +
      tag +
      href +
      ' class="news-item' +
      extraClass +
      '">' +
      '<p class="news-item-date text-muted fs-12 m-0">' +
      escapeHtml(item.date || "") +
      "</p>" +
      '<h3 class="news-item-title">' +
      escapeHtml(item.title || "") +
      "</h3>" +
      '<p class="news-item-description">' +
      escapeHtml(item.desc || "") +
      "</p>" +
      "</" +
      tag +
      "></li>"
    );
  }

  function renderNewsForYear(year, newsData) {
    var container = document.getElementById("news-list-" + year);
    if (!container) return;
    var items = Array.isArray(newsData[year]) ? newsData[year] : [];
    container.innerHTML = items.map(renderNewsItem).join("");
  }

  function wireNewsTabs(newsData) {
    var tablist = document.getElementById("newsTab");
    if (!tablist || !window.LTS || typeof window.LTS.createTabs !== "function") return;

    if (!tablist.dataset.tabsInitialized) {
      window.LTS.createTabs({
        tablist: tablist,
        tabSelector: "button[data-year]",
        getPanelId: function (button) { return button.getAttribute("aria-controls"); },
        onActivate: function (entry) {
          var year = entry.tab.dataset.year;
          if (newsDataCache) renderNewsForYear(year, newsDataCache);
        }
      });
      tablist.dataset.tabsInitialized = "true";
    }

    if (newsData) {
      newsDataCache = newsData;
      Object.keys(newsData).forEach(function (year) {
        renderNewsForYear(year, newsData);
      });
    }
  }

  function renderNewsListFallback(newsData) {
    var list = $(".news-list");
    if (!list) return;

    var items = Object.keys(newsData || {})
      .sort(function (a, b) {
        return parseInt(b, 10) - parseInt(a, 10);
      })
      .reduce(function (all, year) {
        return all.concat(Array.isArray(newsData[year]) ? newsData[year] : []);
      }, []);

    if (items.length) list.innerHTML = items.map(renderNewsItem).join("");
  }

  function renderPositions(positions) {
    var root = $(".open-positions ul.list-unstyled");
    if (!root || !Array.isArray(positions)) return;

    root.innerHTML = positions
      .map(function (position) {
        var attrs = linkAttributes(position.url);
        var tag = attrs ? "a" : "div";
        var linkAttrs = attrs
          ? ' href="' + escapeAttr(attrs.href) + '" target="' + attrs.target + '"' +
            (attrs.rel ? ' rel="' + attrs.rel + '"' : "")
          : "";
        return (
          '<li class="mb-3"><' + tag + linkAttrs + ' class="open-position d-flex p-4 ' +
          escapeAttr(position.className || "") + '">' +
          '<div class="open-position-icon"><i class="mdi mdi-briefcase fs-20"></i></div>' +
          '<div class="open-position-content ps-3">' +
          '<h3 class="open-position-title mb-2">' +
          escapeHtml(position.title || "") +
          "</h3>" +
          '<p class="open-position-description m-0">' +
          escapeHtml(position.desc || "") +
          "</p>" +
          "</div></" + tag + "></li>"
        );
      })
      .join("");
  }


  function memberMetaItem(icon, label, value, href) {
    if (!value) return "";
    var safeHref = safeUrl(href);
    var content = safeHref
      ? '<a href="' + escapeAttr(safeHref) + '">' + escapeHtml(value) + "</a>"
      : "<span>" + escapeHtml(value) + "</span>";
    return (
      '<p class="member-meta-item"><i class="' +
      icon +
      ' text-primary"></i><strong>' +
      escapeHtml(label) +
      "</strong>" +
      content +
      "</p>"
    );
  }

  function emptyMemberState(label, description) {
    return (
      '<div class="member member-thesis-empty mt-4"><div class="member-content"><div class="member-role-badge member-role-student">' +
      escapeHtml(label) +
      '</div><h3 class="member-name mb-2">No entries yet</h3><p class="member-thesis-abstract mb-0">' +
      escapeHtml(description) +
      "</p></div></div>"
    );
  }

  function memberCard(item, roleLabel) {
    var interests = Array.isArray(item.interests) ? item.interests : [];
    var interestsHtml = interests.length
      ? '<ul class="member-interest-list mt-0 mb-0">' +
        interests
          .map(function (interest) {
            return (
              '<li class="interest-chip">' + escapeHtml(interest) + "</li>"
            );
          })
          .join("") +
        "</ul>"
      : "";
    var profileUrl = safeUrl(item.profileUrl);
    var imageUrl = siteAssetUrl(item.image);
    var profile = profileUrl
      ? '<a href="' +
        escapeAttr(profileUrl) +
        '" class="member-profile-link">View profile <img src="' +
        DATA_BASE_PREFIX +
        'images/home/right-arrow-primary.png" alt="" class="img-fluid member-profile-arrow"></a>'
      : "";
    var badgeLabel = item.cardLabel || roleLabel;
    var badgeClass =
      item.badgeClass || (roleLabel === "Faculty" ? "faculty" : "phd");
    var subrole = [item.role, item.status]
      .filter(Boolean)
      .map(escapeHtml)
      .join(" · ");
    var contact = [
      memberMetaItem(
        "mdi mdi-email",
        "Email",
        item.email,
        item.email ? "mailto:" + item.email : "",
      ),
      memberMetaItem(
        "mdi mdi-phone",
        "Phone",
        item.phone,
        item.phone ? "tel:" + item.phone : "",
      ),
      memberMetaItem("mdi mdi-map-marker", "Address", item.address),
      memberMetaItem("mdi mdi-office-building", "Building", item.building),
      memberMetaItem("mdi mdi-door", "Room", item.room),
    ]
      .filter(Boolean)
      .join("");

    var contactHtml = contact
      ? '<div class="member-divider"></div><div class="member-meta-grid">' +
        contact +
        "</div>"
      : "";

    return (
      '<article class="member"><div class="member-content">' +
      '<div class="member-header member-header-inline"><div class="member-image member-image-inline">' +
      (imageUrl
        ? '<img src="' +
          escapeAttr(imageUrl) +
          '" alt="' +
          escapeAttr(item.name || "") +
          '" width="96" height="96" loading="lazy" decoding="async">'
        : "") +
      '</div><div class="member-identity"><div class="member-role-badge member-role-' +
      escapeAttr(badgeClass) +
      '">' +
      escapeHtml(badgeLabel) +
      "</div>" +
      '<h3 class="member-name mb-0">' +
      escapeHtml(item.name || "") +
      "</h3>" +
      (subrole
        ? '<p class="member-card-subrole mb-0">' + subrole + "</p>"
        : "") +
      '<div class="member-section-label">Research interests</div><div class="member-interest mb-0">' +
      interestsHtml +
      "</div>" +
      "</div>" +
      (profile
        ? '<div class="member-profile-wrap">' + profile + "</div>"
        : "") +
      "</div>" +
      contactHtml +
      "</div></article>"
    );
  }

  function thesisCard(item, roleLabel) {
    var links = [];
    var thesisLink = linkAttributes(item.thesisUrl);
    if (thesisLink)
      links.push(
        '<a class="member-thesis-link" href="' +
          escapeAttr(thesisLink.href) +
          '" target="' + thesisLink.target + '"' +
          (thesisLink.rel ? ' rel="' + thesisLink.rel + '"' : "") +
          '><i class="mdi mdi-file-document-outline"></i><span>Read thesis</span></a>',
      );
    var linkedinLink = linkAttributes(item.linkedin);
    if (linkedinLink)
      links.push(
        '<a class="member-thesis-link" href="' +
          escapeAttr(linkedinLink.href) +
          '" target="' + linkedinLink.target + '"' +
          (linkedinLink.rel ? ' rel="' + linkedinLink.rel + '"' : "") +
          '><i class="mdi mdi-linkedin"></i><span>LinkedIn</span></a>',
      );

    return (
      '<article class="member member-thesis-card"><div class="member-content">' +
      '<div class="member-role-badge member-role-student">' +
      escapeHtml(roleLabel) +
      "</div>" +
      '<h3 class="member-name mb-2">' +
      escapeHtml(item.name || "") +
      "</h3>" +
      '<div class="member-section-label member-thesis-label">' +
      (roleLabel === "Intern" ? "Project title" : "Thesis title") +
      "</div>" +
      '<h4 class="member-thesis-title">' +
      escapeHtml(item.thesisTitle || item.title || "") +
      "</h4>" +
      '<p class="member-thesis-abstract">' +
      escapeHtml(item.abstract || item.desc || "") +
      "</p>" +
      (links.length
        ? '<div class="member-thesis-links">' + links.join("") + "</div>"
        : "") +
      "</div></article>"
    );
  }

  function renderMemberGroup(items, roleLabel, compact) {
    if (!Array.isArray(items) || !items.length) {
      return emptyMemberState(
        roleLabel,
        compact
          ? "Add a name, title, short abstract, and thesis or portfolio link here when available."
          : "",
      );
    }
    return items
      .map(function (item) {
        return compact
          ? thesisCard(item, roleLabel)
          : memberCard(item, roleLabel);
      })
      .join("");
  }

  function renderMembers(data) {
    var groups = [
      {
        root: "profmembers",
        tab: "profmembers-tab",
        items: data.faculty,
        label: "Faculty",
        compact: false,
      },
      {
        root: "phdmembers",
        tab: "phdmembers-tab",
        items: data.phd,
        label: "PhD",
        compact: false,
      },
      {
        root: "mastermembers",
        tab: "mastermembers-tab",
        items: data.master,
        label: "Master",
        compact: true,
      },
      {
        root: "internmembers",
        tab: "internmembers-tab",
        items: data.intern,
        label: "Intern",
        compact: true,
      },
    ];

    var allRoot = document.getElementById("allmembers");
    var groningenRoot = document.getElementById("groningenmembers");
    if (allRoot || groningenRoot) {
      var allCards = [];
      groups.forEach(function (group) {
        if (Array.isArray(group.items)) {
          allCards = allCards.concat(
            group.items.map(function (item) {
              return group.compact
                ? thesisCard(item, group.label)
                : memberCard(item, group.label);
            }),
          );
        }
      });
      var groningenHtml = allCards.length
        ? allCards.join("")
        : emptyMemberState(
            "Groningen members",
            "Groningen-based group members will appear here when added.",
          );
      if (allRoot) allRoot.innerHTML = groningenHtml;
      if (groningenRoot) groningenRoot.innerHTML = groningenHtml;
    }

    var externalRoot = document.getElementById("externalcollaborators");
    if (externalRoot) {
      externalRoot.innerHTML =
        Array.isArray(data.externalCollaborators) &&
        data.externalCollaborators.length
          ? renderMemberGroup(
              data.externalCollaborators,
              "External collaborator",
              false,
            )
          : emptyMemberState(
              "External collaborators",
              "External collaborators will be added here as public profile information becomes available.",
            );
    }

    groups.forEach(function (group) {
      var root = document.getElementById(group.root);
      if (root)
        root.innerHTML = renderMemberGroup(
          group.items,
          group.label,
          group.compact,
        );

      var tab = document.getElementById(group.tab);
      if (tab && (!Array.isArray(group.items) || !group.items.length)) {
        var item = tab.closest(".nav-item");
        if (item) item.style.display = "none";
      }
    });
  }

  function teachingIconClass(iconColor) {
    if (iconColor === "text-danger") return "icon-rose";
    if (iconColor === "text-purple") return "icon-purple";
    return "icon-emerald";
  }

  function renderTeaching(data) {
    Object.keys(data || {}).forEach(function (year) {
      var row = document.querySelector("#teaching" + year + " .row");
      if (!row) return;
      var items = Array.isArray(data[year]) ? data[year] : [];

      row.innerHTML = items
        .map(function (course) {
          var label = /thesis|supervision/i.test(course.title || "")
            ? "Supervision"
            : "Course";
          var attrs = linkAttributes(course.url);
          var tag = attrs ? "a" : "article";
          var linkAttrs = attrs
            ? ' href="' + escapeAttr(attrs.href) + '"' +
              (attrs.rel ? ' rel="' + attrs.rel + '"' : "") +
              ' target="' + attrs.target + '"'
            : "";
          var action = attrs ? "View course" : "Course information";
          return (
            '<div class="col-lg-6 col-md-6 d-flex"><' + tag +
            ' class="teaching-card d-flex flex-column w-100"' + linkAttrs + '>' +
            '<div class="teaching-card-top"><div class="teaching-card-icon ' +
            teachingIconClass(course.iconColor) +
            '"><i class="' +
            escapeAttr(course.icon || "mdi mdi-book-outline") +
            '"></i></div>' +
            '<div><span class="teaching-card-kicker">' +
            label +
            '</span><h3 class="teaching-card-title">' +
            escapeHtml(course.title || "") +
            "</h3></div></div>" +
            '<p class="teaching-card-text">' +
            escapeHtml(course.desc || "") +
            "</p>" +
            '<div class="teaching-card-meta mt-auto"><span>' +
            escapeHtml(year) +
            "</span><span>" + action + "</span></div>" +
            "</" + tag + "></div>"
          );
        })
        .join("");
    });
  }

  function publicationMeta(item) {
    var fields = [
      ["When", item.month],
      ["Pages", item.pages],
      ["Location", item.location],
      ["Publisher", item.publisher],
    ].filter(function (field) {
      return field[1] && String(field[1]).trim();
    });

    if (!fields.length) return "";
    return (
      '<div class="publication-meta-grid">' +
      fields
        .map(function (field) {
          return (
            '<div class="publication-meta-item"><span class="publication-meta-label">' +
            escapeHtml(field[0]) +
            '</span><span class="publication-meta-value">' +
            escapeHtml(field[1]) +
            "</span></div>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function slugifyLabel(label) {
    return (
      String(label || "link")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "link"
    );
  }

  function publicationLinkIcon(label) {
    var icons = {
      paper: "mdi-file-document-outline",
      pdf: "mdi-file-pdf-box",
      "webis-pdf": "mdi-file-pdf-box",
      report: "mdi-file-chart-outline",
      doi: "mdi-link-variant",
      publisher: "mdi-bank-outline",
      "ug-portal": "mdi-school-outline",
      dblp: "mdi-database-outline",
      arxiv: "mdi-alpha-a-box-outline",
      code: "mdi-code-tags",
      data: "mdi-database-outline",
      tool: "mdi-tools",
      demo: "mdi-monitor-dashboard",
      slides: "mdi-presentation",
      poster: "mdi-image-outline",
      video: "mdi-play-circle-outline",
      award: "mdi-medal-outline",
      research: "mdi-flask-outline",
      event: "mdi-calendar-outline",
    };

    return icons[slugifyLabel(label)] || "mdi-open-in-new";
  }

  function publicationCard(item, number) {
    var validLinks = (item.links || []).map(function (link) {
      return { link: link, attrs: linkAttributes(link.url) };
    }).filter(function (entry) { return entry.attrs; });

    var links = validLinks
      .map(function (entry) {
        var link = entry.link;
        var attrs = entry.attrs;
        var label = link.label || "Link";
        var kind = slugifyLabel(label);
        return (
          '<a class="publication-link-chip publication-link-chip--' +
          escapeAttr(kind) +
          '" href="' +
          escapeAttr(attrs.href) +
          '" target="' + attrs.target + '"' +
          (attrs.rel ? ' rel="' + attrs.rel + '"' : "") +
          ' aria-label="' +
          escapeAttr(label + " for " + (item.title || "publication")) +
          '">' +
          '<i class="mdi ' +
          escapeAttr(publicationLinkIcon(label)) +
          '" aria-hidden="true"></i>' +
          "<span>" +
          escapeHtml(label) +
          "</span>" +
          "</a>"
        );
      })
      .join("");
    var primary = validLinks.length ? validLinks[0].attrs : null;
    var title = primary
      ? '<a href="' +
        escapeAttr(primary.href) +
        '" target="' + primary.target + '"' +
        (primary.rel ? ' rel="' + primary.rel + '"' : "") + '>' +
        escapeHtml(item.title || "") +
        "</a>"
      : escapeHtml(item.title || "");

    return (
      '<article class="publication-entry-card publication-entry-card-local">' +
      '<div class="publication-entry-index">' +
      escapeHtml(number) +
      "</div>" +
      '<div class="publication-entry-main">' +
      '<div class="publication-entry-topline"><span class="publication-theme-chip">' +
      escapeHtml(item.type || "Publication") +
      '</span><span class="publication-entry-year">' +
      escapeHtml(item.year || "") +
      "</span></div>" +
      '<h3 class="publication-entry-title">' +
      title +
      "</h3>" +
      '<p class="publication-entry-authors">' +
      escapeHtml(item.authors || "") +
      "</p>" +
      '<p class="publication-entry-venue">' +
      escapeHtml(item.venue || "") +
      "</p>" +
      publicationMeta(item) +
      '<div class="publication-entry-links">' +
      links +
      "</div>" +
      "</div></article>"
    );
  }

  function renderPublicationsPage(publications) {
    var listRoot = $("#publications-list");
    var filterRoot = $("#publication-year-filters");
    if (!listRoot || !filterRoot || !Array.isArray(publications)) return;

    var years = publications
      .reduce(function (all, item) {
        if (all.indexOf(item.year) === -1) all.push(item.year);
        return all;
      }, [])
      .sort(function (a, b) {
        return b - a;
      });
    var visibleYears = years.filter(function (year) {
      return year >= 2022;
    });
    var scopes = [{ label: "All publications", value: "all" }].concat(
      visibleYears.map(function (year) {
        return { label: String(year), value: String(year) };
      }),
    );
    if (
      years.some(function (year) {
        return year < 2022;
      })
    )
      scopes.push({ label: "Previous years", value: "previous" });

    var state = { scope: "all" };

    function filteredData() {
      if (state.scope === "all") return publications.slice();
      if (state.scope === "previous")
        return publications.filter(function (item) {
          return item.year < 2022;
        });
      return publications.filter(function (item) {
        return String(item.year) === state.scope;
      });
    }

    function renderList() {
      var items = filteredData();
      if (!items.length) {
        listRoot.innerHTML =
          '<div class="publication-empty-state">No publications match the current filter.</div>';
        return;
      }

      var grouped = items.reduce(function (groups, item) {
        groups[item.year] = groups[item.year] || [];
        groups[item.year].push(item);
        return groups;
      }, {});

      var globalIndex = 0;
      listRoot.innerHTML = years
        .filter(function (year) {
          return grouped[year];
        })
        .map(function (year) {
          return (
            '<section class="publication-year-block">' +
            '<div class="publication-year-heading"><h2 class="publication-year-label">' +
            escapeHtml(year) +
            "</h2></div>" +
            '<div class="publication-year-entries">' +
            grouped[year]
              .map(function (item) {
                globalIndex += 1;
                return publicationCard(item, globalIndex);
              })
              .join("") +
            "</div>" +
            "</section>"
          );
        })
        .join("");
    }

    filterRoot.innerHTML = scopes
      .map(function (scope, index) {
        return (
          '<div class="nav-item"><button type="button" class="nav-link year-filter__button' +
          (index === 0 ? " active" : "") +
          '" data-value="' +
          escapeAttr(scope.value) +
          '" aria-pressed="' +
          (index === 0 ? "true" : "false") +
          '">' +
          escapeHtml(scope.label) +
          "</button></div>"
        );
      })
      .join("");

    filterRoot.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-value]");
      if (!button) return;
      state.scope = button.dataset.value;
      $all("button[data-value]", filterRoot).forEach(function (item) {
        var selected = item === button;
        item.classList.toggle("active", selected);
        item.setAttribute("aria-pressed", selected ? "true" : "false");
      });
      renderList();
    });

    renderList();
  }

  function reportLoadError(section, error) {
    console.error("Failed to load " + section + " data:", error);
    var target = document.querySelector('[data-load-error="' + section + '"]');
    if (target) {
      target.hidden = false;
      target.textContent = "This content could not be loaded. Please refresh the page.";
    }
  }

  function init() {
    var newsTab = $("#newsTab");
    var newsList = $(".news-list");
    if (newsTab || newsList) {
      if (newsTab) wireNewsTabs(null);
      loadData("news.json", "news")
        .then(function (newsData) {
          if (newsTab) wireNewsTabs(newsData);
          else renderNewsListFallback(newsData);
        })
        .catch(function (error) { reportLoadError("news", error); });
    }

    if ($(".open-positions"))
      loadData("positions.json", "positions")
        .then(renderPositions)
        .catch(function (error) { reportLoadError("positions", error); });
    if ($("#members"))
      loadData("members.json", "members")
        .then(function (members) {
          renderMembers(members);
        })
        .catch(function (error) { reportLoadError("members", error); });
    if ($("#teachingTab"))
      loadData("teaching.json", "teaching")
        .then(renderTeaching)
        .catch(function (error) { reportLoadError("teaching", error); });
    if ($("#publications-list"))
      loadData("publications.json", "publications")
        .then(renderPublicationsPage)
        .catch(function (error) { reportLoadError("publications", error); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
