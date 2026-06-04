import type { ReactNode } from "react";
import { Avatar } from "@heroui/react";

type AvatarSize = "sm" | "md" | "lg";

interface AppAvatarProps {
  /** Full name used to derive initials when no image is given. */
  name: string;
  src?: string | null;
  size?: AvatarSize;
  className?: string;
  /** Tailwind color classes for the fallback (e.g. background + text). */
  fallbackClassName?: string;
  /** Explicit fallback background color (hex/CSS var); overrides fallbackClassName bg. */
  colorHex?: string;
}

/** Derive up to two uppercase initials from a name. */
export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/** Thin wrapper over HeroUI Avatar that renders initials when there is no image. */
export default function AppAvatar({
  name,
  src,
  size = "md",
  className = "",
  fallbackClassName = "bg-(--accent) text-white",
  colorHex,
}: AppAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      {src ? <Avatar.Image src={src} alt={name} /> : null}
      <Avatar.Fallback
        className={`text-xs font-semibold ${colorHex ? "text-white" : fallbackClassName}`}
        style={colorHex ? { backgroundColor: colorHex } : undefined}
      >
        {initialsOf(name)}
      </Avatar.Fallback>
    </Avatar>
  );
}

interface AvatarGroupItem {
  name: string;
  src?: string | null;
  /** Optional accent color for this avatar's fallback background. */
  color?: string;
}

interface AppAvatarGroupProps {
  items: AvatarGroupItem[];
  /** Max avatars shown before collapsing into a +N chip. */
  max?: number;
  size?: AvatarSize;
  /** Rendered around the group — e.g. to attach a popover/tooltip trigger. */
  children?: ReactNode;
}

/**
 * Overlapping avatar stack that shows up to `max` avatars and a "+N" overflow
 * avatar. HeroUI has no AvatarGroup, so this composes wrapped Avatars.
 */
export function AppAvatarGroup({ items, max = 3, size = "sm" }: AppAvatarGroupProps) {
  const shown = items.slice(0, max);
  const overflow = items.length - shown.length;

  return (
    <div className="flex items-center -space-x-2">
      {shown.map((item, i) => (
        <AppAvatar
          key={`${item.name}-${i}`}
          name={item.name}
          src={item.src}
          size={size}
          className="ring-2 ring-(--surface)"
          colorHex={item.color}
        />
      ))}
      {overflow > 0 ? (
        <div
          className="flex items-center justify-center rounded-full ring-2 ring-(--surface) bg-(--default) text-(--foreground) text-xs font-semibold h-8 w-8"
          aria-label={`${overflow} more`}
        >
          +{overflow}
        </div>
      ) : null}
    </div>
  );
}
