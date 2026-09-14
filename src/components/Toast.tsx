/**
 * ====================================================================
 * PROYECTO: Sistema Central de Inventarios
 * DESARROLLO & ARQUITECTURA: Victor Solorzano (Silocom C.A.)
 * ASISTENCIA TÉCNICA: Google AI Studio & Opencode (Obsidian)
 * ROL: Frontend React (Componente Toast)
 * ====================================================================
 */

import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4"
    >
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
          error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />,
        };

        const bgStyles = {
          success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          error: 'bg-rose-50 border-rose-200 text-rose-900',
          warning: 'bg-amber-50 border-amber-200 text-amber-900',
          info: 'bg-blue-50 border-blue-200 text-blue-900',
        };

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border shadow-lg transition-all transform translate-y-0 ${bgStyles[toast.type]}`}
          >
            <div className="flex items-center gap-3">
              {icons[toast.type]}
              <p className="text-sm font-medium leading-snug">{toast.text}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-black/5 transition-colors"
              aria-label="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
