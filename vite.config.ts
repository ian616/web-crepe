import { defineConfig } from "vite";

export default defineConfig({
    build: {
        target: "esnext",
    },
    optimizeDeps: {
        exclude: ["tvmjs"],
    },
    assetsInclude: ["**/*.wasm"],
    server: {
        port: 5173,
        open: true,
    },
});
