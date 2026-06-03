import { useCallback } from "react";
import { useSearchParams } from "react-router";

/**
 * A useState-like hook backed by a URL search param, so filter state is shareable
 * via the page URL. Empty/default values are removed from the URL to keep it clean.
 *
 * @param key       the search-param name
 * @param defaultValue value treated as "unset" (omitted from the URL)
 */
export function useUrlState(
  key: string,
  defaultValue = "",
): [string, (value: string) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) ?? defaultValue;

  const setValue = useCallback(
    (next: string) => {
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (!next || next === defaultValue) {
            updated.delete(key);
          } else {
            updated.set(key, next);
          }
          return updated;
        },
        { replace: true },
      );
    },
    [key, defaultValue, setParams],
  );

  return [value, setValue];
}
