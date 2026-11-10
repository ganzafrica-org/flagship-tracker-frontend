import { useState } from "react";
import { Link } from "react-router";
import { IconHomeFilled } from "@tabler/icons-react";
import { Select, Label, ListBox } from "@heroui/react";

function LanguageFlag({ language }: { language: "EN" | "Kiny" }) {
  if (language === "Kiny") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 22 14"
        className="block h-3.5 w-5 overflow-hidden rounded-[2px] border border-neutral-200"
      >
        <rect width="22" height="7" fill="#33A9E0" />
        <rect y="7" width="22" height="3.5" fill="#FAD201" />
        <rect y="10.5" width="22" height="3.5" fill="#20603D" />
        <circle cx="16.8" cy="3.2" r="1.5" fill="#FAD201" />
        <g stroke="#FAD201" strokeWidth="0.35" strokeLinecap="round">
          <line x1="16.8" y1="0.7" x2="16.8" y2="5.7" />
          <line x1="14.3" y1="3.2" x2="19.3" y2="3.2" />
          <line x1="15.1" y1="1.5" x2="18.5" y2="4.9" />
          <line x1="18.5" y1="1.5" x2="15.1" y2="4.9" />
          <line x1="15.55" y1="0.95" x2="18.05" y2="5.45" />
          <line x1="18.05" y1="0.95" x2="15.55" y2="5.45" />
        </g>
      </svg>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="relative block h-3.5 w-5 overflow-hidden rounded-[2px] border border-neutral-200 bg-[repeating-linear-gradient(to_bottom,#b91c1c_0_14%,#ffffff_14%_28%)]"
    >
      <span className="absolute left-0 top-0 h-[58%] w-[45%] bg-[#1d4ed8]" />
    </span>
  );
}

interface AuthShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AuthShell({ title, description, children }: AuthShellProps) {
  const [language, setLanguage] = useState<"EN" | "Kiny">("EN");

  return (
    <main className="relative flex min-h-dvh w-full items-start justify-center overflow-x-hidden overflow-y-auto bg-[linear-gradient(180deg,#1f95c8_0%,#0f5872_100%)] p-3 text-(--foreground) sm:items-center sm:overflow-hidden sm:p-3 lg:p-8">
      <section className="my-auto grid h-auto w-full max-w-[1160px] rounded-[14px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] sm:h-[min(560px,calc(100dvh-1.5rem))] sm:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] sm:overflow-hidden">
        <div className="relative flex flex-col overflow-hidden rounded-br-[48px] bg-[#edf4fb] px-4 py-4 sm:h-full sm:min-h-0 sm:rounded-br-[92px] sm:px-6 sm:py-5 lg:rounded-br-[124px] lg:px-10 lg:py-9">
          <Link to="/login" viewTransition className="relative z-10 flex w-fit items-center gap-1.5 text-[color:var(--accent)]">
            <div className="flex h-8 w-8 items-center justify-center sm:h-9 sm:w-9">
              <IconHomeFilled size={24} className="sm:hidden" />
              <IconHomeFilled size={27} className="hidden sm:block" />
            </div>
            <span className="text-[1.35rem] font-extrabold tracking-[-0.03em] sm:text-[1.62rem]">Flagships</span>
          </Link>

          <div className="relative z-10 mt-2 flex items-center justify-center py-1 [@media(max-width:639px)_and_(max-height:620px)]:hidden sm:mt-4 sm:flex-1 sm:py-4">
            <img
              src="/images/login/login-hero.png"
              alt="Flagships platform illustration"
              className="mx-auto h-auto max-h-[92px] w-full max-w-[200px] object-contain object-center drop-shadow-[0_12px_30px_rgba(37,99,235,0.12)] sm:max-h-none sm:max-w-[280px] lg:max-w-[430px]"
            />
          </div>
        </div>

        <div className="flex flex-col bg-white px-4 py-4 sm:h-full sm:min-h-0 sm:overflow-y-auto sm:px-6 sm:py-4 lg:px-14 lg:py-8">
          <div className="flex justify-end">
            <Select
              className="w-[96px]"
              value={language}
              onChange={(val) => setLanguage(val as "EN" | "Kiny")}
              aria-label="Language"
              variant="secondary"
            >
              <Select.Trigger className="h-8 text-[11px] font-semibold">
                <Select.Value>
                  {() => (
                    <span className="flex items-center gap-1.5">
                      <LanguageFlag language={language} />
                      {language}
                    </span>
                  )}
                </Select.Value>
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover placement="bottom end">
                <ListBox>
                  <ListBox.Item id="EN" textValue="EN">
                    <span className="flex items-center gap-2 text-[11px]">
                      <LanguageFlag language="EN" />
                      EN
                    </span>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="Kiny" textValue="Kiny">
                    <span className="flex items-center gap-2 text-[11px]">
                      <LanguageFlag language="Kiny" />
                      Kiny
                    </span>
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

          <div className="mx-auto flex w-full max-w-[420px] flex-col justify-center sm:flex-1">
            <div>
              <h1 className="text-[1.55rem] font-extrabold tracking-[-0.03em] text-black lg:text-[2.15rem]">{title}</h1>
              <p className="mt-1.5 text-[0.92rem] text-neutral-600 lg:mt-3 lg:text-[0.98rem]">{description}</p>
            </div>

            {children}
          </div>
        </div>
      </section>
    </main>
  );
}

