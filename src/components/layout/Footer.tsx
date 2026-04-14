import React from "react";

export const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-100/50 bg-white py-16 paper-texture">
      <div className="flex flex-col items-center justify-center px-6 gap-8 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-4">
          <div className="h-px w-12 bg-slate-100" />
          <p className="text-[11px] font-bold text-slate-300 uppercase tracking-[0.4em] text-center">
            Contextual Literary Translator
          </p>
          <div className="h-px w-12 bg-slate-100" />
        </div>
        
        <p className="text-sm text-slate-400 text-center max-w-lg leading-relaxed font-serif italic opacity-80">
          "Translation is not a matter of words only: it is a matter of making intelligible a whole culture."
        </p>
        
        <div className="flex flex-col items-center gap-4 mt-2">
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">© 2026 Narrativa AI</span>
            <div className="h-1 w-1 rounded-full bg-slate-200" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Premium Edition</span>
          </div>
          <div className="text-[9px] font-medium text-slate-200 uppercase tracking-[0.2em]">
            Crafted for Authors & Translators
          </div>
        </div>
      </div>
    </footer>
  );
};
