import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Deployed as a GitHub Pages *project* site at https://<user>.github.io/gym/,
// so every asset URL needs the repo name as its base path.
export default defineConfig({
  base: "/gym/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          vendor: ["react", "react-dom", "react-router-dom", "framer-motion"],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/favicon-32.png", "icons/apple-touch-icon.png"],
      manifest: {
        name: "GymRat",
        short_name: "GymRat",
        description: "Registra tus entrenamientos, mantén la racha y compite con tus amigos.",
        start_url: "/gym/",
        scope: "/gym/",
        display: "standalone",
        background_color: "#0b0b0d",
        theme_color: "#0b0b0d",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest}"],
        // Sin esto, un service worker instalado en un iPhone (PWA en pantalla
        // de inicio) se queda "esperando" y sigue sirviendo la versión vieja
        // hasta que se cierra la app del todo — a veces nunca. Con
        // skipWaiting + clientsClaim, la nueva versión toma el control en
        // cuanto termina de descargarse.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
