import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Button } from "@heroui/react";
import { IconEdit, IconUserPlus } from "@tabler/icons-react";

import { dummyIndividuals } from "~/data/dummy-data";
import { flagshipDummyData } from "~/data/dummy-flagship-detail";
import { PageTitleCard } from "~/components/page-title-card";
import TableComponent from "~/components/table-component";

const CATEGORY_LABELS: Record<string, string> = {
  student: "Student",
  graduate: "Graduate",
  neet: "NEET",
  employed: "Employed",
  self_employed: "Self-Employed",
  other: "Other",
};

const COLUMNS = [
  { key: "id",         label: "#",        width: "50px"  },
  { key: "name",       label: "Name",     width: "200px" },
  { key: "sex",        label: "Sex",      width: "80px"  },
  { key: "category",   label: "Category", width: "120px" },
  { key: "flagship",   label: "Flagship", width: "130px" },
  { key: "location",   label: "Location", width: "160px" },
  { key: "source",     label: "Source",   width: "110px" },
  { key: "action",     label: "Action",   width: "80px"  },
];

const COLUMNS_READONLY = COLUMNS.filter((c) => c.key !== "action");

const STATUS_COLOR_MAP: Record<string, "default" | "success" | "warning" | "danger" | "accent"> = {
  flagship:  "accent",
  "walk-in": "success",
  referral:  "warning",
  survey:    "default",
};

interface IndividualsListProps {
  addPath?: string;
  updatePath?: string;
  readOnly?: boolean;
}

export default function IndividualsList({ addPath, updatePath, readOnly = false }: IndividualsListProps) {
  const navigate = useNavigate();

  const rows = useMemo(() =>
    dummyIndividuals.map((ind) => ({
      id:           ind.id,
      name:         `${ind.first_name} ${ind.last_name}`,
      sex:          ind.sex,
      category:     ind.youth_category ? (CATEGORY_LABELS[ind.youth_category] ?? ind.youth_category) : "—",
      flagship:     ind.flagship_name ?? "—",
      flagship_id:  ind.flagship_id != null ? String(ind.flagship_id) : "",
      location:     [ind.district, ind.province].filter(Boolean).join(", "),
      source:       ind.registration_source,
    })),
  []);

  const flagshipFilterOptions = useMemo(() =>
    flagshipDummyData.map((f) => ({ id: String(f.id), label: f.title })),
  []);

  const multiSelectFilters = [
    {
      key:         "flagship_id",
      placeholder: "Filter by flagship",
      options:     flagshipFilterOptions,
    },
  ];

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageTitleCard
        title="Individuals"
        actionSlot={
          readOnly ? undefined : (
            <div className="flex gap-3">
              {updatePath && (
                <Button
                  variant="outline"
                  className="!rounded-3xl font-medium"
                  onPress={() => navigate(updatePath, { viewTransition: true })}
                >
                  <IconEdit size={16} />
                  Update
                </Button>
              )}
              {addPath && (
                <Button
                  variant="primary"
                  className="!rounded-3xl font-medium"
                  onPress={() => navigate(addPath, { viewTransition: true })}
                >
                  <IconUserPlus size={16} />
                  Add Individual
                </Button>
              )}
            </div>
          )
        }
      />

      <TableComponent
        tableSectionTitle="Individuals List"
        tableAriaLabel="Individuals table"
        columns={readOnly ? COLUMNS_READONLY : COLUMNS}
        rows={rows}
        searchPlaceholder="Search by name, sex, category, location…"
        searchKeys={["name", "sex", "category", "location", "source"]}
        statusColumnKey="source"
        statusColorMap={STATUS_COLOR_MAP}
        multiSelectFilters={multiSelectFilters}
        filterByTab={() => true}
        actions={
          readOnly
            ? undefined
            : (row) => [
                {
                  label: "Update",
                  onClick: () =>
                    updatePath
                      ? navigate(`${updatePath}?editId=${row.id}`, { viewTransition: true })
                      : undefined,
                },
              ]
        }
      />
    </div>
  );
}
