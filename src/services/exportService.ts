import { Project, TranslationEntry } from "./storageService";
import { ChatMessage, TranslationSettings } from "./geminiService";
import { DocumentMetadata } from "./documentService";
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType
} from "docx";

export interface ExportOptions {
  includeOriginal: boolean;
  includeTranslation: boolean;
  includeNotes: boolean;
  includeSettings: boolean;
  includeChat: boolean;
  includeMetadata: boolean;
  includePageSeparation: boolean;
  format: 'txt' | 'docx' | 'clipboard' | 'comparison';
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includeOriginal: true,
  includeTranslation: true,
  includeNotes: true,
  includeSettings: true,
  includeChat: false,
  includeMetadata: true,
  includePageSeparation: true,
  format: 'txt',
};

export interface ExportData {
  title: string;
  sourceText: string;
  translatedText: string;
  notes?: string[];
  settings?: TranslationSettings;
  metadata?: {
    originalFilename?: string;
    pageRange?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    date?: string;
  };
  chatHistory?: ChatMessage[];
}

class ExportService {
  /**
   * Sanitizes a filename.
   */
  sanitizeFilename(name: string): string {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^\w\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-')     // Replace spaces with dashes
      .replace(/-+/g, '-');     // Remove double dashes
  }

  /**
   * Builds a plain text string based on data and options.
   */
  buildTextContent(data: ExportData, options: ExportOptions): string {
    const lines: string[] = [];

    // Header
    lines.push("=".repeat(60));
    lines.push(`TRADUTOR LITERÁRIO CONTEXTUAL - EXPORTAÇÃO`);
    lines.push(`Título: ${data.title}`);
    if (data.metadata?.originalFilename) lines.push(`Documento Original: ${data.metadata.originalFilename}`);
    if (data.metadata?.pageRange) lines.push(`Páginas: ${data.metadata.pageRange}`);
    if (data.metadata?.date) lines.push(`Data: ${data.metadata.date}`);
    lines.push("=".repeat(60));
    lines.push("");

    if (options.includeMetadata && data.metadata) {
      lines.push("METADADOS:");
      if (data.metadata.sourceLanguage) lines.push(`- Idioma Origem: ${data.metadata.sourceLanguage}`);
      if (data.metadata.targetLanguage) lines.push(`- Idioma Destino: ${data.metadata.targetLanguage}`);
      lines.push("");
    }

    if (options.includeSettings && data.settings) {
      lines.push("CONFIGURAÇÕES DE TRADUÇÃO:");
      lines.push(`- Modo: ${data.settings.mode}`);
      lines.push(`- Tom: ${data.settings.tone}`);
      lines.push(`- Adaptação Cultural: ${data.settings.culturalAdaptation}`);
      lines.push(`- Preservar Nomes: ${data.settings.preserveNames ? "Sim" : "Não"}`);
      lines.push("");
    }

    if (options.format === 'comparison') {
      lines.push("-".repeat(60));
      lines.push("COMPARAÇÃO BILINGUE");
      lines.push("-".repeat(60));
      lines.push("");
      
      lines.push("--- ORIGINAL ---");
      lines.push(data.sourceText);
      lines.push("");
      
      lines.push("--- TRADUÇÃO ---");
      lines.push(data.translatedText);
      lines.push("");
    } else {
      if (options.includeOriginal) {
        lines.push("-".repeat(20));
        lines.push("TEXTO ORIGINAL");
        lines.push("-".repeat(20));
        lines.push(data.sourceText);
        lines.push("");
      }

      if (options.includeTranslation) {
        lines.push("-".repeat(20));
        lines.push("TEXTO TRADUZIDO");
        lines.push("-".repeat(20));
        lines.push(data.translatedText);
        lines.push("");
      }
    }

    if (options.includeNotes && data.notes && data.notes.length > 0) {
      lines.push("-".repeat(20));
      lines.push("NOTAS DO TRADUTOR");
      lines.push("-".repeat(20));
      data.notes.forEach((note, i) => lines.push(`${i + 1}. ${note}`));
      lines.push("");
    }

    if (options.includeChat && data.chatHistory && data.chatHistory.length > 0) {
      lines.push("-".repeat(20));
      lines.push("HISTÓRICO DO CHAT");
      lines.push("-".repeat(20));
      data.chatHistory.forEach(msg => {
        lines.push(`${msg.role === 'user' ? 'Usuário' : 'Assistente'}: ${msg.text}`);
      });
    }

    return lines.join("\n");
  }

  /**
   * Generates a DOCX file.
   */
  async generateDocx(data: ExportData, options: ExportOptions): Promise<Blob> {
    const sections: any[] = [];

    // Title & Header
    sections.push(new Paragraph({
      text: "Tradutor Literário Contextual",
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }));

    sections.push(new Paragraph({
      text: data.title,
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
    }));

    if (options.includeMetadata && data.metadata) {
      sections.push(new Paragraph({ text: "" }));
      sections.push(new Paragraph({
        children: [
          new TextRun({ text: "Metadados", bold: true }),
        ],
      }));
      if (data.metadata.originalFilename) sections.push(new Paragraph({ text: `Arquivo Original: ${data.metadata.originalFilename}` }));
      if (data.metadata.pageRange) sections.push(new Paragraph({ text: `Páginas: ${data.metadata.pageRange}` }));
      if (data.metadata.sourceLanguage) sections.push(new Paragraph({ text: `De: ${data.metadata.sourceLanguage}` }));
      if (data.metadata.targetLanguage) sections.push(new Paragraph({ text: `Para: ${data.metadata.targetLanguage}` }));
    }

    if (options.includeSettings && data.settings) {
      sections.push(new Paragraph({ text: "" }));
      sections.push(new Paragraph({
        children: [
          new TextRun({ text: "Configurações", bold: true }),
        ],
      }));
      sections.push(new Paragraph({ text: `Modo: ${data.settings.mode} | Tom: ${data.settings.tone} | Adaptação: ${data.settings.culturalAdaptation}` }));
    }

    // Main Content
    if (options.format === 'comparison') {
      sections.push(new Paragraph({ text: "" }));
      sections.push(new Paragraph({ text: "Comparação Bilíngue", heading: HeadingLevel.HEADING_3 }));
      
      const table = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Original", bold: true })] })] }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Tradução", bold: true })] })] }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({ children: data.sourceText.split('\n').map(t => new Paragraph({ text: t })) }),
              new TableCell({ children: data.translatedText.split('\n').map(t => new Paragraph({ text: t })) }),
            ],
          }),
        ],
      });
      sections.push(table);
    } else {
      if (options.includeOriginal) {
        sections.push(new Paragraph({ text: "" }));
        sections.push(new Paragraph({ text: "Texto Original", heading: HeadingLevel.HEADING_3 }));
        data.sourceText.split('\n').forEach(line => {
          sections.push(new Paragraph({ text: line }));
        });
      }

      if (options.includeTranslation) {
        sections.push(new Paragraph({ text: "" }));
        sections.push(new Paragraph({ text: "Texto Traduzido", heading: HeadingLevel.HEADING_3 }));
        data.translatedText.split('\n').forEach(line => {
          sections.push(new Paragraph({ text: line }));
        });
      }
    }

    if (options.includeNotes && data.notes && data.notes.length > 0) {
      sections.push(new Paragraph({ text: "" }));
      sections.push(new Paragraph({ text: "Notas do Tradutor", heading: HeadingLevel.HEADING_3 }));
      data.notes.forEach((note, i) => {
        sections.push(new Paragraph({ text: `${i + 1}. ${note}` }));
      });
    }

    const doc = new Document({
      sections: [{
        properties: {},
        children: sections,
      }],
    });

    return await Packer.toBlob(doc);
  }

  /**
   * Triggers a file download.
   */
  downloadBlob(filename: string, blob: Blob) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Main entry point for exporting.
   */
  async export(data: ExportData, options: ExportOptions) {
    if (!data.translatedText && options.includeTranslation) {
      throw new Error("Não há tradução disponível para download.");
    }

    if (!options.includeOriginal && !options.includeTranslation && !options.includeNotes) {
      throw new Error("Selecione ao menos uma seção para incluir no arquivo.");
    }

    const baseFilename = this.sanitizeFilename(data.title || "traducao");
    let filename = baseFilename;
    
    if (data.metadata?.pageRange) {
      filename += `_paginas-${data.metadata.pageRange.replace(/\s+/g, '')}`;
    }

    if (options.format === 'clipboard') {
      const text = this.buildTextContent(data, options);
      await navigator.clipboard.writeText(text);
      return true;
    }

    if (options.format === 'docx') {
      const blob = await this.generateDocx(data, options);
      this.downloadBlob(`${filename}.docx`, blob);
      return true;
    }

    // Default to TXT
    const text = this.buildTextContent(data, options);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    this.downloadBlob(`${filename}${options.format === 'comparison' ? '_comparacao' : ''}.txt`, blob);
    return true;
  }

  /**
   * Gerencia falhas no processo de download.
   */
  handleDownloadFailure(error: any): string {
    console.error("Download failure:", error);
    return "Não foi possível gerar o arquivo para download. Tente copiar o texto traduzido manualmente ou verifique sua conexão.";
  }

  /**
   * Exports a single translation entry.
   */
  async exportEntry(entry: TranslationEntry, project: Project | null, options: ExportOptions) {
    const data: ExportData = {
      title: entry.title,
      sourceText: entry.sourceText,
      translatedText: entry.translatedText,
      notes: entry.translatorNotes,
      settings: {
        sourceLanguage: entry.sourceLanguage,
        targetLanguage: entry.targetLanguage,
        mode: entry.translationMode,
        tone: entry.tone,
        culturalAdaptation: entry.culturalAdaptation,
        preserveNames: entry.preserveProperNames,
        showNotes: entry.showTranslatorNotes,
      },
      chatHistory: entry.chatHistory,
      metadata: {
        originalFilename: project?.name,
        date: new Date(entry.updatedAt).toLocaleDateString('pt-BR'),
      }
    };

    return await this.export(data, options);
  }

  /**
   * Exports an entire project (all entries merged).
   */
  async exportProject(project: Project, entries: TranslationEntry[], options: ExportOptions) {
    if (entries.length === 0) {
      throw new Error("O projeto não possui entradas para exportar.");
    }

    // Sort entries by creation date or title if needed
    const sortedEntries = [...entries].sort((a, b) => a.createdAt - b.createdAt);

    const mergedData: ExportData = {
      title: project.name,
      sourceText: sortedEntries.map(e => {
        const header = options.includePageSeparation ? `\n\n--- PÁGINA: ${e.title} ---\n\n` : `\n\n--- ${e.title} ---\n\n`;
        return `${header}${e.sourceText}`;
      }).join(''),
      translatedText: sortedEntries.map(e => {
        const header = options.includePageSeparation ? `\n\n--- PÁGINA: ${e.title} ---\n\n` : `\n\n--- ${e.title} ---\n\n`;
        return `${header}${e.translatedText}`;
      }).join(''),
      notes: sortedEntries.flatMap(e => e.translatorNotes),
      settings: {
        sourceLanguage: project.sourceLanguage || 'auto',
        targetLanguage: project.targetLanguage || 'pt-BR',
        mode: `${project.sourceLanguage || 'auto'} -> ${project.targetLanguage || 'pt-BR'}`,
        tone: 'Vários',
        culturalAdaptation: 'Várias',
        preserveNames: true,
        showNotes: true,
      },
      metadata: {
        originalFilename: project.name,
        date: new Date().toLocaleDateString('pt-BR'),
      }
    };

    return await this.export(mergedData, options);
  }
}

export const exportService = new ExportService();
