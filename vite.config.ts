import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

/** Chrome DevTools and the PWA fallback hit URLs this SPA does not route. Answer them before React Router logs a missing-route error. */
function quietDevProbes(): Plugin {
  return {
    name: "quiet-dev-probes",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? "").split("?")[0];
        if (path === "/json" || path === "/json/version" || path === "/json/list") {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end("{}");
          return;
        }
        if (path === "/index.html") {
          const query = req.url?.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
          // React Router's dev handler copies originalUrl back onto url.
          req.url = `/${query}`;
          req.originalUrl = `/${query}`;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    quietDevProbes(),
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
      devOptions: {
        enabled: true,
        type: "module",
        // dev-dist has no built assets yet, so the default precache glob only warns.
        suppressWarnings: true,
      },
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
