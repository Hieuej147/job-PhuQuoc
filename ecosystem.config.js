/**
 * @file ecosystem.config.js
 * @description PM2 ecosystem configuration.
 * @note [HuynhhThanh] Đã xóa service `agent` do lỗi `/bin/bash` không tương thích trên Windows, giúp lệnh `npm run dev` khởi chạy frontend và backend thành công.
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
  ],
};