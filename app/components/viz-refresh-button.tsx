import { Button, Spinner } from "@heroui/react";
import { IconRefresh } from "@tabler/icons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { toast } from "~/components/app-alert";
import { ApiError } from "~/lib/api";
import { refreshVisualizations } from "~/lib/queries/visualizations";

/**
 * Refreshes the analytics materialized views on the server, then invalidates the
 * cached visualization queries so the page refetches the fresh data.
 */
export default function VizRefreshButton() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: refreshVisualizations,
    onSuccess: () => {
      toast.success("Dashboards refreshed");
      queryClient.invalidateQueries({ queryKey: ["viz"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Failed to refresh"),
  });

  return (
    <Button
      variant="outline"
      className="!rounded-3xl"
      onPress={() => mutation.mutate()}
      isPending={mutation.isPending}
    >
      {({ isPending }) => (
        <>
          {isPending ? <Spinner size="sm" color="current" /> : <IconRefresh size={16} />}
          Refresh
        </>
      )}
    </Button>
  );
}
