import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, User, Bot, AlertCircle, MessageSquare } from "lucide-react";
import { cn } from "@/src/utils";
import { ChatMessage } from "@/src/services/geminiService";
import { motion, AnimatePresence } from "motion/react";
import { viewService, ViewPreferences } from "@/src/services/viewService";

interface ChatTabProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onSendMessage: (message: string) => void;
  onSuggestionClick: (suggestion: string) => void;
  hasTranslation: boolean;
  viewPrefs: ViewPreferences;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  messages,
  isTyping,
  onSendMessage,
  onSuggestionClick,
  hasTranslation,
  viewPrefs
}) => {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const densityClasses = viewService.getDensityClasses(viewPrefs.density);

  const suggestions = [
    "Explique esta escolha",
    "Deixe mais poético",
    "Faça mais fiel ao original",
    "Gere 3 alternativas",
    "Revise este diálogo",
    "Compare literal e adaptado"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isTyping) {
      onSendMessage(input);
      setInput("");
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className={cn(
      "flex flex-col h-[calc(100vh-16rem)] lg:h-[650px] glass-card rounded-[2rem] overflow-hidden bg-white/50 shadow-premium border border-slate-100",
      densityClasses.card
    )}>
      {/* Chat History */}
      <div 
        ref={scrollRef}
        className={cn(
          "flex-1 overflow-y-auto flex flex-col scroll-smooth",
          viewPrefs.density === 'compact' ? 'p-3 gap-3' : viewPrefs.density === 'reading' ? 'p-10 gap-10' : 'p-6 md:p-8 gap-8'
        )}
      >
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex flex-col items-center justify-center h-full text-center",
                viewPrefs.density === 'compact' ? 'gap-3' : 'gap-6'
              )}
            >
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className={cn(
                  "bg-white rounded-[2rem] flex items-center justify-center text-brand-600 shadow-premium border border-brand-50",
                  viewPrefs.density === 'compact' ? 'h-14 w-14' : 'h-20 w-20'
                )}
              >
                <MessageSquare className={viewPrefs.density === 'compact' ? 'h-6 w-6' : 'h-10 w-10'} />
              </motion.div>
              <div className="max-w-xs space-y-2">
                <h3 className={cn("font-serif font-bold text-slate-800", viewPrefs.density === 'compact' ? 'text-base' : 'text-lg')}>Assistente de Apoio</h3>
                <p className={cn("text-slate-500 leading-relaxed", viewPrefs.density === 'compact' ? 'text-xs' : 'text-sm')}>
                  {hasTranslation 
                    ? "Converse sobre escolhas de tradução, peça alternativas ou refine o estilo deste trecho."
                    : "Insira um trecho e gere uma tradução para que eu possa ajudar com refinamentos e análise."}
                </p>
              </div>
            </motion.div>
          ) : (
            messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex gap-4 max-w-[90%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                  viewPrefs.density === 'compact' ? 'h-8 w-8' : viewPrefs.density === 'reading' ? 'h-12 w-12' : 'h-10 w-10',
                  msg.role === "user" ? "bg-brand-600 text-white" : "bg-white text-brand-600 border border-brand-100"
                )}>
                  {msg.role === "user" ? <User className={densityClasses.icon} /> : <Bot className={densityClasses.icon} />}
                </div>
                <div className={cn(
                  "rounded-[1.5rem] leading-relaxed shadow-premium transition-all",
                  viewPrefs.density === 'compact' ? 'p-2.5 px-3.5' : viewPrefs.density === 'reading' ? 'p-8 px-10' : 'p-5',
                  densityClasses.text,
                  msg.role === "user" 
                    ? "bg-brand-600 text-white rounded-tr-none" 
                    : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                )}>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </motion.div>
            ))
          )}

          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-4 mr-auto"
            >
              <div className={cn(
                "h-10 w-10 rounded-2xl bg-white border border-brand-100 flex items-center justify-center text-brand-600 shrink-0 shadow-sm",
                viewPrefs.density === 'compact' ? 'h-8 w-8' : viewPrefs.density === 'reading' ? 'h-12 w-12' : 'h-10 w-10'
              )}>
                <Bot className={densityClasses.icon} />
              </div>
              <div className={cn(
                "bg-white border border-slate-100 rounded-[1.5rem] rounded-tl-none shadow-premium flex items-center",
                viewPrefs.density === 'compact' ? 'p-3 gap-2' : viewPrefs.density === 'reading' ? 'p-8 gap-5' : 'p-5 gap-3'
              )}>
                <div className={cn(
                  "flex",
                  viewPrefs.density === 'compact' ? 'gap-1' : 'gap-1.5'
                )}>
                  <div className={cn("bg-brand-400 rounded-full animate-bounce [animation-delay:-0.3s]", viewPrefs.density === 'compact' ? 'w-1.5 h-1.5' : 'w-2 h-2')}></div>
                  <div className={cn("bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]", viewPrefs.density === 'compact' ? 'w-1.5 h-1.5' : 'w-2 h-2')}></div>
                  <div className={cn("bg-brand-600 rounded-full animate-bounce", viewPrefs.density === 'compact' ? 'w-1.5 h-1.5' : 'w-2 h-2')}></div>
                </div>
                <span className={cn(
                  "font-bold text-slate-400 uppercase tracking-widest",
                  viewPrefs.density === 'compact' ? 'text-[9px]' : viewPrefs.density === 'reading' ? 'text-[13px]' : 'text-[11px]'
                )}>Analisando...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestions & Input */}
      <div className={cn(
        "bg-white border-t border-slate-100/50",
        viewPrefs.density === 'compact' ? 'p-2' : viewPrefs.density === 'reading' ? 'p-8' : 'p-6'
      )}>
        <AnimatePresence>
          {messages.length === 0 && hasTranslation && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={cn(
                "flex flex-wrap gap-2",
                viewPrefs.density === 'compact' ? 'mb-2' : 'mb-6'
              )}
            >
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => onSuggestionClick(s)}
                  className={cn(
                    "bg-slate-50 hover:bg-brand-50 font-bold text-slate-500 hover:text-brand-600 rounded-full border border-slate-100 hover:border-brand-200 transition-all active:scale-95 shadow-sm",
                    viewPrefs.density === 'compact' ? 'px-3 py-1 text-[9px]' : 'px-4 py-2 text-[10px]'
                  )}
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={hasTranslation ? "Pergunte sobre a tradução..." : "Gere uma tradução primeiro..."}
            disabled={!hasTranslation || isTyping}
            className={cn(
              "w-full bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-300 transition-all disabled:opacity-50 group-hover:border-slate-200",
              viewPrefs.density === 'compact' ? 'pl-4 pr-12 py-2.5 text-xs' : 'pl-6 pr-14 py-4 text-base'
            )}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            type="submit"
            disabled={!input.trim() || isTyping || !hasTranslation}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:hover:bg-brand-600 transition-all shadow-lg shadow-brand-200/50",
              viewPrefs.density === 'compact' ? 'h-8 w-8' : 'h-10 w-10'
            )}
          >
            <Send className={densityClasses.icon} />
          </motion.button>
        </form>
      </div>
    </div>
  );
};
