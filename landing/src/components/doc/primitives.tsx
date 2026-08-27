import { MoveUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DocField } from "@/content";

/** A typed sheet of paper. */
export function DocSheet({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("paper p-5 sm:p-6", className)} {...props}>
      {children}
    </div>
  );
}

/** The typed header row of a document: title left, annotation right. */
export function DocHeader({
  title,
  annotation,
  tone = "ink",
}: {
  title: string;
  annotation?: string;
  tone?: "ink" | "carbon";
}) {
  return (
    <div
      className={cn(
        "mb-4 flex items-baseline justify-between gap-4 border-b pb-2",
        tone === "ink"
          ? "border-ink/60 text-ink"
          : "border-carbon-300/60 text-carbon-100",
      )}
    >
      <span className="doc-label font-bold">{title}</span>
      {annotation ? (
        <span
          className={cn(
            "doc-label-sm",
            tone === "ink" ? "text-ink-soft" : "text-carbon-300",
          )}
        >
          {annotation}
        </span>
      ) : null}
    </div>
  );
}

/** One ruled field: typed label over a filled-in value. */
export function FieldRow({
  field,
  tone = "ink",
  highlight = false,
  className,
}: {
  field: DocField;
  tone?: "ink" | "carbon";
  highlight?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[6.5rem_1fr] items-baseline gap-3 py-2 sm:grid-cols-[7.5rem_1fr]",
        highlight && "bg-carbon-600/10",
        className,
      )}
    >
      <span
        className={cn(
          "doc-label-sm",
          tone === "ink" ? "text-ink-soft" : "text-carbon-300",
        )}
      >
        {field.label}
      </span>
      <span
        className={cn(
          "fill-line pb-1 text-[0.9375rem] leading-snug font-medium",
          tone === "ink" ? "text-ink" : "text-carbon-100",
          highlight && (tone === "ink" ? "text-carbon-800" : "text-carbon-300"),
        )}
      >
        {field.value}
      </span>
    </div>
  );
}

/** The rubber stamp. Rendered inline; animation is applied by parents. */
export function Stamp({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "stamp inline-block text-[clamp(1.25rem,1rem+1.2vw,1.875rem)]",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/** A routing arrow marker in the file's grammar. */
export function RouteMark({ className }: { className?: string }) {
  return (
    <MoveUpRight
      aria-hidden
      strokeWidth={2.25}
      className={cn("size-4 text-carbon-400", className)}
    />
  );
}

/** Horizontal pipeline of states, ruled like a form's checkbox row. */
export function PipelineRow({
  label,
  steps,
  tone = "ink",
  activeIndex = 2,
}: {
  label: string;
  steps: string[];
  tone?: "ink" | "carbon";
  activeIndex?: number;
}) {
  return (
    <div>
      <p
        className={cn(
          "doc-label-sm mb-3",
          tone === "ink" ? "text-ink-soft" : "text-carbon-300",
        )}
      >
        {label}
      </p>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2">
        {steps.map((step, i) => (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "doc-label-sm border px-2 py-1",
                i === activeIndex
                  ? tone === "ink"
                    ? "border-carbon-700 bg-carbon-600/10 text-carbon-800"
                    : "border-carbon-300 bg-carbon-600/20 text-carbon-100"
                  : tone === "ink"
                    ? "border-sheet-line text-ink-soft"
                    : "border-carbon-300/40 text-carbon-300",
              )}
            >
              {step}
            </span>
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "h-px w-4 sm:w-6",
                  tone === "ink" ? "bg-ink-faint" : "bg-carbon-300/50",
                )}
              />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
