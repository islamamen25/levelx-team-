"use client";

import * as React from "react";
import { Dialog } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog.Root>
  );
}

export function SheetTrigger({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn("cursor-pointer", className)} {...props}>
      {children}
    </button>
  );
}

export function SheetContent({
  children,
  className,
  side = "right",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showCloseButton: _sc,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  side?: "left" | "right";
  showCloseButton?: boolean;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity duration-300" />
      <Dialog.Popup
        className={cn(
          "fixed inset-y-0 z-50 flex w-[min(320px,85vw)] flex-col bg-white shadow-2xl",
          "transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
          side === "left"
            ? "left-0 data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full"
            : "right-0 data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full",
          className,
        )}
        {...props}
      >
        {children}
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

export const SheetClose = Dialog.Close;
