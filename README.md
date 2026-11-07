# pltv.ink — Modern journal

A responsive implementation of the supplied mobile and desktop prototypes.

- `dist/index.html`, `styles.css`, `app.js`, and the local photo assets form the journal.
- `build.py` regenerates HTML and content from the supplied `design-reference.html` as data, without executing its prototype scripts.
- `worker/api.js` accepts correspondence, saves it in the private R2 bucket, and provides the owner-only `/inbox`.
- `scripts/build.mjs` embeds the journal assets and API into a dependency-free Cloudflare Worker.
- `.openai/hosting.json` retains the Sites identity and R2 binding.

Run `npm test`, then `npm run build`. The hosted `OWNER_EMAIL` secret authorizes inbox access using platform-injected identity headers. No owner's email is included in the client files or contact card. Sending letters stores them in the inbox; it does not send email notifications.

The supplied social profiles are linked. Telegram and project destination URLs remain unspecified; their controls show notes rather than navigating to invented external URLs. Contact downloads contain public name, role, city, and social profile data only.

Publish through the Sites workflow. Keep private access until the owner explicitly requests an audience change.
