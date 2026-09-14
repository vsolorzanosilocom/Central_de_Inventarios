/**
 * ====================================================================
 * PROYECTO: Sistema Central de Inventarios
 * DESARROLLO & ARQUITECTURA: Victor Solorzano (Silocom C.A.)
 * ASISTENCIA TÉCNICA: Google AI Studio & Opencode (Obsidian)
 * ROL: Frontend React (Tipos y modelos TypeScript)
 * ====================================================================
 */

export type InventoryModule = 'CONSUMIBLES' | 'FLOTA' | 'ROUTER' | 'SENSORIZEIT' | 'SIM';

export type SubModuleMap = {
  CONSUMIBLES: 'PRINCIPAL';
  FLOTA: 'PRINCIPAL' | 'REGIONAL';
  ROUTER: 'PRINCIPAL' | 'REGIONAL';
  SENSORIZEIT: 'PRINCIPAL' | 'REGIONAL';
  SIM: 'PRINCIPAL' | 'REGIONAL' | 'PROPIEDAD';
};

export type InventorySubModule =
  | 'PRINCIPAL'
  | 'REGIONAL'
  | 'PROPIEDAD';

export interface InventoryResponse {
  success: boolean;
  headers?: string[];
  rows?: (string | number | null)[][];
  error?: string;
  message?: string;
}

export interface SimCatalogs {
  serials: string[];
  operadoras: string[];
  relaciones: Record<string, string[]>; // Propietario -> Array of Procesadores
}

export interface RouterCatalogs {
  serials: string[];
  relaciones: Record<string, string[]>; // Marca -> Array of Modelos
}

export interface SensorizeitCatalogs {
  serials: string[];
  relaciones: Record<string, Record<string, string[]>>; // Tipo -> Marca -> Array of Modelos
}

export interface FlotaCatalogs {
  serials: string[];
  relaciones: Record<string, string[]>; // Marca -> Array of Modelos
}

export interface ConsumiblesCatalogs {
  aplicaPara: string[];
  relaciones: Record<string, Record<string, string[]>>; // Producto -> Marca -> Array of Modelos
}

export interface InitialDataSources {
  sim: SimCatalogs;
  router: RouterCatalogs;
  sensorizeit: SensorizeitCatalogs;
  flota: FlotaCatalogs;
  consumibles: ConsumiblesCatalogs;
}

export interface InitialDataResponse {
  success: boolean;
  data?: InitialDataSources;
  error?: string;
}

export interface SimPayload {
  serial: string;
  telefono?: string;
  ip?: string;
  puk?: string;
  operadora: string;
  propietario: string;
  procesador: string;
  fecha: string;
}

export interface RouterPayload {
  serial: string;
  imei?: string;
  marca: string;
  modelo: string;
  fecha: string;
}

export interface SensorizeitPayload {
  serial: string;
  imei?: string;
  dev_eui?: string;
  app_eui?: string;
  app_key?: string;
  appskey?: string;
  netskey?: string;
  at_pin?: string;
  ota_pin?: string;
  tipo_sensor: string;
  marca: string;
  modelo: string;
  fecha: string;
}

export interface FlotaPayload {
  serial: string;
  imei?: string;
  marca: string;
  modelo: string;
  fecha: string;
}

export interface ConsumiblesPayload {
  nombre_producto: string;
  marca: string;
  modelo: string;
  aplica_para: string;
  cantidad: number;
  fecha: string;
}

export type AnyPayload =
  | SimPayload
  | RouterPayload
  | SensorizeitPayload
  | FlotaPayload
  | ConsumiblesPayload;

export interface SaveResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  text: string;
}
