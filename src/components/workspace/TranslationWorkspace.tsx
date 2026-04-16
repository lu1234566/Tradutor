import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TextArea } from "../ui/TextArea";
import { Button } from "../ui/Button";
import { 
  ArrowRightLeft, 
  Copy, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  Columns, 
  Layout, 
  CheckCircle2,
  Check,
  History,
  Save,
  FolderOpen,
  Share2,
  ChevronRight,
  BookOpen,
  FileText,
  FileUp,
  Type,
  Edit2,
  Download
} from "lucide-react";
import { countCharacters, countWords, cn } from "@/src/utils";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentTranslationConfig } from "./DocumentTranslationConfig";
import { ResultViewer } from "./ResultViewer";
import { TranslatorNotes } from "./TranslatorNotes";
import { 
  DocumentMetadata, 
  ProcessingResult, 
  TranslationScope 
} from "@/src/services/documentService";
import { viewService, ViewPreferences } from "@/src/services/viewService";

interface TranslationWorkspaceProps {
  originalText: string;
  translatedText: string;
  detectedLanguage?: string;
  isTranslating: boolean;
  progressMessage?: string;
  translationProgress?: number;
  error: string | null;
  onOriginalTextChange: (text: string) => void;
  onTranslate: (textOverride?: string) => void;
  onClear: () => void;
  onExampleClick: (text: string) => void;
  onSave: () => void;
  onOpenProjects: () => void;
  onOpenExport: (entry?: any, project?: any, allEntries?: any[]) => void;
  onDocumentProcessed: (text: string, metadata: DocumentMetadata) => void;
  entryTitle: string;
  onEntryTitleChange: (title: string) => void;
  notes: string[];
  adaptedExpressions?: { original: string; adapted: string; explanation: string }[];
  translationStrategy?: string;
  toneDetected?: string;
  showNotes: boolean;
  hasUnsavedChanges?: boolean;
  currentEntry?: any;
  viewPrefs: ViewPreferences;
  translationBlocks?: any[];
}

export const TranslationWorkspace: React.FC<TranslationWorkspaceProps> = ({
  originalText,
  translatedText,
  detectedLanguage,
  isTranslating,
  progressMessage,
  translationProgress = 0,
  error,
  onOriginalTextChange,
  onTranslate,
  onClear,
  onExampleClick,
  onSave,
  onOpenProjects,
  onOpenExport,
  onDocumentProcessed,
  entryTitle,
  onEntryTitleChange,
  notes,
  adaptedExpressions = [],
  translationStrategy,
  toneDetected,
  showNotes,
  hasUnsavedChanges,
  currentEntry,
  viewPrefs,
  translationBlocks = []
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"stack" | "compare">("stack");
  const [inputMode, setInputMode] = useState<"manual" | "document" | "document-config">("manual");
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);

  const densityClasses = viewService.getDensityClasses(viewPrefs.density);

  const handleCopy = async () => {
    if (!translatedText) return;
    try {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  const examples = [
    { label: "Diálogo", text: '"Não sei se devo ir", sussurrou ela, os olhos fixos na porta entreaberta. "O vento lá fora parece carregar segredos que não estou pronta para ouvir."' },
    { label: "Narração", text: "O sol se punha atrás das colinas de ardósia, pintando o céu com pinceladas de um carmesim violento que parecia sangrar sobre o vale silencioso." },
    { label: "Fantasia", text: "As runas gravadas no cetro de carvalho antigo brilharam com uma luz azul gélida, respondendo ao cântico que ecoava pelas paredes da caverna." },
    { label: "Romance", text: "Seus dedos se tocaram por um breve instante, um contato elétrico que fez o tempo parar e o barulho da festa desaparecer em um zumbido distante." },
    { label: "Clássico", text: "Era o melhor dos tempos, era o pior dos tempos, era a idade da sabedoria, era a idade da tolice, era a época da crença, era a época da incredulidade." },
  ];

  return (
    <div className={cn(
      "flex flex-col h-full",
      viewPrefs.density === 'compact' ? 'gap-4' : viewPrefs.density === 'reading' ? 'gap-10' : 'gap-8'
    )}>
      {/* Action Bar */}
      <motion.div 
        id="workspace-action-bar"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex flex-col sm:flex-row items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-soft gap-4",
          densityClasses.card
        )}
      >
        <div className="flex-1 w-full flex items-center gap-4 px-3">
          <div className="p-2 bg-brand-50 text-brand-700 rounded-xl shadow-sm">
            <Edit2 className="h-4 w-4" />
          </div>
          <input 
            type="text" 
            placeholder="Título do Projeto ou Capítulo..."
            value={entryTitle}
            onChange={(e) => onEntryTitleChange(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none font-semibold text-slate-700 placeholder:text-slate-300 text-sm tracking-tight"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenProjects}
            className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold text-slate-500 hover:text-brand-800 hover:bg-brand-50 rounded-xl transition-all uppercase tracking-wider"
          >
            <FolderOpen className="h-4 w-4" />
            Projetos
          </button>
          
          <div className="h-6 w-px bg-slate-100 mx-1" />

          <button
            onClick={() => onOpenExport(currentEntry)}
            disabled={!translatedText && !originalText}
            className="flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold text-slate-500 hover:text-brand-800 hover:bg-brand-50 rounded-xl transition-all disabled:opacity-30 uppercase tracking-wider"
          >
            <Share2 className="h-4 w-4" />
            Exportar
          </button>
          
          {translatedText && (
            <button
              onClick={onSave}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 text-[11px] font-bold rounded-xl transition-all uppercase tracking-wider",
                hasUnsavedChanges 
                  ? "bg-brand-800 text-white hover:bg-brand-900 shadow-premium" 
                  : "text-emerald-600 bg-emerald-50"
              )}
            >
              <Save className="h-4 w-4" />
              {hasUnsavedChanges ? "Salvar" : "Salvo"}
            </button>
          )}
        </div>
      </motion.div>

      {/* Header Info & View Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setInputMode("manual")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all",
                inputMode === "manual" ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Type className="h-3.5 w-3.5" />
              Manual
            </button>
            <button
              onClick={() => setInputMode("document")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all",
                inputMode === "document" ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <FileUp className="h-3.5 w-3.5" />
              Documento
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            <History className="h-3 w-3" />
            <span>{countWords(originalText)} palavras</span>
          </div>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("stack")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all",
              viewMode === "stack" ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Layout className="h-3.5 w-3.5" />
            Foco
          </button>
          <button
            onClick={() => setViewMode("compare")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-md transition-all",
              viewMode === "compare" ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Columns className="h-3.5 w-3.5" />
            Comparar
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className={cn(
        "grid gap-6",
        viewMode === "compare" ? "lg:grid-cols-2" : "grid-cols-1"
      )}>
        {/* Input Card */}
        <div id="workspace-input-card" className={cn(
          "flex flex-col",
          viewPrefs.density === 'compact' ? 'gap-2' : 'gap-4'
        )}>
          <div className="flex items-center justify-between px-1">
            <h3 className={cn(
              "font-bold text-slate-400 uppercase tracking-[0.2em]",
              densityClasses.label
            )}>
              {inputMode === "manual" ? "Texto Original" : "Upload de Documento"}
            </h3>
            {inputMode === "manual" && (
              <button 
                onClick={onClear}
                className="text-[10px] font-bold text-slate-400 hover:text-red-500 uppercase tracking-widest transition-colors"
              >
                Limpar Tudo
              </button>
            )}
          </div>
          
          <AnimatePresence mode="wait">
            {inputMode === "manual" ? (
              <motion.div 
                key="manual-input"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={cn(
                  "relative group glass-card rounded-[2rem] overflow-hidden transition-all duration-300 focus-within:ring-4 focus-within:ring-brand-500/5",
                  densityClasses.card
                )}
              >
                <TextArea
                  placeholder="Cole aqui o trecho original do livro, capítulo, diálogo ou narração..."
                  value={originalText}
                  onChange={(e) => onOriginalTextChange(e.target.value)}
                  className={cn(
                    "border-none shadow-none min-h-[300px] lg:min-h-[400px] bg-transparent",
                    densityClasses.text
                  )}
                />
                
                {/* Examples Chips */}
                {!originalText && (
                  <div className="absolute bottom-8 left-8 right-8 flex flex-wrap gap-2">
                    {examples.map((ex) => (
                      <button
                        key={ex.label}
                        onClick={() => onExampleClick(ex.text)}
                        className="px-4 py-2 bg-white/80 backdrop-blur-sm hover:bg-brand-50 text-[10px] font-bold text-slate-500 hover:text-brand-600 rounded-full border border-slate-100 hover:border-brand-200 transition-all shadow-sm active:scale-95"
                      >
                        {ex.label}
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : inputMode === "document" ? (
              <motion.div
                key="document-upload"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <DocumentUpload 
                  onExtractionComplete={(result) => {
                    setProcessingResult(result);
                    setInputMode("document-config");
                  }}
                  onClear={() => {}}
                  className="min-h-[300px] lg:min-h-[400px]"
                  viewPrefs={viewPrefs}
                />
              </motion.div>
            ) : (
              <motion.div
                key="document-config"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                {processingResult && (
                  <DocumentTranslationConfig 
                    result={processingResult}
                    onBack={() => setInputMode("document")}
                    onConfirm={(text, scope) => {
                      onDocumentProcessed(text, processingResult.metadata);
                      setInputMode("manual");
                      setProcessingResult(null);
                      // Auto-trigger translation after config with the specific text
                      setTimeout(() => onTranslate(text), 100);
                    }}
                    viewPrefs={viewPrefs}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Button (Mobile/Stack) */}
        <div className={cn(
          "flex justify-center",
          viewMode === "compare" ? "lg:hidden" : "block"
        )}>
          <Button
            onClick={onTranslate}
            isLoading={isTranslating}
            disabled={!originalText.trim()}
            size="lg"
            className="w-full sm:w-auto min-w-[280px] rounded-full shadow-2xl shadow-brand-200/50 bg-gradient-to-r from-brand-600 to-brand-700 hover:from-brand-700 hover:to-brand-800 transition-all duration-500"
          >
            {!isTranslating && <Sparkles className="h-4 w-4 mr-2 animate-pulse" />}
            {isTranslating ? "Analisando nuances..." : "Traduzir Texto"}
          </Button>
        </div>

        {/* Output Card */}
        <div id="workspace-output-card" className={cn(
          "flex flex-col",
          viewPrefs.density === 'compact' ? 'gap-2' : 'gap-4',
          !translatedText && !isTranslating && viewMode === "stack" && "hidden lg:flex"
        )}>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <h3 className={cn(
                "font-bold text-slate-400 uppercase tracking-[0.2em]",
                densityClasses.label
              )}>Tradução Literária</h3>
              {detectedLanguage && !isTranslating && (
                <span className="text-[9px] font-bold text-brand-500 bg-brand-50 px-2 py-0.5 rounded-md uppercase tracking-wider border border-brand-100/50">
                  {detectedLanguage}
                </span>
              )}
            </div>
            {translatedText && !isTranslating && (
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Refinado</span>
              </div>
            )}
          </div>

          <div className={cn(
            "relative group rounded-[2.5rem] border border-slate-100 bg-white shadow-soft transition-all duration-500 hover:shadow-premium hover:border-brand-100 overflow-hidden",
            densityClasses.card
          )}>
            <ResultViewer
              content={translatedText}
              isTranslating={isTranslating}
              viewPrefs={viewPrefs}
              className={cn(
                "bg-transparent",
                densityClasses.text
              )}
            />
            

            
            {translatedText && !isTranslating && (
              <div className="absolute bottom-8 right-8 flex gap-2">
                <Button size="sm" variant="secondary" onClick={handleCopy} className="rounded-full bg-white/90 backdrop-blur-sm shadow-premium">
                  {copied ? <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </div>
            )}

            {isTranslating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] gap-8 paper-texture">
                <div className="flex flex-col items-center gap-6 w-full max-w-[320px]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative h-16 w-16">
                      <div className="absolute inset-0 border-4 border-brand-100 rounded-full" />
                      <motion.div 
                        className="absolute inset-0 border-4 border-brand-800 rounded-full border-t-transparent"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-brand-800 animate-pulse" />
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-brand-900 uppercase tracking-[0.2em] animate-pulse">
                      {translationProgress > 0 ? `${translationProgress}%` : "Iniciando..."}
                    </span>
                  </div>

                  {translationProgress > 0 && (
                    <div className="w-full space-y-4">
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                        <motion.div 
                          className="h-full bg-brand-800"
                          initial={{ width: 0 }}
                          animate={{ width: `${translationProgress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      
                      {/* Block Grid Progress */}
                      {translationBlocks.length > 1 && (
                        <div className="flex flex-wrap justify-center gap-1.5 px-4">
                          {translationBlocks.map((block, idx) => (
                            <div 
                              key={block.id} 
                              className={cn(
                                "h-2 w-2 rounded-full transition-all duration-500",
                                block.status === 'success' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" :
                                block.status === 'translating' ? "bg-brand-500 animate-pulse scale-125" :
                                block.status === 'retrying' ? "bg-amber-500 animate-pulse" :
                                block.status === 'failed' ? "bg-red-500" :
                                "bg-slate-200"
                              )}
                              title={`Bloco ${idx + 1}: ${block.status}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-xs font-medium text-slate-500 text-center px-4 leading-relaxed">
                      {progressMessage || "Analisando contexto e nuances culturais..."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Button (Compare Mode Desktop) */}
      {viewMode === "compare" && (
        <div className="hidden lg:flex justify-center">
          <Button
            onClick={onTranslate}
            isLoading={isTranslating}
            disabled={!originalText.trim()}
            size="lg"
            className="min-w-[280px] rounded-full shadow-2xl shadow-brand-200/50"
          >
            {!isTranslating && <Sparkles className="h-4 w-4 mr-2" />}
            {isTranslating ? "Analisando nuances..." : "Traduzir Literário"}
          </Button>
        </div>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-3 p-5 bg-red-50 text-red-700 rounded-2xl border border-red-100 shadow-sm"
          >
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Translator Notes (Integrated) */}
      <TranslatorNotes
        notes={notes}
        adaptedExpressions={adaptedExpressions}
        translationStrategy={translationStrategy}
        toneDetected={toneDetected}
        isVisible={showNotes && translatedText.length > 0}
        viewPrefs={viewPrefs}
      />
    </div>
  );
};
