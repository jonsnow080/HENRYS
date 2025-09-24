"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "./use-toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end gap-3 p-4 sm:p-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto w-full max-w-sm rounded-3xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur",
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-1">
              {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
              {toast.description ? (
                <p className="text-sm text-muted-foreground">{toast.description}</p>
              ) : null}
              {toast.action}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="rounded-full p-1 text-muted-foreground transition hover:bg-muted"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
