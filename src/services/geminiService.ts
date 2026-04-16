import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || "";

export interface TranslationSettings {
  sourceLanguage: string;
  targetLanguage: string;
  mode: string;
  tone: string;
  culturalAdaptation: string;
  preserveNames: boolean;
  showNotes: boolean;
}

export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
  notes: string[];
  adaptedExpressions?: { original: string; adapted: string; explanation: string }[];
  toneDetected?: string;
  translationStrategy?: string;
}

/**
 * 1. validateTranslationInput(text)
 * Valida a entrada do usuário antes de iniciar a tradução.
 */
export function validateTranslationInput(text: string): string | null {
  const trimmedText = text?.trim() || "";
  if (trimmedText.length === 0) {
    return "Insira um trecho para iniciar a tradução.";
  }
  if (trimmedText.length < 3) {
    return "O texto inserido é muito curto para uma tradução literária significativa.";
  }
  return null;
}

/**
 * 2. buildTranslationPrompt(text, settings)
 * Monta o prompt interno completo de tradução literária contextual.
 */
export function buildTranslationPrompt(text: string, settings: TranslationSettings): string {
  const {
    sourceLanguage,
    targetLanguage,
    mode,
    tone,
    culturalAdaptation,
    preserveNames,
    showNotes
  } = settings;

  return `
PAPEL DA IA:
Você é um Tradutor Literário de Elite e Revisor Editorial Sênior, especializado em ficção de suspense contemporânea para o mercado brasileiro.
Seu princípio fundamental é: "A tradução não deve parecer uma tradução, mas sim prosa literária original, tensa e fluida, escrita nativamente em Português Brasileiro."

OBJETIVO:
Produzir uma tradução de altíssima qualidade literária que preserve a alma, o subtexto e o ritmo do original, eliminando qualquer rastro de "texto processado" ou escolhas mecânicas.

CONFIGURAÇÕES DE TRADUÇÃO:
- Idioma de Origem: ${sourceLanguage === "auto" ? "Detectar automaticamente" : sourceLanguage}
- Idioma de Destino: ${targetLanguage}
- Modo de Tradução: ${mode}
- Tom Desejado: ${tone}
- Nível de Adaptação Cultural: ${culturalAdaptation}
- Preservar Nomes Próprios: ${preserveNames ? "Sim" : "Não"}

ORDEM DE PRIORIDADE (Siga rigorosamente):
1. PRESERVAÇÃO ARQUITETÔNICA: Mantenha rigorosamente parágrafos curtos e frases de impacto isoladas.
2. NATURALIDADE LITERÁRIA (PT-BR): O texto deve soar como suspense contemporâneo brasileiro (inteligente, direto, tenso, fluido).
3. VOZ NARRATIVA: Mantenha a coerência tonal da narradora (observadora, tensa, ocasionalmente irônica).
4. PRECISÃO LEXICAL: Evite calques do inglês e escolhas que soem artificiais ou involuntariamente cômicas.
5. RITMO E TIMING: Preserve a cadência e a respiração do texto original.

REGRAS DE OURO:
- EVITE O CÔMICO INVOLUNTÁRIO: Se uma escolha lexical soar estranha ou grotesca fora de propósito (ex: "suco de cadáver"), substitua por algo natural e imersivo.
- DESCRIÇÕES NATURAIS: Descrições de corpo, rosto e barba devem usar expressões idiomáticas brasileiras (ex: "barba por fazer" em vez de "rosto por fazer"; "suor frio" em vez de "transpiração gélida" se for mais natural).
- DIÁLOGOS VIVOS: Diálogos devem soar como fala real, com oralidade natural e espontaneidade.
- NUANCE EXATA: Diferencie pavor de susto, ou espanto de horror. Escolha o termo com a carga emocional precisa.
- SEM SOLENIDADE EXCESSIVA: A narradora é humana e tensa, não uma acadêmica empolada. Evite elevação desnecessária.

REVISÃO EDITORIAL FINAL (FILTRO SILENCIOSO):
Antes de finalizar a resposta, revise mentalmente:
- "Isso soa como português literário natural?"
- "Essa palavra chama atenção por ser esquisita ou por ser precisa?"
- "A tensão foi preservada sem soar melodramática ou técnica demais?"

TEXTO PARA TRADUÇÃO:
"""
${text}
"""

INSTRUÇÃO DE FORMATO DE SAÍDA (JSON):
Retorne estritamente um objeto JSON com esta estrutura. No campo "translation", use \\n para representar quebras de linha.
{
  "detected_source_language": "string",
  "translation": "string",
  "translator_notes": ["string"],
  "adapted_expressions": [
    { "original": "string", "adapted": "string", "explanation": "string" }
  ],
  "tone_detected": "string",
  "translation_strategy": "string"
}

REGRAS DE SAÍDA:
- "translation": O texto traduzido completo.
- "translator_notes": Notas curtas e elegantes sobre escolhas difíceis (apenas se showNotes for true). Garanta que a nota seja coerente com o texto final entregue.
- "adapted_expressions": Lista de expressões idiomáticas ou regionais que foram adaptadas.
- "tone_detected": O tom que você identificou no original.
- "translation_strategy": Breve descrição da estratégia adotada para este trecho.
- Não inclua texto fora do JSON.
`.trim();
}

/**
 * 3. callTranslationModel(prompt)
 * Envia o prompt para o modelo configurado no Google AI Studio com lógica de re-tentativa.
 */
export async function callTranslationModel(prompt: string, retries: number = 2): Promise<string> {
  if (!API_KEY) {
    throw new Error("Configuração da API Gemini não encontrada.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  let lastError: any = null;

  for (let i = 0; i <= retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "Você é um Tradutor Literário de Elite e Revisor Editorial Sênior. Sua prioridade é a precisão lexical e a naturalidade absoluta do Português Brasileiro contemporâneo. Garanta que a arquitetura textual original seja preservada, mas priorize que o texto soe como prosa literária nativa, tensa e fluida. Responda sempre em JSON.",
          responseMimeType: "application/json",
        },
      });

      if (!response.text) {
        // Se não houver texto, pode ser um problema de segurança ou limite
        console.warn(`Tentativa ${i + 1}: Resposta vazia do modelo.`);
        continue;
      }

      return response.text;
    } catch (error: any) {
      lastError = error;
      console.error(`Erro na tentativa ${i + 1} de chamada ao modelo:`, error);
      
      // Se for um erro de quota ou sobrecarga, espera um pouco antes de tentar novamente
      if (error.message?.includes("429") || error.message?.includes("503")) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      } else if (i < retries) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }

  if (lastError?.message?.includes("safety")) {
    throw new Error("O conteúdo foi bloqueado pelos filtros de segurança do modelo.");
  }

  throw new Error("A tradução não retornou conteúdo válido após várias tentativas.");
}

/**
 * 4. parseTranslationResponse(rawResponse)
 * Extrai a estrutura da resposta do modelo com fallbacks robustos.
 */
export function parseTranslationResponse(rawResponse: string): TranslationResult {
  try {
    // Limpeza básica para remover possíveis caracteres invisíveis ou lixo
    const cleanResponse = rawResponse.trim();
    
    // Tenta extrair o JSON se houver texto extra (Markdown code blocks)
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : cleanResponse;
    
    const parsed = JSON.parse(jsonString);

    // Validação mais flexível dos campos
    const translation = parsed.translation || parsed.translatedText || parsed.text;
    
    if (!translation || typeof translation !== "string" || translation.length < 2) {
      throw new Error("Conteúdo de tradução ausente ou inválido no JSON.");
    }

    // Limpeza final de ortografia comum em títulos e normalização de quebras
    const finalTranslation = translation
      .replace(/PROLÓGO/g, "PRÓLOGO")
      .replace(/Prológo/g, "Prólogo")
      .replace(/prológo/g, "prólogo");

    return {
      translatedText: finalTranslation,
      detectedLanguage: parsed.detected_source_language || parsed.language || "Não identificado",
      notes: Array.isArray(parsed.translator_notes) ? parsed.translator_notes : 
             Array.isArray(parsed.notes) ? parsed.notes : [],
      adaptedExpressions: Array.isArray(parsed.adapted_expressions) ? parsed.adapted_expressions : [],
      toneDetected: parsed.tone_detected || "",
      translationStrategy: parsed.translation_strategy || ""
    };
  } catch (error) {
    console.error("Erro ao interpretar resposta:", error, rawResponse);
    
    // Fallback agressivo: se não for JSON mas houver texto substancial, usa o texto bruto
    // Removemos possíveis marcas de JSON se o parser falhou
    const fallbackText = rawResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/\{"translation":/g, "")
      .replace(/"detected_source_language":.*?,/g, "")
      .replace(/"translator_notes":.*?\]/g, "")
      .replace(/"adapted_expressions":.*?\]/g, "")
      .replace(/"tone_detected":.*?,/g, "")
      .replace(/"translation_strategy":.*?,/g, "")
      .replace(/\}/g, "")
      .trim();

    if (fallbackText.length > 20) {
      return {
        translatedText: fallbackText,
        detectedLanguage: "Não identificado",
        notes: ["Nota: A resposta do modelo não estava em formato JSON perfeito, mas o texto foi recuperado."],
        adaptedExpressions: [],
        toneDetected: "Desconhecido",
        translationStrategy: "Recuperação de emergência"
      };
    }
    
    throw new Error("Recebemos uma resposta malformada do modelo que não pôde ser recuperada.");
  }
}

/**
 * translateTextFallback(text, settings)
 * Versão simplificada da tradução para casos de falha persistente.
 * Foca em estabilidade e retorno direto.
 */
export async function translateTextFallback(
  text: string,
  settings: TranslationSettings
): Promise<TranslationResult> {
  const prompt = `Traduza o seguinte texto literário de ${settings.sourceLanguage} para ${settings.targetLanguage}.
Mantenha o tom ${settings.tone} e o modo ${settings.mode}.
PRESERVE A FORMATAÇÃO ORIGINAL (parágrafos e quebras de linha).

TEXTO:
"""
${text}
"""

Retorne APENAS o JSON:
{
  "translation": "texto traduzido aqui",
  "detected_source_language": "idioma",
  "translator_notes": [],
  "adapted_expressions": [],
  "tone_detected": "",
  "translation_strategy": "fallback"
}`;

  const rawResponse = await callTranslationModel(prompt, 1);
  return parseTranslationResponse(rawResponse);
}

/**
 * Função orquestradora (antiga translateText refatorada)
 */
export async function translateText(
  text: string,
  settings: TranslationSettings,
  onProgress?: (message: string) => void,
  forceStructure: boolean = false
): Promise<TranslationResult> {
  // 1. Validar entrada
  const validationError = validateTranslationInput(text);
  if (validationError) {
    throw new Error(validationError);
  }

  // 2. Montar prompt
  let prompt = buildTranslationPrompt(text, settings);
  
  if (forceStructure) {
    prompt += "\n\nAVISO DE REVISÃO ESTRUTURAL: O bloco anterior foi rejeitado por fusão de parágrafos. NESTE BLOCO, é MANDATÁRIO manter exatamente a mesma quantidade de quebras de linha e parágrafos do original. NÃO UNA LINHAS INDEPENDENTES.";
  }

  // 3. Chamar modelo (com mensagens de progresso)
  onProgress?.("Analisando sentido, tom e intenção...");
  await new Promise(r => setTimeout(r, 800));
  
  onProgress?.("Interpretando atmosfera e nuances culturais...");
  const rawResponse = await callTranslationModel(prompt);
  
  onProgress?.("Refinando voz narrativa e naturalidade...");
  await new Promise(r => setTimeout(r, 600));
  
  onProgress?.("Finalizando tradução literária...");
  
  // 4. Interpretar resposta
  return parseTranslationResponse(rawResponse);
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface ChatContext {
  sourceText: string;
  currentTranslation: string;
  settings: TranslationSettings;
  notes: string[];
  history: ChatMessage[];
}

/**
 * buildTranslationChatPrompt(context, userMessage)
 * Monta o prompt interno para o assistente de apoio tradutório.
 */
export function buildTranslationChatPrompt(context: ChatContext, userMessage: string): string {
  const { sourceText, currentTranslation, settings, notes, history } = context;

  let prompt = `Você é um Consultor de Tradução Literária e Revisor Editorial de elite.
Seu objetivo é auxiliar o tradutor a refinar, entender e melhorar a tradução de uma obra literária.
Você tem acesso ao contexto completo do trabalho atual.

CONTEXTO DA OBRA:
- Texto Original:
"""
${sourceText || "(Nenhum texto inserido ainda)"}
"""

- Tradução Atual:
"""
${currentTranslation || "(Nenhum texto traduzido ainda)"}
"""

CONFIGURAÇÕES DE TRADUÇÃO UTILIZADAS:
- Idioma: ${settings.sourceLanguage} -> ${settings.targetLanguage}
- Modo: ${settings.mode}
- Tom: ${settings.tone}
- Adaptação Cultural: ${settings.culturalAdaptation}
- Preservar Nomes: ${settings.preserveNames ? "Sim" : "Não"}

NOTAS DO TRADUTOR (IA):
${notes.length > 0 ? notes.map(n => `- ${n}`).join("\n") : "Nenhuma nota gerada."}

HISTÓRICO RECENTE DA CONVERSA:
${history.map(m => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.text}`).join("\n")}

PEDIDO DO USUÁRIO:
"${userMessage}"

INSTRUÇÕES DE COMPORTAMENTO:
1. FOCO LITERÁRIO: Responda como um especialista em literatura e tradução. Fale sobre ritmo, voz, nuances, subtexto e escolhas lexicais.
2. ANALÍTICO E ÚTIL: Se o usuário pedir uma explicação, seja profundo e justifique com base no texto. Se pedir reescrita, forneça o texto refinado.
3. ALTERNATIVAS: Ao sugerir alternativas, explique brevemente a diferença de efeito entre elas (ex: "esta é mais lírica", "esta é mais direta").
4. CONTEXTUAL: Use sempre o texto original e a tradução atual como referência. Não dê respostas genéricas.
5. FORMATO: Mantenha a resposta clara e bem formatada. Use negrito para destacar termos e listas para alternativas.
6. INTENÇÃO: Identifique se o usuário quer uma explicação, uma nova versão, uma comparação ou uma análise técnica.

Se o usuário pedir para mudar algo na tradução, forneça a nova versão claramente.
Se o usuário perguntar "por que", explique a lógica cultural ou linguística por trás da escolha.

Responda agora ao pedido do usuário de forma profissional e inspiradora.`;

  return prompt;
}

/**
 * callChatModel(prompt)
 * Envia o prompt do chat para o modelo.
 */
export async function callChatModel(prompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error("Configuração da API Gemini não encontrada.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "Você é um Consultor de Tradução Literária de elite. Sua missão é ajudar o usuário a atingir a perfeição estética e narrativa em suas traduções.",
      },
    });

    return response.text || "Não foi possível gerar uma resposta.";
  } catch (error) {
    console.error("Erro no chat Gemini:", error);
    throw new Error("Não foi possível responder agora. Tente novamente.");
  }
}

/**
 * performOcrOnImage(base64Image, mimeType)
 * Usa o Gemini Vision para extrair texto de uma imagem (OCR literário).
 */
export async function performOcrOnImage(base64Image: string, mimeType: string = "image/jpeg"): Promise<string> {
  if (!API_KEY) {
    throw new Error("Configuração da API Gemini não encontrada.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        },
        {
          text: "Transcreva todo o texto visível nesta imagem. Preserve a estrutura de parágrafos e a pontuação original. Se for uma página de livro, mantenha a fidelidade ao texto literário. Retorne apenas o texto transcrito, sem comentários adicionais."
        }
      ],
      config: {
        systemInstruction: "Você é um especialista em OCR literário de alta precisão.",
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Erro no OCR Gemini:", error);
    throw new Error("Não foi possível extrair o texto desta imagem no momento.");
  }
}
