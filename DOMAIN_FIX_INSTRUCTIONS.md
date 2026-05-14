# Domain fix instructions

The canonical public site for ArgsBase Lab is:

https://lab.argsbase.net/

This repository is configured for GitHub Pages with:

```text
CNAME = lab.argsbase.net
```

That publishes the site at `lab.argsbase.net`, but it does not by itself control what happens at the apex domain `argsbase.net` or the `www.argsbase.net` subdomain. If those domains still show the older Language Technology and Society / LTS website, the fix must be made in the DNS provider and/or in the GitHub Pages repository currently serving those domains.

## Required target behavior

- `https://lab.argsbase.net/` should remain the canonical ArgsBase Lab website.
- `https://argsbase.net/` should redirect to `https://lab.argsbase.net/`.
- `https://www.argsbase.net/` should redirect to `https://lab.argsbase.net/`.

## GitHub Pages checks

1. Open the GitHub repository that serves `lab.argsbase.net`.
2. Go to `Settings -> Pages`.
3. Confirm the custom domain is exactly:

   ```text
   lab.argsbase.net
   ```

4. Confirm HTTPS is enabled and enforced.
5. Confirm the repository contains a `CNAME` file with exactly:

   ```text
   lab.argsbase.net
   ```

## Root domain and www redirect

GitHub Pages cannot reliably redirect one custom domain to another from this static site alone. Use one of these options.

### Option A: DNS/domain-provider redirect

In GoDaddy or the active DNS/domain provider:

1. Create a forwarding rule from `argsbase.net` to `https://lab.argsbase.net/`.
2. Create a forwarding rule from `www.argsbase.net` to `https://lab.argsbase.net/`.
3. Use a permanent redirect if the provider offers `301`.
4. Enable HTTPS forwarding if available.

### Option B: Replace the old root-domain GitHub Pages site

If `argsbase.net` and `www.argsbase.net` are served by another GitHub Pages repository:

1. Find the repository whose `CNAME` file contains `argsbase.net` or `www.argsbase.net`.
2. Either replace that old site with a minimal redirect page, or remove the old custom domain from that repository.
3. If using a minimal redirect page, publish an `index.html` containing a canonical link and immediate redirect to `https://lab.argsbase.net/`.

Example redirect page:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>ArgsBase Lab</title>
  <link rel="canonical" href="https://lab.argsbase.net/">
  <meta http-equiv="refresh" content="0; url=https://lab.argsbase.net/">
  <script>window.location.replace("https://lab.argsbase.net/");</script>
</head>
<body>
  <p>ArgsBase Lab has moved to <a href="https://lab.argsbase.net/">https://lab.argsbase.net/</a>.</p>
</body>
</html>
```

## DNS notes

- `lab.argsbase.net` normally uses a `CNAME` DNS record pointing to the GitHub Pages host for this repository.
- `www.argsbase.net` can use either a provider redirect or a `CNAME` to a separate GitHub Pages redirect site.
- `argsbase.net` cannot be a normal `CNAME` at many DNS providers; it usually needs A records or a provider-level forwarding rule.

Do not point `argsbase.net` directly at this repository unless the intended canonical domain changes from `lab.argsbase.net` to `argsbase.net`.
