import assert from "node:assert/strict";
import { test } from "node:test";
import { submitExpositor } from "../src/lib/submission";
import { createRateLimiter, MAX_BODY_BYTES } from "../src/lib/request-limits";
import { FAILURE_MESSAGE } from "../src/lib/form-config";
import { validSubmission } from "./fixtures";

const key = "6a6a6a6a-1111-4222-8333-123456789abc";
function request(body: unknown = validSubmission, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/expositores", {
    method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key, ...headers }, body: JSON.stringify(body),
  });
}
const defaults = { webhookUrl: "https://hook.example.com/local-test-only", limit: () => 0 };

test("Make 2xx produces only minimal success with normalized, allowlisted payload", async () => {
  let payload: Record<string, unknown> = {};
  const result = await submitExpositor(request({ ...validSubmission, reservationReference: "ABC123", website: "", injected: "omit" }), {
    ...defaults,
    fetcher: async (_url, options) => { payload = JSON.parse(String(options?.body)); return new Response("Accepted", { status: 202 }); },
  });
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { ok: true });
  assert.equal(payload.cuit, "30123456781");
  assert.equal(payload.reservationReference, "ABC123");
  assert.match(String(payload.submissionId), /^[a-f0-9]{64}$/);
  assert.ok(!Number.isNaN(Date.parse(String(payload.submittedAt))));
  assert.equal(Object.keys(payload).length, 17);
  assert.equal(payload.website, undefined);
  assert.equal(payload.injected, undefined);
});

test("same retry produces the same server-generated ID; changed data or key produces a new ID", async () => {
  const ids: string[] = [];
  const fetcher: typeof fetch = async (_url, options) => { ids.push(JSON.parse(String(options?.body)).submissionId); return new Response(null, { status: 204 }); };
  await submitExpositor(request(), { ...defaults, fetcher });
  await submitExpositor(request(), { ...defaults, fetcher });
  await submitExpositor(request({ ...validSubmission, nombreStand: "Otro" }), { ...defaults, fetcher });
  await submitExpositor(request(validSubmission, { "Idempotency-Key": "6a6a6a6a-1111-4222-8333-123456789abd" }), { ...defaults, fetcher });
  assert.equal(ids[0], ids[1]);
  assert.notEqual(ids[0], ids[2]);
  assert.notEqual(ids[0], ids[3]);
});

test("same-origin check uses public Host when Next.js constructs an internal request URL", async () => {
  const fetcher: typeof fetch = async () => new Response(null, { status: 204 });
  const local = await submitExpositor(request(validSubmission, { Host: "127.0.0.1:3000", Origin: "http://127.0.0.1:3000" }), { ...defaults, fetcher });
  assert.equal(local.status, 200);
  const hosted = await submitExpositor(request(validSubmission, { Host: "expositores.expored.com", Origin: "https://expositores.expored.com" }), { ...defaults, fetcher, vercel: true });
  assert.equal(hosted.status, 200);
});

test("validation, honeypot, malformed data, origins, content type and oversize requests never reach Make", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async () => { calls++; return new Response(); };
  const cases: [Request, number][] = [
    [request({}), 422],
    [request({ ...validSubmission, cuit: "30123456782" }), 422],
    [request({ ...validSubmission, emailStand: "invalid" }), 422],
    [request({ ...validSubmission, website: "spam" }), 400],
    [request({ ...validSubmission, reservationReference: {} }), 400],
    [request(validSubmission, { Origin: "https://other.example" }), 403],
    [request(validSubmission, { "Content-Type": "text/plain" }), 415],
    [request(validSubmission, { "Idempotency-Key": "bad" }), 400],
    [request({ ...validSubmission, detalleFactura: "x".repeat(MAX_BODY_BYTES) }), 413],
    [new Request("http://localhost:3000/api/expositores", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }), 400],
  ];
  for (const [req, status] of cases) assert.equal((await submitExpositor(req, { ...defaults, fetcher })).status, status);
  assert.equal(calls, 0);
});

test("missing/unsafe config fails closed and does not expose internals", async () => {
  for (const webhookUrl of [undefined, "garbage", "http://public.example/hook", "https://user:password@example.com/hook"]) {
    const result = await submitExpositor(request(), { ...defaults, webhookUrl, fetcher: async () => { throw Error("Must not send"); } });
    assert.equal(result.status, 503);
    assert.deepEqual(await result.json(), { ok: false, message: FAILURE_MESSAGE });
  }
});

test("Make non-2xx, network errors and timeouts never return success", async () => {
  const cases: [typeof fetch, number][] = [
    [async () => new Response("private upstream detail", { status: 500 }), 502],
    [async () => { throw new Error("secret URL"); }, 502],
    [async () => { throw new DOMException("timed out", "TimeoutError"); }, 504],
  ];
  for (const [fetcher, status] of cases) {
    const result = await submitExpositor(request(), { ...defaults, fetcher });
    assert.equal(result.status, status);
    assert.deepEqual(await result.json(), { ok: false, message: FAILURE_MESSAGE });
  }
});

test("rate limit blocks excess requests and resets after the window", async () => {
  const limit = createRateLimiter();
  for (let i = 0; i < 20; i++) assert.equal(limit("client", 1000), 0);
  assert.equal(limit("client", 1000), 600);
  assert.equal(limit("another-client", 1000), 0);
  assert.equal(limit("client", 601000), 0);
  const result = await submitExpositor(request(), { ...defaults, limit: () => 60 });
  assert.equal(result.status, 429);
  assert.equal(result.headers.get("Retry-After"), "60");
});
