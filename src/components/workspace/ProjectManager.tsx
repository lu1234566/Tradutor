import React, { useState, useEffect } from "react";
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Clock, 
  Trash2, 
  FileText, 
  ChevronRight,
  MoreVertical,
  Edit2,
  Copy,
  X,
  Globe
} from "lucide-react";
import { Project, TranslationEntry, storageService } from "../../services/storageService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../utils";

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadEntry: (entry: TranslationEntry) => void;
  currentEntryId?: string | null;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ 
  isOpen, 
  onClose, 
  onLoadEntry,
  currentEntryId 
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [entries, setEntries] = useState<TranslationEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    const allProjects = storageService.listProjects();
    setProjects(allProjects.sort((a, b) => b.updatedAt - a.updatedAt));
    
    if (allProjects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(allProjects[0].id);
      setEntries(storageService.listEntriesByProject(allProjects[0].id));
    } else if (selectedProjectId) {
      setEntries(storageService.listEntriesByProject(selectedProjectId));
    }
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setEntries(storageService.listEntriesByProject(id));
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    const project = storageService.createProject({ name: newProjectName });
    setNewProjectName("");
    setIsCreatingProject(false);
    loadData();
    setSelectedProjectId(project.id);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Tem certeza que deseja excluir este projeto e todas as suas traduções?")) {
      storageService.deleteProject(id);
      if (selectedProjectId === id) setSelectedProjectId(null);
      loadData();
    }
  };

  const handleDeleteEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Excluir esta tradução?")) {
      storageService.deleteEntry(id);
      loadData();
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-5xl h-[80vh] rounded-3xl shadow-2xl flex overflow-hidden border border-slate-200"
      >
        {/* Sidebar: Projetos */}
        <div className="w-72 bg-slate-50 border-r border-slate-100 flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-brand-600" />
              <h2 className="font-bold text-slate-800">Projetos</h2>
            </div>
            <button 
              onClick={() => setIsCreatingProject(true)}
              className="p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar projeto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isCreatingProject && (
              <div className="p-2 space-y-2">
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Nome do projeto"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  className="w-full px-3 py-2 border border-brand-300 rounded-lg text-sm outline-none ring-2 ring-brand-500/10"
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleCreateProject}
                    className="flex-1 py-1.5 bg-brand-600 text-white text-xs font-bold rounded-lg"
                  >
                    Criar
                  </button>
                  <button 
                    onClick={() => setIsCreatingProject(false)}
                    className="flex-1 py-1.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {filteredProjects.map(project => (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-xl transition-all group",
                  selectedProjectId === project.id 
                    ? "bg-brand-50 text-brand-700 shadow-sm" 
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="font-semibold text-sm truncate w-full text-left">{project.name}</span>
                  <span className="text-[10px] opacity-60">{project.entryCount} traduções</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 
                    onClick={(e) => handleDeleteProject(project.id, e)}
                    className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" 
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main: Traduções */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {projects.find(p => p.id === selectedProjectId)?.name || "Selecione um projeto"}
              </h3>
              <p className="text-xs text-slate-500">Gerencie as traduções deste projeto</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!selectedProjectId ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                <FolderOpen className="h-12 w-12 opacity-20" />
                <p>Selecione um projeto para ver as traduções</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                <FileText className="h-12 w-12 opacity-20" />
                <p>Nenhuma tradução neste projeto ainda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {entries.map(entry => (
                  <div 
                    key={entry.id}
                    className={cn(
                      "group relative p-5 rounded-2xl border transition-all hover:shadow-md",
                      currentEntryId === entry.id 
                        ? "border-brand-200 bg-brand-50/30 ring-1 ring-brand-100" 
                        : "border-slate-100 hover:border-brand-100 bg-white"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-800">{entry.title}</h4>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            entry.status === 'Final' ? "bg-emerald-100 text-emerald-700" :
                            entry.status === 'Revisado' ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {entry.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(entry.updatedAt, "d 'de' MMM, HH:mm", { locale: ptBR })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {entry.sourceLanguage} → {entry.targetLanguage}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => onLoadEntry(entry)}
                          className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700 transition-all shadow-sm"
                        >
                          Abrir
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Original</p>
                        <p className="text-xs text-slate-600 line-clamp-2 font-serif italic">
                          {entry.sourceText.substring(0, 150)}...
                        </p>
                      </div>
                      <div className="bg-brand-50/20 p-3 rounded-xl border border-brand-50/50">
                        <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1">Tradução</p>
                        <p className="text-xs text-slate-700 line-clamp-2 font-serif">
                          {entry.translatedText.substring(0, 150)}...
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => handleDeleteEntry(entry.id, e)}
                      className="absolute -top-2 -right-2 p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
