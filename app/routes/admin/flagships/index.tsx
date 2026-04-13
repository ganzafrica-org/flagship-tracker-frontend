import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { IconHomeFilled, IconLayoutGrid, IconTable } from "@tabler/icons-react";
import { Button } from "@heroui/react";

import type { Route } from "./+types/index";
import FlagshipsList, {
  type FlagshipCardItem,
} from "~/components/pages/flagships/flagships-list";
import { ContentTab } from "~/components/content-tab";
import { PageTitleCard } from "~/components/page-title-card";
import TableComponent from "~/components/table-component";
import { flagshipDummyData } from "~/data/dummy-flagship-detail";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Flagships | Admin" }];
}

export default function AdminFlagships() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"all" | "active" | "planning" | "closed">("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const filteredFlagships = useMemo(
    () => flagshipDummyData.filter((item) => activeTab === "all" || item.status === activeTab),
    [activeTab]
  );
  const flagshipCards: FlagshipCardItem[] = useMemo(
    () =>
      filteredFlagships.map((item) => ({
          ...item,
          icon: <IconHomeFilled size={18} />,
        })),
    [filteredFlagships]
  );
  const flagshipRows = useMemo(
    () =>
      filteredFlagships.map((item) => ({
        id: item.id,
        projectName: item.title,
        totalInvestment: item.totalInvestment,
        jobsCreated: item.jobsCreated,
        revenueGenerated: item.totalInvestment,
        geographicCoverage: item.location,
      })),
    [filteredFlagships]
  );

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageTitleCard
        title="Flagship Projects Management"
        actionLabel="Add a Flagship"
        onActionPress={() => navigate("/admin/flagships/add-flagship")}
      />
      <ContentTab
        items={[
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "planning", label: "Planning" },
          { id: "closed", label: "Closed" },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as "all" | "active" | "planning" | "closed")}
        endSlot={
          <Button
            isIconOnly
            variant={viewMode === "table" ? "primary" : "outline"}
            aria-label={viewMode === "table" ? "Switch to card view" : "Switch to table view"}
            onPress={() => setViewMode((prev) => (prev === "cards" ? "table" : "cards"))}
          >
            {viewMode === "table" ? <IconLayoutGrid size={18} /> : <IconTable size={18} />}
          </Button>
        }
      />
      {viewMode === "cards" ? (
        <FlagshipsList
          items={flagshipCards}
          className="w-full"
          onViewMore={(item) => navigate(`/admin/flagships/${item.id}`)}
        />
      ) : (
        <TableComponent
          tableSectionTitle="List of Flagships"
          tableAriaLabel="Admin flagships table"
          rows={flagshipRows}
          searchKeys={["projectName", "geographicCoverage"]}
          columns={[
            { key: "id", label: "#" },
            { key: "projectName", label: "Project Name" },
            { key: "totalInvestment", label: "Total Investment" },
            { key: "jobsCreated", label: "Jobs Created" },
            { key: "revenueGenerated", label: "Revenue Generated" },
            { key: "geographicCoverage", label: "Geographic Coverage" },
            { key: "action", label: "Action" },
          ]}
          minTableWidthClassName="min-w-[1050px]"
          filterByTab={() => true}
          actions={(row) => [
            { label: "View Details", onClick: () => navigate(`/admin/flagships/${row.id}`) },
            { label: "Update", onClick: () => undefined },
            { label: "Delete", onClick: () => undefined, color: "danger" },
          ]}
        />
      )}
    </div>
  );
}
