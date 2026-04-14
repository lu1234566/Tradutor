import React, { useState } from "react";
import { BookMarked, ChevronDown, ChevronUp } from "lucide-react";
import { viewService, ViewPreferences } from "@/src/services/viewService";
import { cn } from "@/src/utils";
import { motion, AnimatePresence } from "motion/react";

interface TranslatorNotesProps {
  notes: string[];
  adaptedExpressions?: { original: string; adapted: string; explanation: string }[];
  translationStrategy?: string;
  toneDetected?: string;
  isVisible: boolean;
  viewPrefs: ViewPreferences;
  defaultExpanded?: boolean;
}

export const TranslatorNotes: React.FC<TranslatorNotesProps> = ({ 
  notes, 
  adaptedExpressions = [],
  translationStrategy,
  toneDetected,
  isVisible, 
  viewPrefs,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!isVisible) return null;

  const densityClasses = viewService.getDensityClasses(viewPrefs.density);
  const hasContent = notes.length > 0 || adaptedExpressions.length > 0 || translationStrategy || toneDetected;

  return (
    <div className={cn(
      "bg-[#FDF9F3] border border-amber-100 rounded-2xl shadow-soft transition-all overflow-hidden",
      viewPrefs.density === 'compact' ? 'mt-4' : viewPrefs.density === 'reading' ? 'mt-10' : 'mt-6',
      densityClasses.card
    )}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between text-amber-900 hover:bg-amber-50/50 transition-colors",
          viewPrefs.density === 'compact' ? 'p-4' : viewPrefs.density === 'reading' ? 'p-8' : 'p-5'
        )}
      >
        <div className="flex items-center gap-3">
          <BookMarked className={cn("text-amber-600", densityClasses.icon)} />
          <h3 className={cn(
            "font-bold uppercase tracking-[0.15em] text-amber-800",
            densityClasses.label
          )}>Insights do Tradutor</h3>
          {hasContent && (
            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[9px] font-bold">
              {notes.length + adaptedExpressions.length + (translationStrategy ? 1 : 0)}
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4 text-amber-400" /> : <ChevronDown className="h-4 w-4 text-amber-400" />}
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className={cn(
              "border-t border-amber-100/50 flex flex-col gap-8",
              viewPrefs.density === 'compact' ? 'p-4 pt-4' : viewPrefs.density === 'reading' ? 'p-8 pt-6' : 'p-6 pt-6'
            )}>
              {/* Strategy & Tone */}
              {(translationStrategy || toneDetected) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {toneDetected && (
                    <div className="bg-white/60 p-4 rounded-2xl border border-amber-100/50 shadow-sm">
                      <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">Tom Detectado</h4>
                      <p className="text-sm text-amber-900 font-serif italic leading-relaxed">"{toneDetected}"</p>
                    </div>
                  )}
                  {translationStrategy && (
                    <div className="bg-white/60 p-4 rounded-2xl border border-amber-100/50 shadow-sm">
                      <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2">Estratégia Adotada</h4>
                      <p className="text-sm text-amber-900 font-serif leading-relaxed">{translationStrategy}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Adapted Expressions */}
              {adaptedExpressions.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest px-1">Adaptações Contextuais</h4>
                  <div className="grid gap-4">
                    {adaptedExpressions.map((exp, idx) => (
                      <div key={idx} className="bg-white/40 p-4 rounded-2xl border border-amber-100/30 flex flex-col gap-3">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-bold text-amber-900">"{exp.original}"</span>
                          <span className="text-amber-300">→</span>
                          <span className="font-bold text-emerald-800">"{exp.adapted}"</span>
                        </div>
                        <p className="text-[11px] text-amber-800/70 italic leading-relaxed font-serif">{exp.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* General Notes */}
              {notes.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest px-1">Observações Gerais</h4>
                  <ul className={densityClasses.spacing}>
                    {notes.map((note, index) => (
                      <li key={index} className={cn(
                        "flex items-start text-amber-900/80 leading-relaxed font-serif",
                        viewPrefs.density === 'compact' ? 'gap-3' : viewPrefs.density === 'reading' ? 'gap-6' : 'gap-4',
                        densityClasses.text
                      )}>
                        <span className={cn(
                          "flex shrink-0 items-center justify-center rounded-full bg-amber-100 font-medium text-amber-700 mt-1",
                          viewPrefs.density === 'compact' ? 'h-5 w-5 text-[10px]' : viewPrefs.density === 'reading' ? 'h-8 w-8 text-sm' : 'h-6 w-6 text-xs'
                        )}>
                          {index + 1}
                        </span>
                        <span className="pt-0.5">{note}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!hasContent && (
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
