import { useState } from "react";
import {
  Button,
  Card,
  FieldError,
  FieldGroup,
  Fieldset,
  Form,
  Label,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";
import { useNavigate } from "react-router";

import AppInput from "~/components/input";
import { PageTitleCard } from "~/components/page-title-card";
import { RwandaLocationSelector, type RwandaLocationValue } from "~/components/rwanda-location-selector";

const VALUE_CHAINS = ["Tomatoes", "Potatoes", "Rice", "Cassava", "Avocado"];

const DEFAULT_LOCATION_VALUE: RwandaLocationValue = {
  province: "",
  district: "",
  sector: "",
  cell: "",
  village: "",
};

export function meta() {
  return [{ title: "Add Flagship | M&E" }];
}

export default function MeAddFlagshipPage() {
  const navigate = useNavigate();
  const [location, setLocation] = useState<RwandaLocationValue>(DEFAULT_LOCATION_VALUE);
  const [valueChain, setValueChain] = useState<string>("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col gap-5 w-full min-w-0">
      <PageTitleCard title="Flagship Projects Management" />

      <Card className="p-5">
        <h2 className="text-[20px] leading-tight font-semibold text-(--foreground) mb-4">Add a Flagship</h2>

        <Form onSubmit={handleSubmit}>
          <Fieldset className="w-full border-none p-0">
            <FieldGroup className="grid gap-4 sm:grid-cols-10 w-full">

              {/* Flagship Name */}
              <TextField name="flagshipName" isRequired className="sm:col-span-5 w-full">
                <Label>Flagship Name</Label>
                <AppInput variant="form" placeholder="Flagship name" />
                <FieldError />
              </TextField>

              {/* Value Chain */}
              <Select
                name="valueChain"
                className="sm:col-span-5 w-full"
                placeholder="Select value chain"
                selectedKey={valueChain}
                onSelectionChange={(key) => setValueChain(key as string)}
              >
                <Label>Value Chain</Label>
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {VALUE_CHAINS.map((item) => (
                      <ListBox.Item key={item} id={item} textValue={item}>
                        {item}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>

              {/* Acreage */}
              <TextField name="acreage" isRequired className="sm:col-span-5 w-full">
                <Label>Acreage</Label>
                <AppInput variant="form" type="number" min={0} step={1} placeholder="Land size" />
                <FieldError />
              </TextField>

              {/* How many farmers */}
              <div className="sm:col-span-5 grid grid-cols-2 gap-2">
                <TextField name="farmersMen" isRequired className="w-full">
                  <Label>Farmers (Men)</Label>
                  <AppInput variant="form" type="number" min={0} step={1} placeholder="0" />
                  <FieldError />
                </TextField>
                <TextField name="farmersWomen" isRequired className="w-full">
                  <Label>Farmers (Women)</Label>
                  <AppInput variant="form" type="number" min={0} step={1} placeholder="0" />
                  <FieldError />
                </TextField>
              </div>

              {/* Youths Engaged */}
              <TextField name="youthsEngaged" isRequired className="sm:col-span-5 w-full">
                <Label>Number of Youths Engaged</Label>
                <AppInput variant="form" type="number" min={0} step={1} placeholder="0" />
                <FieldError />
              </TextField>

              {/* Total Investment */}
              <TextField name="totalInvestment" isRequired className="sm:col-span-5 w-full">
                <Label>Total Investment</Label>
                <AppInput variant="form" placeholder="0" inputMode="decimal" />
                <FieldError />
              </TextField>

              {/* Quantities Produced */}
              <TextField name="quantitiesProduced" className="sm:col-span-3 w-full">
                <Label>Quantities Produced</Label>
                <AppInput variant="form" type="number" min={0} step={1} placeholder="0" />
                <FieldError />
              </TextField>

              {/* Monthly Net Income per Youth */}
              <TextField name="monthlyNetIncome" className="sm:col-span-4 w-full">
                <Label>Monthly Net Income per Youth</Label>
                <AppInput variant="form" type="number" min={0} step={1} placeholder="0" />
                <FieldError />
              </TextField>

              {/* Expected Revenue */}
              <TextField name="expectedRevenue" isRequired className="sm:col-span-3 w-full">
                <Label>Expected Revenue</Label>
                <AppInput variant="form" placeholder="0" inputMode="decimal" />
                <FieldError />
              </TextField>

              {/* Location */}
              <div className="sm:col-span-10">
                <span className="mb-2 block text-sm font-medium text-(--foreground)">Location</span>
                <RwandaLocationSelector value={location} onChange={setLocation} />
              </div>

            </FieldGroup>
          </Fieldset>

          <div className="flex flex-wrap justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onPress={() => navigate("/admin/flagships")}>
              Save the Draft
            </Button>
            <Button type="submit" variant="primary">
              Continue
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
