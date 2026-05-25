import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 엔트리에서 직접 registerSW를 호출하므로 자동 스크립트 주입은 끕니다.
      injectRegister: false,
      registerType: "autoUpdate",
      // 이미 public/icons 아래 PNG 아이콘을 직접 관리하므로 자동 에셋 생성기는 끕니다.
      pwaAssets: {
        disabled: true,
      },
      includeAssets: [
        "favicon.svg",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/maskable-icon-512.png",
      ],
      manifest: {
        name: "Routimate",
        short_name: "Routimate",
        description: "루틴 인증과 챌린지를 관리하는 갓생 루틴 서비스",
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icons/maskable-icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // 배포 후 오래된 캐시가 남는 문제를 줄이기 위한 정리 옵션입니다.
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        runtimeCaching: [
          {
            // API는 항상 네트워크를 타도록 고정해 로그인/업로드가 캐시에 막히지 않게 합니다.
            urlPattern: /^https:\/\/api\.routimate\.com\/.*/i,
            handler: "NetworkOnly",
            options: {
              cacheName: "routimate-api-bypass",
            },
          },
          {
            // HTML 문서는 새 배포를 빨리 반영하기 위해 네트워크 우선 전략을 사용합니다.
            urlPattern: ({ request, sameOrigin }) =>
              sameOrigin && request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "routimate-pages",
              networkTimeoutSeconds: 3,
            },
          },
          {
            // JS/CSS/Worker는 재검증이 쉬운 정적 자산이므로 SWR 전략으로 처리합니다.
            urlPattern: ({ request, sameOrigin }) =>
              sameOrigin &&
              ["script", "style", "worker"].includes(request.destination),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "routimate-static-assets",
            },
          },
          {
            // 이미지와 폰트는 캐시 우선으로 두되 개수를 제한해 캐시 폭주를 막습니다.
            urlPattern: ({ request, sameOrigin }) =>
              sameOrigin &&
              ["image", "font"].includes(request.destination),
            handler: "CacheFirst",
            options: {
              cacheName: "routimate-media-assets",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  // preview는 터널/배포 점검 시 dev와 같은 포트로 열리도록 유지합니다.
  preview: {
    allowedHosts: true,
    host: true,
    port: 5173,
  },
  // 개발 서버는 기존처럼 외부 접속 가능 상태를 유지합니다.
  server: {
    allowedHosts: true,
    host: true,
  },
});
