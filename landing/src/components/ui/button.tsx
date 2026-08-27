import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * shadcn-pattern button, restyled for the Carbon File world:
 * - `stamp`: the primary action — teal stamp-pad fill, navy ink text;
 * - `countersign`: the subordinate action — a ruled outline awaiting a signature;
 * - `quiet`: an inline typed action.
 * Squared 2px corners: this is a document, not an app chip.
 */
const buttonVariants = cva(
  "inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-[2px] px-6 py-2.5 font-[family-name:var(--font-text)] text-[0.9375rem] font-semibold transition-[background-color,border-color,color,transform,box-shadow] duration-150 ease-out select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        stamp:
          "bg-carbon-600 text-cover-950 shadow-[0_2px_0_0_var(--carbon-700)] hover:bg-carbon-500 active:shadow-none",
        countersign:
          "border border-current bg-transparent text-brand-100 hover:bg-brand-50/10 data-[on=sheet]:text-brand-600 data-[on=sheet]:hover:bg-brand-600/10",
        quiet:
          "min-h-0 px-1 py-0.5 font-medium underline decoration-current/40 underline-offset-4 hover:decoration-current",
      },
    },
    defaultVariants: { variant: "stamp" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant }), className)} {...props} />
  );
}

/** Anchor styled as a button — for real links (mailto, routes). */
export function ButtonLink({
  className,
  variant,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> &
  VariantProps<typeof buttonVariants>) {
  return (
    <a className={cn(buttonVariants({ variant }), className)} {...props} />
  );
}

export { buttonVariants };
