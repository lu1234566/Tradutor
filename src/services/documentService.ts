import * as pdfjs from 'pdfjs-dist';
import { performOcrOnImage } from './geminiService';

// Configure PDF.js worker using a more robust loading strategy for Vite
// We try to use the local bundled worker, and fallback to CDN if necessary
try {
  // @ts-ignore - Vite specific way to get the worker URL
  const workerUrl = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
} catch (e) {
  console.warn("Failed to load local PDF worker, falling back to CDN", e);
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
}

export type DocumentType = 'pdf' | 'txt' | 'docx' | 'epub' | 'unknown';
export type ExtractionStatus = 'idle' | 'extracting' | 'success' | 'error';

export interface PageContent {
  pageNumber: number;
  text: string;
}

export interface DocumentMetadata {
  id: string;
  name: string;
  size: number;
  type: DocumentType;
  lastModified: number;
  pageCount?: number;
  extractedAt?: number;
  extractionStatus: ExtractionStatus;
}

export interface ProcessingResult {
  text: string;
  metadata: DocumentMetadata;
  pages: PageContent[];
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB limit
const MAX_PAGES = 150; // 150 pages limit
const MAX_TEXT_LENGTH = 150000; // 150k characters limit

/**
 * Valida os limites do documento para evitar travamentos.
 */
export const validatePdfLimits = (metadata: DocumentMetadata): { valid: boolean; error?: string } => {
  if (metadata.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `O arquivo excede o limite de ${formatFileSize(MAX_FILE_SIZE)}. Tente um arquivo menor ou divida o PDF.` 
    };
  }

  if (metadata.pageCount && metadata.pageCount > MAX_PAGES) {
    return { 
      valid: false, 
      error: `O documento possui ${metadata.pageCount} páginas, o que excede o limite de ${MAX_PAGES}. Tente traduzir por intervalos de páginas.` 
    };
  }

  return { valid: true };
};

/**
 * Formata o tamanho do arquivo para exibição legível.
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Normaliza o texto extraído removendo ruídos óbvios e corrigindo quebras de linha.
 */
export const normalizeExtractedText = (text: string): string => {
  if (!text) return "";

  return text
    // Remove espaços duplicados excessivos
    .replace(/[ \t]+/g, ' ')
    // Remove quebras de linha múltiplas excessivas (mais de 3)
    .replace(/\n{4,}/g, '\n\n\n')
    // Tenta corrigir quebras de linha no meio de frases (heurística leve)
    .split('\n')
    .reduce((acc, current, index, array) => {
      if (index === 0) return current;
      const prev = array[index - 1].trim();
      const curr = current.trim();
      
      if (prev && curr && !/[.!?:]/.test(prev.slice(-1)) && /^[a-z]/.test(curr)) {
        return acc + ' ' + curr;
      }
      return acc + '\n' + current;
    }, "")
    .trim();
};

export const validateUploadedFile = (file: File): { valid: boolean; error?: string } => {
  if (!file) {
    return { valid: false, error: "Nenhum arquivo selecionado." };
  }

  if (file.size === 0) {
    return { valid: false, error: "O arquivo parece estar vazio." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Arquivo muito grande. O limite atual é de ${formatFileSize(MAX_FILE_SIZE)}.` };
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  const supportedExtensions = ['pdf', 'txt'];

  if (!extension || !supportedExtensions.includes(extension)) {
    if (['docx', 'epub'].includes(extension || '')) {
      return { valid: false, error: `O formato .${extension} ainda não é suportado para leitura direta, mas você pode copiar o texto manualmente.` };
    }
    return { valid: false, error: "Este formato de arquivo não é suportado para extração automática." };
  }

  return { valid: true };
};

/**
 * Gera mensagens elegantes para o fluxo de documentos.
 */
export const showDocumentWorkflowMessage = (type: 'no-text' | 'limit-exceeded' | 'partial-failure' | 'download-error', context?: any): string => {
  switch (type) {
    case 'no-text':
      return "Este PDF parece não conter texto selecionável. No momento, a leitura funciona melhor com PDFs que possuem texto embutido (não apenas imagens escaneadas).";
    case 'limit-exceeded':
      return `O documento é muito extenso para uma tradução direta. Recomendamos traduzir por intervalos de páginas para garantir a melhor qualidade e estabilidade.`;
    case 'partial-failure':
      return `Houve um problema ao traduzir o bloco ${context?.index + 1}. Você pode tentar novamente este bloco ou prosseguir com o que já foi traduzido.`;
    case 'download-error':
      return "Não foi possível gerar o arquivo para download no momento. Você ainda pode copiar o texto traduzido para a área de transferência.";
    default:
      return "Ocorreu um imprevisto no processamento do documento.";
  }
};

/**
 * Constrói o estado de progresso para exibição na UI.
 */
export const buildDocumentProgressState = (current: number, total: number, step: string) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  return {
    percentage,
    message: `${step} (${current} de ${total})`,
    isComplete: current === total && total > 0
  };
};

/**
 * Gerencia falhas de tradução documental.
 */
export const handleDocumentTranslationFailure = (error: any, context: { index: number; total: number }) => {
  console.error(`Falha no bloco ${context.index + 1}/${context.total}:`, error);
  return {
    error: true,
    message: showDocumentWorkflowMessage('partial-failure', context),
    retryable: true
  };
};

export const getDocumentType = (fileName: string): DocumentType => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf': return 'pdf';
    case 'txt': return 'txt';
    case 'docx': return 'docx';
    case 'epub': return 'epub';
    default: return 'unknown';
  }
};

/**
 * Converte uma página do PDF em uma imagem base64 para processamento via Vision.
 */
const renderPageToImage = async (page: any, scale: number = 2.0): Promise<string> => {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) throw new Error("Falha ao criar contexto de canvas.");
  
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
  
  // Retorna apenas a parte base64 (sem o prefixo data:image/jpeg;base64,)
  return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
};

/**
 * Extrai texto de um PDF página por página.
 */
export const extractTextFromPDF = async (
  file: File, 
  onProgress?: (msg: string) => void
): Promise<{ pages: PageContent[]; fullText: string; pageCount: number }> => {
  const arrayBuffer = await file.arrayBuffer();
  
  onProgress?.("Iniciando motor de leitura de PDF...");
  
  const loadingTask = pdfjs.getDocument({ 
    data: arrayBuffer,
    // Increase memory limit for large PDFs
    maxImageSize: 1024 * 1024 * 10, // 10MB
  });

  loadingTask.onProgress = (progress) => {
    if (progress.total > 0) {
      const percent = Math.round((progress.loaded / progress.total) * 100);
      onProgress?.(`Carregando arquivo: ${percent}%`);
    }
  };
  
  try {
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;
    const pages: PageContent[] = [];
    let fullText = "";

    onProgress?.(`Documento carregado. Analisando ${pageCount} páginas...`);

    for (let i = 1; i <= pageCount; i++) {
      onProgress?.(`Processando página ${i} de ${pageCount}...`);
      
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Extrai o texto mantendo uma ordem razoável
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      
      let normalizedPageText = normalizeExtractedText(pageText);
      
      // Se a página não tem texto extraível, tenta Vision OCR
      // Aumentamos o limite para 15 páginas se for um documento pequeno, ou as primeiras 10 de qualquer um
      const ocrLimit = pageCount <= 20 ? pageCount : 10;
      
      if (!normalizedPageText.trim() && i <= ocrLimit) {
        onProgress?.(`Página ${i} parece ser uma imagem. Ativando OCR via IA...`);
        try {
          const base64Image = await renderPageToImage(page);
          const ocrResult = await performOcrOnImage(base64Image);
          normalizedPageText = normalizeExtractedText(ocrResult);
          
          if (!normalizedPageText.trim()) {
            normalizedPageText = "[Página sem conteúdo textual identificado]";
          }
        } catch (ocrError) {
          console.warn(`Falha no OCR da página ${i}:`, ocrError);
          normalizedPageText = "[Erro na extração de imagem]";
        }
      } else if (!normalizedPageText.trim()) {
        normalizedPageText = "[Página sem texto selecionável]";
      }
      
      pages.push({
        pageNumber: i,
        text: normalizedPageText
      });
      
      fullText += normalizedPageText + "\n\n";
    }

    const hasRealContent = pages.some(p => 
      p.text.trim().length > 10 && 
      !p.text.includes("[Página sem texto selecionável]") &&
      !p.text.includes("[Erro na extração de imagem]")
    );

    if (!hasRealContent) {
      throw new Error("O PDF parece não conter texto extraível e a Visão Computacional não conseguiu identificar conteúdo textual significativo. Verifique se o arquivo não está protegido por senha.");
    }

    onProgress?.("Extração concluída com sucesso!");
    return { pages, fullText: fullText.trim(), pageCount };
  } catch (error: any) {
    console.error("Error extracting PDF text:", error);
    if (error.message?.includes("não conter texto extraível") || error.message?.includes("protegido")) {
      throw error;
    }
    
    if (error.name === 'PasswordException') {
      throw new Error("Este PDF está protegido por senha e não pode ser lido automaticamente.");
    }

    throw new Error("Falha técnica ao processar a estrutura do PDF. O arquivo pode estar corrompido ou em um formato incompatível.");
  }
};

const extractTextFromTXT = async (file: File): Promise<{ text: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text.trim()) {
        reject(new Error("O arquivo de texto está vazio."));
      } else {
        resolve({ text: normalizeExtractedText(text) });
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler o arquivo de texto."));
    reader.readAsText(file);
  });
};

export const processUploadedDocument = async (
  file: File, 
  onProgress?: (msg: string) => void
): Promise<ProcessingResult> => {
  const type = getDocumentType(file.name);
  const id = crypto.randomUUID();
  
  let pages: PageContent[] = [];
  let fullText = "";
  let pageCount = 1;

  try {
    if (type === 'pdf') {
      const result = await extractTextFromPDF(file, onProgress);
      pages = result.pages;
      fullText = result.fullText;
      pageCount = result.pageCount;
    } else if (type === 'txt') {
      const result = await extractTextFromTXT(file);
      fullText = result.text;
      pages = [{ pageNumber: 1, text: fullText }];
      pageCount = 1;
    } else {
      throw new Error("Formato não suportado para extração de texto.");
    }

    const metadata: DocumentMetadata = {
      id,
      name: file.name,
      size: file.size,
      type,
      lastModified: file.lastModified,
      pageCount,
      extractedAt: Date.now(),
      extractionStatus: 'success'
    };

    return { text: fullText, metadata, pages };
  } catch (error: any) {
    throw error;
  }
};

export type TranslationScopeMode = 'full' | 'page' | 'range' | 'selection';

export interface TranslationScope {
  mode: TranslationScopeMode;
  pageNumber?: number;
  range?: { start: number; end: number };
  selection?: string;
}

export interface DocumentChunk {
  id: string;
  text: string;
  index: number;
  total: number;
}

/**
 * Obtém o texto baseado no escopo de tradução selecionado.
 */
export const getDocumentTranslationScopeText = (
  result: ProcessingResult,
  scope: TranslationScope
): string => {
  switch (scope.mode) {
    case 'full':
      return result.text;
    case 'page':
      if (scope.pageNumber) {
        const page = result.pages.find(p => p.pageNumber === scope.pageNumber);
        return page ? page.text : "";
      }
      return "";
    case 'range':
      if (scope.range) {
        return result.pages
          .filter(p => p.pageNumber >= scope.range!.start && p.pageNumber <= scope.range!.end)
          .map(p => p.text)
          .join("\n\n");
      }
      return "";
    case 'selection':
      return scope.selection || "";
    default:
      return result.text;
  }
};

/**
 * Divide um texto grande em blocos menores respeitando parágrafos.
 * Limite sugerido: ~6000 caracteres por bloco para manter estabilidade e contexto.
 */
export const splitLargeDocumentIntoChunks = (text: string, chunkSize: number = 6000): DocumentChunk[] => {
  if (text.length <= chunkSize) {
    return [{ id: crypto.randomUUID(), text, index: 0, total: 1 }];
  }

  const chunks: DocumentChunk[] = [];
  let remainingText = text;
  let currentIndex = 0;

  while (remainingText.length > 0) {
    if (remainingText.length <= chunkSize) {
      chunks.push({ id: crypto.randomUUID(), text: remainingText, index: currentIndex, total: 0 });
      break;
    }

    // Tenta cortar em um parágrafo próximo ao limite
    let splitIndex = remainingText.lastIndexOf('\n\n', chunkSize);
    
    // Se não achar parágrafo duplo, tenta quebra de linha simples
    if (splitIndex === -1 || splitIndex < chunkSize * 0.7) {
      splitIndex = remainingText.lastIndexOf('\n', chunkSize);
    }

    // Se ainda não achar, corta no espaço
    if (splitIndex === -1 || splitIndex < chunkSize * 0.7) {
      splitIndex = remainingText.lastIndexOf(' ', chunkSize);
    }

    // Fallback: corta no limite exato
    if (splitIndex === -1) {
      splitIndex = chunkSize;
    }

    const chunkText = remainingText.substring(0, splitIndex).trim();
    chunks.push({ id: crypto.randomUUID(), text: chunkText, index: currentIndex, total: 0 });
    
    remainingText = remainingText.substring(splitIndex).trim();
    currentIndex++;
  }

  // Atualiza o total em todos os blocos
  const total = chunks.length;
  return chunks.map(c => ({ ...c, total }));
};
