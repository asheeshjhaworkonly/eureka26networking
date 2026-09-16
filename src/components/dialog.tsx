"use client";
import { useEffect, useRef } from "react";
export function Dialog({
  children,
  onClose,
  labelledBy,
  className,
}: {
  children: React.ReactNode;
  onClose: () => void;
  labelledBy: string;
  className: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current
      ?.querySelector<HTMLElement>("[autofocus],button,input,select,a[href]")
      ?.focus();
    return () => {
      document.body.style.overflow = priorOverflow;
      previous?.focus();
    };
  }, []);
  function key(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const items = Array.from(
      ref.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled),input:not(:disabled),select:not(:disabled),a[href],[tabindex="0"]',
      ) || [],
    );
    const first = items[0],
      last = items.at(-1);
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={key}
    >
      <section
        ref={ref}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </section>
    </div>
  );
}
