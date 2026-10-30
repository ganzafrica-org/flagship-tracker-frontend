import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { Tooltip } from "@heroui/react";
import { COOPERATIVE_TYPE_NAV } from "~/lib/queries/cooperatives";
import {
  IconLayoutDashboard,
  IconFlag,
  IconChartBar,
  IconUsers,
  IconCirclePlus,
  IconBuildingCommunity,
  IconIdBadge2,
  IconCoin,
  IconChevronDown,
} from "@tabler/icons-react";

type UserRole = "admin" | "senior" | "me";

interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  /** When set, the item renders as an expandable group (or a flyout when collapsed). */
  children?: { id: string; label: string; href: string; type: string }[];
}

function cooperativeChildren(base: string): SidebarItem["children"] {
  return COOPERATIVE_TYPE_NAV.map((t) => ({
    id: t.type,
    label: t.label,
    type: t.type,
    href: `${base}?type=${t.type}`,
  }));
}

interface SidebarProps {
  role: UserRole;
  isOpen: boolean;
}

const SIDEBAR_ITEMS: Record<UserRole, SidebarItem[]> = {
  admin: [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/admin/dashboard",
      icon: <IconLayoutDashboard size={20} />,
    },
    {
      id: "users",
      label: "Users",
      href: "/admin/users",
      icon: <IconUsers size={20} />,
    },
    {
      id: "flagships",
      label: "Flagships",
      href: "/admin/flagships",
      icon: <IconFlag size={20} />,
    },
    {
      id: "individuals",
      label: "Individuals",
      href: "/admin/individuals",
      icon: <IconIdBadge2 size={20} />,
    },
    {
      id: "cooperatives",
      label: "Cooperatives & Organisations",
      href: "/admin/cooperatives",
      icon: <IconBuildingCommunity size={20} />,
      children: cooperativeChildren("/admin/cooperatives"),
    },
    {
      id: "funders",
      label: "Funders",
      href: "/admin/funders",
      icon: <IconCoin size={20} />,
    },
    {
      id: "reports",
      label: "Reports",
      href: "/admin/reports",
      icon: <IconChartBar size={20} />,
    },
  ],
  senior: [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/senior/dashboard",
      icon: <IconLayoutDashboard size={20} />,
    },
    {
      id: "flagships",
      label: "Flagships",
      href: "/senior/flagships",
      icon: <IconFlag size={20} />,
    },
    {
      id: "individuals",
      label: "Individuals",
      href: "/senior/individuals",
      icon: <IconIdBadge2 size={20} />,
    },
    {
      id: "cooperatives",
      label: "Cooperatives & Organisations",
      href: "/senior/cooperatives",
      icon: <IconBuildingCommunity size={20} />,
      children: cooperativeChildren("/senior/cooperatives"),
    },
    {
      id: "funders",
      label: "Funders",
      href: "/senior/funders",
      icon: <IconCoin size={20} />,
    },
    {
      id: "reports",
      label: "Reports",
      href: "/senior/reports",
      icon: <IconChartBar size={20} />,
    },
  ],
  me: [
    {
      id: "flagships",
      label: "Flagships",
      href: "/me/flagships",
      icon: <IconFlag size={20} />,
    },
    {
      id: "add-flagship",
      label: "Add Flagship",
      href: "/me/flagships/add-flagship",
      icon: <IconCirclePlus size={20} />,
    },
    {
      id: "individuals",
      label: "Individuals",
      href: "/me/individuals",
      icon: <IconIdBadge2 size={20} />,
    },
    {
      id: "cooperatives",
      label: "Cooperatives & Organisations",
      href: "/me/cooperatives",
      icon: <IconBuildingCommunity size={20} />,
      children: cooperativeChildren("/me/cooperatives"),
    },
    {
      id: "funders",
      label: "Funders",
      href: "/me/funders",
      icon: <IconCoin size={20} />,
    },
    {
      id: "reports",
      label: "Reports",
      href: "/me/reports",
      icon: <IconChartBar size={20} />,
    }
  ],
};

function NavGroup({ item, isOpen }: { item: SidebarItem; isOpen: boolean }) {
  const { pathname, search } = useLocation();
  const currentType = new URLSearchParams(search).get("type") ?? "";
  const inSection = pathname.startsWith(item.href);
  const [expanded, setExpanded] = useState(inSection);
  const [flyout, setFlyout] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (inSection) setExpanded(true);
  }, [inSection]);

  const children = item.children ?? [];
  const isChildActive = (type: string) => pathname === item.href && currentType === type;

  const childClass = (active: boolean) =>
    [
      "block rounded-3xl px-3 py-1.5 text-sm transition-colors",
      active ? "bg-(--accent) text-(--accent-foreground) font-medium" : "text-(--accent) hover:bg-(--default)",
    ].join(" ");

  if (isOpen) {
    return (
      <div>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className={[
            "flex w-full items-center gap-3 px-3 py-2 rounded-3xl text-sm font-medium transition-colors text-left",
            inSection && !expanded ? "bg-(--default) text-(--accent)" : "text-(--accent) hover:bg-(--default)",
          ].join(" ")}
        >
          <span className="shrink-0">{item.icon}</span>
          <span className="min-w-0 flex-1 break-words leading-tight">{item.label}</span>
          <IconChevronDown size={16} className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
        {expanded ? (
          <div className="mt-1 ml-6 flex flex-col gap-1 border-l border-(--border) pl-2">
            {children.map((c) => (
              <NavLink key={c.id} to={c.href} viewTransition className={childClass(isChildActive(c.type))}>
                {c.label}
              </NavLink>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  function openFlyout() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setFlyout({ top: rect.top, left: rect.right });
  }

  return (
    <div onMouseEnter={openFlyout} onMouseLeave={() => setFlyout(null)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={item.label}
        aria-haspopup="menu"
        aria-expanded={flyout !== null}
        onClick={() => (flyout ? setFlyout(null) : openFlyout())}
        className={[
          "flex items-center justify-center w-10 h-10 rounded-3xl transition-colors",
          inSection ? "bg-(--accent) text-(--accent-foreground)" : "text-(--accent) hover:bg-(--default)",
        ].join(" ")}
      >
        {item.icon}
      </button>
      {flyout ? (
        <div
          role="menu"
          style={{ position: "fixed", top: flyout.top, left: flyout.left }}
          className="z-50 w-52 rounded-2xl border border-(--border) bg-(--surface) p-2 shadow-lg"
        >
          <p className="px-3 pb-1 text-xs font-semibold text-(--muted)">{item.label}</p>
          <div className="flex flex-col gap-1">
            {children.map((c) => (
              <NavLink
                key={c.id}
                to={c.href}
                role="menuitem"
                viewTransition
                onClick={() => setFlyout(null)}
                className={childClass(isChildActive(c.type))}
              >
                {c.label}
              </NavLink>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function Sidebar({ role, isOpen }: SidebarProps) {
  const items = SIDEBAR_ITEMS[role];
  
  const exactMatchIds = new Set([
    "flagships",
    "cooperatives",
    "reports",
    "users",
    "dashboard",
    "individuals",
    "funders",
  ]);

  return (
    <aside
      className={[
        "h-full bg-(--surface) border-r border-(--border) flex flex-col transition-all duration-300 overflow-x-hidden overflow-y-auto shrink-0",
        isOpen ? "w-56" : "w-14",
      ].join(" ")}
    >
      <nav className="flex flex-col gap-1 p-2 mt-2" aria-label="Main navigation">
        {items.map((item) => {
          if (item.children) return <NavGroup key={item.id} item={item} isOpen={isOpen} />;
          if (isOpen) {
            return (
              <NavLink key={item.id} to={item.href} end={exactMatchIds.has(item.id)} viewTransition>
                {({ isActive }) => (
                  <span
                    className={[
                      "flex items-center gap-3 px-3 py-2 rounded-3xl text-sm font-medium transition-colors",
                      isActive
                        ? "bg-(--accent) text-(--accent-foreground)"
                        : "text-(--accent) hover:bg-(--default)",
                    ].join(" ")}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="min-w-0 break-words leading-tight">{item.label}</span>
                  </span>
                )}
              </NavLink>
            );
          }

          return (
            <Tooltip key={item.id} delay={150}>
              <Tooltip.Trigger>
                <NavLink to={item.href} end={exactMatchIds.has(item.id)} viewTransition>
                  {({ isActive }) => (
                    <span
                      className={[
                        "flex items-center justify-center w-10 h-10 rounded-3xl transition-colors",
                        isActive
                          ? "bg-(--accent) text-(--accent-foreground)"
                          : "text-(--accent) hover:bg-(--default)",
                      ].join(" ")}
                    >
                      {item.icon}
                    </span>
                  )}
                </NavLink>
              </Tooltip.Trigger>
              <Tooltip.Content placement="right">
                {item.label}
              </Tooltip.Content>
            </Tooltip>
          );
        })}
      </nav>
    </aside>
  );
}
