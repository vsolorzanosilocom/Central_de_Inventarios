/**
 * ====================================================================
 * PROYECTO: Sistema Central de Inventarios
 * DESARROLLO & ARQUITECTURA: Victor Solorzano (Silocom C.A.)
 * ASISTENCIA TÉCNICA: Google AI Studio & Opencode (Obsidian)
 * ROL: Frontend React (Componente Footer)
 * ====================================================================
 */

import React from 'react';
import { SilocomLogo } from './SilocomLogo';

export const Footer: React.FC = () => {
  return (
    <footer id="app-footer" className="bg-slate-900 border-t border-slate-800 text-slate-400 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Logo corporativo en el footer */}
        <div className="flex items-center gap-3">
          <SilocomLogo size="sm" showRif={true} />
          <div className="border-l border-slate-700 pl-3">
            <p className="text-white font-bold">SILOCOM C.A.</p>
            <p className="text-slate-400">Soluciones en Telemetría y Comunicaciones</p>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center sm:text-right text-slate-500">
          <p>© {new Date().getFullYear()} Silocom C.A. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
