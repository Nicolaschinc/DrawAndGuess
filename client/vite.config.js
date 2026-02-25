import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/drawguess/",
  plugins: [react()],
  define: {
    // Vite uses string replacement, so the value should be a stringified string (e.g. '"1.0.0"')
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  server: {
    host: true,
  },
});
