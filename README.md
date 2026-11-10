# pltv.ink — Modern journal

The responsive journal of Pavel Litvinko, built from the supplied desktop and mobile prototypes. Includes the national identity and Belarusian currency symbol projects, original images, social links, a contact download, and a correspondence form.

## Deploy to Cloudflare with Wrangler

Requires Node.js 22+ and Python 3.12+. Install the pinned dependencies:

```sh
npm ci
npm test
npm run deploy:check
```

Authenticate Wrangler using `npm run wrangler -- login` on your computer, or supply `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` through your execution environment. The token needs Workers Scripts edit, R2 Storage edit, Workers Routes edit, and DNS edit for the `pltv.ink` zone. If Wrangler needs to look up the zone, include Zone read permission.

Create the private letter bucket in the selected Cloudflare account:

```sh
npm run wrangler -- r2 bucket create pltv-ink-letters
```

Set the inbox password as a Worker secret. Wrangler may prompt to create the Worker on the first run:

```sh
npm run wrangler -- secret put INBOX_PASSWORD
npm run deploy
```

`npm run deploy` builds the site and runs **Wrangler** against `wrangler.jsonc`. The Worker is `pltv-ink-journal`, with `pltv.ink` as its custom domain. If another Cloudflare Pages project or Worker already owns that hostname, detach that hostname from its old deployment when cutting over; keep the other project and any product subdomains intact. Existing DNS records for the root hostname may need to be replaced by the custom-domain deployment.

The public journal accepts letters at `/api/letters`. Letters are stored in the `pltv-ink-letters` R2 bucket; this does not send email notifications. Visit `https://pltv.ink/inbox` to read them, using username **pavel** and the password stored as `INBOX_PASSWORD`. Inbox access fails closed until the secret is configured. The owner's email is absent from the client files and contact card.

For local development, put `INBOX_PASSWORD` in an untracked `.dev.vars` file, then run:

```sh
npm run build:cloudflare
npm run wrangler -- dev
```

The local R2 simulator and production bucket are separate. Letters already stored in the original Sites deployment remain in that deployment's bucket; they are not copied by Wrangler.

## Source layout

- `build.py` regenerates HTML and project content from `design-reference.html`, which is read as design data without executing its scripts.
- `dist/index.html`, `dist/styles.css`, `dist/app.js`, and `dist/assets/` contain the journal and original supplied images.
- `worker/api.js` implements letter validation, storage, and the inbox.
- `worker/cloudflare.js` authenticates the inbox for direct Cloudflare hosting and serves static files through Workers Assets. It does not trust visitor-supplied Sites identity headers.
- `scripts/build-cloudflare.mjs` copies the journal's client files to ignored `build/cloudflare/`, excluding Sites deployment metadata and the generated Sites Worker.
- `wrangler.jsonc` configures the custom domain, static assets, and R2 bucket.

The original Sites deployment remains available separately. `.openai/hosting.json`, `scripts/build.mjs`, and `dist/server/index.js` retain its build configuration. `npm run build` builds that original Sites artifact; direct Cloudflare deployment uses `npm run deploy` instead.
