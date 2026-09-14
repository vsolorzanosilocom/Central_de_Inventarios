# Sistema Central de Inventarios y Registros — SILOCOM C.A.

Aplicación web unificada para control de inventarios, disponibilidad en tiempo real y registro de activos corporativos de **SILOCOM C.A.**, desarrollada en **React 19 + TypeScript + Vite + Tailwind CSS** y optimizada para despliegue en **Vercel** con backend desacoplado en **Google Apps Script (GAS)** y Google Sheets en producción.

---

## 🚀 Guía de Despliegue en Vercel

### Paso 1: Configurar el Backend en Google Apps Script
1. El backend de Google Apps Script ya se encuentra desplegado y verificado en producción:
   - URL `/exec`: `https://script.google.com/macros/s/AKfycbyvf0H0HZ-7fSrXwNptsedrrx0ZqMK0VlE4rqsERmqNMLCLi6gxNeao7Tewp-Kdbvts/exec`
   - Token de Seguridad: `SILOCOM-INV-2026`
2. Si requiere desplegar una nueva versión:
   - Asegúrese de que en **Implementar > Administrar implementaciones** la configuración sea:
     - **Ejecutar como (Execute as):** `Yo` (cuenta con acceso a las hojas de cálculo).
     - **Quién tiene acceso (Who has access):** `Cualquiera` (Anyone).

---

### Paso 2: Despliegue en Vercel
1. Suba este repositorio a su cuenta de **GitHub** o **GitLab**.
2. Inicie sesión en [Vercel](https://vercel.com) y haga clic en **"Add New Project"** > **"Import Git Repository"**.
3. En la pantalla de configuración del proyecto:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Expanda la sección **Environment Variables** y agregue las siguientes variables:
   - `VITE_GAS_URL`: `https://script.google.com/macros/s/AKfycbyvf0H0HZ-7fSrXwNptsedrrx0ZqMK0VlE4rqsERmqNMLCLi6gxNeao7Tewp-Kdbvts/exec`
   - `VITE_API_TOKEN`: `SILOCOM-INV-2026`
5. Haga clic en **Deploy**. La aplicación quedará desplegada con HTTPS, alta disponibilidad y conexión en tiempo real a Google Sheets.

---

## 🛠️ Variables de Entorno

| Variable | Descripción | Ejemplo / Valor en Producción |
| :--- | :--- | :--- |
| `VITE_GAS_URL` | URL pública de la Web App de Apps Script (`/exec`) | `https://script.google.com/macros/s/.../exec` |
| `VITE_API_TOKEN` | Token de seguridad compartido con Apps Script | `SILOCOM-INV-2026` |

---

## 📦 Estructura del Proyecto

```text
├── Codigo.gs                # Referencia del backend REST API para Google Apps Script
├── src/
│   ├── components/
│   │   ├── SilocomLogo.tsx  # Wordmark oficial corporativo Silocom (pastilla blanca, sin imágenes externas)
│   │   ├── Header.tsx       # Barra de navegación navy sticky
│   │   ├── Footer.tsx       # Pie de página corporativo
│   │   ├── Dashboard.tsx    # Panel con semáforo de stock (0=rojo, 1-3=amarillo), métricas y nombres originales
│   │   ├── Registro.tsx     # Formularios limpios sin placeholders (salvo SIM teléfono), 9 campos técnicos en Sensorizeit
│   │   ├── Toast.tsx        # Sistema de alertas no intrusivas
│   │   └── Loader.tsx       # Spinner de carga
│   ├── services/
│   │   └── api.ts           # Cliente HTTP con contrato robusto (token y action en query y body, sin mocks)
│   ├── types.ts             # Definiciones TypeScript completas
│   ├── App.tsx              # Componente raíz con caché de catálogos
│   ├── main.tsx             # Punto de entrada Vite React
│   └── index.css            # Estilos globales Tailwind CSS
├── .env.example             # Plantilla de variables de entorno
├── .env.local               # Configuración local con credenciales de producción
├── package.json
└── vite.config.ts
```

---

## 🛡️ Reglas de Negocio Implementadas

1. **Sin Datos Simulados:** Cero mocks. Si falla la red o el servicio, se muestra el error real de forma explícita.
2. **Protección de Fórmulas:** Ninguna función sobrescribe celdas calculadas en Google Sheets.
3. **Contrato HTTP Robusto:** Se envían `action` y `token` tanto en la query string como en el cuerpo POST JSON (`Content-Type: text/plain;charset=utf-8`), evitando bloqueos por preflight CORS y pérdida de cuerpo ante eventuales redirecciones 302.
4. **Formulario Sensorizeit Completo:** Los 9 campos técnicos (`SERIAL`, `IMEI`, `DEV EUI`, `APP EUI`, `APP KEY`, `APPSKEY`, `NETSKEY`, `AT PIN`, `OTA PIN`) son obligatorios y disponen de su botón "Marcar N/A". El serial "N/A" se excluye de la validación de unicidad.
5. **Inputs Limpios:** Sin texto fantasma en ningún campo salvo el teléfono de Tarjeta SIM (`58xxxxxxxxxx` con validación `^58\d{10}$`).
6. **Submódulos Originales del Dashboard:**
   - **Flota GPS:** Almacén Principal / Almacén Regional.
   - **Routers:** Almacén Principal / Almacén Regional.
   - **Sensorizeit:** Almacén Principal (BD Estática) / Almacén Regional.
   - **Tarjetas SIM:** Almacén Principal / Almacén Regional / Propiedad Silocom totales.
   - **Consumibles:** Control General.
7. **Semáforo Visual de Stock:**
   - `0 unidades` = 🔴 **Crítico**
   - `1 a 3 unidades` = 🟡 **Bajo**
   - `> 3 unidades` = 🟢 **Normal**
