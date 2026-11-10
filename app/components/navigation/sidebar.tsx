import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router";
import { Tooltip } from "@heroui/react";
import { COOPERATIVE_TYPE_NAV } from "~/lib/queries/cooperatives";
import {
  IconFlag,
  IconUsers,
  IconIdBadge2,
  IconChevronDown,
} from "@tabler/icons-react";

type UserRole = "admin" | "senior" | "me";

interface NavNode {
  id: string;
  label: string;
  href: string;
  /** Active when `?type=` matches. Used by the cooperative type links. */
  type?: string;
  /** Subpaths that belong to a sibling, so this item does not stay highlighted. */
  exclude?: string[];
  children?: NavNode[];
}

interface SidebarItem {
  id: string;
  label: string;
  href?: string;
  icon: React.ReactNode;
  /** When set, the item renders as an expandable group (or a flyout when collapsed). */
  children?: NavNode[];
}

function cooperativeChildren(base: string): NavNode[] {
  return COOPERATIVE_TYPE_NAV.map((t) => ({
    id: t.type,
    label: t.label,
    type: t.type,
    href: `${base}?type=${t.type}`,
  }));
}

function flagshipModule(base: string, options?: { dashboard?: string; extra?: NavNode[] }): NavNode[] {
  return [
    ...(options?.dashboard ? [{ id: "dashboard", label: "Dashboard", href: options.dashboard }] : []),
    { id: "flagships", label: "Flagships", href: `${base}/flagships`, exclude: [`${base}/flagships/add-flagship`] },
    ...(options?.extra ?? []),
    { id: "flagship-individuals", label: "Individuals", href: `${base}/flagship/individuals` },
    {
      id: "cooperatives",
      label: "Cooperatives & Organisations",
      href: `${base}/cooperatives`,
      children: cooperativeChildren(`${base}/cooperatives`),
    },
    { id: "funders", label: "Funders", href: `${base}/funders` },
    { id: "reports", label: "Reports", href: `${base}/reports` },
  ];
}

function youthModule(base: string): NavNode[] {
  return [
    { id: "youth-dashboard", label: "Dashboard", href: `${base}/youth/dashboard` },
    { id: "individuals", label: "Individuals", href: `${base}/individuals` },
  ];
}

interface SidebarProps {
  role: UserRole;
  isOpen: boolean;
}

const SIDEBAR_ITEMS: Record<UserRole, SidebarItem[]> = {
  admin: [
    {
      id: "users",
      label: "Users",
      href: "/admin/users",
      icon: <IconUsers size={20} />,
    },
    {
      id: "flagship",
      label: "Flagship",
      icon: <IconFlag size={20} />,
      children: flagshipModule("/admin", { dashboard: "/admin/dashboard" }),
    },
    {
      id: "youth-profiles",
      label: "Youth Profiles",
      icon: <IconIdBadge2 size={20} />,
      children: youthModule("/admin"),
    },
  ],
  senior: [
    {
      id: "flagship",
      label: "Flagship",
      icon: <IconFlag size={20} />,
      children: flagshipModule("/senior", { dashboard: "/senior/dashboard" }),
    },
    {
      id: "youth-profiles",
      label: "Youth Profiles",
      icon: <IconIdBadge2 size={20} />,
      children: youthModule("/senior"),
    },
  ],
  me: [
    {
      id: "flagship",
      label: "Flagship",
      icon: <IconFlag size={20} />,
      children: flagshipModule("/me", {
        extra: [{ id: "add-flagship", label: "Add Flagship", href: "/me/flagships/add-flagship" }],
      }),
    },
    {
      id: "youth-profiles",
      label: "Youth Profiles",
      icon: <IconIdBadge2 size={20} />,
      children: youthModule("/me"),
    },
  ],
};

function pathOf(href: string): string {
  return href.split("?")[0];
}

function nodeActive(node: NavNode, pathname: string, search: string): boolean {
  if (node.children?.length) return node.children.some((child) => nodeActive(child, pathname, search));
  const path = pathOf(node.href);
  if (node.type) {
    return pathname === path && (new URLSearchParams(search).get("type") ?? "") === node.type;
  }
  if ((node.exclude ?? []).some((excluded) => pathname === excluded || pathname.startsWith(`${excluded}/`))) {
    return false;
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

function linkClass(active: boolean) {
  return [
    "block rounded-3xl px-3 py-1.5 text-sm transition-colors",
    active ? "bg-(--accent) text-(--accent-foreground) font-medium" : "text-(--accent) hover:bg-(--default)",
  ].join(" ");
}

function NavNodes({ nodes, onNavigate }: { nodes: NavNode[]; onNavigate?: () => void }) {
  const { pathname, search } = useLocation();

  return (
    <div className="flex flex-col gap-1">
      {nodes.map((node) =>
        node.children?.length ? (
          <NestedGroup key={node.id} node={node} onNavigate={onNavigate} />
        ) : (
          <NavLink
            key={node.id}
            to={node.href}
            viewTransition
            onClick={onNavigate}
            className={linkClass(nodeActive(node, pathname, search))}
          >
            {node.label}
          </NavLink>
        ),
      )}
    </div>
  );
}

function NestedGroup({ node, onNavigate }: { node: NavNode; onNavigate?: () => void }) {
  const { pathname, search } = useLocation();
  const active = nodeActive(node, pathname, search);
  const [expanded, setExpanded] = useState(active);

  useEffect(() => {
    if (active) setExpanded(true);
  }, [active]);

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-center gap-2 rounded-3xl px-3 py-1.5 text-left text-sm text-(--accent) hover:bg-(--default)"
      >
        <span className="min-w-0 flex-1 break-words leading-tight">{node.label}</span>
        <IconChevronDown size={14} className={`shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded ? (
        <div className="mt-1 ml-3 border-l border-(--border) pl-2">
          <NavNodes nodes={node.children ?? []} onNavigate={onNavigate} />
        </div>
      ) : null}
    </div>
  );
}

function NavGroup({
  item,
  isOpen,
  expanded,
  onToggle,
}: {
  item: SidebarItem;
  isOpen: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { pathname, search } = useLocation();
  const children = item.children ?? [];
  const inSection = children.some((child) => nodeActive(child, pathname, search));
  const [flyout, setFlyout] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  if (isOpen) {
    return (
      <div>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={onToggle}
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
            <NavNodes nodes={children} />
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
          className="z-50 w-64 rounded-2xl border border-(--border) bg-(--surface) p-2 shadow-lg"
        >
          <p className="px-3 pb-1 text-xs font-semibold text-(--muted)">{item.label}</p>
          <NavNodes nodes={children} onNavigate={() => setFlyout(null)} />
        </div>
      ) : null}
    </div>
  );
}

export default function Sidebar({ role, isOpen }: SidebarProps) {
  const items = SIDEBAR_ITEMS[role];
  const { pathname, search } = useLocation();
  const activeModuleId =
    items.find((item) => item.children?.some((child) => nodeActive(child, pathname, search)))?.id ?? null;
  const [openModuleId, setOpenModuleId] = useState<string | null>(activeModuleId);

  useEffect(() => {
    if (activeModuleId) setOpenModuleId(activeModuleId);
  }, [activeModuleId]);

  const exactMatchIds = new Set(["users"]);

  return (
    <aside
      className={[
        "h-full bg-(--surface) border-r border-(--border) flex flex-col transition-all duration-300 overflow-x-hidden overflow-y-auto shrink-0",
        isOpen ? "w-64" : "w-14",
      ].join(" ")}
    >
      <nav className="flex flex-col gap-1 p-2 mt-2" aria-label="Main navigation">
        {items.map((item) => {
          if (item.children) {
            return (
              <NavGroup
                key={item.id}
                item={item}
                isOpen={isOpen}
                expanded={openModuleId === item.id}
                onToggle={() => setOpenModuleId((current) => (current === item.id ? null : item.id))}
              />
            );
          }
          if (!item.href) return null;
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
                <NavLink to={item.href!} end={exactMatchIds.has(item.id)} viewTransition>
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
