/**
 * ====================================================================
 * PROYECTO: Sistema Central de Inventarios
 * DESARROLLO & ARQUITECTURA: Victor Solorzano (Silocom C.A.)
 * ASISTENCIA TÉCNICA: Google AI Studio & Opencode (Obsidian)
 * ROL: Frontend React (Componente Dashboard)
 * ====================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import { InventoryModule, InventorySubModule, InventoryResponse } from '../types';
import { getInventoryData } from '../services/api';
import { Loader } from './Loader';
import {
  Package,
  Truck,
  Router as RouterIcon,
  Cpu,
  Smartphone,
  Search,
  RefreshCw,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Boxes,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [selectedModule, setSelectedModule] = useState<InventoryModule>('CONSUMIBLES');
  const [selectedSubModule, setSelectedSubModule] = useState<InventorySubModule>('PRINCIPAL');
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Configuración de submódulos disponibles con etiquetas exactas de la app original
  const subModuleOptions: Record<
    InventoryModule,
    { id: InventorySubModule; label: string; description: string }[]
  > = {
    CONSUMIBLES: [
      { id: 'PRINCIPAL', label: 'Control General', description: 'Inventario de consumibles y accesorios' },
    ],
    FLOTA: [
      { id: 'PRINCIPAL', label: 'Almacén Principal', description: 'Equipos GPS disponibles en almacén' },
      { id: 'REGIONAL', label: 'Almacén Regional', description: 'Custodia por técnico regional' },
    ],
    ROUTER: [
      { id: 'PRINCIPAL', label: 'Almacén Principal', description: 'Routers en stock central' },
      { id: 'REGIONAL', label: 'Almacén Regional', description: 'Routers en campo con técnicos' },
    ],
    SENSORIZEIT: [
      { id: 'PRINCIPAL', label: 'Almacén Principal (BD Estática)', description: 'Catálogo y disponibilidad de sensores' },
      { id: 'REGIONAL', label: 'Almacén Regional', description: 'Sensores asignados a personal' },
    ],
    SIM: [
      { id: 'PRINCIPAL', label: 'Almacén Principal', description: 'SIMs por propietario y procesador' },
      { id: 'REGIONAL', label: 'Almacén Regional', description: 'SIMs asignadas en regiones' },
      { id: 'PROPIEDAD', label: 'Propiedad Silocom totales', description: 'Consolidado por empresa / cliente' },
    ],
  };

  // Función reutilizable para cargar datos del módulo activo
  const loadModuleData = async (mod: InventoryModule, subMod: InventorySubModule) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getInventoryData(mod, subMod);
      if (response && response.success) {
        setData(response);
      } else {
        setData(null);
        setError(response?.error || 'No se pudo cargar el inventario del módulo seleccionado.');
      }
    } catch (err) {
      setData(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al cambiar de módulo o submódulo
  useEffect(() => {
    loadModuleData(selectedModule, selectedSubModule);
  }, [selectedModule, selectedSubModule]);

  // Al cambiar de módulo principal, restablecer al primer submódulo disponible
  const handleModuleChange = (mod: InventoryModule) => {
    setSelectedModule(mod);
    setSelectedSubModule(subModuleOptions[mod][0].id);
    setSearchTerm('');
  };

  // Identificar el índice de la columna de cantidad / disponibilidad
  const quantityColIndex = useMemo(() => {
    if (!data?.headers) return -1;
    const qtyKeywords = ['disponible', 'cantidad', 'cantidad en almacén', 'cantidad disponible'];
    return data.headers.findIndex((h) =>
      qtyKeywords.some((kw) => h.toLowerCase().trim().includes(kw))
    );
  }, [data?.headers]);

  // Filtrar filas: excluir filas de totales/sumas y aplicar el término de búsqueda
  const { filteredRows, criticalCount, lowStockCount, healthyCount } = useMemo(() => {
    if (!data?.rows) {
      return {
        filteredRows: [],
        criticalCount: 0,
        lowStockCount: 0,
        healthyCount: 0,
      };
    }

    // 1. Excluir filas que sean totales o sumas acumuladas
    const validRows = data.rows.filter((row) => {
      const firstCell = String(row[0] || '').toLowerCase().trim();
      const secondCell = String(row[1] || '').toLowerCase().trim();
      const isTotal =
        firstCell.includes('total') ||
        firstCell.includes('suma') ||
        secondCell.includes('total') ||
        secondCell.includes('suma');
      return !isTotal;
    });

    let critical = 0;
    let low = 0;
    let healthy = 0;

    validRows.forEach((row) => {
      if (quantityColIndex !== -1) {
        const val = Number(row[quantityColIndex]);
        if (!isNaN(val)) {
          if (val === 0) critical++;
          else if (val >= 1 && val <= 3) low++;
          else healthy++;
        }
      }
    });

    // 2. Aplicar filtro de búsqueda de texto
    const search = searchTerm.toLowerCase().trim();
    const rows = validRows.filter((row) => {
      if (!search) return true;
      return row.some((cell) => String(cell || '').toLowerCase().includes(search));
    });

    return {
      filteredRows: rows,
      criticalCount: critical,
      lowStockCount: low,
      healthyCount: healthy,
    };
  }, [data?.rows, quantityColIndex, searchTerm]);

  // Módulos con sus iconos correspondientes
  const moduleTabs = [
    { id: 'CONSUMIBLES', label: 'Consumibles', icon: Package },
    { id: 'FLOTA', label: 'Flota GPS', icon: Truck },
    { id: 'ROUTER', label: 'Routers', icon: RouterIcon },
    { id: 'SENSORIZEIT', label: 'Sensorizeit', icon: Cpu },
    { id: 'SIM', label: 'Tarjetas SIM', icon: Smartphone },
  ] as const;

  return (
    <div id="dashboard-container" className="space-y-6 animate-fade-in">
      {/* Selector de Módulo Principal (Tabs) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 overflow-x-auto">
        <div className="flex items-center space-x-1.5 min-w-max">
          {moduleTabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = selectedModule === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-module-${tab.id.toLowerCase()}`}
                onClick={() => handleModuleChange(tab.id as InventoryModule)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-150 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-tabs y Barra de Herramientas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        {/* Selector de Submódulo */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
            Vista:
          </span>
          {subModuleOptions[selectedModule].map((sub) => {
            const isSubSelected = selectedSubModule === sub.id;
            return (
              <button
                key={sub.id}
                id={`subtab-${sub.id.toLowerCase()}`}
                onClick={() => setSelectedSubModule(sub.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  isSubSelected
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                title={sub.description}
              >
                {sub.label}
              </button>
            );
          })}
        </div>

        {/* Búsqueda y Botón de Recarga con manejo visible de error */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              id="dashboard-search-input"
              type="text"
              placeholder="Buscar en tabla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50/50"
            />
          </div>

          <button
            id="btn-refresh-inventory"
            onClick={() => loadModuleData(selectedModule, selectedSubModule)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors disabled:opacity-50"
            title="Actualizar datos desde Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Métricas de Stock */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registros */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Referencias Listadas</p>
            <p className="text-xl font-bold text-slate-900">{filteredRows.length}</p>
          </div>
        </div>

        {/* Stock Crítico (0 unidades) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-rose-200/80 bg-rose-50/20 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-rose-100 text-rose-700">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-700">Stock Crítico (0 uds)</p>
            <p className="text-xl font-bold text-rose-900">{criticalCount}</p>
          </div>
        </div>

        {/* Stock Bajo (1-3 unidades) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-200/80 bg-amber-50/20 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700">Stock Bajo (1-3 uds)</p>
            <p className="text-xl font-bold text-amber-900">{lowStockCount}</p>
          </div>
        </div>

        {/* Stock Saludable (>3 unidades) */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-emerald-200/80 bg-emerald-50/20 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-700">Stock Disponible (&gt;3)</p>
            <p className="text-xl font-bold text-emerald-900">{healthyCount}</p>
          </div>
        </div>
      </div>

      {/* Vista de Tabla con Semáforo y Manejo Visible de Error */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Disponibilidad en Tiempo Real: {selectedModule} • {selectedSubModule}
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-600" /> 0 = Crítico
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> 1-3 = Bajo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> &gt;3 = Normal
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-16">
            <Loader text="Consultando inventario en tiempo real desde Google Sheets..." />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="inline-flex p-3 rounded-full bg-rose-100 text-rose-600 mb-3">
              <AlertOctagon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Error al consultar inventario</h3>
            <p className="text-rose-700 font-medium text-sm max-w-xl mx-auto">{error}</p>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => loadModuleData(selectedModule, selectedSubModule)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reintentar Consulta
              </button>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No se encontraron registros que coincidan con los criterios de búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
            <table id="inventory-table" className="w-full text-left text-xs border-collapse">
              {/* Encabezado fijo */}
              <thead className="bg-slate-100 text-slate-700 font-bold tracking-wider uppercase sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  {data?.headers?.map((header, idx) => (
                    <th key={idx} className="py-3 px-4 whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Filas de datos con semáforo */}
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="hover:bg-blue-50/40 transition-colors duration-100 group"
                  >
                    {row.map((cell, cIdx) => {
                      const isQtyCol = cIdx === quantityColIndex;
                      const numVal = Number(cell);
                      const isNumeric = !isNaN(numVal) && cell !== '' && cell !== null;

                      if (isQtyCol && isNumeric) {
                        // Lógica del semáforo estricto
                        let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
                        let labelPrefix = '';

                        if (numVal === 0) {
                          badgeClass = 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse';
                          labelPrefix = '⚠️ ';
                        } else if (numVal >= 1 && numVal <= 3) {
                          badgeClass = 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
                        }

                        return (
                          <td key={cIdx} className="py-2.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs border ${badgeClass}`}
                            >
                              {labelPrefix}
                              {numVal} uds
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={cIdx}
                          className="py-2.5 px-4 whitespace-nowrap text-slate-700 font-medium group-hover:text-slate-900"
                        >
                          {cell !== null && cell !== undefined && cell !== '' ? String(cell) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
