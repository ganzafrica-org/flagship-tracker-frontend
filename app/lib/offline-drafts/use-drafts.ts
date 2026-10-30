import { useLiveQuery } from "dexie-react-hooks";

import { db, type DraftRecord } from "./db";

/** Live-updating list of local drafts for one entity type, newest first. */
export function useDrafts(entityType: DraftRecord["entityType"]) {
  return useLiveQuery(
    () => db.drafts.where("entityType").equals(entityType).reverse().sortBy("createdAt"),
    [entityType],
  );
}

/** Live-updating count of local drafts, optionally scoped to one entity type. */
export function useDraftCount(entityType?: DraftRecord["entityType"]) {
  return (
    useLiveQuery(
      () => (entityType ? db.drafts.where("entityType").equals(entityType).count() : db.drafts.count()),
      [entityType],
    ) ?? 0
  );
}
