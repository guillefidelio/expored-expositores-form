import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

export function startMockWebhook(port = 4010) {
  let mode = "success";
  let deliveries = [];
  const server = createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.method === "GET" && req.url === "/health") return res.end('{"ok":true}');
    let text = "";
    for await (const chunk of req) {
      text += chunk;
      if (Buffer.byteLength(text) > 16384) { res.writeHead(413); return res.end("{}"); }
    }
    let body;
    try { body = JSON.parse(text || "{}"); } catch { res.writeHead(400); return res.end("{}"); }
    if (req.method === "POST" && req.url === "/__control") {
      if (!["success", "failure", "timeout"].includes(body.mode)) { res.writeHead(400); return res.end("{}"); }
      mode = body.mode;
      deliveries = [];
      return res.end('{"ok":true}');
    }
    if (req.method === "GET" && req.url === "/__deliveries") return res.end(JSON.stringify(deliveries));
    if (req.method !== "POST" || req.url !== "/webhook") { res.writeHead(404); return res.end("{}"); }
    // Prevent accidental use of real submissions in this local-only tool.
    if (!body.razonSocial?.startsWith("PRUEBA LOCAL")) {
      res.writeHead(400);
      return res.end('{"error":"Usá una razón social que comience con PRUEBA LOCAL y datos ficticios."}');
    }
    deliveries.push(body);
    const currentMode = mode;
    setTimeout(() => {
      res.writeHead(currentMode === "failure" ? 503 : 200);
      res.end(JSON.stringify({ ok: currentMode !== "failure" }));
    }, currentMode === "timeout" ? 12_000 : 800).unref();
  });
  server.listen(port, "127.0.0.1", () => console.log(`Mock webhook listening on http://127.0.0.1:${port}/webhook (synthetic data only)`));
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) startMockWebhook(Number(process.env.MOCK_PORT || 4010));
