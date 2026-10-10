#!/usr/bin/env node
/**
 * Arranca la demo PassLive: API (puerto 4000) + frontend Vite (puerto 5173).
 * Uso:  npm run demo
 * Ctrl+C detiene ambos procesos.
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

const procs = [];

function start(name, args, cwd) {
  const child = spawn(npm, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`\n[${name}] terminó con código ${code}`);
    }
    shutdown(code ?? 0);
  });
  procs.push(child);
  return child;
}

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const p of procs) {
    if (!p.killed) p.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 300);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("▶ PassLive demo: arrancando API (4000) y frontend (5173)…\n");
start("api", ["run", "dev"], resolve(root, "server"));
start("web", ["run", "dev"], resolve(root, "web"));

console.log(`
┌─────────────────────────────────────────────────┐
│  PassLive demo                                 │
│  Frontend : http://localhost:5173               │
│  API      : http://localhost:4000/api/health    │
│  Ctrl+C   : detiene ambos servicios            │
└─────────────────────────────────────────────────┘
`);
