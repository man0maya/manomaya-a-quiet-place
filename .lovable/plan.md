

# Google Search Console Verification Setup

This plan covers all three verification methods for Google Search Console.

---

## Method 1: HTML File Verification

Place the uploaded `google273ab953032642f3.html` file in the `public/` directory. Files in `public/` are served at the site root, so it will be accessible at `https://manomaya.lovable.app/google273ab953032642f3.html` -- exactly where Google expects it.

## Method 2: HTML Meta Tag Verification

Add the verification meta tag to the `<head>` section of `index.html`:

```html
<meta name="google-site-verification" content="8gmeTvN0QTz8-Q1wQpHmBqf2e2gMWZ33ZqS8nOLIErs" />
```

This will be placed alongside the existing SEO meta tags for clean organization.

## Method 3: DNS TXT Record

The DNS TXT record (`google-site-verification=EOvb9X_fkMGCHqjUNBJYSs5FDEnMmIfsmb0tlygBWws`) must be added at your domain registrar -- it cannot be set through code. Since the site is hosted on `manomaya.lovable.app` (a Lovable subdomain), this method is not applicable unless you have a custom domain configured. The HTML file and meta tag methods above are sufficient for verification.

---

## Summary of Code Changes

| File | Change |
|---|---|
| `public/google273ab953032642f3.html` | Copy uploaded verification file to public directory |
| `index.html` | Add Google site verification meta tag in `<head>` |

After publishing, you can click "Verify" in Google Search Console and it should confirm ownership using either the HTML file or meta tag method.

