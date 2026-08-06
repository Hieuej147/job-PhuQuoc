const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const repoRoot = path.resolve(root, "..");
const agentDir = path.join(root, "agent");

function loadEnvFile(envFile, { override = false } = {}) {
  if (!fs.existsSync(envFile)) return;
  fs.readFileSync(envFile, "utf-8")
    .split("\n")
    .forEach((line) => {
      const match = line.match(/^\s*([^#][^=]*?)\s*=\s*(.*)\s*$/);
      if (!match) return;
      const key = match[1];
      if (!override && process.env[key] !== undefined) return;
      process.env[key] = match[2].replace(/^["']|["']$/g, "");
    });
}

// The agent owns `web/.env`. Load it first so an older backend key cannot
// silently win when both files define OPENAI_API_KEY. Backend values remain
// available as a fallback for shared settings that are not defined by web.
loadEnvFile(path.join(root, ".env"));
loadEnvFile(path.join(repoRoot, "backend", ".env"));

function pickPython() {
  // Ưu tiên uv run nếu có sẵn — đảm bảo đúng môi trường venv, tránh lệch PATH/DLL trên Windows
  if (!spawnSync("uv", ["--version"], { stdio: "ignore" }).error) {
    return { command: "uv", args: ["run", "python"] };
  }

  const candidates =
    process.platform === "win32"
      ? [path.join(agentDir, ".venv", "Scripts", "python.exe"), "py", "python"]
      : [path.join(agentDir, ".venv", "bin", "python"), "python3", "python"];

  for (const candidate of candidates) {
    if (path.isAbsolute(candidate) && fs.existsSync(candidate)) {
      return { command: candidate, args: [] };
    }
  }

  if (process.platform === "win32") {
    if (!spawnSync("py", ["-3", "--version"], { stdio: "ignore" }).error) {
      return { command: "py", args: ["-3"] };
    }
    if (!spawnSync("python", ["--version"], { stdio: "ignore" }).error) {
      return { command: "python", args: [] };
    }
    return { command: "python", args: [] };
  }

  if (!spawnSync("python3", ["--version"], { stdio: "ignore" }).error) {
    return { command: "python3", args: [] };
  }
  if (!spawnSync("python", ["--version"], { stdio: "ignore" }).error) {
    return { command: "python3", args: [] };
  }
  return { command: "python3", args: [] };
}

const python = pickPython();

const child = spawn(
  python.command,
  [
    ...python.args,
    "main.py",
  ],
  {
    cwd: agentDir,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: "1",
    },
    stdio: "inherit",
    shell: false,
  },
);

const shutdown = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("exit", () => shutdown("SIGTERM"));

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(0);
  }
  process.exit(code ?? 0);
});
