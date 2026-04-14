

import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Button, Card } from "@heroui/react";

import Input from "~/components/input";
import { PageTitleCard } from "~/components/page-title-card";
import { RwandaLocationSelector, type RwandaLocationValue } from "~/components/rwanda-location-selector";
import { dummyDataManagementRows, type DataManagementRow } from "~/data/dummy-data";
import { getDataManagementRowById, nextDataManagementRowId, prependDataManagementRow, upsertDataManagementRow } from "~/lib/data-management-storage";

function formatCurrencyUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateDisplayFromIso(isoDate: string): string {
  const parts = isoDate.split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  if (!y || !m || !d) return isoDate;
  const dd = String(d).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const yy = String(y).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

const DEFAULT_LOCATION_VALUE: RwandaLocationValue = {
  province: "",
  district: "",
  sector: "",
  cell: "",
  village: "",
};

export default function DataManagementAddFlagshipDataPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const [acreage, setAcreage] = useState("");
  const [howManyJob, setHowManyJob] = useState("");
  const [totalJobs, setTotalJobs] = useState("");
  const [youthsEngaged, setYouthsEngaged] = useState("");
  const [totalInvestment, setTotalInvestment] = useState("");
  const [quantitiesProduced, setQuantitiesProduced] = useState("");
  const [monthlyNetIncomePerYouth, setMonthlyNetIncomePerYouth] = useState("");
  const [revenueGenerated, setRevenueGenerated] = useState("");
  const [location, setLocation] = useState<RwandaLocationValue>(DEFAULT_LOCATION_VALUE);
  const [existingRow, setExistingRow] = useState<DataManagementRow | null>(null);

  const editId = Number(searchParams.get("editId") ?? "");
  const mode = searchParams.get("mode");
  const isViewMode = mode === "view";
  const isEditMode = Number.isFinite(editId);

  useEffect(() => {
    if (!isEditMode) return;
    const row = getDataManagementRowById(editId, dummyDataManagementRows);
    if (!row) return;

    setExistingRow(row);
    setAcreage(String(row.acreage ?? ""));
    setHowManyJob(String(row.howManyJob ?? row.jobsCreated ?? ""));
    setTotalJobs(String(row.totalJobs ?? row.jobsCreated ?? ""));
    setYouthsEngaged(String(row.youthsEngaged ?? ""));
    setTotalInvestment(String(row.totalInvestment ?? "").replace(/[^0-9.-]/g, ""));
    setQuantitiesProduced(String(row.quantitiesProduced ?? ""));
    setMonthlyNetIncomePerYouth(String(row.monthlyNetIncomePerYouth ?? ""));
    setRevenueGenerated(String(row.revenueGenerated ?? "").replace(/[^0-9.-]/g, ""));
    setLocation({
      province: String(row.province ?? ""),
      district: String(row.district ?? ""),
      sector: String(row.sector ?? ""),
      cell: String(row.cell ?? ""),
      village: String(row.village ?? ""),
    });
  }, [editId, isEditMode]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const inv = Number(String(totalInvestment).replace(/[^0-9.-]/g, "")) || 0;
    const jobs = Number(totalJobs || howManyJob) || 0;
    const rev = Number(String(revenueGenerated).replace(/[^0-9.-]/g, "")) || 0;
    const createdOnIso = new Date().toISOString().slice(0, 10);

    const row: DataManagementRow = {
      id: isEditMode ? editId : nextDataManagementRowId(dummyDataManagementRows),
      totalInvestment: formatCurrencyUsd(inv),
      jobsCreated: jobs,
      revenueGenerated: formatCurrencyUsd(rev),
      createdOn: existingRow?.createdOn ?? formatDateDisplayFromIso(createdOnIso),
      createdBy: existingRow?.createdBy ?? "M&E Officer",
      acreage,
      howManyJob,
      totalJobs,
      youthsEngaged,
      quantitiesProduced,
      monthlyNetIncomePerYouth,
      province: location.province,
      district: location.district,
      sector: location.sector,
      cell: location.cell,
      village: location.village,
    };

    if (isEditMode) {
      upsertDataManagementRow(row);
    } else {
      prependDataManagementRow(row);
    }
    navigate("/me/data-management");
  };

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      <PageTitleCard title="Data Management" actionLabel="Import Data" onActionPress={() => undefined} />
      <Card className="p-5 space-y-4 rounded-lg">
        <h2 className="text-[20px] leading-tight font-semibold text-(--foreground)">
          {isViewMode ? "View Data" : isEditMode ? "Edit Data" : "Add Data"}
        </h2>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-10">
            <Input
              variant="form"
              containerClassName="sm:col-span-5"
              label="Acreage"
              type="number"
              min={0}
              step={1}
              placeholder="0"
              value={acreage}
              onChange={(e) => setAcreage(e.target.value)}
              disabled={isViewMode}
              required
            />
            <Input
              variant="form"
              containerClassName="sm:col-span-3"
              label="How many job"
              type="number"
              min={0}
              step={1}
              placeholder="0"
              value={howManyJob}
              onChange={(e) => setHowManyJob(e.target.value)}
              disabled={isViewMode}
              required
            />
            <Input
              variant="form"
              containerClassName="sm:col-span-2"
              label="0 Total jobs"
              type="number"
              min={0}
              step={1}
              placeholder="0"
              value={totalJobs}
              onChange={(e) => setTotalJobs(e.target.value)}
              disabled={isViewMode}
            />
            <Input
              variant="form"
              containerClassName="sm:col-span-5"
              label="Number of youths Engaged"
              type="number"
              min={0}
              step={1}
              placeholder="0"
              value={youthsEngaged}
              onChange={(e) => setYouthsEngaged(e.target.value)}
              disabled={isViewMode}
              required
            />
            <Input
              variant="form"
              containerClassName="sm:col-span-5"
              label="Total Investment"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={totalInvestment}
              onChange={(e) => setTotalInvestment(e.target.value)}
              disabled={isViewMode}
              required
            />
            <Input
              variant="form"
              containerClassName="sm:col-span-3"
              label="Quantities produced"
              type="number"
              min={0}
              step={1}
              placeholder="0"
              value={quantitiesProduced}
              onChange={(e) => setQuantitiesProduced(e.target.value)}
              disabled={isViewMode}
            />
            <Input
              variant="form"
              containerClassName="sm:col-span-4"
              label="Monthly Net Income per Youth"
              type="number"
              min={0}
              step={1}
              placeholder="0"
              value={monthlyNetIncomePerYouth}
              onChange={(e) => setMonthlyNetIncomePerYouth(e.target.value)}
              disabled={isViewMode}
            />
            <Input
              variant="form"
              containerClassName="sm:col-span-3"
              label="Revenue"
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={revenueGenerated}
              onChange={(e) => setRevenueGenerated(e.target.value)}
              disabled={isViewMode}
              required
            />
            <div className="sm:col-span-10">
              <label className="mb-1 block text-[15px] font-medium text-(--foreground)">Location</label>
            </div>
            <div className="sm:col-span-10">
              <RwandaLocationSelector value={location} onChange={setLocation} disabled={isViewMode} />
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="h-10 !rounded-lg px-8 font-medium"
              onPress={() => navigate("/me/data-management")}
            >
              {isViewMode ? "Back" : "Save the Draft"}
            </Button>
            {!isViewMode ? (
              <Button
                type="button"
                variant="primary"
                className="h-10 !rounded-lg px-10 font-medium"
                onPress={() => formRef.current?.requestSubmit()}
              >
                Submit
              </Button>
            ) : null}
          </div>
        </form>
      </Card>
    </div>
  );
}
