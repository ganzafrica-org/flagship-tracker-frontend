"use client";

import { useState } from "react";
import { useNavigate } from "react-router";

import { dummyUserTabs, dummyUsers } from "~/data/dummy-data";
import TableComponent from "~/components/table-component";
import { PageTitleCard } from "~/components/page-title-card";
import { ContentTab } from "~/components/content-tab";

function UserManagementTable() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"all" | "active" | "planning" | "closed">("all");
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

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard title="User Management" actionLabel="Add A New User" onActionPress={() => navigate("/admin/users/add-user")} />
      <ContentTab
        items={[
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "planning", label: "Planning" },
          { id: "in-active", label: "Inactive" }
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as "all" | "active" | "planning" | "closed")}
      />
      <TableComponent
        tableSectionTitle="Recent Users"
        tabs={dummyUserTabs}
        rows={rows}
        searchKeys={["fullName", "email", "role"]}
        filterByTab={(row, selectedTab) => {
          if (selectedTab === "all") return true;
          if (selectedTab === "active") return row.status === "Active";
          if (selectedTab === "planning") return row.status === "Pending";
          if (selectedTab === "inactive") return row.status === "Inactive";
          return true;
        }}
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
        statusColumnKey="status"
        statusColorMap={{
          Active: "success",
          Pending: "warning",
          Inactive: "default",
        }}
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
