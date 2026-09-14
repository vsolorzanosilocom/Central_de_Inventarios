/**
 * ====================================================================
 * PROYECTO: Sistema Central de Inventarios
 * DESARROLLO & ARQUITECTURA: Victor Solorzano (Silocom C.A.)
 * ASISTENCIA TÉCNICA: Google AI Studio & Opencode (Obsidian)
 * ROL: Frontend React (Tipos de entorno y variables Vite)
 * ====================================================================
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GAS_URL?: string;
  readonly VITE_API_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
