import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { TranslationWorkspace } from "./components/workspace/TranslationWorkspace";
import { TranslatorNotes } from "./components/workspace/TranslatorNotes";
import { ChatTab } from "./components/workspace/ChatTab";
import { ProjectManager } from "./components/workspace/ProjectManager";
import { SaveModal } from "./components/workspace/SaveModal";
import { ExportModal } from "./components/workspace/ExportModal";
import { Onboarding } from "./components/layout/Onboarding";
import { ConfirmationModal } from "./components/ui/ConfirmationModal";
import { MessageSquare, Eye, Menu, X, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./utils";
import { 
  translateText, 
  translateTextFallback,
  TranslationSettings, 
  ChatMessage, 
  buildTranslationChatPrompt, 
  callChatModel 
} from "./services/geminiService";
import { storageService, TranslationEntry, EntryStatus, Project } from "./services/storageService";
import { 
  DocumentMetadata, 
  splitLargeDocumentIntoChunks, 
  DocumentChunk,
  processUploadedDocument,
  getDocumentTranslationScopeText,
  buildDocumentProgressState,
  handleDocumentTranslationFailure,
  showDocumentWorkflowMessage
} from "./services/documentService";

import { 
  viewService, 
  ViewPreferences, 
  DEFAULT_VIEW_PREFS 
} from "./services/viewService";
import { 
  BookOpen, 
  MessageCircle, 
  Settings, 
  FolderOpen, 
  LayoutGrid, 
  Maximize2 
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"preview" | "chat">("preview");
  const [mobileActiveTab, setMobileActiveTab] = useState<"translate" | "chat" | "notes" | "projects">("translate");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [viewPrefs, setViewPrefs] = useState<ViewPreferences>(viewService.loadPreferences());

  const updateViewPrefs = (newPrefs: Partial<ViewPreferences>) => {
    const updated = { ...viewPrefs, ...newPrefs };
    setViewPrefs(updated);
    viewService.savePreferences(updated);
  };
  const [settings, setSettings] = useState<TranslationSettings>({
    sourceLanguage: "auto",
    targetLanguage: "pt-BR",
    mode: "Equilibrado",
    tone: "Neutro",
    culturalAdaptation: "Moderada",
    preserveNames: true,
    showNotes: true,
  });

  const [originalText, setOriginalText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [entryTitle, setEntryTitle] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState<string | undefined>(undefined);
  const [isTranslating, setIsTranslating] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [translationProgress, setTranslationProgress] = useState(0);
  const [translationBlocks, setTranslationBlocks] = useState<DocumentChunk[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<string[]>([]);
  const [adaptedExpressions, setAdaptedExpressions] = useState<{ original: string; adapted: string; explanation: string }[]>([]);
  const [translationStrategy, setTranslationStrategy] = useState("");
  const [toneDetected, setToneDetected] = useState("");

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Persistence State
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [recentEntries, setRecentEntries] = useState<TranslationEntry[]>([]);

  useEffect(() => {
    setRecentEntries(storageService.listAllEntries().sort((a, b) => b.updatedAt - a.updatedAt));
  }, [isProjectManagerOpen, isSaveModalOpen]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [exportData, setExportData] = useState<{
    entry?: TranslationEntry;
    project?: Project;
    allEntries?: TranslationEntry[];
  }>({});
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const confirmClear = () => {
    setOriginalText("");
    setTranslatedText("");
    setEntryTitle("");
    setNotes([]);
    setAdaptedExpressions([]);
    setTranslationStrategy("");
    setToneDetected("");
    setError(null);
    setChatMessages([]);
    setCurrentEntryId(null);
    setHasUnsavedChanges(false);
    showToast("Workspace limpo.");
  };

  const handleSettingsChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleResetSettings = () => {
    setSettings({
      sourceLanguage: "auto",
      targetLanguage: "pt-BR",
      mode: "Equilibrado",
      tone: "Neutro",
      culturalAdaptation: "Moderada",
      preserveNames: true,
      showNotes: true,
    });
    setHasUnsavedChanges(true);
  };

  /**
   * handleTranslate()
   * Orquestra todo o processo de tradução.
   */
  // Warn about unsaved changes before closing tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleTranslate = async (textOverride?: string | any) => {
    // Se for chamado por um evento de clique, o primeiro argumento será o evento, não o texto.
    const textToTranslate = (typeof textOverride === "string" ? textOverride : undefined) || originalText;
    
    if (typeof textToTranslate !== "string" || !textToTranslate.trim()) {
      setError("Insira um trecho para iniciar a tradução.");
      return;
    }

    setError(null);
    setIsTranslating(true);
    setTranslationProgress(0);
    setTranslatedText("");
    setDetectedLanguage(undefined);
    setNotes([]);
    setAdaptedExpressions([]);
    setTranslationStrategy("");
    setToneDetected("");
    
    // Se for uma nova tradução "do zero" (sem entrada carregada), limpa o chat
    if (!currentEntryId) {
      setChatMessages([]);
    }
    
    try {
      // Se o texto for muito grande, divide em blocos
      const CHUNK_SIZE = 4000;
      if (textToTranslate.length > CHUNK_SIZE) {
        const chunks = splitLargeDocumentIntoChunks(textToTranslate, CHUNK_SIZE);
        setTranslationBlocks(chunks);
        
        const allNotes: string[] = [];
        const allAdapted: { original: string; adapted: string; explanation: string }[] = [];
        let lastStrategy = "";
        let lastTone = "";
        const finalTranslatedChunks: string[] = new Array(chunks.length).fill("");

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          
          // Atualiza status do bloco para 'translating'
          setTranslationBlocks(prev => prev.map((c, idx) => idx === i ? { ...c, status: 'translating' } : c));
          
          const progress = buildDocumentProgressState(i + 1, chunks.length, "Processando Bloco");
          setTranslationProgress(progress.percentage);
          setProgressMessage(progress.message);
          
          let retryCount = 0;
          const maxRetries = 2;
          let success = false;
          let lastChunkError = "";

          while (retryCount <= maxRetries && !success) {
            try {
              const currentStatus = retryCount > 0 ? 'retrying' : 'translating';
              setTranslationBlocks(prev => prev.map((c, idx) => idx === i ? { ...c, status: currentStatus, attempts: retryCount } : c));

              // Na última tentativa, usa o fallback, nas outras tenta refinar
              const result = retryCount === maxRetries 
                ? await translateTextFallback(chunk.text, settings)
                : await translateText(
                    chunk.text, 
                    settings, 
                    (msg) => setProgressMessage(`Bloco ${i + 1}${retryCount > 0 ? ` (Tentativa ${retryCount + 1})` : ""}: ${msg}`),
                    retryCount > 0 // Força estrutura se for um retry
                  );
              
              // Validação rigorosa de preservação estrutural
              const originalParagraphs = chunk.paragraphCount;
              const translatedParagraphs = result.translatedText.split('\n').filter(p => p.trim() !== "").length;
              const originalCount = chunk.text.split('\n').filter(p => p.trim() !== "").length;
              
              // Se a tradução fundiu parágrafos, tenta novamente com instrução reforçada
              if (originalCount > 1 && translatedParagraphs < originalCount && retryCount < maxRetries) {
                console.warn(`Bloco ${i + 1}: Fusão de parágrafos detectada (${translatedParagraphs}/${originalCount}). Tentando correção estrutural...`);
                retryCount++;
                continue;
              }

              finalTranslatedChunks[i] = result.translatedText;
              if (result.notes) allNotes.push(...result.notes);
              if (result.adaptedExpressions) allAdapted.push(...result.adaptedExpressions);
              if (result.translationStrategy) lastStrategy = result.translationStrategy;
              if (result.toneDetected) lastTone = result.toneDetected;
              
              if (result.detectedLanguage && i === 0) {
                setDetectedLanguage(result.detectedLanguage);
              }
              
              setTranslationBlocks(prev => prev.map((c, idx) => idx === i ? { ...c, status: 'success', translatedText: result.translatedText } : c));
              success = true;
            } catch (chunkErr: any) {
              retryCount++;
              lastChunkError = chunkErr instanceof Error ? chunkErr.message : String(chunkErr);
              
              if (retryCount > maxRetries) {
                setTranslationBlocks(prev => prev.map((c, idx) => idx === i ? { ...c, status: 'failed', error: lastChunkError } : c));
                const failure = handleDocumentTranslationFailure(chunkErr, { index: i, total: chunks.length });
                // Não interrompe a tradução inteira, apenas registra o erro do bloco
                console.warn(`Bloco ${i + 1} falhou após todas as tentativas:`, lastChunkError);
                break;
              }
              
              // Espera exponencial
              await new Promise(r => setTimeout(r, 1000 * retryCount));
            }
          }
          
          // Atualiza o texto traduzido parcial para o usuário ver progresso real
          setTranslatedText(finalTranslatedChunks.map((t, idx) => {
            if (t === "") return "";
            return t + (chunks[idx]?.suffix || "");
          }).join(""));
        }

        const successfulChunks = finalTranslatedChunks.filter(t => t !== "");
        if (successfulChunks.length > 0) {
          const finalTranslation = finalTranslatedChunks.map((t, idx) => {
            return t + (chunks[idx]?.suffix || "");
          }).join("");
          setTranslatedText(finalTranslation);
          setNotes(Array.from(new Set(allNotes)));
          setAdaptedExpressions(allAdapted);
          setTranslationStrategy(lastStrategy);
          setToneDetected(lastTone);
          
          if (successfulChunks.length === chunks.length) {
            setTranslationProgress(100);
            setProgressMessage("Tradução concluída com sucesso!");
            showToast("Tradução concluída!");
          } else {
            setProgressMessage(`Tradução parcial concluída (${successfulChunks.length} de ${chunks.length} blocos).`);
            setError(`Alguns blocos (${chunks.length - successfulChunks.length}) não puderam ser traduzidos.`);
          }
          
          // Semiautomatic save
          if (currentEntryId) {
            storageService.updateEntry(currentEntryId, {
              sourceText: textToTranslate,
              translatedText: finalTranslation,
              translatorNotes: Array.from(new Set(allNotes)),
              adaptedExpressions: allAdapted,
              translationStrategy: lastStrategy,
              toneDetected: lastTone,
              sourceLanguage: settings.sourceLanguage,
              targetLanguage: settings.targetLanguage,
              translationMode: settings.mode,
              tone: settings.tone,
              culturalAdaptation: settings.culturalAdaptation,
              preserveProperNames: settings.preserveNames,
              showTranslatorNotes: settings.showNotes,
            });
          }
        }
      } else {
        // Tradução simples para textos curtos
        setProgressMessage("Analisando e traduzindo...");
        setTranslationProgress(30);
        
        let result = await translateText(textToTranslate, settings, (msg) => setProgressMessage(msg));
        
        // Validação estrutural básica para textos curtos
        const originalLines = textToTranslate.split('\n').filter(p => p.trim() !== "");
        const originalCount = originalLines.length;
        const translatedCount = result.translatedText.split('\n').filter(p => p.trim() !== "").length;
        
        if (originalCount > 1 && translatedCount < originalCount) {
          console.warn("Fusão de parágrafos detectada em texto curto. Tentando correção...");
          setProgressMessage("Refinando estrutura literária...");
          result = await translateText(textToTranslate, settings, undefined, true);
        }

        setTranslationProgress(100);
        setTranslatedText(result.translatedText);
        setDetectedLanguage(result.detectedLanguage);
        if (result.notes) setNotes(result.notes);
        if (result.adaptedExpressions) setAdaptedExpressions(result.adaptedExpressions);
        if (result.translationStrategy) setTranslationStrategy(result.translationStrategy);
        if (result.toneDetected) setToneDetected(result.toneDetected);
        showToast("Tradução concluída!");
        
        // Semiautomatic save
        if (currentEntryId) {
          storageService.updateEntry(currentEntryId, {
            sourceText: textToTranslate,
            translatedText: result.translatedText,
            translatorNotes: result.notes || [],
            adaptedExpressions: result.adaptedExpressions || [],
            translationStrategy: result.translationStrategy || "",
            toneDetected: result.toneDetected || "",
            sourceLanguage: settings.sourceLanguage,
            targetLanguage: settings.targetLanguage,
            translationMode: settings.mode,
            tone: settings.tone,
            culturalAdaptation: settings.culturalAdaptation,
            preserveProperNames: settings.preserveNames,
            showTranslatorNotes: settings.showNotes,
          });
        }
      }
      
      setHasUnsavedChanges(true);
    } catch (err: any) {
      console.error("Translation error:", err);
      setError(err instanceof Error ? err.message : "Erro inesperado na tradução.");
      showToast("Falha na tradução.", "error");
    } finally {
      setTimeout(() => {
        setIsTranslating(false);
        setTranslationProgress(0);
        setProgressMessage("");
      }, 1500);
    }
  };

  /**
   * handleChatSubmit()
   * Orquestra a interação com o assistente de apoio tradutório.
   */
  const handleChatSubmit = async (message: string) => {
    if (!message.trim() || isChatLoading) return;

    const userMsg: ChatMessage = { role: "user", text: message };
    const newHistory = [...chatMessages, userMsg];
    setChatMessages(newHistory);
    setIsChatLoading(true);

    try {
      const prompt = buildTranslationChatPrompt({
        sourceText: originalText,
        currentTranslation: translatedText,
        settings,
        notes,
        history: chatMessages.slice(-4)
      }, message);

      const response = await callChatModel(prompt);
      const modelMsg: ChatMessage = { role: "model", text: response };
      const finalHistory = [...newHistory, modelMsg];
      setChatMessages(finalHistory);

      // Sync chat history with entry if loaded
      if (currentEntryId) {
        storageService.updateEntry(currentEntryId, { chatHistory: finalHistory });
      }
    } catch (err) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, { 
        role: "model", 
        text: "Desculpe, não consegui processar seu pedido agora. Tente novamente em instantes." 
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleSaveClick = () => {
    if (currentEntryId) {
      // Direct save
      storageService.updateEntry(currentEntryId, {
        sourceText: originalText,
        translatedText: translatedText,
        translatorNotes: notes,
        chatHistory: chatMessages,
        sourceLanguage: settings.sourceLanguage,
        targetLanguage: settings.targetLanguage,
        translationMode: settings.mode,
        tone: settings.tone,
        culturalAdaptation: settings.culturalAdaptation,
        preserveProperNames: settings.preserveNames,
        showTranslatorNotes: settings.showNotes,
      });
      setHasUnsavedChanges(false);
      showToast("Alterações salvas.");
    } else {
      setIsSaveModalOpen(true);
    }
  };

  const handleSaveToProject = (projectId: string, title: string, status: EntryStatus) => {
    const entry = storageService.createEntry(projectId, {
      title,
      status,
      sourceText: originalText,
      translatedText: translatedText,
      translatorNotes: notes,
      adaptedExpressions: adaptedExpressions,
      translationStrategy: translationStrategy,
      toneDetected: toneDetected,
      chatHistory: chatMessages,
      sourceLanguage: settings.sourceLanguage,
      targetLanguage: settings.targetLanguage,
      translationMode: settings.mode,
      tone: settings.tone,
      culturalAdaptation: settings.culturalAdaptation,
      preserveProperNames: settings.preserveNames,
      showTranslatorNotes: settings.showNotes,
    });
    setCurrentEntryId(entry.id);
    setIsSaveModalOpen(false);
    setHasUnsavedChanges(false);
    showToast("Tradução salva no projeto.");
  };

  const handleEntryTitleChange = (title: string) => {
    setEntryTitle(title);
    setHasUnsavedChanges(true);
    
    // Update current entry if it exists
    if (currentEntryId) {
      storageService.updateEntry(currentEntryId, { title });
    }
  };
  const handleLoadEntry = (entry: TranslationEntry) => {
    setOriginalText(entry.sourceText);
    setTranslatedText(entry.translatedText);
    setEntryTitle(entry.title);
    setNotes(entry.translatorNotes);
    setAdaptedExpressions(entry.adaptedExpressions || []);
    setTranslationStrategy(entry.translationStrategy || "");
    setToneDetected(entry.toneDetected || "");
    setChatMessages(entry.chatHistory);
    setSettings({
      sourceLanguage: entry.sourceLanguage,
      targetLanguage: entry.targetLanguage,
      mode: entry.translationMode as any,
      tone: entry.tone as any,
      culturalAdaptation: entry.culturalAdaptation as any,
      preserveNames: entry.preserveProperNames,
      showNotes: entry.showTranslatorNotes,
    });
    setCurrentEntryId(entry.id);
    setIsProjectManagerOpen(false);
    setHasUnsavedChanges(false);
    setActiveTab("preview");
    showToast(`Tradução "${entry.title}" carregada.`);
  };

  const handleOpenExport = (entry?: TranslationEntry, project?: Project, allEntries?: TranslationEntry[]) => {
    let exportEntry = entry;
    
    // If no entry is provided (unsaved work), create a temporary one from current state
    if (!exportEntry && !allEntries && (originalText || translatedText)) {
      exportEntry = {
        id: currentEntryId || "temp-export",
        projectId: "",
        title: entryTitle || "Tradução sem título",
        sourceText: originalText,
        translatedText: translatedText,
        translatorNotes: notes,
        adaptedExpressions: adaptedExpressions,
        translationStrategy: translationStrategy,
        toneDetected: toneDetected,
        chatHistory: chatMessages,
        sourceLanguage: settings.sourceLanguage,
        targetLanguage: settings.targetLanguage,
        translationMode: settings.mode,
        tone: settings.tone,
        culturalAdaptation: settings.culturalAdaptation,
        preserveProperNames: settings.preserveNames,
        showTranslatorNotes: settings.showNotes,
        status: "Rascunho",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        manuallyEdited: false
      };
    }

    setExportData({ entry: exportEntry, project, allEntries });
    setIsExportModalOpen(true);
  };

  const handleClear = () => {
    if (hasUnsavedChanges) {
      setIsConfirmationOpen(true);
      return;
    }
    confirmClear();
  };

  const handleExampleClick = (text: string) => {
    setOriginalText(text);
    setHasUnsavedChanges(true);
  };

  const handleDocumentProcessed = (text: string, metadata: DocumentMetadata) => {
    setOriginalText(text);
    setHasUnsavedChanges(true);
    showToast(`Documento "${metadata.name}" importado com sucesso!`);
    // O onTranslate será chamado pelo componente filho com um pequeno delay
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem("hasSeenOnboarding", "true");
  };

  const densityClasses = viewService.getDensityClasses(viewPrefs.density);

  return (
    <div className={cn(
      "min-h-screen flex flex-col transition-colors duration-500",
      viewPrefs.density === 'reading' ? 'bg-white' : 'bg-slate-50'
    )}>
      <Header 
        settings={settings} 
        onSettingsChange={handleSettingsChange}
        onResetSettings={handleResetSettings}
        onClear={() => setIsConfirmationOpen(true)}
        onSave={handleSaveClick}
        onExport={() => handleOpenExport()}
        onOpenProjects={() => setIsProjectManagerOpen(true)}
        viewPrefs={viewPrefs}
        onUpdateViewPrefs={updateViewPrefs}
      />
      
      {showOnboarding && <Onboarding onClose={handleCloseOnboarding} />}

      <main className={cn(
        "flex-1 flex flex-col lg:flex-row w-full mx-auto relative transition-all duration-500 pb-20 lg:pb-0",
        viewPrefs.density === 'reading' ? 'max-w-4xl' : 'max-w-[1600px]'
      )}>
        {/* Sidebar Toggle (Mobile) - Only in Panel Mode */}
        {viewPrefs.navigationMode === 'panel' && (
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden fixed bottom-24 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-200"
          >
            {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        )}

        {/* Sidebar Settings */}
        <div className={cn(
          "fixed inset-0 z-40 lg:relative lg:z-0 lg:block transition-transform duration-300 ease-in-out",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          viewPrefs.navigationMode === 'guided' ? 'hidden lg:block' : ''
        )}>
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
          <Sidebar
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onResetSettings={handleResetSettings}
            recentEntries={recentEntries}
            onLoadEntry={handleLoadEntry}
            onOpenProjects={() => setIsProjectManagerOpen(true)}
            viewPrefs={viewPrefs}
            className={cn(
              "relative w-72 h-full lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] shadow-2xl lg:shadow-none bg-white",
              densityClasses.card
            )}
          />
        </div>

        {/* Main Workspace */}
        <div className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-500",
          densityClasses.container
        )}>
          <div className={cn(
            "mx-auto w-full flex flex-col h-full transition-all duration-500",
            viewPrefs.density === 'reading' ? 'max-w-3xl' : 'max-w-5xl'
          )}>
            {/* Guided Mode Logic for Mobile */}
            <div className={cn(
              "flex-1 flex flex-col h-full",
              viewPrefs.navigationMode === 'guided' ? 'block' : 'flex flex-col lg:flex-row gap-6 p-4 lg:p-6'
            )}>
              
              {/* Translation Area */}
              <div className={cn(
                "flex-1 flex flex-col",
                viewPrefs.navigationMode === 'guided' && mobileActiveTab !== 'translate' ? 'hidden lg:flex' : 'flex'
              )}>
                <TranslationWorkspace
                  originalText={originalText}
                  translatedText={translatedText}
                  detectedLanguage={detectedLanguage}
                  isTranslating={isTranslating}
                  progressMessage={progressMessage}
                  translationProgress={translationProgress}
                  translationBlocks={translationBlocks}
                  error={error}
                  onOriginalTextChange={(text) => { setOriginalText(text); setHasUnsavedChanges(true); }}
                  onTranslate={handleTranslate}
                  onClear={handleClear}
                  onExampleClick={handleExampleClick}
                  onDocumentProcessed={handleDocumentProcessed}
                  onSave={handleSaveClick}
                  entryTitle={entryTitle}
                  onEntryTitleChange={handleEntryTitleChange}
                  onOpenProjects={() => setIsProjectManagerOpen(true)}
                  onOpenExport={(entry, project, allEntries) => handleOpenExport(entry, project, allEntries)}
                  notes={notes}
                  adaptedExpressions={adaptedExpressions}
                  translationStrategy={translationStrategy}
                  toneDetected={toneDetected}
                  showNotes={settings.showNotes}
                  hasUnsavedChanges={hasUnsavedChanges}
                  viewPrefs={viewPrefs}
                  currentEntry={currentEntryId ? {
                    id: currentEntryId,
                    sourceText: originalText,
                    translatedText: translatedText,
                    translatorNotes: notes,
                    adaptedExpressions: adaptedExpressions,
                    translationStrategy: translationStrategy,
                    toneDetected: toneDetected,
                    chatHistory: chatMessages,
                    sourceLanguage: settings.sourceLanguage,
                    targetLanguage: settings.targetLanguage,
                    translationMode: settings.mode,
                    tone: settings.tone,
                    culturalAdaptation: settings.culturalAdaptation,
                    preserveProperNames: settings.preserveNames,
                    showTranslatorNotes: settings.showNotes,
                    projectId: "",
                    title: "Tradução Atual",
                    status: "Rascunho" as EntryStatus,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    manuallyEdited: false
                  } : undefined}
                />
              </div>

              {/* Notes Area (Guided Mode Only) */}
              {viewPrefs.navigationMode === 'guided' && mobileActiveTab === 'notes' && (
                <div className="flex-1 flex flex-col p-4">
                  <TranslatorNotes
                    notes={notes}
                    isVisible={settings.showNotes && translatedText.length > 0}
                    viewPrefs={viewPrefs}
                    defaultExpanded={true}
                  />
                </div>
              )}

              {/* Chat Area */}
              <div className={cn(
                "flex-1 flex flex-col",
                viewPrefs.navigationMode === 'guided' && mobileActiveTab !== 'chat' ? 'hidden lg:flex' : 'flex'
              )}>
                <ChatTab
                  messages={chatMessages}
                  isTyping={isChatLoading}
                  onSendMessage={handleChatSubmit}
                  onSuggestionClick={handleChatSubmit}
                  hasTranslation={translatedText.length > 0}
                  viewPrefs={viewPrefs}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Navigation Bar (Guided Mode) */}
      {viewPrefs.navigationMode === 'guided' && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-100 px-6 py-3 flex items-center justify-between z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <MobileNavItem 
            active={mobileActiveTab === 'translate'} 
            onClick={() => setMobileActiveTab('translate')}
            icon={<BookOpen className="h-5 w-5" />}
            label="Traduzir"
          />
          <MobileNavItem 
            active={mobileActiveTab === 'chat'} 
            onClick={() => setMobileActiveTab('chat')}
            icon={<MessageCircle className="h-5 w-5" />}
            label="Apoio"
          />
          <MobileNavItem 
            active={mobileActiveTab === 'notes'} 
            onClick={() => setMobileActiveTab('notes')}
            icon={<Settings className="h-5 w-5" />}
            label="Notas"
          />
          <MobileNavItem 
            active={mobileActiveTab === 'projects'} 
            onClick={() => {
              setMobileActiveTab('projects');
              setIsProjectManagerOpen(true);
            }}
            icon={<FolderOpen className="h-5 w-5" />}
            label="Projetos"
          />
        </div>
      )}

      {/* Overlays */}
      <ProjectManager 
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        onLoadEntry={handleLoadEntry}
        onOpenExport={handleOpenExport}
        currentEntryId={currentEntryId}
        viewPrefs={viewPrefs}
      />

      {isSaveModalOpen && (
        <SaveModal 
          onSave={handleSaveToProject}
          onClose={() => setIsSaveModalOpen(false)}
          defaultTitle={originalText.slice(0, 30) + (originalText.length > 30 ? "..." : "")}
          viewPrefs={viewPrefs}
        />
      )}

      {isExportModalOpen && (
        <ExportModal
          entry={exportData.entry || null}
          project={exportData.project || null}
          allProjectEntries={exportData.allEntries}
          onClose={() => setIsExportModalOpen(false)}
          onSuccess={(msg) => console.log(msg)}
          onError={(msg) => setError(msg)}
          viewPrefs={viewPrefs}
        />
      )}

      {isConfirmationOpen && (
        <ConfirmationModal
          isOpen={isConfirmationOpen}
          title="Limpar Workspace?"
          message="Existem alterações não salvas. Deseja realmente limpar tudo e começar do zero?"
          confirmLabel="Sim, Limpar"
          cancelLabel="Manter"
          variant="danger"
          onConfirm={confirmClear}
          onClose={() => setIsConfirmationOpen(false)}
        />
      )}

      {/* Toasts */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={cn(
              "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md",
              toast.type === "success" ? "bg-emerald-500/90 text-white border-emerald-400" : 
              toast.type === "error" ? "bg-red-500/90 text-white border-red-400" : 
              "bg-slate-800/90 text-white border-slate-700"
            )}
          >
            {toast.type === "success" && <CheckCircle2 className="h-5 w-5" />}
            {toast.type === "error" && <AlertCircle className="h-5 w-5" />}
            <span className="text-sm font-bold tracking-wide">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

function MobileNavItem({ active, onClick, icon, label }: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string; 
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300",
        active ? "text-brand-600 scale-110" : "text-slate-400 hover:text-slate-600"
      )}
    >
      <div className={cn(
        "p-2 rounded-xl transition-colors",
        active ? "bg-brand-50" : "bg-transparent"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[10px] font-bold uppercase tracking-widest",
        active ? "opacity-100" : "opacity-60"
      )}>
        {label}
      </span>
    </button>
  );
}

function Footer() {
  return (
    <footer className="hidden lg:block py-8 px-6 border-t border-slate-100 bg-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">T</div>
          <span className="text-sm font-bold text-slate-900 tracking-tight">Tradutor Literário Contextual</span>
        </div>
        <div className="flex items-center gap-8">
          <a href="#" className="text-xs font-bold text-slate-400 hover:text-brand-600 transition-colors uppercase tracking-widest">Documentação</a>
          <a href="#" className="text-xs font-bold text-slate-400 hover:text-brand-600 transition-colors uppercase tracking-widest">Privacidade</a>
          <a href="#" className="text-xs font-bold text-slate-400 hover:text-brand-600 transition-colors uppercase tracking-widest">Suporte</a>
        </div>
        <p className="text-xs font-medium text-slate-400">© 2026 Tradutor Literário Contextual. Todos os direitos reservados.</p>
      </div>
    </footer>
  );
}
