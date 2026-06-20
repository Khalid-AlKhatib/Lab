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
  "globalThis.__CONTENT_TEST__ = { safeUrl, siteAssetUrl, linkAttributes, renderNewsItem, renderTeaching, memberCard, renderMembers };\n" +
  source.slice(index);

const teachingRow = { innerHTML: "" };
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
      return selector === "#teaching2026 .row" ? teachingRow : null;
    },
    querySelectorAll() { return []; },
  },
};
context.window = context;
vm.createContext(context);
vm.runInContext(source, context, { filename: "content.js" });

const { safeUrl, siteAssetUrl, linkAttributes, renderNewsItem, renderTeaching, memberCard, renderMembers } = context.__CONTENT_TEST__;
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(safeUrl("javascript:alert(1)") === "", "javascript: URL must be rejected");
assert(safeUrl("data:text/html,test") === "", "data: URL must be rejected");
assert(safeUrl("../members/member-1.html") === "../members/member-1.html", "relative URL must be preserved");
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


renderTeaching({
  2026: [
    { title: "Valid", desc: "Course", url: "https://example.org", icon: "mdi mdi-book-outline" },
    { title: "Invalid", desc: "No destination", url: "javascript:alert(1)", icon: "mdi mdi-book-outline" },
  ],
});
assert(teachingRow.innerHTML.includes('<a class="teaching-card'), "valid Teaching URL must render an anchor");
assert(teachingRow.innerHTML.includes('<article class="teaching-card'), "invalid Teaching URL must render a non-link card");
assert(!teachingRow.innerHTML.includes('href="#"'), "Teaching cards must never fall back to href=#");


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
