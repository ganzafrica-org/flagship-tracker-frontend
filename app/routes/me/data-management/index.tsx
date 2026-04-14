

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import TableComponent from "~/components/table-component";
import { PageTitleCard } from "~/components/page-title-card";
import { dummyDataManagementRows, type DataManagementRow } from "~/data/dummy-data";
import { mergeDataManagementRows } from "~/lib/data-management-storage";

export default function DataManagementPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [rows, setRows] = useState<DataManagementRow[]>(dummyDataManagementRows);

  useEffect(() => {
    setRows(mergeDataManagementRows(dummyDataManagementRows));
  }, [location.key]);

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      <PageTitleCard title="Data Management" actionLabel="Add Data" onActionPress={() => navigate("/me/data-management/add-flagship-data")} />
      <TableComponent
        tableSectionTitle="Preview New Data"
        rows={rows}
        searchKeys={["totalInvestment", "jobsCreated", "revenueGenerated", "createdOn", "createdBy", "id"]}
        filterByTab={() => true}
        columns={[
          { key: "id", label: "#" },
          { key: "totalInvestment", label: "Total Investment" },
          { key: "jobsCreated", label: "Jobs Created" },
          { key: "revenueGenerated", label: "Revenue Generated" },
          { key: "createdOn", label: "Created on" },
          { key: "createdBy", label: "Created by" },
          { key: "action", label: "Action" },
        ]}
        minTableWidthClassName="min-w-[960px]"
        actions={(row) => [
          { label: "View Details", onClick: () => navigate(`/me/data-management/add-flagship-data?editId=${encodeURIComponent(String(row.id))}&mode=view`) },
          { label: "Edit", onClick: () => navigate(`/me/data-management/add-flagship-data?editId=${encodeURIComponent(String(row.id))}`) },
          { label: "Delete", onClick: () => undefined, color: "danger" },
        ]}
      />
    </div>
  );
}
