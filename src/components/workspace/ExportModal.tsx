import React, { useState } from "react";
import { 
  Download, 
  Copy, 
  FileText, 
  CheckCircle2, 
  X, 
  Layout, 
  Settings, 
  MessageSquare, 
  Info, 
  Check,
  FileCode,
  ArrowRightLeft
} from "lucide-react";
import { cn } from "@/src/utils";
import { Project, TranslationEntry } from "@/src/services/storageService";
import { exportService, ExportOptions, DEFAULT_EXPORT_OPTIONS } from "@/src/services/exportService";
import { ViewPreferences, viewService } from "@/src/services/viewService";

interface ExportModalProps {
  entry: TranslationEntry | null;
  project: Project | null;
  allProjectEntries?: TranslationEntry[];
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  viewPrefs: ViewPreferences;
}

export const ExportModal: React.FC<ExportModalProps> = ({ 
  entry, 
  project, 
  allProjectEntries,
  onClose, 
  onSuccess, 
  onError,
  viewPrefs
}) => {
  const densityClasses = viewService.getDensityClasses(viewPrefs.density);
  const [options, setOptions] = useState<ExportOptions>(DEFAULT_EXPORT_OPTIONS);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"entry" | "project">(allProjectEntries ? "project" : "entry");

  const handleExport = async (format: ExportOptions['format']) => {
    if (!entry && !allProjectEntries) {
      onError("Não há conteúdo suficiente para exportar.");
      return;
    }

    setIsExporting(true);
    const updatedOptions = { ...options, format };

    try {
      let success = false;
      if (exportType === "project" && project && allProjectEntries) {
        success = await exportService.exportProject(project, allProjectEntries, updatedOptions);
        if (success) onSuccess(format === 'clipboard' ? "Projeto copiado para a área de transferência." : "Projeto exportado com sucesso.");
      } else if (entry) {
        success = await exportService.exportEntry(entry, project, updatedOptions);
        if (success) onSuccess(format === 'clipboard' ? "Tradução copiada para a área de transferência." : "Tradução exportada com sucesso.");
      }

      if (success) onClose();
    } catch (err) {
      console.error(err);
      onError(exportService.handleDownloadFailure(err));
    } finally {
      setIsExporting(false);
    }
  };

  const toggleOption = (key: keyof ExportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={cn(
        "bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300",
        densityClasses.card
      )}>
        {/* Header */}
        <div className={cn(
          "border-b border-slate-100 flex items-center justify-between bg-slate-50/50",
          viewPrefs.density === 'compact' ? 'p-4' : 'p-6'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-100",
              viewPrefs.density === 'compact' ? 'h-8 w-8' : 'h-10 w-10'
            )}>
              <Download className={viewPrefs.density === 'compact' ? 'h-4 w-4' : 'h-5 w-5'} />
            </div>
            <div>
              <h3 className={cn("font-serif font-bold text-slate-800", viewPrefs.density === 'compact' ? 'text-base' : 'text-lg')}>Exportar Trabalho</h3>
              <p className="text-[10px] text-slate-500">Escolha o formato e o que incluir</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className={cn("space-y-6 max-h-[70vh] overflow-y-auto", viewPrefs.density === 'compact' ? 'p-4' : 'p-6')}>
          {/* Scope Selection (if project entries are available) */}
          {allProjectEntries && (
            <div className="space-y-3">
              <label className={cn("font-bold text-slate-400 uppercase tracking-widest", densityClasses.label)}>Escopo da Exportação</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setExportType("entry")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border font-bold transition-all",
                    viewPrefs.density === 'compact' ? 'p-2 text-xs' : 'p-3 text-sm',
                    exportType === "entry" ? "bg-brand-50 border-brand-200 text-brand-700" : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                  )}
                >
                  <FileText className="h-4 w-4" />
                  Entrada Atual
                </button>
                <button 
                  onClick={() => setExportType("project")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border font-bold transition-all",
                    viewPrefs.density === 'compact' ? 'p-2 text-xs' : 'p-3 text-sm',
                    exportType === "project" ? "bg-brand-50 border-brand-200 text-brand-700" : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                  )}
                >
                  <Layout className="h-4 w-4" />
                  Projeto Inteiro
                </button>
              </div>
            </div>
          )}

          {/* Options Selection */}
          <div className="space-y-3">
            <label className={cn("font-bold text-slate-400 uppercase tracking-widest", densityClasses.label)}>O que incluir na saída?</label>
            <div className="grid grid-cols-2 gap-2">
              <OptionToggle 
                label="Texto Original" 
                active={options.includeOriginal} 
                onClick={() => toggleOption('includeOriginal')} 
                density={viewPrefs.density}
              />
              <OptionToggle 
                label="Tradução" 
                active={options.includeTranslation} 
                onClick={() => toggleOption('includeTranslation')} 
                density={viewPrefs.density}
              />
              <OptionToggle 
                label="Notas do Tradutor" 
                active={options.includeNotes} 
                onClick={() => toggleOption('includeNotes')} 
                density={viewPrefs.density}
              />
              <OptionToggle 
                label="Configurações" 
                active={options.includeSettings} 
                onClick={() => toggleOption('includeSettings')} 
                density={viewPrefs.density}
              />
              <OptionToggle 
                label="Histórico do Chat" 
                active={options.includeChat} 
                onClick={() => toggleOption('includeChat')} 
                density={viewPrefs.density}
              />
              <OptionToggle 
                label="Metadados" 
                active={options.includeMetadata} 
                onClick={() => toggleOption('includeMetadata')} 
                density={viewPrefs.density}
              />
              {exportType === "project" && (
                <OptionToggle 
                  label="Separar por Páginas" 
                  active={options.includePageSeparation} 
                  onClick={() => toggleOption('includePageSeparation')} 
                  density={viewPrefs.density}
                />
              )}
            </div>
          </div>

          {/* Export Formats */}
          <div className="space-y-3">
            <label className={cn("font-bold text-slate-400 uppercase tracking-widest", densityClasses.label)}>Formato de Saída</label>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => handleExport('clipboard')}
                disabled={isExporting}
                className={cn(
                  "flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all group",
                  viewPrefs.density === 'compact' ? 'p-3' : 'p-4'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-brand-600 transition-colors shadow-sm",
                    viewPrefs.density === 'compact' ? 'h-8 w-8' : 'h-10 w-10'
                  )}>
                    <Copy className={viewPrefs.density === 'compact' ? 'h-4 w-4' : 'h-5 w-5'} />
                  </div>
                  <div className="text-left">
                    <p className={cn("font-bold text-slate-800", viewPrefs.density === 'compact' ? 'text-xs' : 'text-sm')}>Copiar para Área de Transferência</p>
                    <p className="text-[10px] text-slate-500">Ideal para colar em outros editores</p>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 text-slate-200 group-hover:text-brand-500 transition-colors" />
              </button>

              <button 
                onClick={() => handleExport('docx')}
                disabled={isExporting}
                className={cn(
                  "flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all group",
                  viewPrefs.density === 'compact' ? 'p-3' : 'p-4'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-brand-600 transition-colors shadow-sm",
                    viewPrefs.density === 'compact' ? 'h-8 w-8' : 'h-10 w-10'
                  )}>
                    <FileText className={viewPrefs.density === 'compact' ? 'h-4 w-4' : 'h-5 w-5'} />
                  </div>
                  <div className="text-left">
                    <p className={cn("font-bold text-slate-800", viewPrefs.density === 'compact' ? 'text-xs' : 'text-sm')}>Exportar como DOCX</p>
                    <p className="text-[10px] text-slate-500">Documento formatado para Word/Docs</p>
                  </div>
                </div>
                <Download className="h-5 w-5 text-slate-200 group-hover:text-brand-500 transition-colors" />
              </button>

              <button 
                onClick={() => handleExport('pdf')}
                disabled={isExporting}
                className={cn(
                  "flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all group",
                  viewPrefs.density === 'compact' ? 'p-3' : 'p-4'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-brand-600 transition-colors shadow-sm",
                    viewPrefs.density === 'compact' ? 'h-8 w-8' : 'h-10 w-10'
                  )}>
                    <FileCode className={viewPrefs.density === 'compact' ? 'h-4 w-4' : 'h-5 w-5'} />
                  </div>
                  <div className="text-left">
                    <p className={cn("font-bold text-slate-800", viewPrefs.density === 'compact' ? 'text-xs' : 'text-sm')}>Exportar como PDF</p>
                    <p className="text-[10px] text-slate-500">Arquivo pronto para impressão e leitura</p>
                  </div>
                </div>
                <Download className="h-5 w-5 text-slate-200 group-hover:text-brand-500 transition-colors" />
              </button>

              <button 
                onClick={() => handleExport('txt')}
                disabled={isExporting}
                className={cn(
                  "flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all group",
                  viewPrefs.density === 'compact' ? 'p-3' : 'p-4'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-brand-600 transition-colors shadow-sm",
                    viewPrefs.density === 'compact' ? 'h-8 w-8' : 'h-10 w-10'
                  )}>
                    <FileCode className={viewPrefs.density === 'compact' ? 'h-4 w-4' : 'h-5 w-5'} />
                  </div>
                  <div className="text-left">
                    <p className={cn("font-bold text-slate-800", viewPrefs.density === 'compact' ? 'text-xs' : 'text-sm')}>Exportar como TXT</p>
                    <p className="text-[10px] text-slate-500">Formato simples e universal</p>
                  </div>
                </div>
                <Download className="h-5 w-5 text-slate-200 group-hover:text-brand-500 transition-colors" />
              </button>

              {exportType === "entry" && (
                <button 
                  onClick={() => handleExport('comparison')}
                  disabled={isExporting}
                  className={cn(
                    "flex items-center justify-between bg-brand-50 hover:bg-brand-100 border border-brand-100 rounded-2xl transition-all group",
                    viewPrefs.density === 'compact' ? 'p-3' : 'p-4'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "bg-white rounded-xl flex items-center justify-center text-brand-600 shadow-sm",
                      viewPrefs.density === 'compact' ? 'h-8 w-8' : 'h-10 w-10'
                    )}>
                      <ArrowRightLeft className={viewPrefs.density === 'compact' ? 'h-4 w-4' : 'h-5 w-5'} />
                    </div>
                    <div className="text-left">
                      <p className={cn("font-bold text-brand-800", viewPrefs.density === 'compact' ? 'text-xs' : 'text-sm')}>Exportar Comparativo</p>
                      <p className="text-[10px] text-brand-600/70">Original e Tradução lado a lado</p>
                    </div>
                  </div>
                  <Download className="h-5 w-5 text-brand-300 group-hover:text-brand-600 transition-colors" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={cn("bg-slate-50 border-t border-slate-100 flex items-center justify-center", viewPrefs.density === 'compact' ? 'p-4' : 'p-6')}>
          <p className="text-[10px] text-slate-400 text-center flex items-center gap-2">
            <Info className="h-3 w-3" />
            Sua tradução será formatada profissionalmente para uso real.
          </p>
        </div>
      </div>
    </div>
  );
};

const OptionToggle = ({ label, active, onClick, density }: { label: string, active: boolean, onClick: () => void, density: ViewPreferences['density'] }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex items-center justify-between px-3 py-2 rounded-xl border font-bold transition-all",
      density === 'compact' ? 'text-[10px]' : 'text-[11px]',
      active ? "bg-brand-50 border-brand-200 text-brand-700" : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
    )}
  >
    {label}
    {active ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-slate-200" />}
  </button>
);
