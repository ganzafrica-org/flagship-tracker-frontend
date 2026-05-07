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
        actionSlot={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              className="!rounded-3xl font-medium shrink-0"
              onPress={() => navigate("/me/flagships/add-flagship?mode=update")}
            >
              Update Flagship
            </Button>
            <Button
              variant="primary"
              className="!rounded-3xl font-medium shrink-0"
              onPress={() => navigate("/me/flagships/add-flagship")}
            >
              Add Flagship
            </Button>
          </div>
        }
      />
      <FlagshipsList
        items={flagshipCards}
        className="w-full"
        onViewMore={(item) => navigate(`/me/flagships/${item.id}`)}
      />
    </div>
  );
}
