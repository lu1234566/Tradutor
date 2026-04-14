import React from "react";
import { cn } from "@/src/utils";
import { ChevronDown } from "lucide-react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] px-1">{label}</label>}
        <div className="relative group">
          <select
            ref={ref}
            className={cn(
              "w-full appearance-none rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm text-slate-700 focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/5 disabled:opacity-50 disabled:bg-slate-50 transition-all shadow-soft group-hover:border-slate-200",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-300 group-hover:text-brand-500 transition-all">
            <ChevronDown className="h-3.5 w-3.5 group-hover:scale-110" />
          </div>
        </div>
      </div>
    );
  }
);
Select.displayName = "Select";
