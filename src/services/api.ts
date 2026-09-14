/**
 * ====================================================================
 * PROYECTO: Sistema Central de Inventarios
 * DESARROLLO & ARQUITECTURA: Victor Solorzano (Silocom C.A.)
 * ASISTENCIA TÉCNICA: Google AI Studio & Opencode (Obsidian)
 * ROL: Frontend React (Servicio API REST hacia GAS)
 * ====================================================================
 */

import {
  InventoryModule,
  InventoryResponse,
  InitialDataResponse,
  SaveResponse,
  AnyPayload,
} from '../types';

const BASE = (import.meta.env.VITE_GAS_URL || '').trim();
const TOKEN = (import.meta.env.VITE_API_TOKEN || 'SILOCOM-INV-2026').trim();

/**
 * Función central de comunicación HTTP con la API REST de Google Apps Script.
 * Contrato robusto contra 302 y redirecciones de Apps Script:
 * - Parámetros action y token en la query string de la URL.
 * - POST con body JSON y Content-Type: "text/plain;charset=utf-8" (evita preflight OPTIONS CORS).
 * - Cero datos simulados (mocks): si hay fallo de red, auth o configuración, se lanza el error real.
 */
export async function callApi<T = unknown>(
  action: string,
  params: Record<string, unknown> = {}
): Promise<T> {
  if (!BASE) {
    throw new Error(
      'VITE_GAS_URL no está configurada. Defínala en .env.local o en las variables de entorno de Vercel.'
    );
  }

  const separator = BASE.includes('?') ? '&' : '?';
  const endpoint = `${BASE}${separator}action=${encodeURIComponent(action)}&token=${encodeURIComponent(TOKEN)}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        token: TOKEN,
        action,
        ...params,
      }),
    });
  } catch (netErr) {
    throw new Error(
      `Error de red o conexión al contactar Google Apps Script: ${netErr instanceof Error ? netErr.message : String(netErr)}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Error de respuesta HTTP ${response.status} (${response.statusText}). Verifique el despliegue del script de Google Apps Script.`
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch (jsonErr) {
    throw new Error(
      'Respuesta no válida del servidor (no es un JSON válido). Esto suele ocurrir si la URL /exec no está autorizada para "Cualquiera" o si una redirección 302 POST→GET perdió el contenido.'
    );
  }

  return data as T;
}

/**
 * Consulta de datos de inventario en tiempo real desde Google Sheets.
 */
export async function getInventoryData(
  module: InventoryModule,
  subModule: string,
  refresh: boolean = false
): Promise<InventoryResponse> {
  return callApi<InventoryResponse>('getInventoryData', { module, subModule, refresh });
}

/**
 * Obtención de catálogos y fuentes de datos iniciales.
 */
export async function getInitialData(): Promise<InitialDataResponse> {
  return callApi<InitialDataResponse>('getInitialData', {});
}

/**
 * Guardado de nuevo registro en la hoja de cálculo correspondiente.
 */
export async function saveRecord(
  formType: InventoryModule,
  payload: AnyPayload
): Promise<SaveResponse> {
  return callApi<SaveResponse>('saveRecord', { formType, payload });
}

export const API_CONFIG = {
  isConfigured: Boolean(BASE),
  url: BASE,
  token: TOKEN,
};
