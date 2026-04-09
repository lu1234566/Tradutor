import React, { useState } from "react";
import { BookMarked, ChevronDown, ChevronUp } from "lucide-react";
import { viewService, ViewPreferences } from "@/src/services/viewService";
import { cn } from "@/src/utils";
import { motion, AnimatePresence } from "motion/react";

interface TranslatorNotesProps {
  notes: string[];
  isVisible: boolean;
  viewPrefs: ViewPreferences;
  defaultExpanded?: boolean;
}

export const TranslatorNotes: React.FC<TranslatorNotesProps> = ({ 
  notes, 
  isVisible, 
  viewPrefs,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!isVisible) return null;

  const densityClasses = viewService.getDensityClasses(viewPrefs.density);

  return (
    <div className={cn(
      "bg-amber-50/50 border border-amber-200/60 rounded-2xl shadow-sm transition-all overflow-hidden",
      viewPrefs.density === 'compact' ? 'mt-4' : viewPrefs.density === 'reading' ? 'mt-10' : 'mt-6',
      densityClasses.card
    )}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between text-amber-800 hover:bg-amber-100/50 transition-colors",
          viewPrefs.density === 'compact' ? 'p-3' : viewPrefs.density === 'reading' ? 'p-6' : 'p-4'
        )}
      >
        <div className="flex items-center gap-2">
          <BookMarked className={densityClasses.icon} />
          <h3 className={cn(
            "font-semibold uppercase tracking-wider",
            densityClasses.label
          )}>Notas do Tradutor</h3>
          {notes.length > 0 && (
            <span className="ml-2 px-2 py-0.5 bg-amber-200/50 rounded-full text-[10px] font-bold">
              {notes.length}
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className={cn(
              "border-t border-amber-200/30",
              viewPrefs.density === 'compact' ? 'p-3 pt-1' : viewPrefs.density === 'reading' ? 'p-6 pt-2' : 'p-4 pt-2'
            )}>
              {notes.length > 0 ? (
                <ul className={densityClasses.spacing}>
                  {notes.map((note, index) => (
                    <li key={index} className={cn(
                      "flex items-start text-amber-900/80 leading-relaxed font-serif",
                      viewPrefs.density === 'compact' ? 'gap-2' : viewPrefs.density === 'reading' ? 'gap-5' : 'gap-3',
                      densityClasses.text
                    )}>
                      <span className={cn(
                        "flex shrink-0 items-center justify-center rounded-full bg-amber-200/50 font-medium text-amber-700 mt-0.5",
                        viewPrefs.density === 'compact' ? 'h-4 w-4 text-[9px]' : viewPrefs.density === 'reading' ? 'h-7 w-7 text-sm' : 'h-5 w-5 text-xs'
                      )}>
                        {index + 1}
                      </span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={cn(
                  "italic font-serif text-amber-700/60",
                  densityClasses.text
                )}>
                  Nenhuma nota de adaptação cultural ou contexto gerada para este trecho.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
