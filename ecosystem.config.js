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
      script: "dist/src/main.js",
      cwd: path.join(root, "backend"),
      env: { NODE_ENV: "development" },
    },
    {
      name: "frontend",
      script: "node_modules/next/dist/bin/next",
      args: "dev -p 3001",
      cwd: path.join(root, "web"),
      env: { NODE_ENV: "development" },
    },
    {
      name: "inngest",
      script: "npx",
      args: "inngest-cli@latest dev -u http://localhost:3000/api/inngest",
      cwd: root,
      env: { NODE_ENV: "development" },
    },
    {
      name: "agent",
      script: path.join(root, "web", "scripts", "run-agent.js"),
      cwd: root,
      env: { NODE_ENV: "development" },
    },
  ],
};
