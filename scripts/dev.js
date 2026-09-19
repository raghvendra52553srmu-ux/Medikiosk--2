import { spawn } from "child_process";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const apiDir = path.resolve(rootDir, "apps/api");

function isPortListening(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function main() {
  const isApiRunning = await isPortListening(4000);
  const children = [];

  if (isApiRunning) {
    console.log("\x1b[32m[dev] MediKiosk backend is already running on port 4000.\x1b[0m");
  } else {
    console.log("\x1b[36m[dev] Starting MediKiosk API server on port 4000...\x1b[0m");
    const isWindows = process.platform === "win32";
    const apiProcess = spawn("node", ["src/server.js"], {
      cwd: apiDir,
      stdio: "inherit",
      shell: isWindows,
    });
    children.push(apiProcess);

    apiProcess.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        console.error(`\x1b[31m[api] API server exited with code ${code}\x1b[0m`);
      }
    });
  }

  // Start Vite frontend
  console.log("\x1b[35m[dev] Starting Vite frontend...\x1b[0m");
  const isWindows = process.platform === "win32";
  const viteCmd = isWindows ? "npx.cmd" : "npx";
  const viteProcess = spawn(viteCmd, ["vite"], {
    cwd: rootDir,
    stdio: "inherit",
    shell: isWindows,
  });
  children.push(viteProcess);

  const cleanup = () => {
    for (const child of children) {
      try {
        child.kill();
      } catch {}
    }
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("exit", cleanup);
}

main().catch((err) => {
  console.error("[dev] Failed to start dev environment:", err);
  process.exit(1);
});
