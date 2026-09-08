import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command, mode }) => {
  // frontend/src/lib/api.js silently falls back to http://localhost:5000
  // when VITE_API_BASE_URL is unset — fine for local `vite dev`, but a
  // production build that ships with that fallback baked in would talk to
  // localhost from every visitor's browser. Fail the build, not the runtime.
  if (command === "build") {
    const env = loadEnv(mode, process.cwd(), "VITE_");
    if (!env.VITE_API_BASE_URL) {
      throw new Error(
        "VITE_API_BASE_URL is not set. Set it (see .env.example) before building — " +
          "without it, the build would silently talk to http://localhost:5000 in production."
      );
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: {
        "/api": "http://localhost:5000",
      },
    },
  };
});
