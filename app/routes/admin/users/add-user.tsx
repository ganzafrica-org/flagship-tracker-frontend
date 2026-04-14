import { useState } from "react";
import type { DateValue } from "@internationalized/date";
import {
  Button,
  Calendar,
  Card,
  DateField,
  DatePicker,
  FieldError,
  FieldGroup,
  Fieldset,
  Form,
  Label,
  ListBox,
  Select,
} from "@heroui/react";
import { useNavigate, useSearchParams } from "react-router";

import { PageTitleCard } from "~/components/page-title-card";
import AppInput from "~/components/input";
import { RwandaLocationSelector, type RwandaLocationValue } from "~/components/rwanda-location-selector";
import { flagshipDummyData } from "~/data/dummy-flagship-detail";
import { dummyUsers } from "~/data/dummy-data";

const triggerClass = "h-10 border border-default-500 rounded-3xl px-3 text-sm text-(--foreground) transition-colors w-full";

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
  const [dateOfBirth, setDateOfBirth] = useState<DateValue | null>(null);
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
        <Form>
          <Fieldset className="w-full border-none p-0">
            <FieldGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 w-full">

              <AppInput label="First Name" placeholder="First name" variant="form" value={firstName} onChange={(e) => setFirstName(e.target.value)} disabled={isViewMode} />
              <AppInput label="Last Name" placeholder="Last name" variant="form" value={lastName} onChange={(e) => setLastName(e.target.value)} disabled={isViewMode} />
              <AppInput label="Email" type="email" placeholder="Email" variant="form" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isViewMode} />
              <AppInput label="Phone Number *" placeholder="Phone Number" variant="form" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={isViewMode} />

              {/* Date of Birth */}
              <DatePicker className="w-full" value={dateOfBirth} onChange={setDateOfBirth} isDisabled={isViewMode}>
                <Label className="mb-1 block text-[15px] font-medium text-(--foreground)">Date of Birth *</Label>
                <DateField.Group className={triggerClass}>
                  <DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
                  <DateField.Suffix>
                    <DatePicker.Trigger>
                      <DatePicker.TriggerIndicator />
                    </DatePicker.Trigger>
                  </DateField.Suffix>
                </DateField.Group>
                <DatePicker.Popover>
                  <Calendar aria-label="Date of birth">
                    <Calendar.Header>
                      <Calendar.YearPickerTrigger>
                        <Calendar.YearPickerTriggerHeading />
                        <Calendar.YearPickerTriggerIndicator />
                      </Calendar.YearPickerTrigger>
                      <Calendar.NavButton slot="previous" />
                      <Calendar.NavButton slot="next" />
                    </Calendar.Header>
                    <Calendar.Grid>
                      <Calendar.GridHeader>
                        {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                      </Calendar.GridHeader>
                      <Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
                    </Calendar.Grid>
                    <Calendar.YearPickerGrid>
                      <Calendar.YearPickerGridBody>
                        {({ year }) => <Calendar.YearPickerCell year={year} />}
                      </Calendar.YearPickerGridBody>
                    </Calendar.YearPickerGrid>
                  </Calendar>
                </DatePicker.Popover>
              </DatePicker>

              {/* Gender */}
              <Select placeholder="Select gender" selectedKey={gender} onSelectionChange={(key) => setGender(key as string)} isDisabled={isViewMode} className="w-full">
                <Label className="mb-1 block text-[15px] font-medium text-(--foreground)">Gender</Label>
                <Select.Trigger className={triggerClass}>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {[{ id: "female", label: "Female" }, { id: "male", label: "Male" }, { id: "other", label: "Other" }].map((item) => (
                      <ListBox.Item key={item.id} id={item.id} textValue={item.label}>
                        {item.label}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              {/* Role */}
              <Select placeholder="Select role" selectedKey={role} onSelectionChange={(key) => setRole(key as string)} isDisabled={isViewMode} className="w-full">
                <Label className="mb-1 block text-[15px] font-medium text-(--foreground)">Role</Label>
                <Select.Trigger className={triggerClass}>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {[{ id: "admin", label: "Admin" }, { id: "me", label: "M & E" }, { id: "senior", label: "Senior Official" }].map((item) => (
                      <ListBox.Item key={item.id} id={item.id} textValue={item.label}>
                        {item.label}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              {/* Flagship to Manage */}
              <Select placeholder="Select flagship" selectedKey={selectedFlagshipId} onSelectionChange={(key) => setSelectedFlagshipId(key as string)} isDisabled={isViewMode} className="w-full">
                <Label className="mb-1 block text-[15px] font-medium text-(--foreground)">Flagship to Manage</Label>
                <Select.Trigger className={triggerClass}>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {flagshipDummyData.map((flagship) => (
                      <ListBox.Item key={flagship.id} id={flagship.id} textValue={flagship.title}>
                        {flagship.title}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

            </FieldGroup>
          </Fieldset>

          {/* Location */}
          <div className="w-full space-y-2">
            <label className="mb-1 block text-[15px] font-medium text-(--foreground)">Location</label>
            <RwandaLocationSelector value={location} onChange={setLocation} disabled={isViewMode} />
          </div>

          <div className="flex justify-end gap-3 pt-2 w-full">
            <Button variant="outline" onPress={() => navigate("/admin/users")}>{isViewMode ? "Back" : "Save the Draft"}</Button>
            {!isViewMode ? <Button type="submit" variant="primary">Submit</Button> : null}
          </div>
        </Form>
      </Card>
    </div>
  );
}
