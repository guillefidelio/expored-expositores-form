import { createHash } from "node:crypto";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 20;
const MAX_CLIENTS = 2000;

// Best effort, per warm instance. Use a platform firewall for a distributed limit.
export function createRateLimiter() {
  const clients = new Map<string, { count: number; expires: number }>();
  return (identity: string, now = Date.now()): number => {
    for (const [key, entry] of clients) if (entry.expires <= now) clients.delete(key);
    const key = createHash("sha256").update(identity).digest("hex");
    const entry = clients.get(key);
    if (entry) {
      if (entry.count >= MAX_REQUESTS) return Math.ceil((entry.expires - now) / 1000);
      entry.count += 1;
      return 0;
    }
    if (clients.size >= MAX_CLIENTS) return 60;
    clients.set(key, { count: 1, expires: now + WINDOW_MS });
    return 0;
  };
}

export const rateLimit = createRateLimiter();
export const MAX_BODY_BYTES = 16 * 1024;

export class RequestBodyError extends Error {
  constructor(public status: number) { super("Invalid request body"); }
}

export async function readJsonBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) throw new RequestBodyError(413);
  if (!request.body) throw new RequestBodyError(400);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new RequestBodyError(408)), 5000);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), timeout]);
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) throw new RequestBodyError(413);
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch (error) {
    if (error instanceof RequestBodyError) throw error;
    throw new RequestBodyError(400);
  } finally {
    clearTimeout(timer);
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
