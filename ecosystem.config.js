/**
 * @file ecosystem.config.js
 * @description PM2 ecosystem configuration.
 * @note Chạy được trên cả Windows và Linux, gồm backend, frontend, inngest và FastAPI agent.
 * @note frontend chạy bản PRODUCTION (đã build sẵn) để tránh hiện tượng biên dịch
 *       chậm/đứng khi chuyển trang trong dev mode với codebase lớn.
 *       Muốn quay lại dev mode (hot-reload khi sửa code), đổi "start" thành "run dev:ui".
 */
const path = require("path");
const root = __dirname;
module.exports = {
  apps: [
    {
      name: "backend",
      script: "cmd.exe",
      args: "/c pnpm run dev",
      interpreter: "none",
      cwd: path.join(root, "backend"),
      env: { NODE_ENV: "development" },
    },
    {
      name: "frontend",
      script: "cmd.exe",
      args: "/c pnpm start",
      interpreter: "none",
      cwd: path.join(root, "web"),
      env: { NODE_ENV: "production" },
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
        PYTHONUNBUFFERED: "1"
      },
    },
  ],
};