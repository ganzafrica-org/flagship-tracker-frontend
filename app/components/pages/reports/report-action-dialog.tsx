

import { useEffect, useState } from "react";
import { Button, Card } from "@heroui/react";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import { ReportPDF } from "~/components/pdf-format/pdf-service";

import type { ReportDownloadRow } from "~/components/pages/reports/report-download-utils";
import { downloadReportCsv } from "~/components/pages/reports/report-download-utils";

export type ReportDialogMode = "view" | "feedback" | "download" | null;

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

  if (!mode || !report) return null;

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
      <div className={`w-full ${mode === "view" ? "max-w-4xl" : "max-w-lg"}`} onClick={(e) => e.stopPropagation()}>
      <Card className="overflow-hidden rounded-2xl border-none bg-white shadow-2xl dark:bg-(--field-background)">
        {mode === "view" ? (
          <div className="p-6">
            <div className="w-full h-[620px] overflow-hidden rounded-xl bg-white">
              <PDFViewer width="100%" height="100%" showToolbar={false}>
                <ReportPDF report={report} />
              </PDFViewer>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="outline" className="border-none bg-transparent shadow-none" onPress={onClose}>
                Cancel
              </Button>
              <PDFDownloadLink
                document={<ReportPDF report={report} />}
                fileName={`${report.name.replace(/[^\w-]+/g, "_")}.pdf`}
              >
                {({ loading }) => (
                  <Button
                    variant="primary"
                    className="bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent)]/90"
                  >
                    {loading ? "Preparing..." : "Download PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
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
              <PDFDownloadLink
                document={<ReportPDF report={report} />}
                fileName={`${report.name.replace(/[^\w-]+/g, "_")}.pdf`}
              >
                {({ loading }) => (
                  <Button
                    variant="primary"
                    className="w-full bg-[color:var(--accent)] text-white hover:bg-[color:var(--accent)]/90 sm:w-auto"
                  >
                    {loading ? "Preparing..." : "PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" className="border-none bg-transparent shadow-none" onPress={onClose}>
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
