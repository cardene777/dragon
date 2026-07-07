"use client";

import { createContext, useCallback, useContext, useState } from "react";
import * as Toast from "@radix-ui/react-toast";
import { X, Check, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Toast context — Radix Toast wrapper。
 * useToast() hook で toast({ type: "success"|"error"|"info", title, description })。
 *
 * Radix ToastProvider を app root で mount、 各 page 内で useToast() で呼出。
 */

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (input: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let seq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((input: Omit<ToastItem, "id">) => {
    const id = `t-${++seq}`;
    setItems((prev) => [...prev, { ...input, id }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <Toast.Provider swipeDirection="right" duration={3500}>
        {children}
        {items.map((item) => (
          <Toast.Root
            key={item.id}
            className={cn(
              "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl bg-[var(--color-surface)] p-4 shadow-2xl",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-right-full",
            )}
            onOpenChange={(open) => {
              if (!open) setItems((prev) => prev.filter((x) => x.id !== item.id));
            }}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-white",
                item.type === "success" && "bg-emerald-500",
                item.type === "error" && "bg-red-500",
                item.type === "info" && "bg-[var(--color-accent)]",
              )}
            >
              {item.type === "success" && <Check size={16} />}
              {item.type === "error" && <AlertCircle size={16} />}
              {item.type === "info" && <Info size={16} />}
            </div>
            <div>
              <Toast.Title className="text-[13px] font-semibold text-[var(--color-ink)]">
                {item.title}
              </Toast.Title>
              {item.description && (
                <Toast.Description className="mt-0.5 text-[12px] text-[var(--color-ink-dim)]">
                  {item.description}
                </Toast.Description>
              )}
            </div>
            <Toast.Close asChild>
              <button
                type="button"
                className="rounded-full p-1 text-[var(--color-ink-mute)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)]"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-4 right-4 z-[100] flex w-96 flex-col gap-2 outline-none max-w-[100vw] px-4" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
