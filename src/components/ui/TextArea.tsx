import React from "react";
import { cn } from "@/src/utils";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col h-full">
        {label && (
          <label className="mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            "flex-1 w-full resize-none rounded-3xl border border-slate-100 bg-white p-8 text-lg text-slate-800 shadow-premium placeholder:text-slate-300 focus:border-brand-200 focus:outline-none focus:ring-8 focus:ring-brand-500/5 disabled:cursor-not-allowed disabled:opacity-50 transition-all font-serif leading-relaxed paper-texture",
            error && "border-red-200 focus:border-red-300 focus:ring-red-500/5",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);
TextArea.displayName = "TextArea";
