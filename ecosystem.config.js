/**
 * @file ecosystem.config.js
 * @description PM2 ecosystem configuration.
 * @note Chạy được trên cả Windows và Linux, gồm backend, frontend, inngest và FastAPI agent.
 */
const fs = require("fs");
const path = require("path");
const root = __dirname;

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  return fs
    .readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith("#"))
    .reduce((acc, line) => {
      const idx = line.indexOf("=");
      if (idx === -1) return acc;
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      acc[key] = value;
      return acc;
    }, {});
}

function mergeEnvFiles(...files) {
  return files.reduce((env, file) => ({ ...env, ...parseEnvFile(file) }), {});
}

const rootEnv = path.join(root, ".env");
const backendEnv = path.join(root, "backend", ".env");
const webEnv = path.join(root, "web", ".env");
const webAgentEnv = path.join(root, "web", "agent", ".env");

const backendBaseEnv = mergeEnvFiles(rootEnv, backendEnv);
const webBaseEnv = mergeEnvFiles(rootEnv, webEnv);
const agentBaseEnv = mergeEnvFiles(rootEnv, webEnv, webAgentEnv);

module.exports = {
  apps: [
    {
      name: "backend",
      script: "dist/src/main.js",
      cwd: path.join(root, "backend"),
      env: { NODE_ENV: "development", ...backendBaseEnv },
    },
    {
      name: "frontend",
      script: "node_modules/next/dist/bin/next",
      args: "dev -p 3001",
      cwd: path.join(root, "web"),
      env: { NODE_ENV: "development", ...webBaseEnv },
    },
    {
      name: "inngest",
      script: "npx",
      args: "inngest-cli@latest dev -u http://localhost:3000/api/inngest",
      cwd: root,
      env: { NODE_ENV: "development", ...backendBaseEnv, ...webBaseEnv },
    },
    {
      name: "agent",
      script: path.join(root, "web", "scripts", "run-agent.js"),
      cwd: root,
      env: { NODE_ENV: "development", ...agentBaseEnv },
    },
  ],
};
