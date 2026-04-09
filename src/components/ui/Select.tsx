import React from "react";
import { cn } from "@/src/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">{label}</label>}
        <div className="relative group">
          <select
            ref={ref}
            className={cn(
              "w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/5 disabled:opacity-50 disabled:bg-slate-50 transition-all shadow-sm group-hover:border-slate-300 group-hover:shadow-md",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 group-hover:text-brand-600 transition-all">
            <ChevronDown className="h-4 w-4 group-hover:scale-110" />
          </div>
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";
