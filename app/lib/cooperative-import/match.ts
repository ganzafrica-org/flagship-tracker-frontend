/** Fields that identify a cooperative-type record for the bulk upload. */
export interface CooperativeIdentity {
  cooperativeName?: string | null;
  groupType?: string | null;
  district?: string | null;
}

const norm = (t: string | null | undefined) => (t ?? "").trim().toLowerCase();

/**
 * True when two records are the same for the upload: same name, group type and district
 * (case-insensitive; a blank district only matches a blank district). Used to skip existing
 * records in an uploaded sheet and to stop a sheet draft from creating a record that now exists.
 */
export function isSameCooperative(a: CooperativeIdentity, b: CooperativeIdentity): boolean {
  return (
    norm(a.cooperativeName) !== "" &&
    norm(a.cooperativeName) === norm(b.cooperativeName) &&
    (a.groupType ?? "") === (b.groupType ?? "") &&
    norm(a.district) === norm(b.district)
  );
}
