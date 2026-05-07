"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

type ToastType = "success" | "error";
type Toast = { id: number; type: ToastType; message: string };

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const add = useCallback((type: ToastType, message: string) => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const ctx: ToastContextValue = {
    success: (msg) => add("success", msg),
    error: (msg) => add("error", msg),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium",
              "pointer-events-auto animate-in slide-in-from-bottom-2 fade-in duration-200",
              t.type === "success"
                ? "bg-white dark:bg-gray-900 border-green-200 dark:border-green-800 text-gray-800 dark:text-gray-100"
                : "bg-white dark:bg-gray-900 border-red-200 dark:border-red-800 text-gray-800 dark:text-gray-100",
            ].join(" ")}
          >
            {t.type === "success"
              ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
            <span>{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
