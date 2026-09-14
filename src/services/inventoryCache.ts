/**
 * ====================================================================
 * PROYECTO: Sistema Central de Inventarios
 * DESARROLLO & ARQUITECTURA: Victor Solorzano (Silocom C.A.)
 * ASISTENCIA TÉCNICA: Google AI Studio & Opencode (Obsidian)
 * ROL: Frontend React (Servicio de Caché en Memoria y Precarga de Inventarios)
 * ====================================================================
 */

import { InventoryModule, InventoryResponse, InventorySubModule } from '../types';
import { getInventoryData } from './api';

// Almacenamiento en memoria para los inventarios consultados
const cache = new Map<string, InventoryResponse>();

// Combinaciones canónicas de módulos y submódulos a precargar
const INVENTORY_COMBOS: { module: InventoryModule; subModule: InventorySubModule }[] = [
  { module: 'CONSUMIBLES', subModule: 'PRINCIPAL' },
  { module: 'FLOTA', subModule: 'PRINCIPAL' },
  { module: 'FLOTA', subModule: 'REGIONAL' },
  { module: 'ROUTER', subModule: 'PRINCIPAL' },
  { module: 'ROUTER', subModule: 'REGIONAL' },
  { module: 'SENSORIZEIT', subModule: 'PRINCIPAL' },
  { module: 'SENSORIZEIT', subModule: 'REGIONAL' },
  { module: 'SIM', subModule: 'PRINCIPAL' },
  { module: 'SIM', subModule: 'REGIONAL' },
  { module: 'SIM', subModule: 'PROPIEDAD' },
];

/**
 * Obtiene la clave de caché normalizada
 */
function getCacheKey(module: string, subModule: string): string {
  return `${module}:${subModule}`;
}

/**
 * Devuelve la respuesta en caché si existe, o undefined.
 */
export function getCachedInventory(
  module: InventoryModule,
  subModule: string
): InventoryResponse | undefined {
  return cache.get(getCacheKey(module, subModule));
}

/**
 * Consulta la API (con soporte para parámetro refresh), guarda en caché y retorna.
 */
export async function fetchInventory(
  module: InventoryModule,
  subModule: string,
  refresh: boolean = false
): Promise<InventoryResponse> {
  const key = getCacheKey(module, subModule);

  if (!refresh) {
    const existing = cache.get(key);
    if (existing) {
      return existing;
    }
  }

  const response = await getInventoryData(module, subModule, refresh);
  if (response && response.success) {
    cache.set(key, response);
  }
  return response;
}

/**
 * Precarga en paralelo los 10 combos de inventario en segundo plano.
 * Usa Promise.allSettled para que fallos de red individuales sean silenciosos
 * y no bloqueen a los demás.
 */
export async function preloadAllInventories(): Promise<void> {
  const tasks = INVENTORY_COMBOS.map(async ({ module, subModule }) => {
    try {
      const res = await getInventoryData(module, subModule, false);
      if (res && res.success) {
        cache.set(getCacheKey(module, subModule), res);
      }
    } catch {
      // Fallo silencioso en precarga; se reintentará al abrir esa pestaña específica
    }
  });

  await Promise.allSettled(tasks);
}
