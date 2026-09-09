import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Digital Sommelier",
        short_name: "Sommelier",
        description: "AI-powered wine & food curation for boutique bars",
        theme_color: "#1A0F0A",
        background_color: "#FDF8F0",
        display: "standalone",
        orientation: "portrait",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/bar-api\/.*/i,
            handler: "NetworkFirst",
            options: { cacheName: "bar-api-cache", expiration: { maxEntries: 50, maxAgeSeconds: 3600 } },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5174,
    proxy: {
      "/bar-api": { target: "http://localhost:3002", changeOrigin: true },
      "/cake-api": { target: "http://localhost:3002", changeOrigin: true },
    },
  },
});
