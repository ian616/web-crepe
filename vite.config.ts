import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import externalize from "vite-plugin-externalize-dependencies";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    externalize({ externals: ["ws"] })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/app"),
      "@components": path.resolve(__dirname, "src/app/components")
    }
  },
  server: {
    port: 5173,
    open: true
  },
  assetsInclude: ["**/*.wasm"],
  optimizeDeps: {
    exclude: ["ws"]
  },
  build: {
    commonjsOptions: {
      ignore: ["ws"]
    },
    rollupOptions: {
      external: ["ws"]
    }
  }
});