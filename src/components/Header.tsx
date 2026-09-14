/**
 * ====================================================================
 * PROYECTO: Sistema Central de Inventarios
 * DESARROLLO & ARQUITECTURA: Victor Solorzano (Silocom C.A.)
 * ASISTENCIA TÉCNICA: Google AI Studio & Opencode (Obsidian)
 * ROL: Frontend React (Componente Header)
 * ====================================================================
 */

import React from 'react';
import { SilocomLogo } from './SilocomLogo';
import { LayoutDashboard, PlusCircle, Database, AlertCircle } from 'lucide-react';
import { API_CONFIG } from '../services/api';

interface HeaderProps {
  currentView: 'dashboard' | 'registro';
  onSelectView: (view: 'dashboard' | 'registro') => void;
  isLoadingCatalogs?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  isLoadingCatalogs = false,
}) => {
  return (
    <header
      id="app-header"
      className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md text-white select-none"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Lado izquierdo: SilocomLogo en pastilla blanca + Título Corporativo */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <SilocomLogo size="md" showRif={true} />
            </div>

            <div className="hidden sm:block border-l border-slate-700 pl-4">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                SISTEMA CENTRAL DE INVENTARIOS
                <span className="hidden md:inline-flex text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Cloud REST
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                SILOCOM C.A. • Control Unificado y Registro de Activos
              </p>
            </div>
          </div>

          {/* Centro / Navegación: Tabs de Vistas */}
          <div className="flex items-center space-x-2 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700/60 shadow-inner">
            <button
              id="nav-btn-dashboard"
              onClick={() => onSelectView('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              id="nav-btn-registro"
              onClick={() => onSelectView('registro')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 ${
                currentView === 'registro'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar Activo</span>
            </button>
          </div>

          {/* Lado derecho: Estado de sincronización */}
          <div className="hidden lg:flex items-center space-x-3 text-xs">
            {isLoadingCatalogs ? (
              <span className="text-slate-400 flex items-center gap-1.5 text-xs animate-pulse">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                Cargando catálogos...
              </span>
            ) : !API_CONFIG.isConfigured ? (
              <span className="text-amber-400 flex items-center gap-1 text-xs font-medium bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30">
                <AlertCircle className="w-3.5 h-3.5" />
                Falta VITE_GAS_URL
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
