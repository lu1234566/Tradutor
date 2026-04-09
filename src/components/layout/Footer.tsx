import React from "react";

export const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-100/50 bg-white py-12">
      <div className="flex flex-col items-center justify-center px-6 gap-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-slate-200" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] text-center">
            Tradutor Literário Contextual
          </p>
          <div className="h-px w-8 bg-slate-200" />
        </div>
        
        <p className="text-xs text-slate-400 text-center max-w-md leading-relaxed font-serif italic">
          "A tradução é uma das formas mais profundas de leitura, um ato de recriação que honra a alma do texto original."
        </p>
        
        <div className="flex items-center gap-4 mt-2">
          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">© 2026 Narrativa AI</span>
          <div className="h-1 w-1 rounded-full bg-slate-200" />
          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Premium Edition</span>
        </div>
      </div>
    </footer>
  );
};
