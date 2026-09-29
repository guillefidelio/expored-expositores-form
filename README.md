# ExpoRed 2027 · Datos del Expositor

Standalone Next.js App Router application for `expositores.expored.com`. Spanish public form, TypeScript, plain CSS, and a server-only `POST /api/expositores` integration with a Make custom webhook. No database, authentication, analytics, Google Forms, or browser-to-Sheets integration.

The form uses two onboarding steps, with circular progress indicators: company details, then billing and payment. Continue validates the company fields; Back and the step indicators preserve entered values. Only the final “Enviar datos” action sends to the API. Server field errors reveal and focus the affected step. Both circles show completion only after Make confirms acceptance.

## Requirements and setup

Use Node.js 22 or 24 LTS and npm. Dependencies are pinned; commit `package-lock.json` and install with `npm ci`.

```sh
npm ci
npm run dev:mock
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). This is the recommended development mode: it starts a loopback-only mock webhook on port 4010 and overrides `MAKE_EXPOSITOR_WEBHOOK_URL` for the child Next.js process, even if a real URL exists in your environment. Nothing is sent to Make. Stop both processes with Ctrl+C.

On this Windows workstation, the `npm` launcher initially resolved to a missing roaming-profile installation. If that happens, invoke the installed npm directly, for example `& 'C:\Program Files\nodejs\node.exe' 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' ci` in PowerShell. Once dependencies are installed, `node scripts/run-mock-app.mjs` also starts the safe local preview without that launcher. The global Node/npm installation has not been changed.

Use **only fictional data**. The mock accepts a company name beginning with `PRUEBA LOCAL`. A complete synthetic fixture is in `tests/fixtures.ts`; its CUIT `30-12345678-1` is a checksum test value, not an assertion that a company owns that number. Emails use the reserved `example.invalid` domain.

For a separately configured environment, copy `.env.example` to `.env.local` and set:

```dotenv
MAKE_EXPOSITOR_WEBHOOK_URL=https://hook.example.invalid/replace-with-your-make-webhook
```

The example is deliberately unusable. Set the actual URL only in your private environment or Vercel's environment settings. **Never prefix it with `NEXT_PUBLIC_`, commit it, put it in a browser request, or use a real webhook for development tests.** `npm run dev` uses that configured environment; `npm run dev:mock` always uses the local mock instead.

## Local verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

The browser suite starts the production build at `127.0.0.1:3100` and a separate mock at `127.0.0.1:4011`. It refuses to reuse an existing app server. Neither `.env.local` nor an inherited Make URL can redirect these tests to the real service. The suite uses fictional data only. If a supported browser is already installed, set `PLAYWRIGHT_CHANNEL=msedge` or `chrome` instead of installing Chromium (PowerShell: `$env:PLAYWRIGHT_CHANNEL = 'msedge'`).

Coverage includes:

- All 13 required fields from the previous Google Form, email, telephone, CUIT checksum, field lengths, two IVA choices, and two payment choices.
- Server validation independent of the browser, allowlisted payload keys, normalization, honeypot, JSON/body limits, origin checks, and rate limiting.
- Actual browser → local Route Handler → mock webhook delivery with the exact Google Form field set.
- Loading state and duplicate-click prevention, confirmed success, upstream failure, a real 10-second upstream timeout, preserved values, and retry identifiers.
- Three-step onboarding navigation; keyboard error focus and accessible descriptions; 320px, 375px and desktop layout; reduced motion; loaded logo; runtime errors.

Screenshots are written to `artifacts/desktop.png` and `artifacts/mobile-375.png`. Test artifacts are ignored by Git. Browser automation is Chromium-based; no claim of full Safari/Firefox coverage is made.

The mock starts in `success` mode and delays replies 800ms so the sending state can be inspected. To change modes during `dev:mock`, use a separate terminal:

```sh
curl -X POST http://127.0.0.1:4010/__control -H "Content-Type: application/json" -d '{"mode":"failure"}'
```

PowerShell equivalent:

```powershell
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:4010/__control' -ContentType 'application/json' -Body '{"mode":"failure"}'
```

Available modes: `success` (HTTP 200), `failure` (HTTP 503), `timeout` (12-second delay). The app times out at 10 seconds. Changing mode clears recorded deliveries. `GET /__deliveries` returns only the synthetic payloads received by this mock, stored in memory until reset/restart. These helper endpoints are **not application routes and are never deployed**. The mock does not log payloads.

## Configuration and source map

| File | Responsibility |
| --- | --- |
| `src/lib/form-config.ts` | Labels, field lengths, IVA choices, Spanish success/failure copy |
| `src/lib/validation.ts` | Shared client/server validation and CUIT checksum |
| `src/components/exhibitor-form.tsx` | Three-step form interaction, accessible errors, loading/success states |
| `src/components/form-field.tsx` | Labels and controls with autocomplete and error descriptions |
| `src/app/globals.css` | Responsive ExpoRed design, focus and reduced-motion rules |
| `src/app/api/expositores/route.ts` | Public POST handler, Node.js runtime, 30-second platform budget |
| `src/lib/submission.ts` | Server validation, payload construction and webhook forwarding |
| `src/lib/request-limits.ts` | Bounded body parsing and best-effort rate limiter |
| `scripts/` | Local mock tools only |

`IVA_OPTIONS` and `PAYMENT_OPTIONS` in `src/lib/form-config.ts` drive both the UI choices and server allowlists. The current choices are only `Responsable Inscripto` / `Exento` and `Cheque` / `Transferencia`.

The official logo is bundled at `public/logoexpored27.png`, using the 595 × 255 transparent PNG supplied by the user. It is served locally on a navy background; the form does not depend on the WordPress site at runtime. Typography uses the system Arial/Helvetica stack without external font requests.

## Webhook contract

The browser sends JSON to the same-origin `/api/expositores`. The server reads the URL exclusively from `process.env.MAKE_EXPOSITOR_WEBHOOK_URL`, revalidates the fields, and posts JSON to Make. It follows no redirects and never returns or logs upstream response bodies, errors, URLs, CUITs, phone numbers, emails, or full payloads.

Payload keys:

```text
submissionId, submittedAt,
razonSocial, nombreComercial, responsableStand, telefonoStand, emailStand,
nombreStand, responsablePago, telefonoPago, emailPago, cuit, condicionIVA,
formaPago, detalleFactura
```

All form values are trimmed strings. Every field is required. CUIT is always 11 digits after check-digit validation. Meaningful invoice line breaks are preserved. Unknown properties and the honeypot are never forwarded. The app does not add reservation metadata or personal information to URLs.

`submittedAt` is a server-generated UTC ISO timestamp for the delivery attempt. `submissionId` is a server-generated SHA-256 identifier derived from a random browser attempt key and the normalized submission. Unchanged retries from the same mounted form reuse that ID, even across server instances. Changed values or reloading the page create a different ID. Direct API requests may omit `Idempotency-Key`; then the server supplies a random seed. A supplied key must be a UUID v4.

**Make must use `submissionId` to prevent duplicates before writing to Google Sheets.** Use a durable, concurrency-safe deduplication step (or sequential scenario execution with a durable identifier store), and acknowledge already-processed IDs with a successful HTTP response. Do not use the timestamp as a deduplication key. A timeout can occur after Make accepted a request: the application reports failure and keeps the same identifier for an unchanged retry. There is no exactly-once guarantee across a reload or changed values. This application neither configures nor pretends to configure the Make scenario, identifier store, confirmation email, or Sheets mapping.

A Make 2xx response is the only path to browser success. This confirms webhook acceptance, not completion of downstream Sheets/email automation. The browser receives only `{ "ok": true }`; failures receive `{ "ok": false, "message": "…" }` or field errors. Responses use `Cache-Control: no-store`.

| Status | Meaning |
| --- | --- |
| 200 | Make returned 2xx |
| 400 | Malformed JSON, invalid retry key or filled honeypot |
| 403 | Cross-origin browser request |
| 408 | Request body was not read within 5 seconds |
| 413 / 415 | Body exceeds 16 KiB / unsupported content type |
| 422 | Field validation errors |
| 429 | Rate limited; includes `Retry-After` |
| 502 | Make rejected the delivery, network error, redirect, or unexpected failure |
| 503 | Missing or invalid webhook configuration |
| 504 | Webhook timed out |

## Request limits and operating boundaries

The endpoint accepts JSON only, limits streamed bodies to 16 KiB (even without a Content-Length header), waits up to 5 seconds for the request body and up to 10 seconds for Make, and caps all field lengths. A hidden honeypot and same-origin browser checks reduce basic automated submissions. This public form does not authenticate exhibitors.

The in-memory limiter allows 20 attempts per 10 minutes per IP **per warm Vercel instance**, with at most 2,000 active buckets. It uses [Vercel's `x-vercel-forwarded-for` header](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for) only when running on Vercel and retains only a hash of the address. Outside Vercel, requests share one instance-wide bucket rather than trusting client-supplied IP headers. Cold starts clear these counters and horizontally scaled instances do not share them. This is a lightweight abuse deterrent, not a distributed quota. For production traffic, configure a Vercel Firewall rate rule on `POST /api/expositores` if stronger shared enforcement is needed; it has not been configured by this project. If self-hosting, enforce rate limits at your trusted ingress.

No application logs contain submission data. Hosting and Make can have their own request/access logs; configure their retention and permissions separately. Avoid enabling payload logging in integrations. Success clears React form values; failures retain them only in the mounted page.

## Deploy separately on Vercel

1. Push this source to your repository and import it as a **new, separate Vercel project**. Select Next.js and Node.js 24 LTS (22 LTS also satisfies the project engine). Keep the default install (`npm ci` with the lockfile) and build (`npm run build`) behavior.
2. Add `MAKE_EXPOSITOR_WEBHOOK_URL` in **Project Settings → Environment Variables**, scoped to Production. Use a dedicated isolated test webhook for Preview if previews require submissions; otherwise leave Preview unset so it fails closed. Never point automated development tests at production Make.
3. Deploy only when ready. Environment-variable changes require a new deployment. The project builds without a secret; submissions return a generic error until the environment is configured.
4. In **Project Settings → Domains**, add only `expositores.expored.com`. Vercel will show the exact DNS record required for that project. Follow the [official Vercel domain guide](https://vercel.com/docs/domains/working-with-domains/add-a-domain).
5. Give the displayed **subdomain CNAME** to the person managing DNS. DNS is configured separately. Do not change the root `expored.com`, `www`, nameservers, mail records, or the Webflow project. No root-domain redirect is needed.
6. After DNS propagation, confirm that Vercel shows a valid domain configuration and HTTPS certificate. Arrange any production acceptance submission separately with the ExpoRed/Make administrator.

Nothing has been published by this project, and no real submissions have been sent. The Make scenario, confirmation email, Google Sheets mapping and DNS remain separate configuration work.

Framework installation reference: [Next.js App Router installation](https://nextjs.org/docs/app/getting-started/installation).

## Delivery verification (2026-09-29)

- Type generation / TypeScript, ESLint and production build: passed.
- 12 validation/server tests: passed.
- 9 browser tests against the production build and local mock, using installed Microsoft Edge: passed (35.3 seconds), including step navigation, Enter-to-continue, no early submission, preserved values, and server errors returning to the affected step.
- Agent-browser check of the development server: expected fields and logo present, no application console or runtime errors.
- Axe 4.12.1: zero violations. Its one manual contrast check concerned the select's decorative background arrow; the placeholder color on white measures 4.64:1.
- Desktop and 375px screenshots reviewed; 320px overflow and successful submission checked automatically.
- No webhook configuration string found in the generated public JavaScript assets.

The Windows sandbox blocked Playwright's process-tree cleanup; the completed browser run used local execution outside that sandbox so the runner could exit normally. All deliveries stayed on loopback. No real webhook, deployment, Webflow modification, or DNS change was performed.
