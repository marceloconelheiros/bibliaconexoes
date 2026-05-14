import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

/** Query ?v=… para ícones — muda quando o PNG muda, para o celular não ficar com arte antiga em cache. */
function publicAssetCacheQuery(relativeToRoot: string): string {
  try {
    const fp = path.resolve(__dirname, relativeToRoot);
    const buf = fs.readFileSync(fp);
    const h = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 12);
    return `?v=${h}`;
  } catch {
    return "";
  }
}

const icon192q = publicAssetCacheQuery("public/icon-192.png");
const icon512q = publicAssetCacheQuery("public/icon-512.png");
const logoq = publicAssetCacheQuery("public/logo.png");

function injectIconCacheBust(): Plugin {
  return {
    name: "inject-icon-cache-bust",
    transformIndexHtml(html) {
      let out = html.replace(/href="\/logo\.png"/g, `href="/logo.png${logoq}"`);
      out = out.replace(/href="\/icon-192\.png"/g, `href="/icon-192.png${icon192q}"`);
      out = out.replace(/content="\/logo\.png"/g, `content="/logo.png${logoq}"`);
      return out;
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/",
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    injectIconCacheBust(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Bíblia Conexões — leitura e planos bíblicos',
        short_name: 'Conexões',
        description:
          'Planos de leitura, Bíblia online e áudio para sua jornada espiritual.',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: `/icon-192.png${icon192q}`,
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: `/icon-512.png${icon512q}`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
