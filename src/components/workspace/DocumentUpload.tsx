import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileUp, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileCheck,
  FileWarning,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { cn } from "@/src/utils";
import { 
  validateUploadedFile, 
  processUploadedDocument, 
  formatFileSize,
  validatePdfLimits,
  DocumentMetadata,
  ProcessingResult
} from "@/src/services/documentService";

import { viewService, ViewPreferences } from "@/src/services/viewService";

interface DocumentUploadProps {
  onExtractionComplete: (result: ProcessingResult) => void;
  onClear: () => void;
  className?: string;
  viewPrefs: ViewPreferences;
}

type UploadStatus = 'idle' | 'loading' | 'processing' | 'success' | 'error';

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ 
  onExtractionComplete, 
  onClear,
  className,
  viewPrefs
}) => {
  const densityClasses = viewService.getDensityClasses(viewPrefs.density);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const validation = validateUploadedFile(file);
    if (!validation.valid) {
      setError(validation.error || "Erro ao validar arquivo.");
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);
    setResult(null);
    setProcessingMessage("Iniciando processamento...");

    try {
      // Small delay to show loading state for better UX
      const startTime = Date.now();
      
      setStatus('processing');
      const processingResult = await processUploadedDocument(file, (msg) => setProcessingMessage(msg));
      
      // Validação adicional de limites pós-extração (páginas)
      const limitValidation = validatePdfLimits(processingResult.metadata);
      if (!limitValidation.valid) {
        setError(limitValidation.error || "O documento excede os limites suportados.");
        setStatus('error');
        return;
      }
      
      const endTime = Date.now();
      const elapsed = endTime - startTime;
      if (elapsed < 800) {
        await new Promise(resolve => setTimeout(resolve, 800 - elapsed));
      }

      setResult(processingResult);
      setStatus('success');
      
      // Automatically go to configuration after a brief success message
      setTimeout(() => {
        onExtractionComplete(processingResult);
      }, 1500);
    } catch (err: any) {
      console.error("Processing error:", err);
      setError(err.message || "Falha ao processar documento.");
      setStatus('error');
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const reset = () => {
    setStatus('idle');
    setError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClear();
  };

  const confirmUseText = () => {
    if (result) {
      onExtractionComplete(result);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <AnimatePresence mode="wait">
        {status === 'idle' ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative group cursor-pointer border-2 border-dashed rounded-[2.5rem] transition-all duration-500 flex flex-col items-center justify-center text-center gap-6 paper-texture",
              isDragging 
                ? "border-brand-400 bg-brand-50/50 scale-[1.01]" 
                : "border-slate-100 hover:border-brand-200 hover:bg-white hover:shadow-premium",
              viewPrefs.density === 'compact' ? 'p-8' : viewPrefs.density === 'reading' ? 'p-20' : 'p-10 md:p-16'
            )}
          >
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={onFileChange}
              accept=".pdf,.txt,.docx,.md"
              className="hidden"
            />
            
            <div className={cn(
              "bg-brand-50 rounded-[2rem] flex items-center justify-center text-brand-600 group-hover:scale-110 transition-transform duration-700 shadow-soft",
              viewPrefs.density === 'compact' ? 'h-14 w-14' : 'h-20 w-20'
            )}>
              <FileUp className={cn("h-8 w-8", densityClasses.icon)} />
            </div>
            
            <div className="space-y-3">
              <h3 className={cn("font-serif font-semibold text-ink text-xl", densityClasses.heading)}>Importar Manuscrito</h3>
              <p className={cn("text-slate-400 max-w-xs leading-relaxed font-medium", densityClasses.text)}>
                Arraste seu documento aqui ou clique para explorar seus arquivos.
              </p>
              <div className={cn("flex flex-wrap justify-center gap-2 pt-2", densityClasses.label)}>
                {['PDF', 'TXT', 'DOCX', 'MD'].map(ext => (
                  <span key={ext} className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded-md border border-slate-100 text-[9px] font-bold tracking-widest">{ext}</span>
                ))}
              </div>
            </div>
            <div className={cn("font-bold text-slate-300 text-[10px] uppercase tracking-[0.2em]", densityClasses.label)}>
              Limite de 20MB
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="status"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "bg-white border border-slate-100 rounded-[2rem] shadow-premium relative overflow-hidden",
              densityClasses.card
            )}
          >
            {/* Background Accent */}
            <div className={cn(
              "absolute top-0 left-0 w-full h-1 transition-all duration-1000",
              status === 'loading' || status === 'processing' ? "bg-brand-500 animate-pulse" :
              status === 'success' ? "bg-emerald-500" :
              status === 'error' ? "bg-red-500" : "bg-slate-200"
            )} />

            <div className="flex items-center gap-4">
              <div className={cn(
                "rounded-2xl flex items-center justify-center shrink-0",
                viewPrefs.density === 'compact' ? 'h-10 w-10' : 'h-12 w-12',
                status === 'loading' || status === 'processing' ? "bg-brand-50 text-brand-600" :
                status === 'success' ? "bg-emerald-50 text-emerald-600" :
                status === 'error' ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-400"
              )}>
                {status === 'loading' || status === 'processing' ? <Loader2 className={cn(densityClasses.icon, "animate-spin")} /> :
                 status === 'success' ? <FileCheck className={densityClasses.icon} /> :
                 status === 'error' ? <FileWarning className={densityClasses.icon} /> : <FileText className={densityClasses.icon} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={cn("font-bold text-slate-800 truncate", densityClasses.text)}>
                    {result?.metadata.name || fileInputRef.current?.files?.[0]?.name || "Processando arquivo..."}
                  </h4>
                  <button 
                    onClick={reset}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                  >
                    <X className={densityClasses.icon} />
                  </button>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className={densityClasses.label}>
                    {result?.metadata ? formatFileSize(result.metadata.size) : "Calculando..." }
                  </span>
                  <span className="text-slate-200">•</span>
                  <span className={cn(
                    "font-bold uppercase tracking-widest",
                    densityClasses.label,
                    status === 'loading' ? "text-brand-500" :
                    status === 'processing' ? "text-brand-600" :
                    status === 'success' ? "text-emerald-600" :
                    status === 'error' ? "text-red-600" : "text-slate-400"
                  )}>
                    {status === 'loading' ? "Carregando..." :
                     status === 'processing' ? (processingMessage || "Extraindo Texto...") :
                     status === 'success' ? "Pronto para Tradução" :
                     status === 'error' ? "Erro no Arquivo" : ""}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4 p-3 bg-red-50 rounded-xl flex items-start gap-2 text-red-700 text-xs border border-red-100"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{error}</p>
              </motion.div>
            )}

            {status === 'success' && result && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={viewPrefs.density === 'compact' ? 'mt-4 space-y-2' : 'mt-6 space-y-4'}
              >
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className={densityClasses.label}>Prévia do Texto</span>
                    <span className={cn("font-bold text-emerald-600 uppercase tracking-widest", densityClasses.label)}>
                      {result.metadata.pageCount} {result.metadata.pageCount === 1 ? 'página' : 'páginas'}
                    </span>
                  </div>
                  <div className={cn("text-slate-600 line-clamp-3 italic leading-relaxed", densityClasses.text)}>
                    "{result.text.slice(0, 200)}..."
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={confirmUseText}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100",
                      viewPrefs.density === 'compact' ? 'px-3 py-2 text-[10px]' : 'px-4 py-2.5 text-xs'
                    )}
                  >
                    Iniciar Tradução
                    <ArrowRight className={viewPrefs.density === 'compact' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                  </button>
                  <button
                    onClick={reset}
                    className={cn(
                      "bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2",
                      viewPrefs.density === 'compact' ? 'px-3 py-2 text-[10px]' : 'px-4 py-2.5 text-xs'
                    )}
                  >
                    <RefreshCw className={viewPrefs.density === 'compact' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
                    Trocar Arquivo
                  </button>
                </div>
              </motion.div>
            )}

            {status === 'error' && (
              <div className="mt-4">
                <button
                  onClick={reset}
                  className="w-full py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Tentar Novamente
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
