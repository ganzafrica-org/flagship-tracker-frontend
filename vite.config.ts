import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      // React Router's dev/build HTML pipeline doesn't go through Vite's
      // transformIndexHtml, so auto HTML injection never fires — register the
      // SW explicitly from app code instead (see app/lib/pwa-register.client.ts).
      injectRegister: false,
      // Lets the service worker load during `react-router dev` too, so offline
      // access to the add-forms can be verified without a production build.
      devOptions: { enabled: true, type: "module" },
      manifest: {
        name: "Flagship Tracker",
        short_name: "Flagship Tracker",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0f7fb8",
        icons: [{ src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" }],
      },
      workbox: {
        // SPA mode (react-router.config.ts: ssr: false) ships one index.html —
        // route offline navigations there so client-side routing can take over,
        // which is what lets /me/.../add-* URLs open with zero network.
        navigateFallback: "/index.html",
        navigateFallbackAllowlist: [/^\/(?!api).*$/],
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2}"],
        runtimeCaching: [
          {
            // Dropdown/lookup data (value chains, clusters, youth categories, etc.)
            // every add-form depends on. Cached after the first online visit so
            // forms stay fully fillable offline afterwards.
            urlPattern: ({ url, request }) =>
              request.method === "GET" && url.pathname.startsWith("/api/lookups"),
            handler: "NetworkFirst",
            options: {
              cacheName: "lookups-cache",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
  },
});
