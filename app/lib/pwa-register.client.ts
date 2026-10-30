import { registerSW } from "virtual:pwa-register";

/**
 * Registers the service worker that caches the app shell and lookup APIs so
 * M&E add-forms (individual/flagship/cooperative/association/company/farmer-group)
 * can be opened and filled with zero network, once the app has been visited online.
 */
export function registerOfflineServiceWorker() {
  if (typeof window === "undefined") return;
  registerSW({ immediate: true });
}
