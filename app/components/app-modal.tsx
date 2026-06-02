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
}

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
}: AppModalProps) {
  return (
    <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container>
        <Modal.Dialog className={dialogClassName}>
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
