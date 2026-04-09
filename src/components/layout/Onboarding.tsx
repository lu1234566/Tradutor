import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, MessageSquare, FolderOpen, Share2, X, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "../ui/Button";

interface OnboardingProps {
  onClose: () => void;
}

const steps = [
  {
    title: "Tradução Literária Contextual",
    description: "Vá além da tradução literal. Nossa IA analisa nuances culturais, tom e estilo para preservar a alma do seu texto.",
    icon: Sparkles,
    color: "bg-brand-500",
  },
  {
    title: "Apoio Criativo via Chat",
    description: "Dúvidas sobre uma metáfora? Use o chat para discutir escolhas tradutórias e refinar seu texto em tempo real.",
    icon: MessageSquare,
    color: "bg-emerald-500",
  },
  {
    title: "Gestão de Projetos",
    description: "Organize seu trabalho por livros ou capítulos. Salve seu progresso e retome de onde parou com facilidade.",
    icon: FolderOpen,
    color: "bg-amber-500",
  },
  {
    title: "Exportação Profissional",
    description: "Gere arquivos prontos para revisão ou comparação, incluindo suas notas e histórico de decisões.",
    icon: Share2,
    color: "bg-blue-500",
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8 sm:p-12">
          <div className="flex flex-col items-center text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                className={`h-20 w-20 ${steps[currentStep].color} rounded-3xl flex items-center justify-center text-white shadow-xl mb-8`}
              >
                {React.createElement(steps[currentStep].icon, { className: "h-10 w-10" })}
              </motion.div>
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <h2 className="text-2xl font-serif font-bold text-slate-800 tracking-tight">
                  {steps[currentStep].title}
                </h2>
                <p className="text-slate-500 leading-relaxed">
                  {steps[currentStep].description}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="flex gap-1.5 mt-10">
              {steps.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-1.5 transition-all duration-500 rounded-full ${
                    idx === currentStep ? "w-10 bg-brand-600 shadow-sm shadow-brand-200" : "w-2 bg-slate-200"
                  }`}
                />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full mt-12">
              <Button 
                variant="ghost" 
                onClick={onClose}
                className="flex-1 rounded-2xl text-slate-400 hover:text-slate-600"
              >
                Pular
              </Button>
              <Button 
                onClick={handleNext}
                className="flex-1 rounded-2xl shadow-xl shadow-brand-200/50"
              >
                {currentStep === steps.length - 1 ? "Começar Agora" : "Próximo"}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 flex items-center justify-center gap-2 border-t border-slate-100">
          <BookOpen className="h-4 w-4 text-slate-400" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Tradutor Literário Contextual v1.0
          </span>
        </div>
      </motion.div>
    </div>
  );
};
