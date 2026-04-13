"use client";

import { Cells, Districts, Provinces, Sectors, Villages } from "rwanda";
import { useEffect } from "react";

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

const SELECT_CLASS_NAME =
  "w-full h-10 rounded-lg border border-default-300 bg-white px-3 py-1.5 text-sm text-(--foreground) outline-none transition-colors focus:border-default-500 disabled:cursor-not-allowed disabled:opacity-60";

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

export function RwandaLocationSelector({ value, onChange, className, disabled = false }: RwandaLocationSelectorProps) {
  const provinces = safeLookup(() => Provinces());
  const districts = value.province ? safeLookup(() => Districts({ provinces: value.province })) : [];
  const sectors =
    value.province && value.district
      ? safeLookup(() => Sectors({ province: value.province, district: value.district }))
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
    if (value.province && !provinces.includes(value.province)) {
      onChange({ province: "", district: "", sector: "", cell: "", village: "" });
      return;
    }
    if (value.district && !districts.includes(value.district)) {
      onChange({ ...value, district: "", sector: "", cell: "", village: "" });
      return;
    }
    if (value.sector && !sectors.includes(value.sector)) {
      onChange({ ...value, sector: "", cell: "", village: "" });
      return;
    }
    if (value.cell && !cells.includes(value.cell)) {
      onChange({ ...value, cell: "", village: "" });
      return;
    }
    if (value.village && !villages.includes(value.village)) {
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
    <div className={`grid gap-4 sm:grid-cols-10 ${className ?? ""}`}>
      <div className="sm:col-span-2">
        <select
          className={SELECT_CLASS_NAME}
          value={value.province}
          onChange={(event) => update("province", event.target.value)}
          disabled={disabled}
          required
        >
          <option value="">Province</option>
          {provinces.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <select
          className={SELECT_CLASS_NAME}
          value={value.district}
          onChange={(event) => update("district", event.target.value)}
          disabled={disabled || !value.province}
          required
        >
          <option value="">District</option>
          {districts.map((district) => (
            <option key={district} value={district}>
              {district}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <select
          className={SELECT_CLASS_NAME}
          value={value.sector}
          onChange={(event) => update("sector", event.target.value)}
          disabled={disabled || !value.district}
          required
        >
          <option value="">Sector</option>
          {sectors.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <select
          className={SELECT_CLASS_NAME}
          value={value.cell}
          onChange={(event) => update("cell", event.target.value)}
          disabled={disabled || !value.sector}
          required
        >
          <option value="">Cell</option>
          {cells.map((cell) => (
            <option key={cell} value={cell}>
              {cell}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <select
          className={SELECT_CLASS_NAME}
          value={value.village}
          onChange={(event) => update("village", event.target.value)}
          disabled={disabled || !value.cell}
          required
        >
          <option value="">Village</option>
          {villages.map((village) => (
            <option key={village} value={village}>
              {village}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
