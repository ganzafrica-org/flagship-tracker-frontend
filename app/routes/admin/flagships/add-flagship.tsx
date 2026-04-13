import { useRef, useState } from "react";
import { Button, Card } from "@heroui/react";
import { useNavigate } from "react-router";

import Input from "~/components/input";
import { PageTitleCard } from "~/components/page-title-card";
import { RwandaLocationSelector, type RwandaLocationValue } from "~/components/rwanda-location-selector";

const DEFAULT_LOCATION_VALUE: RwandaLocationValue = {
  province: "",
  district: "",
  sector: "",
  cell: "",
  village: "",
};

export function meta() {
  return [{ title: "Add Flagship | Admin" }];
}

export default function AdminAddFlagshipPage() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const [location, setLocation] = useState<RwandaLocationValue>(DEFAULT_LOCATION_VALUE);

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      <PageTitleCard title="Flagship Projects Management" />

      <Card className="p-5 space-y-4 rounded-lg">
        <h2 className="text-[20px] leading-tight font-semibold text-(--foreground)">Add a Flagship</h2>

        <form ref={formRef} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-10">
            <Input variant="form" containerClassName="sm:col-span-5" label="Flagship Name" placeholder="Flagship name" required />

            <div className="sm:col-span-5 space-y-1">
              <label className="mb-1 block text-[15px] font-medium text-(--foreground)">Value Chain</label>
              <select className="h-10 w-full rounded-lg border border-default-300 bg-white px-3 py-1.5 text-sm text-(--foreground) outline-none" defaultValue="">
                <option value="" disabled>
                  Select value chain
                </option>
                <option value="Tomatoes">Tomatoes</option>
                <option value="Potatoes">Potatoes</option>
                <option value="Rice">Rice</option>
                <option value="Cassava">Cassava</option>
                <option value="Avocado">Avocado</option>
              </select>
            </div>

            <Input variant="form" containerClassName="sm:col-span-5" label="Acreage" type="number" min={0} step={1} placeholder="Land size" required />

            <div className="sm:col-span-5 space-y-1">
              <label className="mb-1 block text-[15px] font-medium text-(--foreground)">How many farmers</label>
              <div className="grid grid-cols-2 gap-2">
                <Input variant="form" placeholder="Men" type="number" min={0} step={1} required />
                <Input variant="form" placeholder="Women" type="number" min={0} step={1} required />
              </div>
            </div>

            <Input variant="form" containerClassName="sm:col-span-5" label="Number of youths Engaged" type="number" min={0} step={1} placeholder="0" required />
            <Input variant="form" containerClassName="sm:col-span-5" label="Total Investment" type="text" inputMode="decimal" placeholder="0" required />

            <Input variant="form" containerClassName="sm:col-span-3" label="Quantities produced" type="number" min={0} step={1} placeholder="0" />
            <Input variant="form" containerClassName="sm:col-span-4" label="Monthly Net Income per Youth" type="number" min={0} step={1} placeholder="0" />
            <Input variant="form" containerClassName="sm:col-span-3" label="Expected Revenue" type="text" inputMode="decimal" placeholder="0" required />

            <div className="sm:col-span-10">
              <label className="mb-1 block text-[15px] font-medium text-(--foreground)">Location</label>
            </div>
            <div className="sm:col-span-10">
              <RwandaLocationSelector value={location} onChange={setLocation} />
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button type="button" variant="outline" className="h-10 !rounded-lg px-8 font-medium" onPress={() => navigate("/admin/flagships")}>
              Save the Draft
            </Button>
            <Button type="button" variant="primary" className="h-10 !rounded-lg px-10 font-medium" onPress={() => formRef.current?.requestSubmit()}>
              Continue
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
