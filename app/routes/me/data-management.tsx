import { PageTitleCard } from "~/components/page-title-card";

export function meta() {
  return [{ title: "Data Management | M&E" }];
}

export default function MeDataManagement() {
  return (
    <div className="space-y-6 w-full min-w-0">
      <PageTitleCard
        title="Data Management"
        actionLabel="Import Data"
        onActionPress={() => {
          // TODO: wire to add-data flow/modal when available.
        }}
      />
    </div>
  );
}
