import React from "react";
import { Select } from "../ui/Select";
import { Toggle } from "../ui/Toggle";
import { Settings2, Globe, PenTool, Sparkles, RotateCcw, Clock, Plus, FolderOpen } from "lucide-react";
import { motion } from "motion/react";
import { ViewPreferences, viewService } from "@/src/services/viewService";
import { cn } from "@/src/utils";
import { TranslationEntry } from "@/src/services/storageService";

interface SidebarProps {
  settings: {
    sourceLanguage: string;
    targetLanguage: string;
    mode: string;
    tone: string;
    culturalAdaptation: string;
    preserveNames: boolean;
    showNotes: boolean;
  };
  onSettingsChange: (key: string, value: any) => void;
  onResetSettings?: () => void;
  recentEntries: TranslationEntry[];
  onLoadEntry: (entry: TranslationEntry) => void;
  onOpenProjects: () => void;
  className?: string;
  viewPrefs: ViewPreferences;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  settings, 
  onSettingsChange, 
  onResetSettings, 
  recentEntries,
  onLoadEntry,
  onOpenProjects,
  className,
  viewPrefs
}) => {
  const densityClasses = viewService.getDensityClasses(viewPrefs.density);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <aside 
      id="app-sidebar" 
      className={cn(
        "flex flex-col bg-white border-r border-slate-100 overflow-y-auto transition-all duration-300 paper-texture",
        viewPrefs.density === 'compact' ? "gap-6 p-5" : "gap-10 p-8",
        className
      )}
    >
      {/* Projetos Recentes */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-slate-300" />
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Recentes</h3>
          </div>
          <button 
            onClick={onOpenProjects}
            className="text-[10px] font-bold text-brand-600 hover:text-brand-800 uppercase tracking-[0.1em] transition-colors"
          >
            Ver Todos
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {recentEntries.length > 0 ? (
            recentEntries.slice(0, 3).map(entry => (
              <button
                key={entry.id}
                onClick={() => onLoadEntry(entry)}
                className="group flex flex-col items-start p-4 bg-slate-50/50 hover:bg-white rounded-2xl border border-slate-100/50 hover:border-brand-200 hover:shadow-soft transition-all text-left"
              >
                <span className="text-[11px] font-bold text-slate-700 group-hover:text-brand-900 truncate w-full">
                  {entry.title || "Sem título"}
                </span>
                <span className="text-[10px] text-slate-400 group-hover:text-brand-500 mt-1 font-mono">
                  {entry.sourceLanguage} → {entry.targetLanguage}
                </span>
              </button>
            ))
          ) : (
            <div className="p-6 border border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center gap-3 text-center bg-slate-50/30">
              <FolderOpen className="h-5 w-5 text-slate-200" />
              <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-wider">Nenhuma tradução<br/>recente</p>
            </div>
          )}
        </div>
      </motion.div>

      <div className="h-px bg-slate-100" />

      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center justify-between",
          viewPrefs.density === 'compact' ? "pb-1" : "pb-2"
        )}
      >
        <div className="flex items-center gap-2.5 text-slate-800">
          <Settings2 className="h-4 w-4 text-brand-400" />
          <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Ajustes</h2>
        </div>
        {onResetSettings && (
          <motion.button 
            whileHover={{ rotate: -90, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onResetSettings}
            className="p-2 text-slate-300 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
            title="Resetar"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </motion.button>
        )}
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "flex flex-col",
          viewPrefs.density === 'compact' ? "gap-6" : "gap-8"
        )}
      >
        {/* Idiomas */}
        <motion.div variants={itemVariants} id="sidebar-languages" className={cn("flex flex-col", viewPrefs.density === 'compact' ? "gap-3" : "gap-4")}>
          <div className="flex items-center gap-2 mb-1 px-1">
            <Globe className="h-3.5 w-3.5 text-slate-400" />
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Idiomas</h3>
          </div>
          <div className={cn("grid", viewPrefs.density === 'compact' ? "gap-3" : "gap-4")}>
            <Select
              label="Origem"
              value={settings.sourceLanguage}
              onChange={(e) => onSettingsChange("sourceLanguage", e.target.value)}
              className={viewPrefs.density === 'compact' ? "py-1.5 text-xs" : ""}
            >
              <option value="auto">Detectar automaticamente</option>
              <option value="Português (Brasil)">Português (Brasil)</option>
              <option value="English">English</option>
              <option value="Español">Español</option>
              <option value="Français">Français</option>
              <option value="Italiano">Italiano</option>
              <option value="Deutsch">Deutsch</option>
              <option value="Japanese">Japanese</option>
              <option value="Korean">Korean</option>
            </Select>

            <Select
              label="Destino"
              value={settings.targetLanguage}
              onChange={(e) => onSettingsChange("targetLanguage", e.target.value)}
              className={viewPrefs.density === 'compact' ? "py-1.5 text-xs" : ""}
            >
              <option value="Português (Brasil)">Português (Brasil)</option>
              <option value="English">English</option>
              <option value="Español">Español</option>
              <option value="Français">Français</option>
              <option value="Italiano">Italiano</option>
              <option value="Deutsch">Deutsch</option>
              <option value="Japanese">Japanese</option>
              <option value="Korean">Korean</option>
            </Select>
          </div>
        </motion.div>

        {/* Estilo & Tom */}
        <motion.div variants={itemVariants} id="sidebar-style-tone" className={cn("flex flex-col", viewPrefs.density === 'compact' ? "gap-3" : "gap-4")}>
          <div className="flex items-center gap-2 mb-1 px-1">
            <PenTool className="h-3.5 w-3.5 text-slate-400" />
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estilo & Tom</h3>
          </div>
          
          <div className={cn("grid", viewPrefs.density === 'compact' ? "gap-4" : "gap-5")}>
            <div className="flex flex-col gap-1.5">
              <Select
                label="Modo de Tradução"
                value={settings.mode}
                onChange={(e) => onSettingsChange("mode", e.target.value)}
                className={viewPrefs.density === 'compact' ? "py-1.5 text-xs" : ""}
              >
                <option value="Literal">Literal</option>
                <option value="Equilibrado">Equilibrado</option>
                <option value="Literário Adaptado">Literário Adaptado</option>
              </Select>
              {viewPrefs.density !== 'compact' && (
                <p className="text-[10px] text-slate-400 italic px-2 font-serif">
                  {settings.mode === "Literal" && "Fidelidade lexical e estrutural"}
                  {settings.mode === "Equilibrado" && "Equilíbrio entre fidelidade e naturalidade"}
                  {settings.mode === "Literário Adaptado" && "Foco máximo em fluidez, estilo e impacto"}
                </p>
              )}
            </div>

            <Select
              label="Tom Narrativo"
              value={settings.tone}
              onChange={(e) => onSettingsChange("tone", e.target.value)}
              className={viewPrefs.density === 'compact' ? "py-1.5 text-xs" : ""}
            >
              <option value="Neutro">Neutro</option>
              <option value="Formal">Formal</option>
              <option value="Coloquial">Coloquial</option>
              <option value="Poético">Poético</option>
              <option value="Juvenil">Juvenil</option>
              <option value="Narrativo">Narrativo</option>
            </Select>

            <Select
              label="Adaptação Cultural"
              value={settings.culturalAdaptation}
              onChange={(e) => onSettingsChange("culturalAdaptation", e.target.value)}
              className={viewPrefs.density === 'compact' ? "py-1.5 text-xs" : ""}
            >
              <option value="Mínima">Mínima</option>
              <option value="Moderada">Moderada</option>
              <option value="Alta">Alta</option>
            </Select>
          </div>
        </motion.div>

        {/* Preferências */}
        <motion.div variants={itemVariants} id="sidebar-preferences" className={cn("flex flex-col", viewPrefs.density === 'compact' ? "gap-3" : "gap-4")}>
          <div className="flex items-center gap-2 mb-1 px-1">
            <Sparkles className="h-3.5 w-3.5 text-slate-400" />
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Refinamento</h3>
          </div>
          
          <div className={cn(
            "flex flex-col bg-slate-50/50 rounded-2xl border border-slate-100/50",
            viewPrefs.density === 'compact' ? "gap-1 p-1.5" : "gap-2 p-2"
          )}>
            <Toggle
              label="Preservar nomes"
              description={viewPrefs.density === 'compact' ? undefined : "Mantém nomes originais"}
              checked={settings.preserveNames}
              onChange={(e) => onSettingsChange("preserveNames", e.target.checked)}
            />
            <Toggle
              label="Notas do tradutor"
              description={viewPrefs.density === 'compact' ? undefined : "Exibe insights de IA"}
              checked={settings.showNotes}
              onChange={(e) => onSettingsChange("showNotes", e.target.checked)}
            />
          </div>
        </motion.div>
      </motion.div>
    </aside>
  );
};
