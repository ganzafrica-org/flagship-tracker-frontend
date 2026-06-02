import type { ReactNode } from "react";
import { Button, Modal, Spinner } from "@heroui/react";

type AppAlertDialogTone = "danger" | "default";

interface AppAlertDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: AppAlertDialogTone;
  isPending?: boolean;
  onConfirm: () => void;
}

/**
 * Confirmation dialog for destructive / update actions.
 * Controlled via isOpen/onOpenChange so it can be driven by a parent's state
 * and reflect mutation `isPending` on the confirm button.
 */
export default function AppAlertDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  isPending = false,
  onConfirm,
}: AppAlertDialogProps) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-md w-full">
          <Modal.Header>
            <Modal.Heading>{title}</Modal.Heading>
          </Modal.Header>
          {description ? (
            <Modal.Body>
              <p className="text-sm text-(--foreground-600)">{description}</p>
            </Modal.Body>
          ) : null}
          <Modal.Footer className="gap-3">
            <Button
              variant="outline"
              slot="close"
              isDisabled={isPending}
              className="!rounded-3xl"
            >
              {cancelLabel}
            </Button>
            <Button
              variant={tone === "danger" ? "danger" : "primary"}
              onPress={onConfirm}
              isPending={isPending}
              className="!rounded-3xl"
            >
              {({ isPending: pending }) => (
                <>
                  {pending && <Spinner color="current" size="sm" />}
                  {confirmLabel}
                </>
              )}
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
