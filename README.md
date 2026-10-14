# Sistema Central de Inventarios y Registros — SILOCOM C.A.

Aplicación web para consultar inventarios y registrar activos de SILOCOM C.A. El frontend está desarrollado con React 19, TypeScript, Vite 6 y Tailwind CSS 4. Los datos y las operaciones de registro se comunican directamente con una Web App de Google Apps Script (GAS), que utiliza Google Sheets.

## Arquitectura

- **Frontend:** aplicación React/Vite en `src/`, con vistas de dashboard y registro.
- **Comunicación:** `src/services/api.ts` envía solicitudes HTTP directamente a GAS. Las acciones y el token de aplicación se envían en la URL y en el cuerpo de las solicitudes POST.
- **Backend:** `Codigo.gs` es la copia local de referencia del backend de Apps Script; no es una función serverless de Vercel.
- **Caché:** `src/services/inventoryCache.ts` mantiene una caché en el cliente para inventarios.
- **Persistencia:** Google Sheets, a través del backend de GAS.

## Requisitos y desarrollo local

Se requiere Node.js y npm.

```bash
npm install
```

Crea un archivo `.env.local` en la raíz del proyecto con la URL de la Web App de Apps Script:

```env
VITE_GAS_URL=https://script.google.com/macros/s/ID_DE_IMPLEMENTACION/exec
VITE_API_TOKEN=REEMPLAZAR_POR_EL_TOKEN_CONFIGURADO_EN_GAS
```

Inicia Vite con:

```bash
npm run dev
```

Vite mostrará la dirección local disponible (normalmente `http://localhost:5173`). Para validar los tipos y compilar:

```bash
npm run lint
npm run build
```

## Despliegue

El frontend se puede desplegar como sitio estático en Vercel u otro proveedor compatible con Vite:

- **Build:** `npm run build`
- **Directorio de salida:** `dist`
- **Variables de entorno de compilación:** `VITE_GAS_URL` y `VITE_API_TOKEN`

Configura las mismas variables en el entorno de compilación del proveedor y vuelve a compilar después de cambiarlas. El backend GAS se despliega y administra por separado como una Web App de Apps Script. La cuenta que la ejecuta debe tener acceso a las hojas correspondientes y la política de acceso debe permitir las solicitudes previstas por la aplicación.

No hay una carpeta `api/` ni funciones backend de Vercel en este proyecto. La configuración de Vite tampoco incluye un proxy de API local; el navegador contacta directamente a GAS.

## Estructura principal

```text
├── Codigo.gs
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx
│   │   ├── Registro.tsx
│   │   ├── Header.tsx
│   │   └── ...
│   ├── services/
│   │   ├── api.ts
│   │   └── inventoryCache.ts
│   ├── App.tsx
│   ├── types.ts
│   ├── main.tsx
│   └── index.css
├── package.json
└── vite.config.ts
```

## Configuración y seguridad

- `VITE_GAS_URL` debe apuntar a la URL `/exec` de la implementación de GAS.
- Las variables `VITE_*` se incorporan al JavaScript del navegador durante la compilación. Por tanto, `VITE_API_TOKEN` no es un secreto confidencial; no lo uses como única protección de datos o de operaciones. Si se necesita control de acceso, debe imponerse en el backend con un mecanismo apropiado.
- No guardes credenciales privadas en el repositorio ni en variables `VITE_*`.

## Funcionalidad

- El dashboard presenta inventarios por módulo y submódulo.
- El formulario permite registrar activos y utiliza los catálogos iniciales obtenidos desde GAS.
- La interfaz muestra errores de configuración, red y respuesta del servicio; no depende de un backend proxy de Vercel.
