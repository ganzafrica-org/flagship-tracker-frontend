import { useEffect, useState } from "react";

import { checkReachability } from "./network";

/**
 * Online/offline state. `navigator.onLine` only reflects whether the device has a network
 * interface, not whether the API is actually reachable (VPN drops, DNS issues, a down backend
 * all still report "online") — this is advisory only. The offline-drafts capture flow doesn't
 * depend on it being accurate; it reacts to the real fetch outcome instead (see network.ts).
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      void checkReachability().then((reachable) => {
        if (reachable) setJustReconnected(true);
      });
    }
    function handleOffline() {
      setIsOnline(false);
      setJustReconnected(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline, justReconnected, clearJustReconnected: () => setJustReconnected(false) };
}
