# pltv.ink — Modern journal

The responsive journal of Pavel Litvinko, built from the supplied desktop and mobile prototypes. Includes the national identity and Belarusian currency symbol projects, original images, social links, a contact download, and a correspondence form.

## Deploy to Cloudflare with Wrangler

Requires Node.js 22+. Install the pinned dependencies:

```sh
npm ci
npm test
npm run deploy:check
```

The deployment target is the **existing `pltv-root` Worker** in account `c0a9c396fb77f08c584f0554421688ad`. The existing Custom Domains **`pltv.ink` and `www.pltv.ink`**, and their DNS records, remain managed outside Wrangler. Do not add `route` or `routes` to `wrangler.jsonc`, detach domains, or change DNS for this deployment.

Use an authenticated local Wrangler session (`npm run wrangler -- login`), or supply these variables through a verified credential manager:

- `CLOUDFLARE_API_TOKEN`: limited to **Workers Scripts Edit** and **R2 Storage Edit** for the account above.
- `CLOUDFLARE_ACCOUNT_ID`: `c0a9c396fb77f08c584f0554421688ad`.
- `INBOX_PASSWORD`: the private inbox password.

The configuration requires no DNS or routing permissions. Keep secret values outside the repository and chat. A secure secret-entry form is not available in every agent runtime.

Setup and validation use `npm run deploy:check`, which performs a dry run only. Before an authorized production deployment, inspect the existing Worker's bindings and secrets. Preserve the existing `BUCKET` binding and `INBOX_PASSWORD` secret. Create the bucket or set the password only if missing. Environment variables are not automatically uploaded as Worker secrets.

## Sync from Sites

The current source includes Sites version **11**, source commit `576ced186e45dc7c049908a97967a58bc793b771`. The Git merge retains the Sites history and the standalone Cloudflare files.

The Cloudflare build copies the exported `dist/` client files directly. It does not run `build.py`, because regeneration can overwrite edits made in Sites. After each Sites export, merge its source into this repository, preserve the Cloudflare configuration and inbox adapter, run the tests and dry run, then deploy the reviewed commit.

`npm run deploy` builds the site and runs **Wrangler** against `wrangler.jsonc`. With no configured route declarations, Wrangler does not publish routes or Custom Domains; the two existing domain bindings stay attached to `pltv-root`.

The public journal accepts letters at `/api/letters`. Letters are stored in the `pltv-ink-letters` R2 bucket; this does not send email notifications. Visit `https://pltv.ink/inbox` to read them, using username **pavel** and the password stored as `INBOX_PASSWORD`. Inbox access fails closed until the secret is configured. The owner's email is absent from the client files and contact card.

For local development, put `INBOX_PASSWORD` in an untracked `.dev.vars` file, then run:

```sh
npm run build:cloudflare
npm run wrangler -- dev
```

The local R2 simulator and production bucket are separate. Letters already stored in the original Sites deployment remain in that deployment's bucket; they are not copied by Wrangler.

## Source layout

- `build.py` is the original prototype generator. Run it only when intentionally regenerating the journal, then review all generated changes.
- `dist/index.html`, `dist/styles.css`, `dist/app.js`, and `dist/assets/` contain the journal and original supplied images.
- `worker/api.js` implements letter validation, storage, and the inbox.
- `worker/cloudflare.js` authenticates the inbox for direct Cloudflare hosting and serves static files through Workers Assets. It does not trust visitor-supplied Sites identity headers.
- `scripts/build-cloudflare.mjs` copies the journal's client files to ignored `build/cloudflare/`, excluding Sites deployment metadata and the generated Sites Worker.
- `wrangler.jsonc` selects the existing Worker and account and configures static assets and the R2 binding. Domain bindings are deliberately omitted.

The original Sites deployment remains available separately. `.openai/hosting.json`, `scripts/build.mjs`, and `dist/server/index.js` retain its build configuration. `npm run build` builds that original Sites artifact; direct Cloudflare deployment uses `npm run deploy` instead.
