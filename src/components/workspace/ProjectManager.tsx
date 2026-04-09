import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FolderPlus, 
  Search, 
  Plus, 
  Clock, 
  FileText, 
  ChevronRight, 
  Trash2, 
  Copy, 
  MoreVertical,
  ArrowLeft,
  BookOpen,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Edit3,
  X,
  Check,
  Share2
} from "lucide-react";
import { cn } from "@/src/utils";
import { Project, TranslationEntry, storageService, EntryStatus } from "@/src/services/storageService";
import { ConfirmationModal } from "../ui/ConfirmationModal";
import { viewService, ViewPreferences } from "@/src/services/viewService";

interface ProjectManagerProps {
  onLoadEntry: (entry: TranslationEntry) => void;
  onOpenExport: (entry: TranslationEntry | null, project: Project | null, entries?: TranslationEntry[]) => void;
  onClose: () => void;
  viewPrefs: ViewPreferences;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ 
  onLoadEntry, 
  onOpenExport, 
  onClose,
  viewPrefs
}) => {
  const densityClasses = viewService.getDensityClasses(viewPrefs.density);
  const [view, setView] = useState<"projects" | "project-detail">("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [entries, setEntries] = useState<TranslationEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Forms
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: "", description: "" });
  
  // Editing
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectData, setEditProjectData] = useState({ name: "", description: "" });
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editEntryData, setEditEntryData] = useState({ title: "", status: "Rascunho" as EntryStatus });

  // Confirmation Modals
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'project' | 'entry', id: string } | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    setProjects(storageService.listProjects().sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectData.name.trim()) {
      const project = storageService.createProject(newProjectData);
      setNewProjectData({ name: "", description: "" });
      setShowNewProjectForm(false);
      loadProjects();
      handleOpenProject(project);
    }
  };

  const handleOpenProject = (project: Project) => {
    setSelectedProject(project);
    setEntries(storageService.listEntriesByProject(project.id).sort((a, b) => b.updatedAt - a.updatedAt));
    setView("project-detail");
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ type: 'project', id });
  };

  const confirmDeleteProject = (id: string) => {
    storageService.deleteProject(id);
    loadProjects();
  };

  const handleStartEditProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setEditProjectData({ name: project.name, description: project.description || "" });
  };

  const handleSaveEditProject = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingProjectId && editProjectData.name.trim()) {
      storageService.updateProject(editingProjectId, editProjectData);
      setEditingProjectId(null);
      loadProjects();
    }
  };

  const handleDeleteEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ type: 'entry', id });
  };

  const confirmDeleteEntry = (id: string) => {
    storageService.deleteEntry(id);
    if (selectedProject) {
      setEntries(storageService.listEntriesByProject(selectedProject.id).sort((a, b) => b.updatedAt - a.updatedAt));
    }
  };

  const handleDuplicateEntry = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.duplicateEntry(id);
    if (selectedProject) {
      setEntries(storageService.listEntriesByProject(selectedProject.id).sort((a, b) => b.updatedAt - a.updatedAt));
    }
  };

  const handleStartEditEntry = (entry: TranslationEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEntryId(entry.id);
    setEditEntryData({ title: entry.title, status: entry.status });
  };

  const handleSaveEditEntry = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingEntryId && editEntryData.title.trim()) {
      storageService.updateEntry(editingEntryId, editEntryData);
      setEditingEntryId(null);
      if (selectedProject) {
        setEntries(storageService.listEntriesByProject(selectedProject.id).sort((a, b) => b.updatedAt - a.updatedAt));
      }
    }
  };

  const handleExportProject = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const projectEntries = storageService.listEntriesByProject(project.id);
    onOpenExport(null, project, projectEntries);
  };

  const handleExportEntry = (entry: TranslationEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenExport(entry, selectedProject, undefined);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEntries = entries.filter(e => 
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.sourceText.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('pt-BR', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).format(timestamp);
  };

  const getStatusColor = (status: EntryStatus) => {
    switch (status) {
      case "Final": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "Revisado": return "text-brand-600 bg-brand-50 border-brand-100";
      default: return "text-slate-500 bg-slate-50 border-slate-100";
    }
  };

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
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div 
      id="project-manager-container"
      className="flex flex-col h-full bg-[#FDFDFD]"
    >
      {/* Header */}
      <div 
        id="project-manager-header"
        className={cn(
          "border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10",
          viewPrefs.density === 'compact' ? "p-3" : viewPrefs.density === 'reading' ? "p-8" : "p-4 md:p-6"
        )}
      >
        <div className="flex items-center gap-3">
          {view === "project-detail" && (
            <motion.button 
              id="project-manager-back-btn"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { setView("projects"); setSearchQuery(""); }}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
            >
              <ArrowLeft className={densityClasses.icon} />
            </motion.button>
          )}
          <div>
            <h2 id="project-manager-title" className={cn(
              "font-serif font-bold text-slate-800",
              densityClasses.heading
            )}>
              {view === "projects" ? "Meus Projetos" : selectedProject?.name}
            </h2>
            {viewPrefs.density !== 'compact' && (
              <p id="project-manager-subtitle" className={cn(
                "text-slate-500",
                densityClasses.label
              )}>
                {view === "projects" 
                  ? `${projects.length} projetos ativos` 
                  : selectedProject?.description || "Gerencie suas traduções neste projeto"}
              </p>
            )}
          </div>
        </div>
        <motion.button 
          id="project-manager-close-btn"
          whileHover={{ rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
        >
          <X className={densityClasses.icon} />
        </motion.button>
      </div>

      {/* Search & Actions */}
      <div id="project-manager-controls" className={cn(
        viewPrefs.density === 'compact' ? "p-3 space-y-2" : viewPrefs.density === 'reading' ? "p-8 space-y-6" : "p-4 md:p-6 space-y-4"
      )}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400",
              densityClasses.icon
            )} />
            <input 
              id="project-manager-search"
              type="text" 
              placeholder={view === "projects" ? "Buscar projetos..." : "Buscar traduções..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all",
                viewPrefs.density === 'compact' ? "py-1.5 text-xs" : viewPrefs.density === 'reading' ? "py-4 text-lg" : "py-2 text-sm"
              )}
            />
          </div>
          {view === "projects" && (
            <motion.button 
              id="project-manager-new-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowNewProjectForm(true)}
              className={cn(
                "flex items-center gap-2 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-md shadow-brand-100",
                viewPrefs.density === 'compact' ? "px-3 py-1.5 text-xs" : viewPrefs.density === 'reading' ? "px-6 py-4 text-base" : "px-4 py-2 text-sm"
              )}
            >
              <Plus className={densityClasses.icon} />
              <span className={viewPrefs.density === 'compact' ? "hidden" : ""}>Novo</span>
            </motion.button>
          )}
        </div>

        {/* New Project Form */}
        <AnimatePresence>
          {showNewProjectForm && (
            <motion.form 
              id="new-project-form"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              onSubmit={handleCreateProject} 
              className="p-4 bg-white border border-brand-100 rounded-2xl shadow-sm overflow-hidden"
            >
              <div className="space-y-3">
                <input 
                  id="new-project-name"
                  type="text" 
                  placeholder="Nome do projeto (ex: Capítulo 1)"
                  autoFocus
                  value={newProjectData.name}
                  onChange={(e) => setNewProjectData({ ...newProjectData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
                <textarea 
                  id="new-project-desc"
                  placeholder="Descrição opcional"
                  value={newProjectData.description}
                  onChange={(e) => setNewProjectData({ ...newProjectData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand-400 h-20 resize-none"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    id="new-project-cancel"
                    type="button"
                    onClick={() => setShowNewProjectForm(false)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    id="new-project-submit"
                    type="submit"
                    disabled={!newProjectData.name.trim()}
                    className="px-3 py-1.5 text-xs font-bold bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-all disabled:opacity-50"
                  >
                    Criar Projeto
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Content Area */}
      <div id="project-manager-content" className={cn(
        "flex-1 overflow-y-auto pb-20",
        viewPrefs.density === 'compact' ? "px-3" : viewPrefs.density === 'reading' ? "px-8" : "px-4 md:px-6"
      )}>
        <AnimatePresence mode="wait">
          {view === "projects" ? (
            <motion.div 
              key="projects-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              className={cn(
                "grid grid-cols-1 sm:grid-cols-2",
                viewPrefs.density === 'compact' ? "gap-3" : "gap-4"
              )}
            >
              {filteredProjects.length === 0 ? (
                <motion.div 
                  id="projects-empty-state"
                  variants={itemVariants}
                  className="col-span-full py-20 flex flex-col items-center justify-center text-center gap-6"
                >
                  <div className={cn(
                    "h-24 w-24 bg-brand-50/50 rounded-[2rem] flex items-center justify-center text-brand-200 relative",
                    viewPrefs.density === 'compact' ? "h-16 w-16" : viewPrefs.density === 'reading' ? "h-32 w-32" : "h-24 w-24"
                  )}>
                    <FolderPlus className={cn(
                      viewPrefs.density === 'compact' ? "h-6 w-6" : viewPrefs.density === 'reading' ? "h-14 w-14" : "h-10 w-10"
                    )} />
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-brand-400 rounded-full animate-ping" />
                  </div>
                  <div className={cn(
                    "max-w-xs space-y-2",
                    viewPrefs.density === 'reading' ? "max-w-md" : ""
                  )}>
                    <h3 className={cn(
                      "font-serif font-bold text-slate-800",
                      densityClasses.heading
                    )}>Sua biblioteca está vazia</h3>
                    <p className={cn(
                      "text-slate-500 leading-relaxed",
                      densityClasses.text
                    )}>
                      Comece sua jornada literária criando um novo projeto para organizar suas obras, capítulos ou ensaios.
                    </p>
                  </div>
                  <motion.button 
                    id="create-first-project-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowNewProjectForm(true)}
                    className={cn(
                      "bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-all shadow-lg shadow-brand-100 flex items-center gap-2",
                      viewPrefs.density === 'compact' ? "px-4 py-2 text-xs" : viewPrefs.density === 'reading' ? "px-8 py-4 text-base" : "px-6 py-2.5 text-sm"
                    )}
                  >
                    <Plus className={densityClasses.icon} />
                    Criar Primeiro Projeto
                  </motion.button>
                </motion.div>
              ) : (
                filteredProjects.map(project => (
                  <motion.div 
                    key={project.id}
                    variants={itemVariants}
                    onClick={() => handleOpenProject(project)}
                    className={cn(
                      "group relative bg-white border border-slate-100 rounded-[2rem] hover:border-brand-200 hover:shadow-2xl hover:shadow-brand-100/20 transition-all duration-500 cursor-pointer overflow-hidden",
                      viewPrefs.density === 'compact' ? "p-4" : "p-5"
                    )}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50/30 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                    
                    {editingProjectId === project.id ? (
                      <div className="space-y-2 relative z-10" onClick={e => e.stopPropagation()}>
                        <input 
                          type="text" 
                          value={editProjectData.name}
                          onChange={e => setEditProjectData({ ...editProjectData, name: e.target.value })}
                          className="w-full px-3 py-2 text-sm font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/10 outline-none"
                        />
                        <textarea 
                          value={editProjectData.description}
                          onChange={e => setEditProjectData({ ...editProjectData, description: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl h-20 resize-none focus:ring-2 focus:ring-brand-500/10 outline-none"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingProjectId(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"><X className="h-4 w-4" /></button>
                          <button onClick={handleSaveEditProject} className="p-2 text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-all"><Check className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative z-10">
                        <div className={cn(
                          "flex items-start justify-between",
                          viewPrefs.density === 'compact' ? "mb-2" : "mb-4"
                        )}>
                          <div className={cn(
                            "bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all duration-500 shadow-sm",
                            viewPrefs.density === 'compact' ? "h-10 w-10" : "h-12 w-12"
                          )}>
                            <BookOpen className={viewPrefs.density === 'compact' ? "h-5 w-5" : "h-6 w-6"} />
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                            <button 
                              onClick={(e) => handleExportProject(project, e)}
                              title="Exportar Projeto"
                              className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                            >
                              <Share2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={(e) => handleStartEditProject(project, e)}
                              className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={(e) => handleDeleteProject(project.id, e)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <h3 className={cn(
                          "font-serif font-bold text-slate-800 group-hover:text-brand-700 transition-colors line-clamp-1",
                          viewPrefs.density === 'compact' ? "text-base" : "text-lg"
                        )}>
                          {project.name}
                        </h3>
                        {project.description && viewPrefs.density !== 'compact' && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                            {project.description}
                          </p>
                        )}
                        <div className={cn(
                          "border-t border-slate-50 flex items-center justify-between",
                          viewPrefs.density === 'compact' ? "mt-4 pt-2" : "mt-6 pt-4"
                        )}>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <Layers className="h-3 w-3" />
                              {project.entryCount} {project.entryCount === 1 ? "Entrada" : "Entradas"}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Clock className="h-3 w-3" />
                            {formatDate(project.updatedAt)}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="entries-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: 20 }}
              className={viewPrefs.density === 'compact' ? "space-y-2" : "space-y-3"}
            >
              {filteredEntries.length === 0 ? (
                <motion.div 
                  id="entries-empty-state"
                  variants={itemVariants}
                  className="py-20 flex flex-col items-center justify-center text-center gap-6"
                >
                  <div className="h-24 w-24 bg-brand-50/50 rounded-[2rem] flex items-center justify-center text-brand-200">
                    <FileText className="h-10 w-10" />
                  </div>
                  <div className="max-w-xs space-y-2">
                    <h3 className="text-base font-serif font-bold text-slate-800">Nenhuma tradução aqui</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Este projeto ainda não possui entradas salvas. Traduza um texto no workspace e salve-o aqui para começar.
                    </p>
                  </div>
                  <motion.button 
                    id="back-to-workspace-btn"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="px-6 py-2.5 border border-brand-200 text-brand-700 rounded-xl text-sm font-bold hover:bg-brand-50 transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao Workspace
                  </motion.button>
                </motion.div>
              ) : (
                filteredEntries.map(entry => (
                  <motion.div 
                    key={entry.id}
                    variants={itemVariants}
                    onClick={() => onLoadEntry(entry)}
                    className={cn(
                      "group bg-white border border-slate-100 rounded-2xl hover:border-brand-200 hover:shadow-md transition-all cursor-pointer flex items-center gap-4",
                      viewPrefs.density === 'compact' ? "p-3" : "p-4"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      {editingEntryId === entry.id ? (
                        <div className="space-y-2" onClick={e => e.stopPropagation()}>
                          <input 
                            type="text" 
                            value={editEntryData.title}
                            onChange={e => setEditEntryData({ ...editEntryData, title: e.target.value })}
                            className="w-full px-2 py-1 text-sm font-bold border rounded"
                          />
                          <div className="flex gap-1">
                            {(["Rascunho", "Revisado", "Final"] as EntryStatus[]).map(s => (
                              <button 
                                key={s}
                                onClick={() => setEditEntryData({ ...editEntryData, status: s })}
                                className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                                  editEntryData.status === s ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"
                                )}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setEditingEntryId(null)} className="p-1 text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                            <button onClick={handleSaveEditEntry} className="p-1 text-brand-600 hover:text-brand-700"><Check className="h-4 w-4" /></button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={cn(
                              "font-bold text-slate-800 group-hover:text-brand-700 transition-colors truncate",
                              viewPrefs.density === 'compact' ? "text-sm" : "text-base"
                            )}>
                              {entry.title}
                            </h4>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border",
                              getStatusColor(entry.status)
                            )}>
                              {entry.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1 italic">
                            {entry.sourceText}
                          </p>
                          <div className={cn(
                            "flex items-center gap-4",
                            viewPrefs.density === 'compact' ? "mt-1" : "mt-2"
                          )}>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              {entry.sourceLanguage} → {entry.targetLanguage}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(entry.updatedAt)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    {editingEntryId !== entry.id && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={(e) => handleExportEntry(entry, e)}
                          title="Exportar"
                          className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => handleStartEditEntry(entry, e)}
                          title="Editar"
                          className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDuplicateEntry(entry.id, e)}
                          title="Duplicar"
                          className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-all"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteEntry(entry.id, e)}
                          title="Excluir"
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="p-2 text-brand-600">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={deleteConfirm?.type === 'project'}
        title="Excluir Projeto?"
        message="Tem certeza que deseja excluir este projeto e todas as suas traduções? Esta ação não pode ser desfeita."
        confirmLabel="Excluir Projeto"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => deleteConfirm && confirmDeleteProject(deleteConfirm.id)}
        onClose={() => setDeleteConfirm(null)}
        viewPrefs={viewPrefs}
      />

      <ConfirmationModal
        isOpen={deleteConfirm?.type === 'entry'}
        title="Excluir Tradução?"
        message="Tem certeza que deseja excluir esta tradução? Esta ação não pode ser desfeita."
        confirmLabel="Excluir Tradução"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => deleteConfirm && confirmDeleteEntry(deleteConfirm.id)}
        onClose={() => setDeleteConfirm(null)}
        viewPrefs={viewPrefs}
      />
    </div>
  );
};
