import React from "react";
import { cn } from "@/src/utils";

interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, label, description, checked, onChange, ...props }, ref) => {
    return (
      <label className={cn("flex items-center justify-between gap-4 cursor-pointer group p-2 rounded-xl hover:bg-slate-50 transition-all", className)}>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-700 group-hover:text-brand-600 transition-colors uppercase tracking-wider">{label}</span>
          {description && <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{description}</span>}
        </div>
        <div className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full focus-within:ring-4 focus-within:ring-brand-500/10 transition-all">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={checked}
            onChange={onChange}
            ref={ref}
            {...props}
          />
          <span className="pointer-events-none absolute h-full w-full rounded-full bg-slate-200 transition-colors peer-checked:bg-brand-600" aria-hidden="true" />
          <span
            className={cn(
              "pointer-events-none absolute left-0 inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-premium ring-0 transition-transform duration-300 ease-in-out",
              checked ? "translate-x-6" : "translate-x-0.5"
            )}
            aria-hidden="true"
          />
        </div>
      </label>
    );
  }
);
Toggle.displayName = "Toggle";
