import { useState } from "react";
import { Button, Card } from "@heroui/react";
import { useNavigate, useSearchParams } from "react-router";

import { PageTitleCard } from "~/components/page-title-card";
import Input from "~/components/input";
import { RwandaLocationSelector, type RwandaLocationValue } from "~/components/rwanda-location-selector";
import { flagshipDummyData } from "~/data/dummy-flagship-detail";
import { dummyUsers } from "~/data/dummy-data";

export function meta() {
  return [{ title: "Add User | Admin" }];
}

export default function AdminAddUserPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = Number(searchParams.get("editId") ?? "");
  const isEditMode = Number.isFinite(editId);
  const mode = searchParams.get("mode");
  const isViewMode = mode === "view";
  const existingUser = isEditMode ? dummyUsers.find((user) => Number(user.id) === editId) : undefined;
  const userNames = (existingUser?.fullName ?? "").trim().split(/\s+/);

  const [firstName, setFirstName] = useState(userNames[0] ?? "");
  const [lastName, setLastName] = useState(userNames.slice(1).join(" "));
  const [email, setEmail] = useState(existingUser?.email ?? "");
  const [phone, setPhone] = useState(existingUser?.phone ?? "");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [role, setRole] = useState(
    existingUser?.role === "Admin" ? "admin" : existingUser?.role === "M & E" ? "me" : ""
  );
  const [selectedFlagshipId, setSelectedFlagshipId] = useState("");
  const [location, setLocation] = useState<RwandaLocationValue>({
    province: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
  });

  return (
    <div className="space-y-6">
      <PageTitleCard title="Add a New User" />

      <Card className="space-y-5 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="First Name" placeholder="First name" variant="form" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isViewMode} />
          <Input label="Last Name" placeholder="Last name" variant="form" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isViewMode} />
          <Input label="Email" type="email" placeholder="Email" variant="form" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isViewMode} />
          <Input label="Phone Number *" placeholder="Phone Number" variant="form" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isViewMode} />
          <Input label="Date of Birth *" type="date" variant="form" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} disabled={isViewMode} />

          <div className="space-y-1">
            <label className="mb-1 block text-[15px] font-medium text-(--foreground)">Gender</label>
            <select className="h-10 w-full rounded-lg border border-default-300 bg-white px-3 py-1.5 text-sm text-(--foreground) outline-none" value={gender} onChange={(e) => setGender(e.target.value)} disabled={isViewMode}>
              <option value="">Female</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="mb-1 block text-[15px] font-medium text-(--foreground)">Role</label>
            <select className="h-10 w-full rounded-lg border border-default-300 bg-white px-3 py-1.5 text-sm text-(--foreground) outline-none" value={role} onChange={(e) => setRole(e.target.value)} disabled={isViewMode}>
              <option value="">Role</option>
              <option value="admin">Admin</option>
              <option value="me">M &amp; E</option>
              <option value="senior">Senior Official</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="mb-1 block text-[15px] font-medium text-(--foreground)">Flagship to Manage</label>
            <select
              className="h-10 w-full rounded-lg border border-default-300 bg-white px-3 py-1.5 text-sm text-(--foreground) outline-none"
              value={selectedFlagshipId}
              onChange={(e) => setSelectedFlagshipId(e.target.value)}
              disabled={isViewMode}
            >
              <option value="" disabled>
                Select flagship
              </option>
              {flagshipDummyData.map((flagship) => (
                <option key={flagship.id} value={flagship.id}>
                  {flagship.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="mb-1 block text-[15px] font-medium text-(--foreground)">Location</label>
          <RwandaLocationSelector value={location} onChange={setLocation} disabled={isViewMode} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onPress={() => navigate("/admin/users")}>{isViewMode ? "Back" : "Save the Draft"}</Button>
          {!isViewMode ? <Button variant="primary">Submit</Button> : null}
        </div>
      </Card>
    </div>
  );
}
