

import { dummyReportsList } from "~/data/dummy-data";
import TableComponent from "~/components/table-component";
import { ContentTab } from "~/components/content-tab";
import { useMemo, useState } from "react";
import { PageTitleCard } from "~/components/page-title-card";
import ReportActionDialog, {
  type ReportDialogMode,
} from "~/components/pages/reports/report-action-dialog";
import type { ReportDownloadRow } from "~/components/pages/reports/report-download-utils";


export default function SeniorReports() {
  const [activeTab, setActiveTab] = useState<"all" | "auto-generated" | "created-reports">("all");
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

  const filteredRows = useMemo(() => {
    if (activeTab === "all") return rows;
    if (activeTab === "auto-generated") return rows.filter((r) => r.origin === "Auto-Generated");
    return rows.filter((r) => r.origin === "Created Reports");
  }, [activeTab, rows]);

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
      <PageTitleCard title="Reports List" />
      <ContentTab
        items={[
          { id: "all", label: "All" },
          { id: "auto-generated", label: "Auto-Generated" },
          { id: "created-reports", label: "Created Reports" },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as "all" | "auto-generated" | "created-reports")}
      />
      <TableComponent
        tableSectionTitle="List of Reports"
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
          { label: "View Report", onClick: () => openModal("view", row as ReportDownloadRow) },
          { label: "Give Feedback", onClick: () => openModal("feedback", row as ReportDownloadRow) },
          { label: "Download", onClick: () => openModal("download", row as ReportDownloadRow) },
        ]}
      />
      <ReportActionDialog mode={modalType} report={selectedReport} onClose={closeModal} />
    </div>
  );
}
