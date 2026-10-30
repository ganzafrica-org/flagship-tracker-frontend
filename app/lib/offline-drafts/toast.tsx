import { toast } from "~/components/app-alert";

/** Shown whenever a form submission is saved locally instead of sent to the server. */
export function showDraftSavedToast() {
  toast.info(
    <div>
      <p className="font-medium">Data saved as draft</p>
      <p className="text-xs text-(--muted)">
        Don't worry — since you're offline, your data is saved and will be synced once you're back online.
      </p>
    </div>,
  );
}
