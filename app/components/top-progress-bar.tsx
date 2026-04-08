import { useEffect, useRef, useState } from "react";
import { useNavigation } from "react-router";

export function TopProgressBar() {
  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isNavigating) {
      setVisible(true);
      setWidth(20);
      timerRef.current = setInterval(() => {
        setWidth((w) => {
          // Slow down as it approaches 90 — never completes on its own
          if (w >= 90) return w;
          const remaining = 90 - w;
          return w + remaining * 0.1;
        });
      }, 300);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setWidth(100);
      const hide = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 400);
      return () => clearTimeout(hide);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isNavigating]);

  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-label="Page loading"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "3px",
        width: `${width}%`,
        backgroundColor: "oklch(var(--accent) / 1)",
        transition: width === 100 ? "width 0.2s ease-out" : "width 0.3s ease-in-out",
        zIndex: 9999,
      }}
    />
  );
}
