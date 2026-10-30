import { redirect } from "react-router";

/**
 * Single-record view pages (`…?editId=N&mode=view`) became dialogs on their list page.
 * Call this from the old route's clientLoader so existing links and bookmarks land on the
 * list with that record's dialog open (`?view=N`). Returns null when the URL is not a view link.
 *
 * `always` treats any `editId` as a view link (for roles that cannot edit). `keep` carries
 * the named query params across, e.g. the cooperative `type`.
 */
export function redirectLegacyView(
  request: Request,
  listPath: string,
  options: { always?: boolean; keep?: string[] } = {},
) {
  const url = new URL(request.url);
  const id = url.searchParams.get("editId");
  if (!id || (!options.always && url.searchParams.get("mode") !== "view")) return null;

  const query = new URLSearchParams();
  for (const key of options.keep ?? []) {
    const value = url.searchParams.get(key);
    if (value) query.set(key, value);
  }
  query.set("view", id);
  return redirect(`${listPath}?${query.toString()}`);
}
