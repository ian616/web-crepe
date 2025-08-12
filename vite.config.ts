import { defineConfig } from "vite";
import externalize from "vite-plugin-externalize-dependencies";
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [externalize({ externals: ["ws"] }), react()],
    optimizeDeps: {
        exclude: ["ws"],
    },
    build: {
        commonjsOptions: {
            ignore: ["ws"],
        },
        rollupOptions: {
            external: ["ws"],
        },
    },
    assetsInclude: ["**/*.wasm"],
    server: {
        port: 5173,
        open: true,
    },
});
