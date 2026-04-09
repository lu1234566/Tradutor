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
  History,
  Save,
  FolderOpen,
  Share2,
  ChevronRight,
  BookOpen,
  FileText,
  FileUp,
  Type
} from "lucide-react";
import { countCharacters, countWords, cn } from "@/src/utils";
import { DocumentUpload } from "./DocumentUpload";
import { DocumentTranslationConfig } from "./DocumentTranslationConfig";
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
  notes: string[];
  showNotes: boolean;
  hasUnsavedChanges?: boolean;
  currentEntry?: any;
  viewPrefs: ViewPreferences;
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
  notes,
  showNotes,
  hasUnsavedChanges,
  currentEntry,
  viewPrefs
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
          "flex items-center justify-between bg-white/50 backdrop-blur-sm p-2 rounded-2xl border border-slate-100 shadow-premium",
          densityClasses.card
        )}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenProjects}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <FolderOpen className="h-4 w-4" />
            Projetos
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenExport(currentEntry)}
            disabled={!translatedText && !originalText}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all disabled:opacity-30"
          >
            <Share2 className="h-4 w-4" />
            Exportar
          </button>
          {translatedText && (
            <button
              onClick={onSave}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all",
                hasUnsavedChanges 
                  ? "bg-brand-50 text-brand-600 hover:bg-brand-100" 
                  : "text-slate-400 hover:bg-slate-100"
              )}
            >
              <Save className="h-4 w-4" />
              {hasUnsavedChanges ? "Salvar Alterações" : "Salvo"}
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
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <h3 className={cn(
                "font-bold text-slate-400 uppercase tracking-[0.2em]",
                densityClasses.label
              )}>Texto Traduzido</h3>
              {detectedLanguage && !isTranslating && (
                <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  Detectado: {detectedLanguage}
                </span>
              )}
            </div>
            {translatedText && !isTranslating && (
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Concluído</span>
              </div>
            )}
          </div>

          <div className={cn(
            "relative group glass-card rounded-[2rem] overflow-hidden bg-slate-50/30 transition-all duration-300",
            densityClasses.card
          )}>
            <TextArea
              placeholder="Sua tradução aparecerá aqui..."
              value={translatedText}
              readOnly
              className={cn(
                "border-none shadow-none min-h-[300px] lg:min-h-[400px] bg-transparent",
                densityClasses.text,
                isTranslating && "animate-pulse text-slate-300"
              )}
            />
            
            {/* Empty State for Output */}
            {!translatedText && !isTranslating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center gap-4">
                <div className="h-16 w-16 bg-white rounded-3xl flex items-center justify-center text-slate-200 shadow-premium">
                  <FileText className="h-8 w-8" />
                </div>
                <div className="max-w-xs">
                  <p className="text-sm font-medium text-slate-400 leading-relaxed">
                    Clique em <span className="text-brand-600 font-bold">Traduzir</span> para gerar uma versão literária com nuances contextuais.
                  </p>
                </div>
              </div>
            )}
            
            {translatedText && !isTranslating && (
              <div className="absolute bottom-6 right-6 flex gap-2">
                <Button size="sm" variant="secondary" onClick={handleCopy} className="rounded-full bg-white/90 backdrop-blur-sm">
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                  {copied ? "Copiado" : "Copiar"}
                </Button>
              </div>
            )}

            {isTranslating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] gap-6">
                <div className="flex flex-col items-center gap-4 w-full max-w-[240px]">
                  {translationProgress > 0 ? (
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-brand-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${translationProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-3 h-3 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-3 h-3 bg-brand-600 rounded-full animate-bounce"></div>
                    </div>
                  )}
                  
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-bold text-brand-600 uppercase tracking-widest animate-pulse">
                      {translationProgress > 0 ? `${translationProgress}%` : "Refinando Estilo"}
                    </p>
                    <p className="text-xs font-medium text-slate-500 text-center px-4">
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
        isVisible={showNotes && translatedText.length > 0}
        viewPrefs={viewPrefs}
      />
    </div>
  );
};
