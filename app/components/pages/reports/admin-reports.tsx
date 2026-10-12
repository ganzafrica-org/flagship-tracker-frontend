

import { dummyReportsList } from "~/data/dummy-data";
import TableComponent from "~/components/table-component";
import { useMemo, useState } from "react";
import { PageTitleCard } from "~/components/page-title-card";
import { ContentTab } from "~/components/content-tab";
import ReportActionDialog, {
  type ReportDialogMode,
} from "~/components/pages/reports/report-action-dialog";
import { IconEye, IconMessageCircle, IconDownload } from "@tabler/icons-react";
import type { ReportDownloadRow } from "~/components/pages/reports/report-download-utils";

export default function AdminReports() {
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
      <PageTitleCard title="Manage The Reports" />
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
        rows={filteredRows}
        searchKeys={["name", "type", "period", "createdBy"]}
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
          { label: "View Report", icon: <IconEye size={14} />, onClick: () => openModal("view", row as ReportDownloadRow) },
          { label: "Give Feedback", icon: <IconMessageCircle size={14} />, onClick: () => openModal("feedback", row as ReportDownloadRow) },
          { label: "Download", icon: <IconDownload size={14} />, onClick: () => openModal("download", row as ReportDownloadRow) },
        ]}
      />
      <ReportActionDialog mode={modalType} report={selectedReport} onClose={closeModal} />
    </div>
  );
}
