import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/drawguess/",
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  define: {
    // Vite uses string replacement, so the value should be a stringified string (e.g. '"1.0.0"')
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  server: {
    host: true,
    fs: {
      allow: [".."],
    },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
