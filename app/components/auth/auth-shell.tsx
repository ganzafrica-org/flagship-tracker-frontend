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
    <main className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#1f95c8_0%,#0f5872_100%)] p-4 text-(--foreground) sm:p-6 lg:p-8">
      <section className="grid h-full max-h-[560px] w-full max-w-[1160px] overflow-hidden rounded-[14px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative flex min-h-0 flex-col overflow-hidden rounded-br-[92px] bg-[#edf4fb] px-6 py-7 sm:px-9 sm:py-8 lg:h-full lg:rounded-br-[124px] lg:px-10 lg:py-9">
          <Link to="/login" viewTransition className="relative z-10 flex w-fit items-center gap-1.5 text-[color:var(--accent)]">
            <div className="flex h-9 w-9 items-center justify-center">
              <IconHomeFilled size={27} />
            </div>
            <span className="text-[1.62rem] font-extrabold tracking-[-0.03em]">Flagships</span>
          </Link>

          <div className="relative z-10 mt-8 flex flex-1 items-center justify-center py-4 lg:mt-6">
            <img
              src="/images/login/login-hero.png"
              alt="Flagships platform illustration"
              className="mx-auto h-auto w-full max-w-[340px] object-contain object-center drop-shadow-[0_12px_30px_rgba(37,99,235,0.12)] sm:max-w-[390px] lg:max-w-[430px]"
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-col bg-white px-6 py-6 sm:px-10 sm:py-7 lg:h-full lg:px-14 lg:py-8">
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

          <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
            <div>
              <h1 className="text-[2rem] font-extrabold tracking-[-0.03em] text-black sm:text-[2.15rem]">{title}</h1>
              <p className="mt-3 text-[0.98rem] text-neutral-600">{description}</p>
            </div>

            {children}
          </div>
        </div>
      </section>
    </main>
  );
}

