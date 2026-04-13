"use client";

import { dummyReportsList } from "~/data/dummy-data";
import TableComponent from "~/components/table-component";
import { flagshipDummyData } from "~/data/dummy-flagship-detail";
import { useState } from "react";
import { PageTitleCard } from "~/components/page-title-card";
import { ContentTab } from "~/components/content-tab";
import { Button, Card } from "@heroui/react";

type ReportRow = {
  id: number;
  name: string;
  type: string;
  period: string;
  createdOn: string;
  createdBy: string;
  origin: string;
};

export default function AdminReports() {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "planning" | "closed">("all");
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null);
  const [modalType, setModalType] = useState<"view" | "feedback" | "download" | null>(null);
  const [feedbackTitle, setFeedbackTitle] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

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

  const openModal = (type: "view" | "feedback" | "download", row: ReportRow) => {
    setSelectedReport(row);
    setModalType(type);
    if (type === "feedback") {
      setFeedbackTitle("");
      setFeedbackMessage("");
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedReport(null);
  };

  const downloadBlob = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = (filename: string, lines: string[]) => {
    const escapePdfText = (value: string) =>
      value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    const contentLines = ["BT", "/F1 12 Tf", "50 790 Td"];
    lines.forEach((line, index) => {
      if (index > 0) contentLines.push("0 -18 Td");
      contentLines.push(`(${escapePdfText(line)}) Tj`);
    });
    contentLines.push("ET");
    const contentStream = contentLines.join("\n");

    const objects = [
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
      "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
      "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
      `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
    ];

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    for (const obj of objects) {
      offsets.push(pdf.length);
      pdf += obj;
    }
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    for (let i = 1; i < offsets.length; i += 1) {
      pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const blob = new Blob([new TextEncoder().encode(pdf)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleDownload = (format: "pdf" | "excel") => {
    if (!selectedReport) return;
    if (format === "excel") {
      const csv = [
        ["Report Name", "Report Type", "Period", "Created on", "Created by"],
        [selectedReport.name, selectedReport.type, selectedReport.period, selectedReport.createdOn, selectedReport.createdBy],
      ]
        .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      downloadBlob(`${selectedReport.name.replace(/[^\w-]+/g, "_")}.csv`, csv, "text/csv;charset=utf-8");
    } else {
      downloadPdf(`${selectedReport.name.replace(/[^\w-]+/g, "_")}.pdf`, [
        "Report Details",
        "",
        `Name: ${selectedReport.name}`,
        `Type: ${selectedReport.type}`,
        `Period: ${selectedReport.period}`,
        `Created on: ${selectedReport.createdOn}`,
        `Created by: ${selectedReport.createdBy}`,
      ]);
    }
    closeModal();
  };

  return (
    <div className="flex flex-col gap-5">
    <PageTitleCard title="Manage The Reports" actionLabel="Generate Report"/>
    <ContentTab
      items={[
        { id: "all", label: "All" },
        { id: "active", label: "Active" },
        { id: "planning", label: "Planning" },
        { id: "in-active", label: "Inactive" },
      ]}
      activeId={activeTab}
      onChange={(id) => setActiveTab(id as "all" | "active" | "planning" | "closed")}
    />
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
      actions={(row) => [
        { label: "View Details", onClick: () => openModal("view", row as ReportRow) },
        { label: "Give Feedback", onClick: () => openModal("feedback", row as ReportRow) },
        { label: "Download", onClick: () => openModal("download", row as ReportRow) },
      ]}
    />
    {modalType ? (
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
        <Card style={{ borderRadius: "8px" }} className="w-full max-w-xl space-y-4 rounded-lg p-5">
          {modalType === "view" && selectedReport ? (
            <>
              <h3 className="text-lg font-semibold text-(--foreground)">Report Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {selectedReport.name}</p>
                <p><span className="font-medium">Type:</span> {selectedReport.type}</p>
                <p><span className="font-medium">Period:</span> {selectedReport.period}</p>
                <p><span className="font-medium">Created on:</span> {selectedReport.createdOn}</p>
                <p><span className="font-medium">Created by:</span> {selectedReport.createdBy}</p>
              </div>
              <div className="flex justify-end">
                <Button variant="primary" onPress={closeModal}>Close</Button>
              </div>
            </>
          ) : null}

          {modalType === "feedback" && selectedReport ? (
            <>
              <h3 className="text-lg font-semibold text-(--foreground)">Give Feedback</h3>
              <p className="text-sm text-(--muted)">For: {selectedReport.name}</p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Feedback title"
                  value={feedbackTitle}
                  onChange={(e) => setFeedbackTitle(e.target.value)}
                  className="h-10 w-full rounded-lg border border-default-300 bg-white px-3 text-sm outline-none"
                />
                <textarea
                  placeholder="Feedback message"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-default-300 bg-white px-3 py-2 text-sm outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onPress={closeModal}>Cancel</Button>
                <Button
                  variant="primary"
                  isDisabled={!feedbackTitle.trim() || !feedbackMessage.trim()}
                  onPress={closeModal}
                >
                  Submit Feedback
                </Button>
              </div>
            </>
          ) : null}

          {modalType === "download" && selectedReport ? (
            <>
              <h3 className="text-lg font-semibold text-(--foreground)">Download Report</h3>
              <p className="text-sm text-(--muted)">Choose a format for: {selectedReport.name}</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onPress={closeModal}>Cancel</Button>
                <Button variant="outline" onPress={() => handleDownload("excel")}>Excel</Button>
                <Button variant="primary" onPress={() => handleDownload("pdf")}>PDF</Button>
              </div>
            </>
          ) : null}
        </Card>
      </div>
    ) : null}
    </div >
  );
}
