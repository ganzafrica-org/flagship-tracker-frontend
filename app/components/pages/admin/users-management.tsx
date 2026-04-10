"use client";

import { useState } from "react";
import { Button, Card } from "@heroui/react";

import { dummyUserTabs, dummyUsers } from "~/data/dummy-data";
import TableComponent from "~/components/table-component";
import { PageTitleCard } from "~/components/page-title-card";
import { flagshipDummyData } from "~/data/dummy-flagship-detail";
import { ContentTab } from "~/components/content-tab";

function UserManagementTable() {
  const [activeTab, setActiveTab] = useState<"all" | "active" | "planning" | "closed">("all");

  const filtered =
    activeTab === "all"
      ? flagshipDummyData
      : flagshipDummyData.filter((item) => item.status === activeTab);

  const rows = dummyUsers.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
  }));

  return (
    <div className="flex flex-col gap-5">
      <PageTitleCard title="User Management" actionLabel="Add A New User" />
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
        actions={() => [
          { label: "View Details", onClick: () => undefined },
          { label: "Update", onClick: () => undefined },
          { label: "Delete", onClick: () => undefined, color: "danger" },
        ]}
      />
    </div>
  );
}

function AddUserWizardCard() {
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <Card className="space-y-5 p-5">
      <h3 className="text-xl font-semibold text-(--foreground)">Add a New User</h3>

      <div className="rounded-xl border border-default-200 p-4">
        <div className="relative mb-4 flex max-w-xl items-center justify-between">
          <div className="absolute left-0 right-0 top-4 h-[2px] bg-default-200" />
          <div
            className={`absolute left-0 top-4 h-[2px] bg-primary transition-all ${step === 1 ? "w-[50%]" : "w-full"}`}
          />

          <button type="button" onClick={() => setStep(1)} className="relative z-10 flex flex-col items-center gap-1 text-xs">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border ${step >= 1 ? "border-primary bg-primary text-white" : "border-default-300 bg-white text-default-500"
                }`}
            >
              {step > 1 ? "✓" : "1"}
            </span>
            <span className={step === 1 ? "text-primary" : "text-default-500"}>Personal Details</span>
          </button>

          <button type="button" onClick={() => setStep(2)} className="relative z-10 flex flex-col items-center gap-1 text-xs">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border ${step >= 2 ? "border-primary bg-primary text-white" : "border-default-300 bg-white text-default-500"
                }`}
            >
              2
            </span>
            <span className={step === 2 ? "text-primary" : "text-default-500"}>Role Details</span>
          </button>
        </div>
      </div>

      {step === 1 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm text-default-700">First Name</label>
            <input type="text" placeholder="First name" className="w-full rounded-lg border border-default-300 px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-default-700">Last Name</label>
            <input type="text" placeholder="Last name" className="w-full rounded-lg border border-default-300 px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-default-700">Email</label>
            <input type="email" placeholder="Email" className="w-full rounded-lg border border-default-300 px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-default-700">Phone Number *</label>
            <div className="flex gap-2">
              <select className="w-16 rounded-lg border border-default-300 px-2 py-2 text-sm">
                <option value="+250">🇷🇼</option>
                <option value="+254">🇰🇪</option>
                <option value="+256">🇺🇬</option>
              </select>
              <input type="text" placeholder="Phone Number" className="w-full rounded-lg border border-default-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-default-700">Date of Birth *</label>
            <input type="date" className="w-full rounded-lg border border-default-300 px-3 py-2 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-default-700">Gender</label>
            <select className="w-full rounded-lg border border-default-300 px-3 py-2 text-sm">
              <option value="">Female</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm text-default-700">Role</label>
              <select className="w-full rounded-lg border border-default-300 px-3 py-2 text-sm">
                <option value="">Role</option>
                <option value="admin">Admin</option>
                <option value="me">M &amp; E</option>
                <option value="senior">Senior Official</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-default-700">Flagship to Manage</label>
              <input type="text" value="YEPA" readOnly className="w-full rounded-lg border border-default-300 bg-default-100 px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-default-700">Location</label>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <input type="text" placeholder="Province" className="rounded-lg border border-default-300 px-3 py-2 text-sm" />
              <input type="text" placeholder="District" className="rounded-lg border border-default-300 px-3 py-2 text-sm" />
              <input type="text" placeholder="Sector" className="rounded-lg border border-default-300 px-3 py-2 text-sm" />
              <input type="text" placeholder="Cell" className="rounded-lg border border-default-300 px-3 py-2 text-sm" />
              <input type="text" placeholder="Village" className="rounded-lg border border-default-300 px-3 py-2 text-sm" />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline">Save the Draft</Button>
        <Button variant="primary" onPress={() => setStep(step === 1 ? 2 : 1)}>
          {step === 1 ? "Continue" : "Submit"}
        </Button>
      </div>
    </Card>
  );
}

export default function UsersManagementPage() {
  const [view, setView] = useState("management");

  return (
    <div className="space-y-4">
        {/* <Button variant={view === "new-user" ? "primary" : "ghost"} onPress={() => setView("new-user")}>
          Add a New User
        </Button> */}
      {view === "management" ? <UserManagementTable /> : <AddUserWizardCard />}
    </div>
  );
}
