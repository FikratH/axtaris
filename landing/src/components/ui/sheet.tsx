"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * shadcn-pattern Sheet on Radix Dialog, restyled as a paper file pulled
 * from the drawer: slides in from the right on a navy scrim.
 */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetTitle = DialogPrimitive.Title;

export function SheetContent({
  className,
  children,
  closeLabel,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  closeLabel: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-cover-950/70 backdrop-blur-[2px] data-[state=open]:animate-[sheet-fade_200ms_ease-out] data-[state=closed]:animate-[sheet-fade-out_200ms_ease-in_forwards] motion-reduce:animate-none" />
      <DialogPrimitive.Content
        className={cn(
          "paper fixed inset-y-0 right-0 z-50 flex w-[min(20rem,86vw)] flex-col gap-1 overflow-y-auto p-6 pt-16 pb-[calc(1.5rem+env(safe-area-inset-bottom))] data-[state=open]:animate-[sheet-in_260ms_cubic-bezier(0.22,1,0.36,1)] data-[state=closed]:animate-[sheet-out_200ms_ease-in_forwards] motion-reduce:animate-none",
          className,
        )}
        {...props}
      >
        <DialogPrimitive.Close
          aria-label={closeLabel}
          className="absolute top-4 right-4 flex size-11 cursor-pointer items-center justify-center rounded-[2px] text-ink-soft transition-colors hover:bg-sheet-shade hover:text-ink"
        >
          <X className="size-5" strokeWidth={1.75} aria-hidden />
        </DialogPrimitive.Close>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
