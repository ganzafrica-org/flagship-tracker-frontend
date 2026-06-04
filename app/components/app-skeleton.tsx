import { Skeleton } from "@heroui/react";

interface AppSkeletonProps {
  className?: string;
}

/**
 * Thin wrapper over HeroUI's Skeleton so all loading placeholders share one
 * import and default styling. Use `className` to shape each placeholder
 * (height/width/rounding) to match the final content.
 */
export default function AppSkeleton({ className = "" }: AppSkeletonProps) {
  return <Skeleton className={`rounded-lg ${className}`} />;
}

/** A KPI-card-shaped placeholder. */
export function StatCardSkeleton() {
  return <AppSkeleton className="h-24 rounded-xl" />;
}

/** A chart-card-shaped placeholder. */
export function ChartSkeleton({ height = "h-72" }: { height?: string }) {
  return <AppSkeleton className={`${height} rounded-xl`} />;
}

/** A row of N skeleton table cells (used inside a table body while loading). */
export function TableRowSkeleton({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <AppSkeleton className="h-4 w-full" />
        </td>
      ))}
    </>
  );
}
