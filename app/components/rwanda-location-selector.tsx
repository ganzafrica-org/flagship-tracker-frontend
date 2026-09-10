import { Cells, Districts, Provinces, Sectors, Villages } from "rwanda";
import { useEffect } from "react";
import { ComboBox, Input, Label, ListBox } from "@heroui/react";

export interface RwandaLocationValue {
  province: string;
  district: string;
  sector: string;
  cell: string;
  village: string;
}

interface RwandaLocationSelectorProps {
  value: RwandaLocationValue;
  onChange: (next: RwandaLocationValue) => void;
  className?: string;
  disabled?: boolean;
}

function toOptionList(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return values.filter((value): value is string => typeof value === "string");
}

function safeLookup(lookup: () => unknown): string[] {
  try {
    return toOptionList(lookup());
  } catch {
    return [];
  }
}

/** The rwanda package's Sectors() returns sectors for every district in a province. */
function sectorsForDistrict(province: string, district: string): string[] {
  const candidates = safeLookup(() => Sectors({ province, district }));
  const unique = [...new Set(candidates)];
  return unique
    .filter((sector) => {
      try {
        return Array.isArray(Cells({ province, district, sector }));
      } catch {
        return false;
      }
    })
    .sort((a, b) => a.localeCompare(b));
}

interface LocationComboBoxProps {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

function LocationComboBox({ label, placeholder, options, value, onChange, disabled }: LocationComboBoxProps) {
  return (
    <ComboBox
      className="w-full"
      selectedKey={value || null}
      onSelectionChange={(key) => onChange(key == null ? "" : String(key))}
      isDisabled={disabled}
      variant="secondary"
    >
      <Label>{label}</Label>
      <ComboBox.InputGroup>
        <Input className="h-10 border border-default-500 rounded-3xl px-3 text-sm text-(--foreground) transition-colors" placeholder={placeholder} />
        <ComboBox.Trigger />
      </ComboBox.InputGroup>
      <ComboBox.Popover>
        <ListBox>
          {options.map((opt) => (
            <ListBox.Item key={opt} id={opt} textValue={opt}>
              {opt}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </ComboBox.Popover>
    </ComboBox>
  );
}

export function RwandaLocationSelector({ value, onChange, className, disabled = false }: RwandaLocationSelectorProps) {
  const provinces = safeLookup(() => Provinces());
  const districts = value.province ? safeLookup(() => Districts({ provinces: value.province })) : [];
  const sectors =
    value.province && value.district
      ? sectorsForDistrict(value.province, value.district)
      : [];
  const cells =
    value.province && value.district && value.sector
      ? safeLookup(() => Cells({ province: value.province, district: value.district, sector: value.sector }))
      : [];
  const villages =
    value.province && value.district && value.sector && value.cell
      ? safeLookup(() =>
          Villages({ province: value.province, district: value.district, sector: value.sector, cell: value.cell }),
        )
      : [];

  useEffect(() => {
    if (value.province && provinces.length > 0 && !provinces.includes(value.province)) {
      onChange({ province: "", district: "", sector: "", cell: "", village: "" });
      return;
    }
    if (value.district && districts.length > 0 && !districts.includes(value.district)) {
      onChange({ ...value, district: "", sector: "", cell: "", village: "" });
      return;
    }
    if (value.sector && sectors.length > 0 && !sectors.includes(value.sector)) {
      onChange({ ...value, sector: "", cell: "", village: "" });
      return;
    }
    if (value.cell && cells.length > 0 && !cells.includes(value.cell)) {
      onChange({ ...value, cell: "", village: "" });
      return;
    }
    if (value.village && villages.length > 0 && !villages.includes(value.village)) {
      onChange({ ...value, village: "" });
    }
  }, [value, provinces, districts, sectors, cells, villages, onChange]);

  const update = (field: keyof RwandaLocationValue, fieldValue: string) => {
    const resetMap: Record<keyof RwandaLocationValue, Partial<RwandaLocationValue>> = {
      province: { district: "", sector: "", cell: "", village: "" },
      district: { sector: "", cell: "", village: "" },
      sector: { cell: "", village: "" },
      cell: { village: "" },
      village: {},
    };
    onChange({ ...value, [field]: fieldValue, ...resetMap[field] });
  };

  return (
    <div className={`grid gap-4 sm:grid-cols-5 ${className ?? ""}`}>
      <LocationComboBox label="Province" placeholder="Province" options={provinces} value={value.province} onChange={(v) => update("province", v)} disabled={disabled} />
      <LocationComboBox label="District" placeholder="District" options={districts} value={value.district} onChange={(v) => update("district", v)} disabled={disabled || !value.province} />
      <LocationComboBox label="Sector" placeholder="Sector" options={sectors} value={value.sector} onChange={(v) => update("sector", v)} disabled={disabled || !value.district} />
      <LocationComboBox label="Cell (optional)" placeholder="Cell" options={cells} value={value.cell} onChange={(v) => update("cell", v)} disabled={disabled || !value.sector} />
      <LocationComboBox label="Village (optional)" placeholder="Village" options={villages} value={value.village} onChange={(v) => update("village", v)} disabled={disabled || !value.cell} />
    </div>
  );
}
