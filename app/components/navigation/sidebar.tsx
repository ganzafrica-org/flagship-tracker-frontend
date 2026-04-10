import { NavLink } from "react-router";
import { Tooltip } from "@heroui/react";
import {
  IconLayoutDashboard,
  IconFlag,
  IconChartBar,
  IconUsers,
} from "@tabler/icons-react";

type UserRole = "admin" | "senior" | "me";

interface SidebarItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
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
      id: "flagships",
      label: "Flagships",
      href: "/admin/flagships",
      icon: <IconFlag size={20} />,
    },
    {
      id: "users",
      label: "Users",
      href: "/admin/users",
      icon: <IconUsers size={20} />,
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
      id: "reports",
      label: "Reports",
      href: "/me/reports",
      icon: <IconChartBar size={20} />,
    },
  ],
};

export default function Sidebar({ role, isOpen }: SidebarProps) {
  const items = SIDEBAR_ITEMS[role];

  return (
    <aside
      className={[
        "h-full bg-(--surface) border-r border-(--border) flex flex-col transition-all duration-300 overflow-x-hidden overflow-y-auto shrink-0",
        isOpen ? "w-56" : "w-14",
      ].join(" ")}
    >
      <nav className="flex flex-col gap-1 p-2 mt-2" aria-label="Main navigation">
        {items.map((item) => {
          if (isOpen) {
            return (
              <NavLink key={item.id} to={item.href}>
                {({ isActive }) => (
                  <span
                    className={[
                      "flex items-center gap-3 px-3 py-2 rounded-3xl text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-(--accent) text-(--accent-foreground)"
                        : "text-(--accent) hover:bg-(--default)",
                    ].join(" ")}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          }

          return (
            <Tooltip key={item.id} delay={150}>
              <Tooltip.Trigger>
                <NavLink to={item.href}>
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
