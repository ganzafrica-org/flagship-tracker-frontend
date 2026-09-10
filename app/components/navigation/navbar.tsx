import { useState } from "react";
import { Avatar, Dropdown, Label } from "@heroui/react";
import {
  IconMenu2,
  IconHelp,
  IconChevronDown,
  IconUser,
  IconLogout,
} from "@tabler/icons-react";

import UserProfileModal from "~/components/pages/profile/user-profile-modal";

interface NavbarProps {
  onMenuToggle: () => void;
  userName: string;
  onLogout?: () => void;
}

interface Language {
  id: string;
  label: string;
  flag: React.ReactNode;
}

function FlagUK() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="20" height="14" aria-hidden="true">
      <clipPath id="uk-clip">
        <path d="M0 0v30h60V0z" />
      </clipPath>
      <path d="M0 0v30h60V0z" fill="#012169" />
      <path d="M0 0l60 30M60 0L0 30" stroke="#fff" strokeWidth="6" />
      <path d="M0 0l60 30M60 0L0 30" stroke="#C8102E" strokeWidth="4" clipPath="url(#uk-clip)" />
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
      <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

function FlagFR() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" width="20" height="14" aria-hidden="true">
      <rect width="1" height="2" fill="#002395" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#ED2939" />
    </svg>
  );
}

const LANGUAGES: Language[] = [
  { id: "en", label: "English", flag: <FlagUK /> },
  { id: "fr", label: "Français", flag: <FlagFR /> },
];

export default function Navbar({ onMenuToggle, userName, onLogout }: NavbarProps) {
  const [currentLang, setCurrentLang] = useState<string>("en");
  const [profileOpen, setProfileOpen] = useState(false);

  const selectedLanguage = LANGUAGES.find((l) => l.id === currentLang) ?? LANGUAGES[0];

  return (
    <>
      <header className="h-16 bg-(--accent) text-(--accent-foreground) flex items-center justify-between px-2 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button
            className="flex items-center justify-center w-9 h-9 rounded-(--radius) hover:bg-white/10 transition-colors"
            aria-label="Toggle sidebar"
            onClick={onMenuToggle}
          >
            <IconMenu2 size={22} />
          </button>
          <span className="font-bold text-base tracking-tight select-none">
            Flagship Tracker
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="flex items-center justify-center w-9 h-9 rounded-(--radius) hover:bg-white/10 transition-colors"
            aria-label="Help"
          >
            <IconHelp size={22} />
          </button>

          <Dropdown>
            <Dropdown.Trigger
              className="flex flex-row items-center gap-3 rounded-(--radius) px-3 py-1.5 cursor-pointer bg-white/10 border-none shadow-none hover:bg-white/20 transition-colors text-(--accent-foreground) outline-none"
            >
              <Avatar size="sm" color="accent">
                <Avatar.Fallback>
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </Avatar.Fallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:block">{userName}</span>
              <IconChevronDown size={16} />
            </Dropdown.Trigger>
            <Dropdown.Popover placement="bottom end" className="w-(--trigger-width) min-w-0">
              <Dropdown.Menu
                onAction={(key) => {
                  if (key === "profile") {
                    setProfileOpen(true);
                  }
                  if (key === "logout") {
                    onLogout?.();
                  }
                }}
              >
                <Dropdown.Item id="profile" textValue="Profile">
                  <IconUser size={16} />
                  <Label>Profile</Label>
                </Dropdown.Item>
                <Dropdown.Item id="logout" textValue="Logout" variant="danger">
                  <IconLogout size={16} className="text-(--danger)" />
                  <Label>Logout</Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>

          <Dropdown>
            <Dropdown.Trigger
              className="flex items-center gap-1.5 py-1 px-2 border border-white/60 rounded-3xl hover:bg-white/10 transition-colors outline-none"
              aria-label="Switch language"
            >
              {selectedLanguage.flag}
              <span className="text-sm font-medium text-(--accent-foreground)">
                {selectedLanguage.id}
              </span>
            </Dropdown.Trigger>
            <Dropdown.Popover placement="bottom end" className="min-w-36">
              <Dropdown.Menu
                selectionMode="single"
                selectedKeys={new Set([currentLang])}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0];
                  if (typeof selected === "string") setCurrentLang(selected);
                }}
              >
                {LANGUAGES.map((lang) => (
                  <Dropdown.Item key={lang.id} id={lang.id} textValue={lang.label}>
                    <Dropdown.ItemIndicator />
                    {lang.flag}
                    <Label>{lang.label}</Label>
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      </header>

      <UserProfileModal isOpen={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
