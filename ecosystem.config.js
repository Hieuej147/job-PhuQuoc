/**
 * @file ecosystem.config.js
 * @description PM2 ecosystem configuration.
 * @note Chạy được trên cả Windows và Linux, gồm backend, frontend, inngest và FastAPI agent.
 */
const path = require("path");
const root = __dirname;
module.exports = {
  apps: [
    {
      name: "backend",
      // --- Cấu hình cũ ---
      // script: "dist/src/main.js",
      node_args: "-r dotenv/config",
      // --- Cấu hình mới (dùng 1 cách duy nhất qua package manager) ---
      script: "pnpm",
      args: "run dev",
      cwd: path.join(root, "backend"),
      env: { NODE_ENV: "development" },
    },
    {
      name: "frontend",
      // --- Cấu hình cũ ---
      // script: "node_modules/next/dist/bin/next",
      // args: "dev -p 3001",
      // --- Cấu hình mới (dùng 1 cách duy nhất qua package manager) ---
      script: "pnpm",
      args: "run dev:ui",
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
      env: { NODE_ENV: "development" },
    },
  ],
};
