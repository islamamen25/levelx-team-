"use client";

import * as React from "react";
import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Accordion = BaseAccordion.Root;

export function AccordionItem({
  children,
  className,
  value,
  ...props
}: React.ComponentProps<typeof BaseAccordion.Item>) {
  return (
    <BaseAccordion.Item
      value={value}
      className={cn("border-b border-iron", className)}
      {...props}
    >
      {children}
    </BaseAccordion.Item>
  );
}

export function AccordionTrigger({
  children,
  className,
  ...props
}: React.ComponentProps<typeof BaseAccordion.Header>) {
  return (
    <BaseAccordion.Header className="flex" {...props}>
      <BaseAccordion.Trigger
        className={cn(
          "flex flex-1 cursor-pointer items-center justify-between py-4 text-sm font-semibold text-ceramic transition-colors hover:text-mint",
          "[&[data-panel-open]>svg]:rotate-180",
          className,
        )}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-slate transition-transform duration-200" />
      </BaseAccordion.Trigger>
    </BaseAccordion.Header>
  );
}

export function AccordionContent({
  children,
  className,
  ...props
}: React.ComponentProps<typeof BaseAccordion.Panel>) {
  return (
    <BaseAccordion.Panel
      className={cn(
        "overflow-hidden text-sm",
        "data-[open]:animate-in data-[closed]:animate-out",
        "data-[open]:fade-in-0 data-[closed]:fade-out-0",
        className,
      )}
      {...props}
    >
      <div className="pb-4 pt-0">{children}</div>
    </BaseAccordion.Panel>
  );
}
