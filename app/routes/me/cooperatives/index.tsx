import { useNavigate } from "react-router";

import { PageTitleCard } from "~/components/page-title-card";
import { cooperativeDummyData } from "~/data/dummy-cooperatives";
import TableComponent from "~/components/table-component";

export default function MeCooperativesPage() {
  const navigate = useNavigate();
  const rows = cooperativeDummyData.map((item) => ({
    id: item.id,
    cooperativeName: item.cooperativeName,
    cooperativeCode: item.cooperativeCode ?? "N/A",
    groupType: item.groupType,
    registrationStatus: item.registrationStatus ?? "N/A",
    primaryValueChain: item.primaryValueChain ?? "N/A",
    totalMembers: item.totalMembers ?? 0,
    district: item.district ?? "N/A",
  }));

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageTitleCard
        title="Cooperatives"
        actionLabel="Add Cooperative"
        onActionPress={() => navigate("/me/cooperatives/add-cooperative")}
      />

      <TableComponent
        tableSectionTitle="List of Cooperatives"
        rows={rows}
        searchKeys={["cooperativeName", "cooperativeCode", "groupType", "district"]}
        filterByTab={() => true}
        columns={[
          { key: "id", label: "#" },
          { key: "cooperativeName", label: "Cooperative Name" },
          { key: "cooperativeCode", label: "Code" },
          { key: "groupType", label: "Group Type" },
          { key: "registrationStatus", label: "Registration Status" },
          { key: "primaryValueChain", label: "Primary Value Chain" },
          { key: "totalMembers", label: "Total Members" },
          { key: "district", label: "District" },
          { key: "action", label: "Action" },
        ]}
        minTableWidthClassName="min-w-[1100px]"
        actions={(row) => [
          {
            label: "Update",
            onClick: () => navigate(`/me/cooperatives/add-cooperative?mode=update&id=${String(row.id)}`),
          },
        ]}
      />
    </div>
  );
}
