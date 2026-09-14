/**
 * ====================================================================
 * PROYECTO: Sistema Central de Inventarios
 * DESARROLLO & ARQUITECTURA: Victor Solorzano (Silocom C.A.)
 * ASISTENCIA TÉCNICA: Google AI Studio & Opencode (Obsidian)
 * ROL: Frontend React (Componente SilocomLogo)
 * ====================================================================
 */

import React from 'react';

export interface SilocomLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showRif?: boolean;
  className?: string;
}

export const SilocomLogo: React.FC<SilocomLogoProps> = ({
  size = 'md',
  showRif = true,
  className = '',
}) => {
  // Escalas proporcionales para 'sm', 'md' y 'lg'
  const sizeStyles = {
    sm: {
      container: 'px-2.5 py-1',
      text: 'text-xl',
      rif: 'text-[8px]',
    },
    md: {
      container: 'px-3 py-1.5',
      text: 'text-2xl',
      rif: 'text-[9px]',
    },
    lg: {
      container: 'px-4 py-2',
      text: 'text-3xl',
      rif: 'text-[11px]',
    },
  }[size];

  return (
    <div
      id="silocom-corporate-logo"
      className={`inline-flex flex-col items-center justify-center bg-white rounded-lg shadow-inner select-none ${sizeStyles.container} ${className}`}
    >
      {/* Wordmark en una fila */}
      <div
        className={`flex items-baseline font-black ${sizeStyles.text} leading-none tracking-tight`}
      >
        <span className="text-slate-900 font-extrabold">S</span>
        <span className="text-rose-700 font-black px-0.5">I</span>
        <span className="text-slate-900 font-extrabold">locom</span>
      </div>

      {/* RIF corporativo debajo del wordmark */}
      {showRif && (
        <span
          className={`font-bold text-slate-800 tracking-wider mt-0.5 ${sizeStyles.rif}`}
        >
          RIF: J-30725192-1
        </span>
      )}
    </div>
  );
};

export default SilocomLogo;
