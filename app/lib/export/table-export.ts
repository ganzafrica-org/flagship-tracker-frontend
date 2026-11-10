import { saveBlob } from "~/lib/import/template";

export type ExportFormat = "xlsx" | "pdf";

export interface ExportColumn {
  key: string;
  label: string;
}

/** One table of an exported document. */
export interface ExportSection {
  /** Heading above the table (and the sheet name in .xlsx); omit for a single-table document. */
  title?: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
  /** Per-column text overrides for cells whose display differs from the raw row value. */
  values?: Record<string, (row: Record<string, unknown>) => string>;
}

export interface ExportDocumentOptions {
  format: ExportFormat;
  /** Printed at the top of the file. */
  title: string;
  sections: ExportSection[];
  /** File name without extension; defaults to a slug of the title. */
  fileBase?: string;
}

export interface ExportTableOptions extends Omit<ExportSection, "title"> {
  format: ExportFormat;
  title: string;
  fileBase?: string;
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "export";
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function cellText(row: Record<string, unknown>, key: string, values?: ExportSection["values"]): string {
  const custom = values?.[key];
  if (custom) return custom(row);
  const raw = row[key];
  if (raw == null) return "";
  if (Array.isArray(raw)) return raw.map(String).join(", ");
  return String(raw);
}

/** Text of every cell; the "id" column is a 1-based row number, matching the on-screen tables. */
function toMatrix({ columns, rows, values }: ExportSection): string[][] {
  return rows.map((row, index) =>
    columns.map((c) => (c.key === "id" ? String(index + 1) : cellText(row, c.key, values))),
  );
}

function sheetName(wanted: string, used: Set<string>): string {
  const base = wanted.replace(/[\\/?*[\]:]/g, " ").trim().slice(0, 31) || "Export";
  let name = base;
  for (let n = 2; used.has(name.toLowerCase()); n += 1) name = `${base.slice(0, 28)} ${n}`;
  used.add(name.toLowerCase());
  return name;
}

async function buildXlsx({ title, sections }: ExportDocumentOptions): Promise<Blob> {
  const { default: excelJs } = await import("exceljs");
  const workbook = new excelJs.Workbook();
  const used = new Set<string>();

  for (const section of sections) {
    const sheet = workbook.addWorksheet(sheetName(section.title ?? title, used));
    const lastCol = Math.max(section.columns.length, 1);
    const matrix = toMatrix(section);

    sheet.addRow([section.title ? `${title} — ${section.title}` : title]).font = { bold: true, size: 14 };
    sheet.mergeCells(1, 1, 1, lastCol);
    sheet.addRow([`Exported on ${today()} · ${section.rows.length} row(s)`]).font = { italic: true, color: { argb: "FF6B7280" } };
    sheet.mergeCells(2, 1, 2, lastCol);
    sheet.addRow([]);

    const header = sheet.addRow(section.columns.map((c) => c.label));
    header.font = { bold: true };
    header.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
    });
    for (const line of matrix) sheet.addRow(line);

    section.columns.forEach((c, i) => {
      const longest = Math.max(c.label.length, ...matrix.slice(0, 200).map((r) => r[i].length));
      sheet.getColumn(i + 1).width = Math.min(Math.max(longest + 2, 8), 60);
    });
    sheet.views = [{ state: "frozen", ySplit: 4 }];
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

async function buildRecordPdf({ title, sections }: ExportDocumentOptions): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 40;
  const usable = pageW - margin * 2;
  const labelW = 148;
  const valueW = usable - labelW;
  const fontSize = 11;
  const lineH = 15;
  const pad = 7;
  const totalRows = sections.reduce((n, s) => n + s.rows.length, 0);

  const newPage = () => {
    doc.addPage();
    return margin;
  };

  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(31, 41, 55).text(title, margin, margin);
  doc.setDrawColor(16, 145, 200).setLineWidth(2).line(margin, margin + 8, margin + 168, margin + 8);
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(107, 114, 128)
    .text(`Exported on ${today()} · ${totalRows} record(s)`, margin, margin + 26);
  let y = margin + 44;

  for (const section of sections) {
    const matrix = toMatrix(section);
    if (section.title) {
      if (y + 36 > pageH - margin) y = newPage();
      doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(31, 41, 55).text(section.title, margin, y);
      y += 18;
    }
    if (matrix.length === 0) {
      doc.setFont("helvetica", "italic").setFontSize(11).setTextColor(107, 114, 128).text("No records.", margin, y);
      y += 22;
      continue;
    }

    matrix.forEach((cells, index) => {
      const heading = cells[0]?.trim() || `Record ${index + 1}`;
      if (y + 36 > pageH - margin) y = newPage();
      doc.setFont("helvetica", "bold").setFontSize(13).setTextColor(16, 145, 200).text(`${index + 1}. ${heading}`, margin, y);
      y += 12;

      section.columns.forEach((column, colIndex) => {
        const value = cells[colIndex]?.trim() ? cells[colIndex] : "—";
        doc.setFont("helvetica", "bold").setFontSize(fontSize);
        const labelLines = doc.splitTextToSize(column.label, labelW - pad * 2) as string[];
        doc.setFont("helvetica", "normal").setFontSize(fontSize);
        const valueLines = doc.splitTextToSize(value, valueW - pad * 2) as string[];
        const height = Math.max(labelLines.length, valueLines.length, 1) * lineH + pad * 2;
        if (y + height > pageH - margin) y = newPage();

        doc.setFillColor(colIndex % 2 === 0 ? 233 : 255, colIndex % 2 === 0 ? 241 : 255, colIndex % 2 === 0 ? 245 : 255);
        doc.rect(margin, y, usable, height, "F");
        doc.setDrawColor(209, 213, 219).rect(margin, y, usable, height);
        doc.line(margin + labelW, y, margin + labelW, y + height);
        doc.setFont("helvetica", "bold").setFontSize(fontSize).setTextColor(31, 41, 55)
          .text(labelLines, margin + pad, y + pad + lineH - 4);
        doc.setFont("helvetica", "normal").setTextColor(55, 65, 81)
          .text(valueLines, margin + labelW + pad, y + pad + lineH - 4);
        y += height;
      });
      y += 20;
    });
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p).setFont("helvetica", "normal").setFontSize(9).setTextColor(107, 114, 128)
      .text(`Page ${p} of ${pages}`, pageW - margin, pageH - 18, { align: "right" });
  }
  return doc.output("blob");
}

async function buildPdf({ title, sections }: ExportDocumentOptions): Promise<Blob> {
  if (sections.some((section) => section.columns.length > 6)) {
    return buildRecordPdf({ title, sections, format: "pdf" });
  }
  const { jsPDF } = await import("jspdf");
  const widest = Math.max(...sections.map((s) => s.columns.length), 1);
  const doc = new jsPDF({ orientation: widest > 5 ? "landscape" : "portrait", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const usable = pageW - margin * 2;
  const fontSize = 8;
  const lineH = 11;
  const pad = 4;
  const totalRows = sections.reduce((n, s) => n + s.rows.length, 0);

  doc.setFont("helvetica", "bold").setFontSize(14).text(title, margin, margin);
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(107, 114, 128)
    .text(`Exported on ${today()} · ${sections.length > 1 ? `${sections.length} sections` : `${totalRows} row(s)`}`, margin, margin + 14);
  doc.setTextColor(0, 0, 0);
  let y = margin + 32;

  for (const section of sections) {
    const matrix = toMatrix(section);
    // Column widths proportional to the longest text (clamped), scaled to the page width.
    const weights = section.columns.map((c, i) =>
      Math.min(Math.max(c.label.length, ...matrix.slice(0, 100).map((r) => r[i].length), 4), 40),
    );
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const widths = weights.map((w) => (w / totalWeight) * usable);
    const labels = section.columns.map((c) => c.label);

    const drawRow = (cells: string[], bold: boolean) => {
      doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(fontSize);
      const wrapped = cells.map((text, i) => doc.splitTextToSize(text, widths[i] - pad * 2) as string[]);
      const height = Math.max(...wrapped.map((w) => w.length), 1) * lineH + pad * 2;
      if (y + height > pageH - margin) {
        doc.addPage();
        y = margin;
        if (!bold) drawRow(labels, true);
      }
      if (bold) {
        doc.setFillColor(229, 231, 235).rect(margin, y, usable, height, "F");
        doc.setFont("helvetica", "bold").setFontSize(fontSize);
      }
      let x = margin;
      wrapped.forEach((lines, i) => {
        doc.text(lines, x + pad, y + pad + lineH - 3);
        x += widths[i];
      });
      doc.setDrawColor(209, 213, 219).line(margin, y + height, margin + usable, y + height);
      y += height;
    };

    if (section.title) {
      if (y + 60 > pageH - margin) {
        doc.addPage();
        y = margin;
      }
      y += 8;
      doc.setFont("helvetica", "bold").setFontSize(11).text(section.title, margin, y + 8);
      y += 16;
    }
    drawRow(labels, true);
    for (const line of matrix) drawRow(line, false);
    if (matrix.length === 0) {
      doc.setFont("helvetica", "italic").setFontSize(9).text("No records.", margin, y + 14);
      y += 22;
    }
    y += 6;
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p).setFont("helvetica", "normal").setFontSize(8).setTextColor(107, 114, 128)
      .text(`Page ${p} of ${pages}`, pageW - margin, pageH - 16, { align: "right" });
  }
  return doc.output("blob");
}

/** Turn one or more tables into a downloaded .xlsx (a sheet per section) or .pdf (sections stacked). */
export async function exportDocument(options: ExportDocumentOptions): Promise<void> {
  const blob = options.format === "xlsx" ? await buildXlsx(options) : await buildPdf(options);
  saveBlob(`${options.fileBase ?? slug(options.title)}-${today()}.${options.format}`, blob);
}

/** Turn any table (already filtered/searched, all pages) into a downloaded .xlsx or .pdf. */
export function exportTable({ format, title, fileBase, ...section }: ExportTableOptions): Promise<void> {
  return exportDocument({ format, title, fileBase, sections: [section] });
}
