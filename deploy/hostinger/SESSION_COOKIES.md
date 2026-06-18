# VPS Session Cookie Notes

The LTC Portal runs behind Nginx on Hostinger. In that layout, the browser talks to HTTPS through Nginx, while Node usually receives proxied HTTP traffic on localhost.

The server now checks reverse-proxy headers when deciding whether to set secure cookies. This prevents a common deployment bug where login succeeds but the browser never keeps the session.

## Recommended production behavior

- Use HTTPS through Nginx and Let's Encrypt.
- Keep Node bound behind Nginx on localhost.
- Pass these proxy headers from Nginx:
  - `Host`
  - `X-Forwarded-Proto`
  - `X-Forwarded-Host`
  - `X-Forwarded-For`
  - `X-Real-IP`

The included Nginx config already forwards these headers.

## Cookie domain guidance

For a single domain such as `ltc.example.com`, leave the cookie domain unset.

For shared login across subdomains, set the session cookie domain to the root domain, for example `example.com`. The server will normalize that to a parent-domain cookie.

Do not set a parent-domain cookie unless it is actually needed. Narrower cookies are safer.

## Login troubleshooting

If login redirects but the app still shows as logged out, check:

1. The production domain is using HTTPS.
2. Nginx passes `X-Forwarded-Proto: https`.
3. The app domain matches the configured public URL.
4. Browser dev tools show the session cookie being stored.
5. The server clock is accurate.
