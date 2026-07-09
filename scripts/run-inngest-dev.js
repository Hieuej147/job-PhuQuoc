#!/usr/bin/env node

const { spawn } = require("node:child_process");

const endpoint = process.env.INNGEST_DEV_URL || "http://localhost:3000/api/inngest";
const maxAttempts = Number(process.env.INNGEST_WAIT_ATTEMPTS || 60);
const delayMs = Number(process.env.INNGEST_WAIT_DELAY_MS || 2000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForBackend() {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(endpoint, { method: "GET" });
      if (response.ok) return;
    } catch {
      // Backend is not ready yet.
    }

    if (attempt === 1 || attempt % 10 === 0) {
      console.log(`[inngest] waiting for ${endpoint} (${attempt}/${maxAttempts})`);
    }
    await sleep(delayMs);
  }

  throw new Error(`Backend Inngest endpoint is not ready: ${endpoint}`);
}

async function main() {
  await waitForBackend();
  console.log(`[inngest] starting dev server for ${endpoint}`);
  console.log("[inngest] UI: http://localhost:8288");

  const child = spawn("npx", ["inngest-cli@latest", "dev", "-u", endpoint], {
    stdio: "inherit",
    shell: false,
  });

  const stop = (signal) => {
    if (!child.killed) child.kill(signal);
  };

  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));

  child.on("exit", (code, signal) => {
    if (signal) {
      process.exit(0);
    }
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(`[inngest] ${error.message}`);
  process.exit(1);
});

