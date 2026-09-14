/**
 * ====================================================================
 * PROYECTO: Sistema Central de Inventarios
 * DESARROLLO & ARQUITECTURA: Victor Solorzano (Silocom C.A.)
 * ASISTENCIA TÉCNICA: Google AI Studio & Opencode (Obsidian)
 * ROL: Frontend React (Componente App)
 * ====================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Dashboard } from './components/Dashboard';
import { Registro } from './components/Registro';
import { ToastContainer } from './components/Toast';
import { InitialDataSources, ToastMessage } from './types';
import { getInitialData } from './services/api';

export function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'registro'>('dashboard');
  const [catalogs, setCatalogs] = useState<InitialDataSources | null>(null);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Disparador de notificaciones Toast
  const addToast = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', text: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, text }]);

      // Auto-eliminar a los 5 segundos
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Cargar catálogos UNA SOLA VEZ al iniciar la app y cachearlos en memoria
  useEffect(() => {
    let isMounted = true;
    async function loadCatalogsOnce() {
      setIsLoadingCatalogs(true);
      try {
        const response = await getInitialData();
        if (isMounted) {
          if (response && response.success && response.data) {
            setCatalogs(response.data);
          } else {
            addToast(
              'error',
              response?.error || 'No se pudieron precargar los catálogos centrales desde Google Apps Script.'
            );
          }
        }
      } catch (err) {
        if (isMounted) {
          addToast('error', `Error al inicializar fuentes de datos: ${err instanceof Error ? err.message : String(err)}`);
        }
      } finally {
        if (isMounted) setIsLoadingCatalogs(false);
      }
    }

    loadCatalogsOnce();
    return () => {
      isMounted = false;
    };
  }, [addToast]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/80 text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Header Corporativo Sticky Navy */}
      <Header
        currentView={currentView}
        onSelectView={setCurrentView}
        isLoadingCatalogs={isLoadingCatalogs}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'dashboard' ? (
          <Dashboard />
        ) : (
          <Registro
            catalogs={catalogs}
            onUpdateCatalogs={setCatalogs}
            onShowToast={addToast}
          />
        )}
      </main>

      {/* Footer Corporativo */}
      <Footer />

      {/* Notificaciones Toast flotantes */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
