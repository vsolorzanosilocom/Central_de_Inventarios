/**
 * PROYECTO: Sistema Central de Inventarios - Silocom C.A.
 * DESARROLLO & ARQUITECTURA: Victor Solorzano
 * ASISTENCIA TÉCNICA: OpenCode for Obsidian & Antigravity IDE
 * ROL: Logotipo Oficial Corporativo Silocom C.A. (Componente Unificado)
 */

import React, { useId } from 'react';

export interface SilocomLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showRif?: boolean;
  variant?: 'badge' | 'dark' | 'transparent';
  className?: string;
}

export const SilocomLogo: React.FC<SilocomLogoProps> = ({
  size = 'md',
  showRif = true,
  variant = 'badge',
  className = '',
}) => {
  const rawId = useId();
  const uniqueId = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const siloGradId = `silo-grad-${uniqueId}`;
  const roofGradId = `roof-grad-${uniqueId}`;

  // Escalas proporcionales armónicas
  const sizeConfig = {
    sm: {
      container: 'px-2.5 py-1 rounded-lg',
      text: 'text-xl',
      silo: 'w-[11px] h-[19px] mx-[1.5px]',
      rif: 'text-[7.5px] tracking-[0.14em] mt-0.5',
    },
    md: {
      container: 'px-3.5 py-1.5 rounded-xl',
      text: 'text-2xl sm:text-3xl',
      silo: 'w-[13px] h-[23px] sm:w-[15px] sm:h-[26px] mx-[2px]',
      rif: 'text-[9px] sm:text-[10px] tracking-[0.18em] mt-0.5',
    },
    lg: {
      container: 'px-5 py-2.5 rounded-xl',
      text: 'text-3xl sm:text-4xl',
      silo: 'w-[16px] h-[28px] sm:w-[18px] sm:h-[31px] mx-[2.5px]',
      rif: 'text-[11px] sm:text-xs tracking-[0.2em] mt-1',
    },
    xl: {
      container: 'px-7 py-3 rounded-2xl',
      text: 'text-5xl sm:text-6xl',
      silo: 'w-[22px] h-[38px] sm:w-[26px] sm:h-[45px] mx-[3px]',
      rif: 'text-sm sm:text-base tracking-[0.22em] mt-1.5',
    },
  }[size];

  const isDark = variant === 'dark';
  const isBadge = variant === 'badge';

  const containerClasses = isBadge
    ? `inline-flex flex-col items-center justify-center bg-white border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.06),_inset_0_1px_1px_rgba(255,255,255,1)] ${sizeConfig.container}`
    : 'inline-flex flex-col items-center justify-center bg-transparent';

  const textColor = isDark
    ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]'
    : 'text-slate-950';

  const rifColor = isDark
    ? 'text-slate-300 drop-shadow-sm'
    : 'text-slate-700';

  const siloShadow = isDark
    ? 'drop-shadow-[0_2px_6px_rgba(220,38,38,0.55)]'
    : 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)]';

  return (
    <div
      id="silocom-logo-unified"
      className={`${containerClasses} select-none transition-all ${className}`}
      aria-label="Silocom C.A. RIF J-30725192-1"
    >
      {/* Wordmark Silocom con Silo Rojo corporativo como la letra 'l' */}
      <div className={`flex items-center font-black leading-none tracking-tight ${sizeConfig.text}`}>
        {/* Letra 'S' mayúscula */}
        <span className={`${textColor} font-black font-sans`}>S</span>

        {/* Letra 'i' minúscula con punto */}
        <span className={`${textColor} font-black font-sans`}>i</span>

        {/* Letra 'l' representada por el verdadero Silo Rojo Corporativo 3D */}
        <span className="inline-flex items-center">
          <svg
            viewBox="0 0 20 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeConfig.silo} ${siloShadow} shrink-0 inline-block`}
            aria-hidden="true"
          >
            <defs>
              {/* Degradado cilíndrico realista con reflejo especular en el centro */}
              <linearGradient id={siloGradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7a121d" />
                <stop offset="20%" stopColor="#b91c1c" />
                <stop offset="42%" stopColor="#ef4444" />
                <stop offset="60%" stopColor="#dc2626" />
                <stop offset="85%" stopColor="#991b1b" />
                <stop offset="100%" stopColor="#630f17" />
              </linearGradient>
              <linearGradient id={roofGradId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#450a0a" />
                <stop offset="100%" stopColor="#991b1b" />
              </linearGradient>
            </defs>

            {/* Cuerpo del Silo con remates superiores característicos */}
            <path
              d="M 2 1.5
                 C 2 1.5, 4 3.8, 10 3.8
                 C 16 3.8, 18 1.5, 18 1.5
                 L 18.5 45.5
                 C 18.5 46.8, 16.5 47.5, 10 47.5
                 C 3.5 47.5, 1.5 46.8, 1.5 45.5
                 Z"
              fill={`url(#${siloGradId})`}
              stroke="#630f17"
              strokeWidth="0.8"
            />

            {/* Ranura/borde superior cóncavo del Silo */}
            <path
              d="M 2 1.5
                 C 4 3.8, 16 3.8, 18 1.5
                 C 16 0.8, 4 0.8, 2 1.5
                 Z"
              fill={`url(#${roofGradId})`}
            />

            {/* Brillo de luz vertical que genera volumen 3D */}
            <line
              x1="6.8"
              y1="6"
              x2="6.8"
              y2="44"
              stroke="white"
              strokeWidth="1.2"
              strokeOpacity="0.45"
              strokeLinecap="round"
            />
          </svg>
        </span>

        {/* Letras finales 'ocom' en minúscula */}
        <span className={`${textColor} font-black font-sans`}>ocom</span>
      </div>

      {/* RIF Corporativo Oficial */}
      {showRif && (
        <span className={`font-bold font-mono uppercase ${rifColor} ${sizeConfig.rif}`}>
          RIF: J-30725192-1
        </span>
      )}
    </div>
  );
};

export default SilocomLogo;
