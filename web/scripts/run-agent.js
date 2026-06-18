const fs = require("fs");
const path = require("path");
const { spawn, spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const agentDir = path.join(root, "agent");

function pickPython() {
  const candidates = process.platform === "win32"
    ? [
        path.join(agentDir, ".venv", "Scripts", "python.exe"),
        "py",
        "python",
      ]
    : [
        path.join(agentDir, ".venv", "bin", "python"),
        "python3",
        "python",
      ];

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
    return { command: "python", args: [] };
  }

  return { command: "python3", args: [] };
}

const python = pickPython();
const child = spawn(
  python.command,
  [...python.args, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8125"],
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
