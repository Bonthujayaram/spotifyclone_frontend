import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const PORT = 5173;

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: PORT,
    strictPort: true,
    headers: {
      // Google Identity Services opens a popup that must talk back to us.
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  preview: {
    port: PORT,
    strictPort: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
