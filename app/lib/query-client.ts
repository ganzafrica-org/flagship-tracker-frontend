import { QueryCache, QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";
import { clearUser, getAccessToken } from "./auth";

function handleAuthError(error: unknown) {
  if (!(error instanceof ApiError) || (error.status !== 401 && error.status !== 403)) {
    return;
  }
  if (!getAccessToken()) {
    return;
  }
  clearUser();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.assign("/login");
  }
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: handleAuthError,
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: (failureCount, error) => {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          return false;
        }
        if (error instanceof ApiError && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
