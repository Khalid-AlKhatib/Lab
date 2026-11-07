#!/usr/bin/env node
"use strict";

const fs = require("fs");
const vm = require("vm");
const path = require("path");

const root = path.resolve(__dirname, "..");
let source = fs.readFileSync(path.join(root, "js/content.js"), "utf8");
const marker = "})();";
const index = source.lastIndexOf(marker);
if (index < 0) throw new Error("Could not instrument content.js");
source =
  source.slice(0, index) +
  "globalThis.__CONTENT_TEST__ = { safeUrl, siteAssetUrl, linkAttributes, renderNewsItem, renderNewsListFallback, renderTeaching, memberCard, renderMembers };\n" +
  source.slice(index);

const teachingRow = { innerHTML: "" };
const currentTeachingRow = { innerHTML: "" };
const teachingArchive = { innerHTML: "" };
const newsLatest = { innerHTML: "" };
const newsArchive = { innerHTML: "" };
const newsMore = { hidden: true };
const context = {
  console,
  URL,
  Promise,
  Set,
  window: null,
  location: { href: "https://lab.argsbase.net/" },
  document: {
    body: { dataset: { basePath: "../" } },
    readyState: "loading",
    addEventListener() {},
    querySelector(selector) {
      if (selector === "#teaching2026 .row") return teachingRow;
      if (selector === "#teachingCurrent .row") return currentTeachingRow;
      if (selector === "#teachingEarlier") return teachingArchive;
      if (selector === "#home-news-latest") return newsLatest;
      if (selector === "#home-news-archive") return newsArchive;
      if (selector === "#home-news-more") return newsMore;
      return null;
    },
    querySelectorAll() { return []; },
  },
};
context.window = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: "content.js" });

const { safeUrl, siteAssetUrl, linkAttributes, renderNewsItem, renderNewsListFallback, renderTeaching, memberCard, renderMembers } = context.__CONTENT_TEST__;
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(safeUrl("javascript:alert(1)") === "", "javascript: URL must be rejected");
assert(safeUrl("data:text/html,test") === "", "data: URL must be rejected");
assert(safeUrl("../members/member-1.html") === "../members/member-1.html", "relative URL must be preserved");
assert(safeUrl("..\\members\\member-1.html") === "", "backslash-based relative URL must be rejected");
assert(safeUrl("mailto:test@example.org") === "mailto:test@example.org", "mailto URL must be preserved");
assert(siteAssetUrl("images/optimized/hero-land.webp") === "../images/optimized/hero-land.webp", "site-root asset path must use the page base prefix");
assert(siteAssetUrl("../images/member.jpg") === "../images/member.jpg", "already-relative asset path must remain unchanged");
assert(linkAttributes("https://example.org").target === "_blank", "HTTP link must open externally");
assert(linkAttributes("members/member-1.html").target === "_self", "relative link must remain internal");

const unsafeNews = renderNewsItem({
  title: "<script>alert(1)</script>",
  desc: "<img src=x onerror=alert(1)>",
  url: "javascript:alert(1)",
});
assert(!unsafeNews.includes("href="), "unsafe News URL must not render as a link");
assert(!unsafeNews.includes("<script>"), "News title must be escaped");
assert(!unsafeNews.includes("<img src=x"), "News description must be escaped");
assert(unsafeNews.includes("&lt;script&gt;"), "escaped News title should remain readable");

const safeNews = renderNewsItem({ title: "News", desc: "Description", url: "https://example.org" });
assert(safeNews.includes('href="https://example.org"'), "safe News URL must be rendered");
assert(safeNews.includes('rel="noopener noreferrer"'), "external News URL must be protected");
renderNewsListFallback({
  "2026": [
    { title: "First" }, { title: "Second" }, { title: "Third" },
    { title: "Fourth" }, { title: "Fifth" },
  ],
  "2025": [{ title: "Older" }],
});
assert((newsLatest.innerHTML.match(/class="news-item/g) || []).length === 4, "homepage must show four latest news");
assert(newsArchive.innerHTML.includes("Fifth") && newsArchive.innerHTML.includes("Older"), "older news must remain accessible");
assert(!newsMore.hidden, "More news control must be visible when older updates exist");

renderNewsListFallback({ "2026": [{ title: "Only update" }] });
assert(newsMore.hidden, "More news control must hide when there are no older updates");



renderTeaching({
  2026: [
    { title: "Valid", desc: "Course", url: "https://example.org", icon: "mdi mdi-book-outline" },
    { title: "Invalid", desc: "No destination", url: "javascript:alert(1)", icon: "mdi mdi-book-outline" },
  ],
});
assert(teachingRow.innerHTML.includes('<a class="teaching-card'), "valid Teaching URL must render an anchor");
assert(teachingRow.innerHTML.includes('<article class="teaching-card'), "invalid Teaching URL must render a non-link card");
assert(!teachingRow.innerHTML.includes('href="#"'), "Teaching cards must never fall back to href=#");

renderTeaching({
  Current: [{ title: "Recurring Course", url: "https://example.org" }],
  "2025-2026": [
    { title: "Recurring Course", url: "https://example.org" },
    { title: "Past Course", url: "https://example.org" },
  ],
  "2024-2025": [{ title: "Past Course", url: "https://example.org" }],
});
assert(currentTeachingRow.innerHTML.includes("Recurring Course"), "current course must remain visible");
assert(teachingArchive.innerHTML.includes("Past Course"), "past course must remain accessible");
assert(!teachingArchive.innerHTML.includes("Recurring Course"), "recurring course must not appear twice");
assert((teachingArchive.innerHTML.match(/Past Course/g) || []).length === 1, "past course must be deduplicated");
assert(teachingArchive.innerHTML.includes("2024–25, 2025–26"), "past teaching years must be shown");


const memberHtml = memberCard({
  name: "Test Member",
  image: "../images/optimized/anon-male-thumb.jpg",
  interests: ["Argument Mining"],
  email: "test@example.org",
  address: "Groningen",
  profileUrl: "../members/test.html",
}, "Faculty");
assert(memberHtml.includes("Test Member"), "member card must render the member name");
assert(memberHtml.includes("Argument Mining"), "member card must render interests");
assert(memberHtml.includes("mailto:test@example.org"), "member card must render a mailto link");
assert(!memberHtml.includes("EmailEmail"), "member metadata labels must not be duplicated");
assert(typeof renderMembers === "function", "member renderer must be defined");

console.log("content.js utility tests passed");
