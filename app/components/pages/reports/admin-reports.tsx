"use client";

import { dummyReportsList } from "~/data/dummy-data";
import TableComponent from "~/components/pages/table-component";

export default function AdminReports() {
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
    <TableComponent
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
  );
}
