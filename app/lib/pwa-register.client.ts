import { registerSW } from "virtual:pwa-register";

/**
 * Registers the service worker that caches the app shell and lookup APIs so
 * M&E add-forms (individual/flagship/cooperative/association/company/farmer-group)
 * can be opened and filled with zero network, once the app has been visited online.
 */
export function registerOfflineServiceWorker() {
  if (typeof window === "undefined") return;
  // Vite rewrites optimized dependencies while the dev server is running.
  // A service worker that cached the previous copies leaves React Router calling
  // hooks on a React instance that is no longer the one rendering the page.
  if (import.meta.env.DEV) {
    void navigator.serviceWorker?.getRegistrations().then((registrations) => {
      for (const registration of registrations) void registration.unregister();
    });
    void caches?.keys().then((keys) => {
      for (const key of keys) void caches.delete(key);
    });
    return;
  }
  registerSW({ immediate: true });
}
