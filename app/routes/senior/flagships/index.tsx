import { useNavigate } from "react-router";
import { useMemo, useState } from "react";

import type { Route } from "./+types/index";
import FlagshipsList, {
  type FlagshipCardItem
} from "~/components/pages/flagships/flagships-list";
import { flagshipDummyData } from "~/data/dummy-flagship-detail";
import { IconHomeFilled } from "@tabler/icons-react";
import { PageTitleCard } from "~/components/page-title-card";
import { ContentTab } from "~/components/content-tab";

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Flagships | Senior Officials" }];
}

export default function SeniorFlagships() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"all" | "active" | "planning" | "closed">("all");

  const flagshipCards: FlagshipCardItem[] = useMemo(() => {
    const filtered =
      activeTab === "all"
        ? flagshipDummyData
        : flagshipDummyData.filter((item) => item.status === activeTab);

    return filtered.map((item) => ({
      ...item,
      icon: <IconHomeFilled size={18} />,
    }));
  }, [activeTab]);

  return (
    <div className="space-y-6 w-full min-w-0">
      <PageTitleCard title="Flagship Projects" />
      <ContentTab
        items={[
          { id: "all", label: "All" },
          { id: "active", label: "Active" },
          { id: "planning", label: "Planning" },
          { id: "closed", label: "Closed" },
        ]}
        activeId={activeTab}
        onChange={(id) => setActiveTab(id as "all" | "active" | "planning" | "closed")}
      />
      <FlagshipsList
        items={flagshipCards}
        className="w-full"
        onViewMore={(item) => navigate(`/senior/flagships/${item.id}`)}
      />
    </div>
  );
}
