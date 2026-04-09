import React from "react";
import { 
  BookOpenText, 
  Settings, 
  Trash2, 
  Save, 
  FolderOpen, 
  Share2,
  Layout,
  Maximize2,
  Minimize2,
  BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ViewPreferences, NavigationMode, DensityMode } from "@/src/services/viewService";
import { cn } from "@/src/utils";
import { TranslationSettings } from "@/src/services/geminiService";

interface HeaderProps {
  settings: TranslationSettings;
  onSettingsChange: (key: string, value: any) => void;
  onResetSettings: () => void;
  onClear: () => void;
  onSave: () => void;
  onExport: () => void;
  onOpenProjects: () => void;
  viewPrefs: ViewPreferences;
  onUpdateViewPrefs: (prefs: Partial<ViewPreferences>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onSettingsChange,
  onResetSettings,
  onClear,
  onSave,
  onExport,
  onOpenProjects,
  viewPrefs,
  onUpdateViewPrefs
}) => {
  const [isViewMenuOpen, setIsViewMenuOpen] = React.useState(false);

  const densityOptions: { id: DensityMode; label: string; icon: React.ReactNode }[] = [
    { id: 'compact', label: 'Compacto', icon: <Minimize2 className="h-4 w-4" /> },
    { id: 'comfortable', label: 'Confortável', icon: <Layout className="h-4 w-4" /> },
    { id: 'reading', label: 'Leitura', icon: <Maximize2 className="h-4 w-4" /> },
  ];

  const navOptions: { id: NavigationMode; label: string; icon: React.ReactNode }[] = [
    { id: 'guided', label: 'Guiado', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'panel', label: 'Painel', icon: <Layout className="h-4 w-4" /> },
  ];
  return (
    <header id="app-header" className="sticky top-0 z-40 w-full border-b border-slate-100/50 bg-white/70 backdrop-blur-2xl">
      <div className="flex h-16 items-center px-6 md:px-10 max-w-[1600px] mx-auto justify-between">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4"
        >
          <motion.div 
            whileHover={{ rotate: 5, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-xl shadow-brand-200/50 cursor-pointer"
          >
            <BookOpenText className="h-5.5 w-5.5" />
          </motion.div>
          <div className="flex flex-col">
            <h1 className="text-lg font-serif font-bold text-gradient tracking-tight leading-none">
              Tradutor Literário Contextual
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.25em] mt-1">
              Inteligência Narrativa & Adaptação Cultural
            </p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 lg:gap-4"
        >
          {/* View Preferences Toggle */}
          <div className="relative">
            <button
              onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-xs font-bold uppercase tracking-wider",
                isViewMenuOpen ? "bg-brand-50 text-brand-600" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Layout className="h-4 w-4" />
              <span className="hidden sm:inline">Visualização</span>
            </button>

            <AnimatePresence>
              {isViewMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsViewMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-20"
                  >
                    <div className="space-y-6">
                      {/* Density Section */}
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Densidade</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {densityOptions.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => onUpdateViewPrefs({ density: opt.id })}
                              className={cn(
                                "flex flex-col items-center gap-2 p-2 rounded-xl border transition-all",
                                viewPrefs.density === opt.id 
                                  ? "bg-brand-50 border-brand-200 text-brand-600" 
                                  : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                              )}
                            >
                              {opt.icon}
                              <span className="text-[10px] font-bold">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Navigation Section */}
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Navegação</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {navOptions.map((opt) => (
                            <button
                              key={opt.id}
                              onClick={() => onUpdateViewPrefs({ navigationMode: opt.id })}
                              className={cn(
                                "flex items-center justify-center gap-2 p-2 rounded-xl border transition-all",
                                viewPrefs.navigationMode === opt.id 
                                  ? "bg-brand-50 border-brand-200 text-brand-600" 
                                  : "bg-white border-slate-100 text-slate-500 hover:border-slate-200"
                              )}
                            >
                              {opt.icon}
                              <span className="text-[10px] font-bold">{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="h-8 w-px bg-slate-100 hidden sm:block" />

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenProjects}
              className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
              title="Projetos"
            >
              <FolderOpen className="h-5 w-5" />
            </button>
            <button
              onClick={onExport}
              className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
              title="Exportar"
            >
              <Share2 className="h-5 w-5" />
            </button>
            <button
              onClick={onClear}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Limpar"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </header>
  );
};
