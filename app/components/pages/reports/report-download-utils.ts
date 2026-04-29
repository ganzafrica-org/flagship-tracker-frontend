export type ReportDownloadRow = {
  id: number;
  name: string;
  type: string;
  period: string;
  createdOn: string;
  createdBy: string;
  origin: string;
};

export function downloadBlob(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadReportPdf(filename: string, lines: string[]) {
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
}

export function downloadReportCsv(report: ReportDownloadRow) {
  const csv = [
    ["Report Name", "Report Type", "Period", "Created on", "Created by", "Origin"],
    [
      report.name,
      report.type,
      report.period,
      report.createdOn,
      report.createdBy,
      report.origin,
    ],
  ]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const safeName = report.name.replace(/[^\w-]+/g, "_");
  downloadBlob(`${safeName}.csv`, csv, "text/csv;charset=utf-8");
}

export function downloadReportAsPdf(report: ReportDownloadRow) {
  const safeName = report.name.replace(/[^\w-]+/g, "_");
  downloadReportPdf(`${safeName}.pdf`, [
    report.name,
    "",
    `Report type: ${report.type}`,
    `Reporting period: ${report.period}`,
    `Report name: ${report.name}`,
    `Created on: ${report.createdOn}`,
    `Created by: ${report.createdBy}`,
    `Origin: ${report.origin}`,
  ]);
}
