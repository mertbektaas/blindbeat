import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
    plugins: [vue()],
    server: {
        host: "0.0.0.0",
        allowedHosts: true,
        proxy: {
            "/api": {
                target: "http://backend:3000",
                changeOrigin: true,
                secure: false
            },
            "/ws": {
                target: "ws://backend:3000",
                ws: true,
                changeOrigin: true,
                secure: false
            }
        },
        hmr: {
            overlay: false
        },
        fs: {
            strict: true,
            deny: ["frontendProgress", "../frontendProgress"]
        },
        headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    },
    build: {
        esbuild: {
            drop: ["console", "debugger"]
        }
    }
});
