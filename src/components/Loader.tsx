/**
 * ====================================================================
 * PROYECTO: Sistema Central de Inventarios
 * DESARROLLO & ARQUITECTURA: Victor Solorzano (Silocom C.A.)
 * ASISTENCIA TÉCNICA: Google AI Studio & Opencode (Obsidian)
 * ROL: Frontend React (Componente Loader)
 * ====================================================================
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Loader: React.FC<LoaderProps> = ({
  text = 'Cargando datos...',
  size = 'md',
}) => {
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  }[size];

  return (
    <div id="loader-wrapper" className="flex flex-col items-center justify-center p-8 gap-3 text-slate-500">
      <Loader2 className={`${sizeMap} animate-spin text-blue-600`} />
      {text && <p className="text-sm font-medium text-slate-600">{text}</p>}
    </div>
  );
};

export default Loader;
