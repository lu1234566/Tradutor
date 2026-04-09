import React, { useState, useEffect } from "react";
import { 
  Save, 
  FolderPlus, 
  Plus, 
  CheckCircle2, 
  X,
  ChevronRight,
  BookOpen,
  Tag
} from "lucide-react";
import { cn } from "@/src/utils";
import { Project, storageService, EntryStatus } from "@/src/services/storageService";
import { ViewPreferences, viewService } from "@/src/services/viewService";

interface SaveModalProps {
  onSave: (projectId: string, title: string, status: EntryStatus) => void;
  onClose: () => void;
  defaultTitle?: string;
  viewPrefs: ViewPreferences;
}

export const SaveModal: React.FC<SaveModalProps> = ({ onSave, onClose, defaultTitle, viewPrefs }) => {
  const densityClasses = viewService.getDensityClasses(viewPrefs.density);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [title, setTitle] = useState(defaultTitle || "");
  const [status, setStatus] = useState<EntryStatus>("Rascunho");
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    const list = storageService.listProjects();
    setProjects(list);
    if (list.length > 0) {
      setSelectedProjectId(list[0].id);
    } else {
      setShowNewProjectForm(true);
    }
  }, []);

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const project = storageService.createProject({ name: newProjectName });
      setProjects(storageService.listProjects());
      setSelectedProjectId(project.id);
      setNewProjectName("");
      setShowNewProjectForm(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProjectId && title.trim()) {
      onSave(selectedProjectId, title, status);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={cn(
        "bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300",
        densityClasses.card
      )}>
        <div className={cn(
          "border-b border-slate-100 flex items-center justify-between",
          viewPrefs.density === 'compact' ? 'p-4' : 'p-6'
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "bg-brand-50 rounded-xl flex items-center justify-center text-brand-600",
              viewPrefs.density === 'compact' ? 'h-8 w-8' : 'h-10 w-10'
            )}>
              <Save className={viewPrefs.density === 'compact' ? 'h-4 w-4' : 'h-5 w-5'} />
            </div>
            <div>
              <h2 className={cn("font-serif font-bold text-slate-800", viewPrefs.density === 'compact' ? 'text-base' : 'text-lg')}>Salvar Tradução</h2>
              <p className="text-[10px] text-slate-500">Organize seu trabalho em um projeto</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={cn("space-y-6", viewPrefs.density === 'compact' ? 'p-4' : 'p-6')}>
          {/* Title */}
          <div className="space-y-2">
            <label className={cn("font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2", densityClasses.label)}>
              <Tag className="h-3 w-3" />
              Título da Entrada
            </label>
            <input 
              type="text" 
              placeholder="Ex: Abertura do Capítulo 1"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cn(
                "w-full bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all",
                viewPrefs.density === 'compact' ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
                densityClasses.text
              )}
            />
          </div>

          {/* Project Selection */}
          <div className="space-y-2">
            <label className={cn("font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2", densityClasses.label)}>
              <BookOpen className="h-3 w-3" />
              Projeto Destino
            </label>
            
            {showNewProjectForm ? (
              <div className="flex gap-2 animate-in slide-in-from-top-2">
                <input 
                  type="text" 
                  placeholder="Nome do novo projeto"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className={cn(
                    "flex-1 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all",
                    viewPrefs.density === 'compact' ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
                    densityClasses.text
                  )}
                />
                <button 
                  type="button"
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim()}
                  className={cn(
                    "bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-all flex items-center justify-center",
                    viewPrefs.density === 'compact' ? 'w-10' : 'w-12'
                  )}
                >
                  <Plus className="h-5 w-5" />
                </button>
                <button 
                  type="button"
                  onClick={() => setShowNewProjectForm(false)}
                  className={cn(
                    "bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center",
                    viewPrefs.density === 'compact' ? 'w-10' : 'w-12'
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <select 
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className={cn(
                    "w-full bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-200 transition-all appearance-none",
                    viewPrefs.density === 'compact' ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
                    densityClasses.text
                  )}
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button 
                  type="button"
                  onClick={() => setShowNewProjectForm(true)}
                  className="text-[10px] font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors px-1"
                >
                  <Plus className="h-3 w-3" />
                  Criar novo projeto
                </button>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className={cn("font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2", densityClasses.label)}>
              <CheckCircle2 className="h-3 w-3" />
              Status do Trabalho
            </label>
            <div className="flex gap-2">
              {(["Rascunho", "Revisado", "Final"] as EntryStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all",
                    status === s 
                      ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-100" 
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:border-brand-200"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className={cn("flex gap-3", viewPrefs.density === 'compact' ? 'pt-2' : 'pt-4')}>
            <button 
              type="button"
              onClick={onClose}
              className={cn(
                "flex-1 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all",
                viewPrefs.density === 'compact' ? 'py-2 text-xs' : 'py-3 text-sm'
              )}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={!selectedProjectId || !title.trim()}
              className={cn(
                "flex-1 font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-all shadow-lg shadow-brand-100 flex items-center justify-center gap-2",
                viewPrefs.density === 'compact' ? 'py-2 text-xs' : 'py-3 text-sm'
              )}
            >
              <Save className={viewPrefs.density === 'compact' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
              Salvar Agora
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
