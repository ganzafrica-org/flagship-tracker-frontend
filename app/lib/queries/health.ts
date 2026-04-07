import { queryOptions } from "@tanstack/react-query";
import { api } from "../api";

export const healthQueryOptions = queryOptions({
  queryKey: ["health"],
  queryFn: () => api.get<unknown>("/api/health"),
  retry: false,
  staleTime: 0,
});
