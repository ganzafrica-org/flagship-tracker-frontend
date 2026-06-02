import type { ReactNode } from "react";
import { Alert, Toast } from "@heroui/react";

export type AppAlertStatus = "default" | "success" | "danger" | "warning";

interface AppAlertProps {
  status?: AppAlertStatus;
  title?: ReactNode;
  /** Main message. Accepts a string or a list of strings (rendered as bullets). */
  message?: ReactNode | string[];
  className?: string;
}

/**
 * Inline banner for surfacing API errors / success states within a form or page.
 * For transient feedback, use the `toast` helpers exported below.
 */
export default function AppAlert({
  status = "danger",
  title,
  message,
  className = "",
}: AppAlertProps) {
  if (!message && !title) return null;

  return (
    <Alert status={status} className={className}>
      <Alert.Indicator />
      <Alert.Content>
        {title ? <Alert.Title>{title}</Alert.Title> : null}
        {Array.isArray(message) ? (
          <Alert.Description>
            <ul className="list-disc pl-4 space-y-0.5">
              {message.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
          </Alert.Description>
        ) : message ? (
          <Alert.Description>{message}</Alert.Description>
        ) : null}
      </Alert.Content>
    </Alert>
  );
}

/** Transient toast helpers (Toast.Provider is mounted in root.tsx). */
export const toast = {
  success: (message: ReactNode) => Toast.toast.success(message),
  error: (message: ReactNode) => Toast.toast.danger(message),
  info: (message: ReactNode) => Toast.toast.info(message),
  warning: (message: ReactNode) => Toast.toast.warning(message),
};
