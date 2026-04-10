import { Tabs } from "@heroui/react";

export interface NavigationTabItem {
  id: string;
  label: string;
  href: string;
}

interface TabProps {
  tabs: NavigationTabItem[];
  activeKey: string;
  ariaLabel: string;
  brandLabel?: string;
}

export function Tab({
  tabs,
  activeKey,
  ariaLabel,
  brandLabel = "Flagship Tracker",
}: TabProps) {
  return (
    <header className="border-b border-(--border) bg-(--surface) px-6">
      <div className="flex items-center gap-8 h-14">
        <span className="font-bold text-base shrink-0">{brandLabel}</span>
        <Tabs selectedKey={activeKey}>
          <Tabs.ListContainer>
            <Tabs.List aria-label={ariaLabel}>
              {tabs.map((tab) => (
                <Tabs.Tab key={tab.id} id={tab.id} href={tab.href}>
                  {tab.label}
                  <Tabs.Indicator />
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      </div>
    </header>
  );
}
