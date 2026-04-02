"use client";

import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

const baseClass =
  "w-full cursor-pointer appearance-none rounded-md border border-slate-700 bg-slate-950 text-slate-200 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500/25";

export type SelectWithChevronProps = ComponentProps<"select">;

export function SelectWithChevron({
  className,
  ...props
}: SelectWithChevronProps) {
  return (
    <div className="relative w-full">
      <select
        className={className ? `${baseClass} ${className}` : baseClass}
        {...props}
      />
      <ChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
        strokeWidth={2}
        aria-hidden
      />
    </div>
  );
}
