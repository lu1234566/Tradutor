import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { viewService, ViewPreferences } from "@/src/services/viewService";
import { cn } from "@/src/utils";
import { AlertCircle, X } from "lucide-react";
import { Button } from "./Button";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
  viewPrefs: ViewPreferences;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "primary",
  onConfirm,
  onClose,
  viewPrefs
}) => {
  const densityClasses = viewService.getDensityClasses(viewPrefs.density);

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="confirmation-modal-overlay" className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "bg-white w-full max-w-md shadow-2xl overflow-hidden border border-slate-100",
              densityClasses.card
            )}
          >
            <div className={cn(
              viewPrefs.density === 'compact' ? 'p-4' : viewPrefs.density === 'reading' ? 'p-10' : 'p-6 md:p-8'
            )}>
              <div className={cn(
                "flex items-start justify-between",
                viewPrefs.density === 'compact' ? 'mb-4' : 'mb-6'
              )}>
                <div className={cn(
                  "rounded-2xl flex items-center justify-center",
                  viewPrefs.density === 'compact' ? 'h-10 w-10' : 'h-12 w-12',
                  variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-600'
                )}>
                  <AlertCircle className={densityClasses.icon} />
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                >
                  <X className={densityClasses.icon} />
                </button>
              </div>

              <h3 className={cn(
                "font-serif font-bold text-slate-800",
                densityClasses.heading,
                viewPrefs.density === 'compact' ? 'mb-1' : 'mb-2'
              )}>{title}</h3>
              <p className={cn(
                "text-slate-500 leading-relaxed",
                densityClasses.text,
                viewPrefs.density === 'compact' ? 'mb-4' : 'mb-8'
              )}>{message}</p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="secondary"
                  size={viewPrefs.density === 'compact' ? 'sm' : 'md'}
                  onClick={onClose}
                  className="flex-1 rounded-xl"
                >
                  {cancelLabel}
                </Button>
                <Button
                  variant={variant === 'danger' ? 'primary' : 'primary'}
                  size={viewPrefs.density === 'compact' ? 'sm' : 'md'}
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={cn(
                    "flex-1 rounded-xl",
                    variant === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : ''
                  )}
                >
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
