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
 * 2. buildTranslationPrompt(config)
 * Monta o prompt interno completo de tradução.
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
Você é um tradutor literário especializado em tradução contextual, adaptação cultural controlada e preservação estilística.
Não realize uma tradução comum palavra por palavra. Interprete o texto profundamente antes de traduzir, respeitando o tom narrativo e a experiência de leitura pretendida pelo autor original.

CONFIGURAÇÕES ATUAIS DO USUÁRIO:
- Idioma de origem: ${sourceLanguage === "auto" ? "Detectar automaticamente" : sourceLanguage}
- Idioma de destino: ${targetLanguage}
- Modo de tradução: ${mode}
- Tom desejado: ${tone}
- Adaptação cultural: ${culturalAdaptation}
- Preservar nomes próprios: ${preserveNames ? "Sim" : "Não"}
- Exibir notas do tradutor: ${showNotes ? "Sim" : "Não"}

INSTRUÇÕES DE COMPORTAMENTO:
- Leia o texto por completo antes de traduzir.
- Identifique o contexto narrativo (diálogo, narração, descrição, etc.).
- Preserve a intenção, a atmosfera e a voz do texto.
- Evite tradução mecânica. Adapte expressões idiomáticas de forma natural.
- Respeite o nível de adaptação cultural solicitado.
- Preserve consistência terminológica e estilística.
- ${preserveNames ? "Preserve nomes de personagens, lugares e organizações, salvo formas consagradas." : "Adapte nomes próprios se necessário para o contexto local."}
- Produza um texto final que soe natural no idioma de destino.

REGRAS ESPECÍFICAS POR MODO:
${mode === "Literal" ? `
- Priorize maior proximidade estrutural com o original.
- Faça menos reformulações.
- Adapte apenas quando necessário para compreensão.
- Preserve construções do original sempre que possível sem comprometer a inteligibilidade.` : ""}
${mode === "Equilibrado" ? `
- Equilibre fidelidade e fluidez.
- Preserve sentido, ritmo e atmosfera.
- Adapte apenas quando necessário para naturalidade.
- Evite literalidade excessiva e evite reescrita livre demais.` : ""}
${mode === "Adaptado" ? `
- Priorize fluidez e recepção natural no idioma de destino.
- Reformule quando necessário para manter impacto e legibilidade.
- Adapte expressões, referências e construções com mais liberdade, sem perder a intenção do original.
- Preserve a experiência de leitura acima da estrutura literal.` : ""}

REGRAS ESPECÍFICAS POR TOM:
${tone === "Neutro" ? "- Usar linguagem clara, estável e natural." : ""}
${tone === "Poético" ? "- Valorizar musicalidade, imagens e delicadeza expressiva." : ""}
${tone === "Dramático" ? "- Intensificar levemente a carga emocional quando compatível com o original." : ""}
${tone === "Sombrio" ? "- Preservar densidade, tensão e atmosfera pesada." : ""}
${tone === "Clássico" ? "- Preferir formulações mais elegantes e atemporais." : ""}
${tone === "Moderno" ? "- Favorecer fluidez contemporânea sem banalizar a escrita." : ""}

REGRAS ESPECÍFICAS POR ADAPTAÇÃO CULTURAL:
${culturalAdaptation === "Baixa" ? `
- Mantenha referências culturais do original.
- Adapte somente o necessário para compreensão.` : ""}
${culturalAdaptation === "Moderada" ? `
- Adapte quando a leitura literal soar artificial ou opaca.
- Preserve equilíbrio entre identidade cultural e naturalidade.` : ""}
${culturalAdaptation === "Alta" ? `
- Localize expressões e equivalentes culturais com maior liberdade.
- Preserve a intenção e o efeito do original.
- Evite exageros ou regionalismos inadequados.` : ""}

PROTEÇÕES DE QUALIDADE:
- Não resuma o texto.
- Não censure automaticamente elementos literários.
- Não simplifique excessivamente.
- Não transforme narração em explicação.
- Não altere nomes sem motivo.
- Não omita frases.
- Não invente conteúdo que não esteja implícito no original.
- Não adicionar moral, comentário ou interpretação extra.

CASOS DE ENTRADA IMPERFEITA:
- Para trechos incompletos ou frases soltas, preserve a coerência local.
- Traduza da melhor forma possível mantendo a naturalidade e evitando alucinações.

TEXTO PARA TRADUÇÃO:
"""
${text}
"""

INSTRUÇÃO DE FORMATO DE SAÍDA:
Retorne estritamente um objeto JSON com a seguinte estrutura:
{
  "detected_source_language": "string",
  "translation": "string",
  "translator_notes": ["string", "string"]
}

REGRAS DE SAÍDA:
- detected_source_language = idioma detectado ou idioma informado.
- translation = texto traduzido completo.
- translator_notes = array vazio se notas estiverem desativadas ou se não houver observações relevantes.
- Não repita o texto original.
- Não faça introduções ou comentários fora do JSON.
`.trim();
}

/**
 * 3. callTranslationModel(prompt)
 * Envia o prompt para o modelo configurado no Google AI Studio.
 */
export async function callTranslationModel(prompt: string): Promise<string> {
  if (!API_KEY) {
    throw new Error("Configuração da API Gemini não encontrada.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "Você é um tradutor literário de elite. Responda sempre em JSON conforme solicitado.",
        responseMimeType: "application/json",
      },
    });

    if (!response.text) {
      throw new Error("A tradução não retornou conteúdo válido.");
    }

    return response.text;
  } catch (error) {
    console.error("Erro na chamada ao modelo:", error);
    throw new Error("Não foi possível concluir a tradução agora. Tente novamente.");
  }
}

/**
 * 4. parseTranslationResponse(rawResponse)
 * Extrai a estrutura da resposta do modelo com fallbacks robustos.
 */
export function parseTranslationResponse(rawResponse: string): TranslationResult {
  try {
    // Tenta extrair o JSON se houver texto extra (Markdown code blocks)
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : rawResponse;
    
    const parsed = JSON.parse(jsonString);

    if (!parsed.translation || typeof parsed.translation !== "string") {
      throw new Error("Formato de tradução inválido.");
    }

    return {
      translatedText: parsed.translation,
      detectedLanguage: parsed.detected_source_language || "Não identificado",
      notes: Array.isArray(parsed.translator_notes) ? parsed.translator_notes : []
    };
  } catch (error) {
    console.error("Erro ao interpretar resposta:", error, rawResponse);
    
    // Fallback: se não for JSON mas houver texto, tenta usar o texto bruto como tradução
    if (rawResponse && rawResponse.length > 10 && !rawResponse.includes("{")) {
      return {
        translatedText: rawResponse,
        detectedLanguage: "Não identificado",
        notes: ["Recebemos uma resposta inesperada do modelo, exibindo conteúdo bruto."]
      };
    }
    
    throw new Error("Recebemos uma resposta inesperada do modelo.");
  }
}

/**
 * Função orquestradora (antiga translateText refatorada)
 */
export async function translateText(
  text: string,
  settings: TranslationSettings,
  onProgress?: (message: string) => void
): Promise<TranslationResult> {
  // 1. Validar entrada
  const validationError = validateTranslationInput(text);
  if (validationError) {
    throw new Error(validationError);
  }

  // 2. Montar prompt
  const prompt = buildTranslationPrompt(text, settings);

  // 3. Chamar modelo (com mensagens de progresso)
  onProgress?.("Lendo o contexto narrativo...");
  await new Promise(r => setTimeout(r, 800));
  
  onProgress?.("Identificando tom, estilo e nuances culturais...");
  const rawResponse = await callTranslationModel(prompt);
  
  onProgress?.("Ajustando a tradução para maior naturalidade literária...");
  await new Promise(r => setTimeout(r, 600));
  
  onProgress?.("Finalizando a versão traduzida...");
  
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
