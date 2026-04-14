import { TranslationSettings, ChatMessage } from "./geminiService";

export type EntryStatus = "Rascunho" | "Revisado" | "Final";

export interface Project {
  id: string;
  name: string;
  description?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  createdAt: number;
  updatedAt: number;
  entryCount: number;
  lastOpenedEntryId?: string;
}

export interface TranslationEntry {
  id: string;
  projectId: string;
  title: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  translationMode: string;
  tone: string;
  culturalAdaptation: string;
  preserveProperNames: boolean;
  showTranslatorNotes: boolean;
  translatorNotes: string[];
  adaptedExpressions?: { original: string; adapted: string; explanation: string }[];
  translationStrategy?: string;
  toneDetected?: string;
  status: EntryStatus;
  chatHistory: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  manuallyEdited: boolean;
}

const STORAGE_KEYS = {
  PROJECTS: "tlc_projects",
  ENTRIES: "tlc_entries",
};

class StorageService {
  // Projects
  listProjects(): Project[] {
    const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  }

  getProject(id: string): Project | undefined {
    return this.listProjects().find((p) => p.id === id);
  }

  createProject(data: Partial<Project>): Project {
    const projects = this.listProjects();
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: data.name || "Novo Projeto",
      description: data.description,
      sourceLanguage: data.sourceLanguage,
      targetLanguage: data.targetLanguage,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      entryCount: 0,
      ...data,
    };
    projects.push(newProject);
    this.saveProjects(projects);
    return newProject;
  }

  updateProject(id: string, updates: Partial<Project>): Project {
    const projects = this.listProjects();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Projeto não encontrado");

    projects[index] = { ...projects[index], ...updates, updatedAt: Date.now() };
    this.saveProjects(projects);
    return projects[index];
  }

  deleteProject(id: string) {
    const projects = this.listProjects().filter((p) => p.id !== id);
    this.saveProjects(projects);
    
    // Delete associated entries
    const entries = this.listAllEntries().filter((e) => e.projectId !== id);
    this.saveEntries(entries);
  }

  private saveProjects(projects: Project[]) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  // Entries
  listAllEntries(): TranslationEntry[] {
    const data = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    return data ? JSON.parse(data) : [];
  }

  listEntriesByProject(projectId: string): TranslationEntry[] {
    return this.listAllEntries().filter((e) => e.projectId === projectId);
  }

  getEntry(id: string): TranslationEntry | undefined {
    return this.listAllEntries().find((e) => e.id === id);
  }

  createEntry(projectId: string, data: Partial<TranslationEntry>): TranslationEntry {
    const entries = this.listAllEntries();
    const newEntry: TranslationEntry = {
      id: crypto.randomUUID(),
      projectId,
      title: data.title || "Nova Tradução",
      sourceText: data.sourceText || "",
      translatedText: data.translatedText || "",
      sourceLanguage: data.sourceLanguage || "auto",
      targetLanguage: data.targetLanguage || "pt-BR",
      translationMode: data.translationMode || "Equilibrado",
      tone: data.tone || "Neutro",
      culturalAdaptation: data.culturalAdaptation || "Moderada",
      preserveProperNames: data.preserveProperNames ?? true,
      showTranslatorNotes: data.showTranslatorNotes ?? true,
      translatorNotes: data.translatorNotes || [],
      status: data.status || "Rascunho",
      chatHistory: data.chatHistory || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      manuallyEdited: data.manuallyEdited || false,
      ...data,
    };
    entries.push(newEntry);
    this.saveEntries(entries);

    // Update project count
    const project = this.getProject(projectId);
    if (project) {
      this.updateProject(projectId, { 
        entryCount: project.entryCount + 1,
        lastOpenedEntryId: newEntry.id 
      });
    }

    return newEntry;
  }

  updateEntry(id: string, updates: Partial<TranslationEntry>): TranslationEntry {
    const entries = this.listAllEntries();
    const index = entries.findIndex((e) => e.id === id);
    if (index === -1) throw new Error("Entrada não encontrada");

    entries[index] = { ...entries[index], ...updates, updatedAt: Date.now() };
    this.saveEntries(entries);
    
    // Update project timestamp
    this.updateProject(entries[index].projectId, { updatedAt: Date.now() });
    
    return entries[index];
  }

  deleteEntry(id: string) {
    const entries = this.listAllEntries();
    const entry = entries.find(e => e.id === id);
    if (!entry) return;

    const filtered = entries.filter((e) => e.id !== id);
    this.saveEntries(filtered);

    // Update project count
    const project = this.getProject(entry.projectId);
    if (project) {
      this.updateProject(entry.projectId, { entryCount: Math.max(0, project.entryCount - 1) });
    }
  }

  duplicateEntry(id: string): TranslationEntry {
    const entry = this.getEntry(id);
    if (!entry) throw new Error("Entrada não encontrada");

    return this.createEntry(entry.projectId, {
      ...entry,
      id: undefined, // Will be generated
      title: `${entry.title} (Cópia)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  private saveEntries(entries: TranslationEntry[]) {
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  }

  // Search
  search(query: string): { projects: Project[]; entries: TranslationEntry[] } {
    const q = query.toLowerCase();
    const projects = this.listProjects().filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description?.toLowerCase().includes(q)
    );
    const entries = this.listAllEntries().filter(e => 
      e.title.toLowerCase().includes(q) || 
      e.sourceText.toLowerCase().includes(q) || 
      e.translatedText.toLowerCase().includes(q)
    );
    return { projects, entries };
  }
}

export const storageService = new StorageService();
