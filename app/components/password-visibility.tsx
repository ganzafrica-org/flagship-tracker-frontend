import { IconEye, IconEyeOff } from "@tabler/icons-react";

export function PasswordVisibilityButton({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={visible ? "Hide password" : "Show password"}
      onClick={onToggle}
      className="absolute top-1/2 right-1 flex h-7 w-8 -translate-y-1/2 items-center justify-center text-neutral-500 transition hover:text-(--accent)"
    >
      {visible ? <IconEyeOff size={16} stroke={1.8} /> : <IconEye size={16} stroke={1.8} />}
    </button>
  );
}
