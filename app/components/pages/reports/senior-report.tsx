"use client";

import { dummyReportsList } from "~/data/dummy-data";
import TableComponent from "~/components/table-component";
import { ContentTab } from "~/components/content-tab";
import { flagshipDummyData } from "~/data/dummy-flagship-detail";
import { IconHomeFilled } from "@tabler/icons-react";
import { useState } from "react";
import { PageTitleCard } from "~/components/page-title-card";


export default function SeniorReports() {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "planning" | "closed">("all");

  const filtered =
    activeTab === "all"
      ? flagshipDummyData
      : flagshipDummyData.filter((item) => item.status === activeTab);

  const rows = dummyReportsList.map((report) => ({
    id: report.id,
    name: report.name,
    type: report.type,
    period: report.period,
    createdOn: report.createdOn,
    createdBy: report.createdBy,
    origin: report.origin,
  }));

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard title="Reports List" />
      <ContentTab
        items={[
          { id: "all", label: "All" },
          { id: "auto-generated", label: "Auto-Generated" },
          { id: "created-reports", label: "Created Reports" },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as "all" | "active" | "planning" | "closed")}
      />
      <TableComponent
        tableSectionTitle="List of Reports"
        rows={rows}
        searchKeys={["name", "type"]}
        filterByTab={(row, selectedTab) => selectedTab === "all" || String(row.origin) === selectedTab}
        columns={[
          { key: "id", label: "#" },
          { key: "name", label: "Report Name" },
          { key: "type", label: "Report Type" },
          { key: "period", label: "Period" },
          { key: "createdOn", label: "Created on" },
          { key: "createdBy", label: "Created by" },
          { key: "action", label: "Action" },
        ]}
        minTableWidthClassName="min-w-[960px]"
        actions={() => [
          { label: "View Details", onClick: () => undefined },
          { label: "Give Feedback", onClick: () => undefined },
          { label: "Download", onClick: () => undefined },
        ]}
      />
    </div>
  );
}
