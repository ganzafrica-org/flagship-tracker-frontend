interface PageTitleCardProps {
  title: string;
  className?: string;
}

export function PageTitleCard({ title, className }: PageTitleCardProps) {
  return (
    <div
      style={{ borderRadius: "12px" }}
      className={`w-full max-w-full min-w-0 rounded-lg overflow-hidden bg-(--surface) border border-(--separator) px-6 py-5 ${className ?? ""}`}
    >
      <h1 className="text-2xl font-bold text-(--foreground)">{title}</h1>
    </div>
  );
}
