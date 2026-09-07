import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const apiTarget = env.VITE_API_PROXY ?? "http://127.0.0.1:4000";

  // The kiosk build inlines everything into one HTML file for offline terminals;
  // the hosted build stays a normal SPA so it can be served from a CDN.
  // Selected with `vite build --mode kiosk` (works identically on Windows and
  // POSIX shells); BUILD_TARGET=kiosk is still honoured for CI compatibility.
  const singleFile = mode === "kiosk" || env.BUILD_TARGET === "kiosk";

  return {
    plugins: [react(), tailwindcss(), ...(singleFile ? [viteSingleFile()] : [])],
    resolve: {
      alias: { "@": path.resolve(__dirname, "src") },
    },
    server: {
      host: true,
      // Allow proxied preview/tunnel hosts (e2b, ngrok, Codespaces) to reach the
      // dev server. Dev-only; the production build is served as static files.
      allowedHosts: true,
      // Browser code always calls a relative /api — never a hardcoded host — and
      // the dev server forwards it. Same-origin in production keeps cookies simple.
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/socket.io": { target: apiTarget, ws: true, changeOrigin: true },
      },
    },
    preview: {
      host: true,
      allowedHosts: true,
      proxy: {
        "/api": { target: apiTarget, changeOrigin: true },
        "/socket.io": { target: apiTarget, ws: true, changeOrigin: true },
      },
    },
    // Kiosk is a shipped artifact like production: no sourcemaps, or they get
    // inlined into the single HTML file and balloon it.
    build: { sourcemap: mode !== "production" && !singleFile },
  };
});
