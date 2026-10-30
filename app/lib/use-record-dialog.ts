import { useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

const PARAM = "view";

/**
 * The record open in a details dialog, kept in the URL as `?view=<id>` so the dialog
 * can be linked to and survives a refresh.
 *
 * Opening pushes a history entry, so the browser Back button closes the dialog. Closing
 * goes back when this page pushed that entry, and otherwise (opened by a link or a
 * refresh landing) just drops the param, so Close never leaves the page.
 */
export function useRecordDialog() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const raw = Number(params.get(PARAM));
  const id = Number.isInteger(raw) && raw > 0 ? raw : null;
  const openedHere = (location.state as { recordDialog?: boolean } | null)?.recordDialog === true;

  const open = useCallback(
    (recordId: number | string) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(PARAM, String(recordId));
          return next;
        },
        { state: { recordDialog: true } },
      );
    },
    [setParams],
  );

  const close = useCallback(() => {
    if (openedHere) {
      navigate(-1);
      return;
    }
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete(PARAM);
        return next;
      },
      { replace: true },
    );
  }, [openedHere, navigate, setParams]);

  return { id, open, close };
}
