import type { ReactNode } from "react";
import { Modal } from "@heroui/react";

interface AppModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Tailwind classes controlling dialog width. */
  dialogClassName?: string;
  /** Fill the whole screen below the `sm` breakpoint instead of floating as a card. */
  fullScreenOnMobile?: boolean;
}

const FULL_SCREEN_DIALOG = "max-sm:!m-0 max-sm:!h-dvh max-sm:!max-h-dvh max-sm:!w-screen max-sm:!max-w-none max-sm:!rounded-none";

/**
 * Thin wrapper over HeroUI's Modal compound component.
 * Mirrors the inline pattern used across the individuals pages.
 */
export default function AppModal({
  isOpen,
  onOpenChange,
  title,
  children,
  footer,
  dialogClassName = "sm:max-w-lg w-full",
  fullScreenOnMobile = false,
}: AppModalProps) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container className={fullScreenOnMobile ? "max-sm:!p-0" : undefined}>
        <Modal.Dialog className={fullScreenOnMobile ? `${dialogClassName} ${FULL_SCREEN_DIALOG}` : dialogClassName}>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Heading>{title}</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="space-y-4">{children}</Modal.Body>
          {footer ? <Modal.Footer className="gap-3">{footer}</Modal.Footer> : null}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
