

import { useMemo, useState } from "react";
import { useNavigate } from "react-router";

import { dummyUsers } from "~/data/dummy-data";
import TableComponent from "~/components/table-component";
import { PageTitleCard } from "~/components/page-title-card";
import { ContentTab } from "~/components/content-tab";

function UserManagementTable() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"all" | "active" | "planning" | "inactive">("all");
  const [rows, setRows] = useState(
    dummyUsers.map((user) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
    }))
  );
  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        if (activeTab === "all") return true;
        if (activeTab === "active") return row.status === "Active";
        if (activeTab === "planning") return row.status === "Pending";
        return row.status === "Inactive";
      }),
    [activeTab, rows]
  );

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard title="User Management" actionLabel="Add A New User" onActionPress={() => navigate("/admin/users/add-user")} />
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
        tableSectionTitle="Recent Users"
        rows={filteredRows}
        searchKeys={["fullName", "email", "role"]}
        columns={[
          { key: "id", label: "#" },
          { key: "fullName", label: "Full Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "role", label: "Role" },
          { key: "status", label: "Status" },
          { key: "action", label: "Action" },
        ]}
        minTableWidthClassName="min-w-[940px]"
        filterByTab={() => true}
        actions={(row) => [
          {
            label: "View Details",
            onClick: () =>
              navigate(`/admin/users/add-user?editId=${encodeURIComponent(String(row.id))}&mode=view`),
          },
          {
            label: "Edit",
            onClick: () => navigate(`/admin/users/add-user?editId=${encodeURIComponent(String(row.id))}`),
          },
          {
            label: "Delete",
            onClick: () =>
              setRows((prev) => prev.filter((item) => String(item.id) !== String(row.id))),
            color: "danger",
          },
        ]}
      />
    </div>
  );
}

export default function UsersManagementPage() {
  return <UserManagementTable />;
}
