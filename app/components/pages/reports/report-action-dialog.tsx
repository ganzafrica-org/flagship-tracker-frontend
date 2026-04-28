

import { useEffect, useState } from "react";
import { Button, Card } from "@heroui/react";
import { PDFViewer } from "@react-pdf/renderer";
import { ReportPDF } from "~/components/pdf-format/pdf-service";

import type { ReportDownloadRow } from "~/components/pages/reports/report-download-utils";
import { downloadReportAsPdf, downloadReportCsv } from "~/components/pages/reports/report-download-utils";

export type ReportDialogMode = "view" | "feedback" | "download" | "generate" | null;

const EMOJI_RATINGS = [
  { value: 1, emoji: "😞", label: "Poor" },
  { value: 2, emoji: "😐", label: "Fair" },
  { value: 3, emoji: "👌", label: "Good" },
  { value: 4, emoji: "👍", label: "Great" },
  { value: 5, emoji: "🔥", label: "Excellent" },
] as const;

interface ReportActionDialogProps {
  mode: ReportDialogMode;
  report: ReportDownloadRow | null;
  onClose: () => void;
}

export default function ReportActionDialog({ mode, report, onClose }: ReportActionDialogProps) {
  const [rating, setRating] = useState<number>(3);
  const [comment, setComment] = useState("");
  const [contactConsent, setContactConsent] = useState(true);
  const [betaConsent, setBetaConsent] = useState(false);

  useEffect(() => {
    if (mode === "feedback" && report) {
      setRating(3);
      setComment("");
      setContactConsent(true);
      setBetaConsent(false);
    }
  }, [mode, report?.id, report]);

  if (!mode || (!report && mode !== "generate")) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleFeedbackSubmit = () => {
    if (!comment.trim()) return;
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div className={`w-full ${mode === "generate" ? "max-w-4xl" : "max-w-lg"}`} onClick={(e) => e.stopPropagation()}>
      <Card className="overflow-hidden rounded-xl border border-default-200 bg-white shadow-xl dark:border-default-100 dark:bg-(--field-background)">
        {mode === "generate" ? (
          <div className="p-6">
            <h2 className="text-xl font-bold text-(--foreground) mb-4">Generated Report Preview</h2>
            <div className="w-full h-[600px] border border-default-200 rounded-lg overflow-hidden">
              <PDFViewer width="100%" height="100%">
                <ReportPDF />
              </PDFViewer>
            </div>
            <div className="mt-6 flex justify-end">
              <Button variant="primary" onPress={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : null}

        {mode === "view" && report ? (
          <div className="p-6">
            <h2 className="text-xl font-bold text-(--foreground)">Report details</h2>
            <p className="mt-1 text-sm text-(--muted) line-clamp-2">{report.name}</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex flex-col gap-0.5 border-b border-default-200 pb-3 dark:border-default-100">
                <dt className="font-semibold text-(--foreground)">Report name</dt>
                <dd className="text-(--muted)">{report.name}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="font-semibold text-(--foreground)">Report type</dt>
                  <dd className="text-(--muted)">{report.type}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-(--foreground)">Period</dt>
                  <dd className="text-(--muted)">{report.period}</dd>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="font-semibold text-(--foreground)">Created on</dt>
                  <dd className="text-(--muted)">{report.createdOn}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-(--foreground)">Created by</dt>
                  <dd className="text-(--muted)">{report.createdBy}</dd>
                </div>
              </div>
              <div>
                <dt className="font-semibold text-(--foreground)">Origin</dt>
                <dd className="text-(--muted)">{report.origin}</dd>
              </div>
            </dl>
            <div className="mt-6 flex justify-end">
              <Button variant="primary" onPress={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : null}

        {mode === "feedback" && report ? (
          <div className="p-6">
            <h2 className="text-xl font-bold text-(--foreground)">Help us improve!</h2>
            <p className="mt-2 text-sm text-(--muted)">
              How would you describe your experience with{" "}
              <span className="font-semibold text-(--foreground)">Flagship Tracker</span> when using
              this report?
            </p>
            <p className="mt-1 text-xs text-(--muted) line-clamp-2">Report: {report.name}</p>

            <div className="mt-5 flex flex-wrap justify-center gap-2 sm:justify-start">
              {EMOJI_RATINGS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-label={item.label}
                  title={item.label}
                  onClick={() => setRating(item.value)}
                  className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 text-2xl transition-colors ${
                    rating === item.value
                      ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10"
                      : "border-default-200 bg-default-50 hover:bg-default-100 dark:border-default-100"
                  }`}
                >
                  {item.emoji}
                </button>
              ))}
            </div>

            <label className="mt-6 block text-sm font-medium text-(--foreground)">
              What&apos;s your overall experience?
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Please share your thoughts..."
              rows={4}
              className="mt-2 w-full rounded-lg border border-default-300 bg-white px-3 py-2 text-sm text-(--foreground) outline-none ring-(--accent) focus:border-[color:var(--accent)] focus:ring-2 dark:bg-(--surface)"
            />

            <div className="mt-4 space-y-3">
              <label className="flex cursor-pointer items-start gap-2 text-sm text-(--foreground)">
                <input
                  type="checkbox"
                  checked={contactConsent}
                  onChange={(e) => setContactConsent(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 rounded border-default-300 accent-[color:var(--accent)]"
                />
                <span>
                  I may be contacted about this feedback.{" "}
                  <a
                    href="#"
                    className="font-medium text-[color:var(--accent)] underline"
                    onClick={(e) => e.preventDefault()}
                  >
                    Read Privacy Policy
                  </a>
                  .
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2 text-sm text-(--foreground)">
                <input
                  type="checkbox"
                  checked={betaConsent}
                  onChange={(e) => setBetaConsent(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 rounded border-default-300 accent-[color:var(--accent)]"
                />
                <span>I&apos;d like to join Flagship Tracker early feedback.</span>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="outline" onPress={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                isDisabled={!comment.trim()}
                onPress={handleFeedbackSubmit}
              >
                Submit
              </Button>
            </div>
          </div>
        ) : null}

        {mode === "download" && report ? (
          <div className="p-6">
            <h2 className="text-xl font-bold text-(--foreground)">Download report data</h2>
            <p className="mt-2 text-sm text-(--muted)">
              Export <span className="font-medium text-(--foreground)">{report.name}</span> for
              offline use. Choose a format below.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onPress={() => {
                  downloadReportCsv(report);
                  onClose();
                }}
              >
                Excel (CSV)
              </Button>
              <Button
                variant="primary"
                className="w-full sm:w-auto"
                onPress={() => {
                  downloadReportAsPdf(report);
                  onClose();
                }}
              >
                PDF
              </Button>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onPress={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        ) : null}
      </Card>
      </div>
    </div>
  );
}
