import React from "react";
import { Select } from "../ui/Select";
import { Toggle } from "../ui/Toggle";
import { Settings2, Globe, PenTool, Sparkles, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import { ViewPreferences, viewService } from "@/src/services/viewService";
import { cn } from "@/src/utils";

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
  className?: string;
  viewPrefs: ViewPreferences;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  settings, 
  onSettingsChange, 
  onResetSettings, 
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
        "flex flex-col bg-white border-r border-slate-100 overflow-y-auto transition-all duration-300",
        viewPrefs.density === 'compact' ? "gap-6 p-4" : "gap-10 p-8",
        className
      )}
    >
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "flex items-center justify-between border-b border-slate-50",
          viewPrefs.density === 'compact' ? "pb-3" : "pb-6"
        )}
      >
        <div className="flex items-center gap-2 text-slate-800">
          <Settings2 className="h-4 w-4 text-brand-500" />
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Configurações</h2>
        </div>
        {onResetSettings && (
          <motion.button 
            whileHover={{ rotate: -45, scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onResetSettings}
            className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
            title="Resetar Configurações"
          >
            <RotateCcw className="h-4 w-4" />
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
                <option value="Adaptado">Adaptado</option>
              </Select>
              {viewPrefs.density !== 'compact' && (
                <p className="text-[10px] text-slate-400 italic px-2 font-serif">
                  {settings.mode === "Literal" && "Prioriza fidelidade estrutural"}
                  {settings.mode === "Equilibrado" && "Balanceia fidelidade e fluidez"}
                  {settings.mode === "Adaptado" && "Prioriza naturalidade e localização cultural"}
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
              <option value="Poético">Poético</option>
              <option value="Dramático">Dramático</option>
              <option value="Sombrio">Sombrio</option>
              <option value="Clássico">Clássico</option>
              <option value="Moderno">Moderno</option>
            </Select>

            <Select
              label="Adaptação Cultural"
              value={settings.culturalAdaptation}
              onChange={(e) => onSettingsChange("culturalAdaptation", e.target.value)}
              className={viewPrefs.density === 'compact' ? "py-1.5 text-xs" : ""}
            >
              <option value="Baixa">Baixa</option>
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
