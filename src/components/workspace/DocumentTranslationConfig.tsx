import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Layers, 
  Hash, 
  MousePointer2, 
  ChevronRight, 
  ChevronLeft,
  Info,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ProcessingResult, 
  TranslationScope, 
  TranslationScopeMode,
  getDocumentTranslationScopeText
} from '../../services/documentService';
import { cn } from '../../utils';

import { viewService, ViewPreferences } from '../../services/viewService';

interface DocumentTranslationConfigProps {
  result: ProcessingResult;
  onConfirm: (text: string, scope: TranslationScope) => void;
  onBack: () => void;
  viewPrefs: ViewPreferences;
}

export const DocumentTranslationConfig: React.FC<DocumentTranslationConfigProps> = ({ 
  result, 
  onConfirm, 
  onBack,
  viewPrefs
}) => {
  const densityClasses = viewService.getDensityClasses(viewPrefs.density);
  const [mode, setMode] = useState<TranslationScopeMode>('full');
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [range, setRange] = useState<{ start: number; end: number }>({ 
    start: 1, 
    end: Math.min(5, result.metadata.pageCount || 1) 
  });
  const [selection, setSelection] = useState<string>("");
  
  const totalPages = result.metadata.pageCount || 1;
  const isLargeDocument = result.text.length > 10000;

  const handleConfirm = () => {
    const scope: TranslationScope = { mode, pageNumber, range, selection };
    const text = getDocumentTranslationScopeText(result, scope);
    onConfirm(text, scope);
  };

  const renderModeOption = (id: TranslationScopeMode, icon: React.ReactNode, title: string, desc: string) => (
    <button
      onClick={() => setMode(id)}
      className={cn(
        "flex items-start gap-3 rounded-2xl border-2 transition-all text-left",
        mode === id 
          ? "border-brand-500 bg-brand-50/50 shadow-sm" 
          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50",
        viewPrefs.density === 'compact' ? 'p-3' : 'p-4'
      )}
    >
      <div className={cn(
        "rounded-xl shrink-0 flex items-center justify-center",
        mode === id ? "bg-brand-500 text-white" : "bg-slate-100 text-slate-400",
        viewPrefs.density === 'compact' ? 'h-8 w-8' : 'h-10 w-10'
      )}>
        {React.cloneElement(icon as React.ReactElement, { className: densityClasses.icon })}
      </div>
      <div>
        <h4 className={cn("font-bold text-slate-800", densityClasses.text)}>{title}</h4>
        <p className={cn("text-slate-500 mt-0.5 leading-relaxed", densityClasses.label)}>{desc}</p>
      </div>
    </button>
  );

  return (
    <div className={cn(
      "w-full max-w-2xl mx-auto bg-white border border-slate-100 rounded-[2.5rem] shadow-premium overflow-hidden",
      densityClasses.card
    )}>
      {/* Header */}
      <div className={cn(
        "bg-slate-50/50 border-bottom border-slate-100 flex items-center justify-between",
        viewPrefs.density === 'compact' ? 'p-4' : 'p-6'
      )}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors"
          >
            <ChevronLeft className={densityClasses.icon} />
          </button>
          <div>
            <h3 className={cn("font-serif font-bold text-slate-800", densityClasses.heading)}>Configurar Tradução</h3>
            <p className={densityClasses.label}>Defina o escopo para {result.metadata.name}</p>
          </div>
        </div>
        <div className={cn(
          "bg-brand-50 text-brand-600 rounded-full font-bold uppercase tracking-widest",
          densityClasses.label,
          viewPrefs.density === 'compact' ? 'px-2 py-0.5' : 'px-3 py-1'
        )}>
          {totalPages} {totalPages === 1 ? 'Página' : 'Páginas'}
        </div>
      </div>

      <div className={cn("space-y-6", viewPrefs.density === 'compact' ? 'p-4' : 'p-6')}>
        {/* Warning for large docs */}
        {isLargeDocument && mode === 'full' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3"
          >
            <AlertTriangle className={cn(densityClasses.icon, "text-amber-500 shrink-0 mt-0.5")} />
            <div>
              <h5 className={cn("font-bold text-amber-800", densityClasses.text)}>Documento Extenso Detectado</h5>
              <p className={cn("text-amber-700 mt-1 leading-relaxed", densityClasses.label)}>
                Este documento possui {result.text.length.toLocaleString()} caracteres. 
                Para garantir a melhor qualidade e estabilidade, ele será processado em blocos segmentados automaticamente.
              </p>
            </div>
          </motion.div>
        )}

        {/* Mode Selection */}
        <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-3", viewPrefs.density === 'compact' ? 'mb-4' : 'mb-6')}>
          {renderModeOption(
            'full', 
            <FileText />, 
            "Documento Inteiro", 
            "Traduzir todo o conteúdo extraído do arquivo."
          )}
          {renderModeOption(
            'page', 
            <Hash />, 
            "Página Específica", 
            "Escolha uma única página para focar a tradução."
          )}
          {renderModeOption(
            'range', 
            <Layers />, 
            "Intervalo de Páginas", 
            "Defina um trecho contínuo de páginas (ex: 3 a 8)."
          )}
          {renderModeOption(
            'selection', 
            <MousePointer2 />, 
            "Trecho Selecionado", 
            "Cole ou selecione um recorte específico do texto."
          )}
        </div>

        {/* Contextual Controls */}
        <AnimatePresence mode="wait">
          {mode === 'page' && (
            <motion.div 
              key="page-control"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4 border-t border-slate-100"
            >
              <label className={cn("font-bold text-slate-500 uppercase tracking-widest", densityClasses.label)}>Número da Página</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="1" 
                  max={totalPages} 
                  value={pageNumber}
                  onChange={(e) => setPageNumber(parseInt(e.target.value))}
                  className="flex-1 accent-brand-500"
                />
                <div className={cn("bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-800", viewPrefs.density === 'compact' ? 'w-12 h-8' : 'w-16 h-10')}>
                  {pageNumber}
                </div>
              </div>
            </motion.div>
          )}

          {mode === 'range' && (
            <motion.div 
              key="range-control"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4 border-t border-slate-100"
            >
              <div className="flex items-center justify-between">
                <label className={cn("font-bold text-slate-500 uppercase tracking-widest", densityClasses.label)}>Intervalo de Páginas</label>
                <span className={cn("font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded", densityClasses.label)}>
                  {range.end - range.start + 1} páginas selecionadas
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <span className={densityClasses.label}>De:</span>
                  <input 
                    type="number" 
                    min="1" 
                    max={range.end} 
                    value={range.start}
                    onChange={(e) => setRange({ ...range, start: Math.max(1, parseInt(e.target.value)) })}
                    className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <span className={densityClasses.label}>Até:</span>
                  <input 
                    type="number" 
                    min={range.start} 
                    max={totalPages} 
                    value={range.end}
                    onChange={(e) => setRange({ ...range, end: Math.min(totalPages, parseInt(e.target.value)) })}
                    className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl px-3 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {mode === 'selection' && (
            <motion.div 
              key="selection-control"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-4 border-t border-slate-100"
            >
              <label className={cn("font-bold text-slate-500 uppercase tracking-widest", densityClasses.label)}>Trecho Específico</label>
              <textarea 
                placeholder="Cole aqui o trecho que deseja traduzir..."
                value={selection}
                onChange={(e) => setSelection(e.target.value)}
                className="w-full h-32 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Button */}
        <div className="pt-6 border-t border-slate-100">
          <button
            onClick={handleConfirm}
            disabled={mode === 'selection' && !selection.trim()}
            className={cn(
              "w-full bg-brand-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 disabled:opacity-50 disabled:cursor-not-allowed",
              viewPrefs.density === 'compact' ? 'h-12 text-xs' : 'h-14 text-sm'
            )}
          >
            Confirmar Escopo e Traduzir
            <ChevronRight className={densityClasses.icon} />
          </button>
          <p className={cn("text-slate-400 text-center mt-4 flex items-center justify-center gap-1", densityClasses.label)}>
            <Info className="h-3 w-3" />
            As configurações de tom e estilo serão aplicadas no próximo passo.
          </p>
        </div>
      </div>
    </div>
  );
};
