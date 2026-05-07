import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Button } from "@heroui/react";
import { IconHomeFilled } from "@tabler/icons-react";

import type { Route } from "./+types/index";
import FlagshipsList, {
  type FlagshipCardItem,
} from "~/components/pages/flagships/flagships-list";
import { flagshipDummyData } from "~/data/dummy-flagship-detail";
import { PageTitleCard } from "~/components/page-title-card";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Flagships | M&E" }];
}

export default function MeFlagships() {
  const navigate = useNavigate();

  const flagshipCards: FlagshipCardItem[] = useMemo(
    () =>
      flagshipDummyData.slice(0, 2).map((item) => ({
        ...item,
        icon: <IconHomeFilled size={18} />,
      })),
    []
  );

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageTitleCard
        title="Flagship Projects"
        actionLabel="Add Flagship"
        onActionPress={() => navigate("/me/flagships/add-flagship", { viewTransition: true })}
      />
      <FlagshipsList
        items={flagshipCards}
        className="w-full"
        onViewMore={(item) => navigate(`/me/flagships/${item.id}`, { viewTransition: true })}
      />
    </div>
  );
}
