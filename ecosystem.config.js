/**
 * @file ecosystem.config.js
 * @description PM2 ecosystem configuration.
 * @note Chạy được trên cả Windows và Linux, gồm backend, frontend, inngest và FastAPI agent.
 * @note frontend chạy DEV mode để có hot reload và Next.js dev indicator khi đang code.
 *       Nếu cần test production locally, build web rồi đổi process frontend sang "start".
 */
const path = require("path");
const root = __dirname;
const isWindows = process.platform === "win32";
const pnpmScript = isWindows ? "cmd.exe" : "pnpm";
const pnpmArgs = (script) => (isWindows ? `/c pnpm ${script}` : script);

module.exports = {
  apps: [
    {
      name: "backend",
      script: pnpmScript,
      args: pnpmArgs("run dev"),
      interpreter: "none",
      cwd: path.join(root, "backend"),
      env: { NODE_ENV: "development" },
    },
    {
      name: "frontend",
      script: pnpmScript,
      args: pnpmArgs("run start"),
      interpreter: "none",
      cwd: path.join(root, "web"),
      env: { NODE_ENV: "development" },
    },
    {
      name: "inngest",
      script: "node",
      args: "scripts/run-inngest-dev.js",
      cwd: root,
      env: { NODE_ENV: "development" },
      autorestart: false,
      max_restarts: 1,
      restart_delay: 5000,
      out_file: path.join(root, "logs", "inngest-out.log"),
      error_file: path.join(root, "logs", "inngest-error.log"),
    },
    {
      name: "agent",
      script: path.join(root, "web", "scripts", "run-agent.js"),
      cwd: root,
      env: {
        NODE_ENV: "development",
        PYTHONIOENCODING: "utf-8",
        PYTHONUNBUFFERED: "1",
      },
    },
  ],
};
