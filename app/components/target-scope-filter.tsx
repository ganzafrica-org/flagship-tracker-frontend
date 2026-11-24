import { TARGET_SCOPE_OPTIONS, type TargetScope } from "~/lib/target-scope";

export function TargetScopeFilter({
  value,
  onChange,
}: {
  value: TargetScope;
  onChange: (scope: TargetScope) => void;
}) {
  return (
    <div className="flex items-center rounded-full border border-(--separator) bg-(--surface) p-0.5">
      {TARGET_SCOPE_OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            className={`rounded-full px-3 py-1.5 text-sm whitespace-nowrap ${
              selected ? "bg-(--accent) font-medium text-white" : "text-(--muted)"
            }`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
