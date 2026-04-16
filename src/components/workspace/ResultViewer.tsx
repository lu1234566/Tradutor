import React from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/src/utils";
import { ViewPreferences } from "@/src/services/viewService";

interface ResultViewerProps {
  content: string;
  isTranslating: boolean;
  placeholder?: string;
  viewPrefs: ViewPreferences;
  className?: string;
}

export const ResultViewer: React.FC<ResultViewerProps> = ({
  content,
  isTranslating,
  viewPrefs,
  className
}) => {
  if (!content && !isTranslating) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center gap-6 paper-texture">
        <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 shadow-soft border border-slate-100">
          <BookOpen className="h-10 w-10" />
        </div>
        <div className="max-w-xs space-y-2">
          <p className="text-sm font-semibold text-slate-500 leading-relaxed">
            Pronto para a metamorfose literária.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Clique em <span className="text-brand-700 font-bold">Traduzir</span> para iniciar a análise contextual.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "w-full h-full min-h-[300px] lg:min-h-[400px] p-8 lg:p-12 overflow-y-auto selection:bg-brand-100 selection:text-brand-900 scroll-smooth",
        "font-serif leading-relaxed text-slate-800 antialiased",
        "whitespace-pre-wrap break-words transition-all duration-300",
        isTranslating && "opacity-40 animate-pulse pointer-events-none",
        viewPrefs.density === 'compact' ? 'text-base' : 
        viewPrefs.density === 'reading' ? 'text-xl leading-loose max-w-3xl mx-auto px-6' : 
        'text-lg',
        className
      )}
      style={{
        tabSize: 4,
        fontFeatureSettings: '"kern" 1, "liga" 1'
      }}
    >
      {content}
    </div>
  );
};
