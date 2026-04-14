

import { dummyReportsList } from "~/data/dummy-data";
import TableComponent from "~/components/table-component";
import { useMemo, useState } from "react";
import { PageTitleCard } from "~/components/page-title-card";
import { ContentTab } from "~/components/content-tab";
import ReportActionDialog, {
  type ReportDialogMode,
} from "~/components/pages/reports/report-action-dialog";
import type { ReportDownloadRow } from "~/components/pages/reports/report-download-utils";

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "planning" | "inactive">("all");
  const [selectedReport, setSelectedReport] = useState<ReportDownloadRow | null>(null);
  const [modalType, setModalType] = useState<ReportDialogMode>(null);

  const rows = useMemo(
    () =>
      dummyReportsList.map((report) => ({
        id: report.id,
        name: report.name,
        type: report.type,
        period: report.period,
        createdOn: report.createdOn,
        createdBy: report.createdBy,
        origin: report.origin,
      })),
    []
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (activeTab === "all") return true;
        if (activeTab === "active") return row.origin === "Auto-Generated";
        if (activeTab === "planning") return row.origin === "Created Reports";
        return false;
      }),
    [activeTab, rows]
  );

  const openModal = (type: Exclude<ReportDialogMode, null>, row: ReportDownloadRow) => {
    setSelectedReport(row);
    setModalType(type);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedReport(null);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard title="Manage The Reports" actionLabel="Generate Report" />
      <ContentTab
        items={[
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "planning", label: "Planning" },
          { id: "inactive", label: "Inactive" },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as "all" | "active" | "planning" | "inactive")}
      />
      <TableComponent
        rows={filteredRows}
        searchKeys={["name", "type"]}
        filterByTab={() => true}
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
        actions={(row) => [
          { label: "View Details", onClick: () => openModal("view", row as ReportDownloadRow) },
          { label: "Give Feedback", onClick: () => openModal("feedback", row as ReportDownloadRow) },
          { label: "Download", onClick: () => openModal("download", row as ReportDownloadRow) },
        ]}
      />
      <ReportActionDialog mode={modalType} report={selectedReport} onClose={closeModal} />
    </div>
  );
}
