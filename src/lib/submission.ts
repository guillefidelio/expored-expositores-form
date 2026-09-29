import { createHash, randomUUID } from "node:crypto";
import { FAILURE_MESSAGE } from "./form-config";
import { validateForm } from "./validation";
import { rateLimit, readJsonBody, RequestBodyError } from "./request-limits";

type Dependencies = {
  webhookUrl?: string;
  fetcher: typeof fetch;
  limit: typeof rateLimit;
  timeoutMs: number;
  vercel: boolean;
};

function response(body: object, status: number, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}

function webhookTarget(value: string | undefined): URL | null {
  try {
    const url = new URL(value ?? "");
    const local = ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
    if (url.username || url.password || url.hash) return null;
    if (url.protocol !== "https:" && !(local && url.protocol === "http:" && !process.env.VERCEL)) return null;
    if (url.hostname.endsWith(".invalid")) return null;
    return url;
  } catch { return null; }
}

export async function submitExpositor(request: Request, overrides: Partial<Dependencies> = {}): Promise<Response> {
  const deps: Dependencies = {
    webhookUrl: process.env.MAKE_EXPOSITOR_WEBHOOK_URL,
    fetcher: fetch,
    limit: rateLimit,
    timeoutMs: 10_000,
    vercel: process.env.VERCEL === "1",
    ...overrides,
  };
  const fail = (status: number) => response({ ok: false, message: FAILURE_MESSAGE }, status);
  try {
    // Vercel overwrites this header at its edge. Never trust arbitrary forwarded IPs.
    const identity = deps.vercel ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown" : "local-instance";
    const retryAfter = deps.limit(identity);
    if (retryAfter) return response({ ok: false, message: FAILURE_MESSAGE }, 429, { "Retry-After": String(retryAfter) });
    const origin = request.headers.get("origin");
    // Next.js may construct request.url with its internal listening hostname.
    // Host is the public authority; Vercel terminates public requests over HTTPS.
    const requestUrl = new URL(request.url);
    const authority = request.headers.get("host") ?? requestUrl.host;
    const expectedOrigin = `${deps.vercel ? "https:" : requestUrl.protocol}//${authority}`;
    if (origin && origin !== expectedOrigin) return fail(403);
    if (request.headers.get("sec-fetch-site") === "cross-site") return fail(403);
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return fail(415);
    const raw = await readJsonBody(request);
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fail(400);
    const body = raw as Record<string, unknown>;
    if (body.website !== undefined && (typeof body.website !== "string" || body.website.trim())) return fail(400);
    const result = validateForm(body);
    if (!result.valid) return response({ ok: false, errors: result.errors }, 422);
    const target = webhookTarget(deps.webhookUrl);
    if (!target) return fail(503);
    const key = request.headers.get("idempotency-key");
    if (key && !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(key)) return fail(400);
    const normalized = result.data;
    // Same browser attempt + same normalized data gives the same server-generated ID.
    // Make must deduplicate this ID; no submission data is persisted here.
    const submissionId = createHash("sha256").update(key ?? randomUUID()).update(JSON.stringify(normalized)).digest("hex");
    const payload = { submissionId, submittedAt: new Date().toISOString(), ...normalized };
    const upstream = await deps.fetcher(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(deps.timeoutMs),
      redirect: "error",
      cache: "no-store",
    });
    // Neither read nor expose Make's response body (which may contain private data).
    await upstream.body?.cancel();
    if (!upstream.ok) return fail(502);
    return response({ ok: true }, 200);
  } catch (error) {
    if (error instanceof RequestBodyError) return fail(error.status);
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) return fail(504);
    return fail(502);
  }
}
