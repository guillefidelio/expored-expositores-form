import { spawn } from "node:child_process";
import { startMockWebhook } from "./mock-webhook.mjs";

const testing = process.argv.includes("--test");
const port = testing ? 3100 : 3000;
const mockPort = testing ? 4011 : 4010;
const mock = startMockWebhook(mockPort);
let app;
mock.on("error", (error) => {
  console.error(`Mock could not start (${error.code}). No application was started.`);
  process.exitCode = 1;
});
mock.on("listening", () => {
  app = spawn(process.execPath, ["node_modules/next/dist/bin/next", testing ? "start" : "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    stdio: "inherit",
    env: { ...process.env, VERCEL: "", MAKE_EXPOSITOR_WEBHOOK_URL: `http://127.0.0.1:${mockPort}/webhook`, NEXT_TELEMETRY_DISABLED: "1" },
    windowsHide: true,
  });
  app.on("exit", (code) => { mock.close(); process.exitCode = code ?? 0; });
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { app?.kill(); mock.close(); });
