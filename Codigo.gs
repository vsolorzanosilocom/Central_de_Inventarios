/**
 * ====================================================================
 * PROYECTO: Sistema Central de Inventarios
 * DESARROLLO & ARQUITECTURA: Victor Solorzano (Silocom C.A.)
 * ASISTENCIA TÉCNICA: Google AI Studio & Opencode (Obsidian)
 * ROL: Backend Central (Google Apps Script API Gateway & Data Broker) • Versión API REST (Compatible con React / Vercel)
 * ====================================================================
 */

// REGISTRO CENTRAL UNIFICADO DE HOJAS DE CÁLCULO (Google Drive IDs)
const CONFIG_IDS = {
  CONSUMIBLES: "18JS5znCfN9UAyzuBkh9joNL_aqg26OtxyHOwnxw81RQ",
  FLOTA:       "1WyvEdZhq2h4X9OmPU_q9W1Mek2lFLDLe7ZFgnzXveuE",
  ROUTER:      "1jd95SI-MgNZkUD0NQCTzSWySxKKWpGGrCgDUX9IjHJM",
  SENSORIZEIT:  "1i5By218IY-aIOt7ACYr-Edxxmq2YFvBWZfIlqzHvUO0",
  SIM:          "1mwSBI1Z6wd4ZOJ-Y5WUTuJVOsFk4t32ERPr0xOfKm3s"
};

// Alias de compatibilidad global
const SS_IDS = CONFIG_IDS;

// Token de seguridad compartido para llamadas a la API REST
const API_TOKEN = "SILOCOM-INV-2026";

// Tiempo de vida de la caché en Google Apps Script (segundos)
var CACHE_TTL_SECONDS = 30;

/**
 * Helper para almacenar y recuperar datos cacheados en Google Apps Script.
 */
function withInventoryCache(key, buildFn, refresh) {
  const cache = CacheService.getScriptCache();
  if (refresh !== true) {
    try {
      const cached = cache.get(key);
      if (cached) return JSON.parse(cached);
    } catch (err) { /* error de caché: seguir normal */ }
  }
  const value = buildFn();
  try {
    const serialized = JSON.stringify(value);
    if (serialized && serialized.length <= 100000) {
      cache.put(key, serialized, CACHE_TTL_SECONDS);
    }
  } catch (err) { /* exceder cuota: no romper la respuesta */ }
  return value;
}

/**
 * Helper para responder en formato JSON mediante ContentService.
 */
function createJsonResponse(outputObject) {
  return ContentService.createTextOutput(JSON.stringify(outputObject))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Endpoint HTTP GET: Procesa consultas por parámetros de URL (?action=...&token=...).
 */
function doGet(e) {
  try {
    const params = (e && e.parameter) ? e.parameter : {};
    const token = params.token;

    // Validación de Token Compartido
    if (token !== API_TOKEN) {
      return createJsonResponse({
        success: false,
        error: "No autorizado. Token de acceso inválido.",
        status: 403
      });
    }

    const action = params.action;

    // Si no se especifica acción, responder estado del servicio
    if (!action) {
      return createJsonResponse({
        success: true,
        message: "API REST Silocom Inventarios Activa y Operativa."
      });
    }

    // Router de acciones vía GET
    let result;
    switch (action) {
      case "getInventoryData":
        const refreshGet = params.refresh === true || params.refresh === "true";
        result = getInventoryData(params.module, params.subModule, refreshGet);
        break;
      case "getInitialData":
        result = { success: true, data: getInitialData() };
        break;
      default:
        result = { success: false, error: "Acción GET no reconocida: " + action };
        break;
    }

    return createJsonResponse(result);

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: String(error),
      status: 500
    });
  }
}

/**
 * Endpoint HTTP POST: Procesa peticiones REST con payload JSON en el body.
 */
function doPost(e) {
  try {
    let body = {};
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        return createJsonResponse({
          success: false,
          error: "Formato JSON inválido en el cuerpo de la petición."
        });
      }
    }

    const params = (e && e.parameter) ? e.parameter : {};
    const token = body.token || params.token;

    // Validación de Token Compartido
    if (token !== API_TOKEN) {
      return createJsonResponse({
        success: false,
        error: "No autorizado. Token de acceso inválido.",
        status: 403
      });
    }

    const action = body.action || params.action;

    // Router de acciones vía POST
    let result;
    switch (action) {
      case "getInventoryData":
        const refreshPost = body.refresh === true || body.refresh === "true" || params.refresh === true || params.refresh === "true";
        result = getInventoryData(body.module || params.module, body.subModule || params.subModule, refreshPost);
        break;
      case "getInitialData":
        result = { success: true, data: getInitialData() };
        break;
      case "saveRecord":
        result = saveRecord(body.formType, body.payload);
        break;
      default:
        result = { success: false, error: "Acción POST no reconocida: " + action };
        break;
    }

    return createJsonResponse(result);

  } catch (error) {
    return createJsonResponse({
      success: false,
      error: String(error),
      status: 500
    });
  }
}

/* ==============================================================================
   SECCIÓN 1: MÓDULOS DE CONSULTA Y DASHBOARD EN TIEMPO REAL
   ============================================================================== */

/**
 * API Gateway Central: Enruta las peticiones de consulta hacia el extractor correspondiente.
 * @param {string} module Módulo solicitado (CONSUMIBLES, FLOTA, ROUTER, SENSORIZEIT, SIM).
 * @param {string} subModule Subcategoría o almacén.
 * @param {boolean} refresh Si es true, ignora la caché y lee directamente las hojas.
 * @return {Object} JSON con estado, encabezados y matriz de datos.
 */
function getInventoryData(module, subModule, refresh) {
  return withInventoryCache("inv:" + module + ":" + subModule, function () {
    try {
      if (!CONFIG_IDS[module]) {
        throw new Error("Módulo solicitado no configurado en el sistema central.");
      }
      
      let result;
      switch(module) {
        case "CONSUMIBLES":
          result = extractConsumiblesData();
          break;
        case "FLOTA":
          result = extractFlotaData(subModule);
          break;
        case "ROUTER":
          result = extractRouterData(subModule);
          break;
        case "SENSORIZEIT":
          result = extractSensorizeitData(subModule);
          break;
        case "SIM":
          result = extractSimData(subModule);
          break;
        default:
          throw new Error("Extractor no implementado para el módulo seleccionado.");
      }
      
      return { success: true, headers: result.headers, rows: result.rows };
      
    } catch (error) {
      Logger.log("Error en módulo " + module + " [" + subModule + "]: " + error.toString());
      return { success: false, error: error.toString() };
    }
  }, refresh);
}

/**
 * Extractor 1: Consumibles (Consulta)
 */
function extractConsumiblesData() {
  const ss = SpreadsheetApp.openById(CONFIG_IDS.CONSUMIBLES);
  const sheet = ss.getSheetByName("CONTROL INVENTARIOS") || ss.getSheetByName("CONTROL INVENTARIO");
  if (!sheet) throw new Error("No se localizó la pestaña de control de consumibles.");
  
  const data = sheet.getDataRange().getValues();
  let startRow = -1;
  let headers = ["Marca", "Nombre", "Modelo", "Entrada", "Salida", "Disponible"];
  let rows = [];
  
  for (let r = 0; r < data.length; r++) {
    if (data[r][1] && data[r][1].toString().toLowerCase().trim() === "marca") {
      startRow = r + 1;
      break;
    }
  }
  
  if (startRow === -1) throw new Error("No se encontró la estructura 'Marca' en la hoja de consumibles.");
  
  for (let r = startRow; r < data.length; r++) {
    let marca = data[r][1];
    if (!marca || marca.toString().trim() === "") break;
    
    rows.push([
      data[r][1], // Marca
      data[r][2], // Nombre
      data[r][3], // Modelo
      data[r][4], // Entrada
      data[r][5], // Salida
      data[r][6]  // Disponible
    ]);
  }
  
  return { headers: headers, rows: rows };
}

/**
 * Extractor 2: Flota (Consulta)
 */
function extractFlotaData(subModule) {
  const ss = SpreadsheetApp.openById(CONFIG_IDS.FLOTA);
  const sheet = ss.getSheetByName("CONTROL INVENTARIO") || ss.getSheetByName("CONTROL INVENTARIOS");
  if (!sheet) throw new Error("No se encontró la pestaña de control de flotas.");
  
  const data = sheet.getDataRange().getValues();
  let rows = [];
  let headers = [];
  let lastMarca = "";
  
  if (subModule === "PRINCIPAL") {
    headers = ["Marca", "Modelo", "Cantidad"];
    let reading = false;
    for (let r = 0; r < data.length; r++) {
      let cellB = data[r][1] ? data[r][1].toString().toLowerCase().trim() : "";
      if (cellB === "marca") { reading = true; continue; }
      if (reading) {
        if (cellB.includes("total") || cellB.includes("suma") || cellB === "") {
          if (cellB.includes("total general") || cellB.includes("suma total")) break;
          continue; 
        }
        if (data[r][1] && data[r][1].toString().trim() !== "") {
          lastMarca = data[r][1].toString();
        }
        rows.push([lastMarca, data[r][2], data[r][3]]);
      }
    }
  } else {
    headers = ["Marca", "Modelo", "Técnico", "Cantidad"];
    let reading = false;
    for (let r = 0; r < data.length; r++) {
      let cellH = data[r][7] ? data[r][7].toString().toLowerCase().trim() : "";
      if (cellH === "marca") { reading = true; continue; }
      if (reading) {
        if (cellH.includes("total") || cellH.includes("suma") || cellH === "") {
          if (cellH.includes("total general") || cellH.includes("suma total")) break;
          if (data[r][8] === "" && data[r][9] === "") continue;
        }
        if (data[r][7] && data[r][7].toString().trim() !== "") {
          lastMarca = data[r][7].toString();
        }
        rows.push([lastMarca, data[r][8], data[r][9], data[r][10]]);
      }
    }
  }
  return { headers: headers, rows: rows };
}

/**
 * Extractor 3: Router (Consulta)
 */
function extractRouterData(subModule) {
  const ss = SpreadsheetApp.openById(CONFIG_IDS.ROUTER);
  const sheet = ss.getSheetByName("INVENTARIO");
  if (!sheet) throw new Error("No se encontró la pestaña 'INVENTARIO' en Routers.");
  
  const data = sheet.getDataRange().getValues();
  let rows = [];
  let headers = [];
  
  if (subModule === "PRINCIPAL") {
    headers = [
      data[4][1] || "Marca", 
      data[4][2] || "Modelo", 
      data[4][3] || "Cantidad En Almacén"
    ];
    
    let lastMarca = "";
    for (let r = 5; r < data.length; r++) {
      let marca = data[r][1] ? data[r][1].toString().trim() : "";
      let modelo = data[r][2] ? data[r][2].toString().trim() : "";
      let cantidad = data[r][3];
      
      if (marca === "" && modelo === "" && (cantidad === "" || cantidad === null)) continue;
      
      let marcaLower = marca.toLowerCase();
      let esTotal = marcaLower.includes("total") || marcaLower.includes("suma");
      
      if (!esTotal && marca !== "") {
        lastMarca = marca;
      }
      
      rows.push([
        esTotal ? marca : (marca || lastMarca), 
        modelo, 
        cantidad
      ]);
      
      if (marcaLower.includes("total general") || marcaLower === "suma total") {
        break;
      }
    }
  } else {
    headers = [
      data[4][6] || "Marca", 
      data[4][7] || "Modelo", 
      data[4][8] || "Asignado Técnico", 
      data[4][9] || "Cantidad"
    ];
    
    let lastMarca = "";
    for (let r = 5; r < data.length; r++) {
      let marca = data[r][6] ? data[r][6].toString().trim() : "";
      let modelo = data[r][7] ? data[r][7].toString().trim() : "";
      let tecnico = data[r][8] ? data[r][8].toString().trim() : "";
      let cantidad = data[r][9];
      
      if (marca === "" && modelo === "" && tecnico === "" && (cantidad === "" || cantidad === null)) continue;
      
      let marcaLower = marca.toLowerCase();
      let esTotal = marcaLower.includes("total") || marcaLower.includes("suma");
      
      if (!esTotal && marca !== "") {
        lastMarca = marca;
      }
      
      rows.push([
        esTotal ? marca : (marca || lastMarca), 
        modelo, 
        tecnico, 
        cantidad
      ]);
      
      if (marcaLower.includes("total general") || marcaLower === "suma total") {
        break;
      }
    }
  }
  return { headers: headers, rows: rows };
}

/**
 * Extractor 4: Sensorizeit (Consulta)
 */
function extractSensorizeitData(subModule) {
  const ss = SpreadsheetApp.openById(CONFIG_IDS.SENSORIZEIT);
  let rows = [];
  let headers = [];
  
  if (subModule === "PRINCIPAL") {
    const sheet = ss.getSheetByName("BD_SENSORES") || ss.getSheetByName("BD");
    if (!sheet) throw new Error("No se encontró la base de datos estática 'BD_SENSORES'.");
    
    const data = sheet.getDataRange().getValues();
    headers = ["Tipo de Sensor", "Marca", "Modelo", "Cantidad Disponible"];
    let startRow = -1;
    
    for (let r = 0; r < data.length; r++) {
      if (data[r][1] && data[r][1].toString().toLowerCase().trim() === "tipo de sensor") {
        startRow = r + 1;
        break;
      }
    }
    
    if (startRow === -1) throw new Error("Estructura base de sensores estáticos no encontrada.");
    
    for (let r = startRow; r < data.length; r++) {
      if (!data[r][1] || data[r][1].toString().trim() === "") break;
      rows.push([data[r][1], data[r][2], data[r][3], data[r][4]]);
    }
  } else {
    const sheet = ss.getSheetByName("CONTROL INVENTARIO") || ss.getSheetByName("CONTROL INVENTARIOS");
    if (!sheet) throw new Error("No se encontró la pestaña de control dinámico.");
    
    const data = sheet.getDataRange().getValues();
    headers = ["Marca", "Modelo", "Técnico Asignado", "Cantidad"];
    let lastMarca = "";
    let reading = false;
    
    for (let r = 0; r < data.length; r++) {
      let cellH = data[r][7] ? data[r][7].toString().toLowerCase().trim() : "";
      if (cellH === "marca") { reading = true; continue; }
      if (reading) {
        if (cellH.includes("total") || cellH.includes("suma") || cellH === "") {
          if (cellH.includes("total general") || cellH.includes("suma total")) break;
          if (data[r][8] === "" && data[r][9] === "") continue;
        }
        if (data[r][7] && data[r][7].toString().trim() !== "") {
          lastMarca = data[r][7].toString();
        }
        rows.push([lastMarca, data[r][8], data[r][9], data[r][10]]);
      }
    }
  }
  return { headers: headers, rows: rows };
}

/**
 * Extractor 5: Tarjetas SIM (Consulta)
 */
function extractSimData(subModule) {
  const ss = SpreadsheetApp.openById(CONFIG_IDS.SIM);
  const sheet = ss.getSheetByName("INVENTARIO");
  if (!sheet) throw new Error("No se encontró la pestaña 'INVENTARIO' de tarjetas SIM.");
  
  const data = sheet.getDataRange().getValues();
  let rows = [];
  let headers = [];
  
  if (subModule === "PRINCIPAL") {
    headers = [
      data[4][1] || "Propietario",
      data[4][2] || "Almacén",
      data[4][3] || "Operadora",
      data[4][4] || "Procesador",
      data[4][5] || "Disponible"
    ];
    
    let lastProp = "";
    for (let r = 5; r < data.length; r++) {
      let prop = data[r][1] ? data[r][1].toString().trim() : "";
      let almacen = data[r][2] ? data[r][2].toString().trim() : "";
      let operadora = data[r][3] ? data[r][3].toString().trim() : "";
      let procesador = data[r][4] ? data[r][4].toString().trim() : "";
      let disponible = data[r][5];
      
      if (prop === "" && almacen === "" && operadora === "" && procesador === "" && (disponible === "" || disponible === null)) continue;
      
      let propLower = prop.toLowerCase();
      let esTotalIntermedio = propLower.includes("total") || propLower.includes("suma");
      let esTotalGeneral = propLower.includes("general") || propLower.includes("total de totales") || propLower === "suma total";
      
      if (!esTotalIntermedio && prop !== "") {
        lastProp = prop;
      }
      
      rows.push([
        esTotalIntermedio ? prop : (prop || lastProp),
        almacen,
        operadora,
        procesador,
        disponible
      ]);
      
      if (esTotalGeneral) {
        break;
      }
    }
  } else if (subModule === "REGIONAL") {
    headers = [
      data[4][7] || "Propietario",
      data[4][8] || "Almacén",
      data[4][9] || "Técnico",
      data[4][10] || "Operadora",
      data[4][11] || "Procesador",
      data[4][12] || "Disponible"
    ];
    
    let lastProp = "";
    for (let r = 5; r < data.length; r++) {
      let prop = data[r][7] ? data[r][7].toString().trim() : "";
      let almacen = data[r][8] ? data[r][8].toString().trim() : "";
      let tecnico = data[r][9] ? data[r][9].toString().trim() : "";
      let operadora = data[r][10] ? data[r][10].toString().trim() : "";
      let procesador = data[r][11] ? data[r][11].toString().trim() : "";
      let disponible = data[r][12];
      
      if (prop === "" && almacen === "" && tecnico === "" && operadora === "" && procesador === "" && (disponible === "" || disponible === null)) continue;
      
      let propLower = prop.toLowerCase();
      let esTotalIntermedio = propLower.includes("total") || propLower.includes("suma");
      
      if (!esTotalIntermedio && prop !== "") {
        lastProp = prop;
      }
      
      rows.push([
        esTotalIntermedio ? prop : (prop || lastProp),
        almacen,
        tecnico,
        operadora,
        procesador,
        disponible
      ]);
      
      if (propLower.includes("total general") || propLower === "suma total") {
        break;
      }
    }
  } else if (subModule === "PROPIEDAD") {
    headers = [
      data[39][1] || "Propietario",
      data[39][2] || "Almacén",
      data[39][3] || "Operadora",
      data[39][4] || "Procesador",
      data[39][5] || "Disponible"
    ];
    
    let lastProp = "";
    for (let r = 40; r < data.length; r++) {
      let prop = data[r][1] ? data[r][1].toString().trim() : "";
      let almacen = data[r][2] ? data[r][2].toString().trim() : "";
      let operadora = data[r][3] ? data[r][3].toString().trim() : "";
      let procesador = data[r][4] ? data[r][4].toString().trim() : "";
      let disponible = data[r][5];
      
      if (prop === "" && almacen === "" && operadora === "" && procesador === "" && (disponible === "" || disponible === null)) continue;
      
      let propLower = prop.toLowerCase();
      let esTotalIntermedio = propLower.includes("total") || propLower.includes("suma");
      let esTotalGeneral = propLower.includes("general") || propLower.includes("total de totales") || propLower === "suma total";
      
      if (!esTotalIntermedio && prop !== "") {
        lastProp = prop;
      }
      
      rows.push([
        esTotalIntermedio ? prop : (prop || lastProp),
        almacen,
        operadora,
        procesador,
        disponible
      ]);
      
      if (esTotalGeneral) {
        break;
      }
    }
  }
  return { headers: headers, rows: rows };
}

/* ==============================================================================
   SECCIÓN 2: MÓDULOS DE REGISTRO DE NUEVOS ACTIVOS Y FUENTES DE DATOS
   ============================================================================== */

/**
 * Obtiene los datos iniciales necesarios para alimentar las listas desplegables.
 */
function getInitialData() {
  try {
    return {
      sim: getSimDataSources(),
      router: getRouterDataSources(),
      sensorizeit: getSensorizeitDataSources(),
      flota: getFlotaDataSources(),
      consumibles: getConsumiblesDataSources()
    };
  } catch (e) {
    throw new Error('Error al cargar datos iniciales: ' + e.message);
  }
}

/**
 * Obtiene fuentes de datos de SIM (Ajustado por eliminación de Columna A - LOTE).
 */
function getSimDataSources() {
  const sheet = SpreadsheetApp.openById(CONFIG_IDS.SIM).getSheetByName('SIM');
  const data = sheet.getDataRange().getValues();
  const serials = [];
  const operadoras = new Set();
  const relacionesPropietarioProcesador = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) serials.push(row[0].toString().trim()); // Col A: Serial
    if (row[4]) operadoras.add(row[4].toString().trim()); // Col E: Operadora
    if (row[5]) { // Col F: Propietario
      const prop = row[5].toString().trim();
      if (!relacionesPropietarioProcesador[prop]) relacionesPropietarioProcesador[prop] = new Set();
      if (row[6]) relacionesPropietarioProcesador[prop].add(row[6].toString().trim()); // Col G: Procesador
    }
  }
  for (let prop in relacionesPropietarioProcesador) {
    relacionesPropietarioProcesador[prop] = Array.from(relacionesPropietarioProcesador[prop]);
  }
  return { serials: serials, operadoras: Array.from(operadoras), relaciones: relacionesPropietarioProcesador };
}

function getRouterDataSources() {
  const sheet = SpreadsheetApp.openById(CONFIG_IDS.ROUTER).getSheetByName('ROUTER');
  const data = sheet.getDataRange().getValues();
  const serials = [];
  const relacionesMarcaModelo = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) serials.push(row[0].toString().trim());
    if (row[2]) {
      const marca = row[2].toString().trim();
      if (!relacionesMarcaModelo[marca]) relacionesMarcaModelo[marca] = new Set();
      if (row[3]) relacionesMarcaModelo[marca].add(row[3].toString().trim());
    }
  }
  for (let marca in relacionesMarcaModelo) {
    relacionesMarcaModelo[marca] = Array.from(relacionesMarcaModelo[marca]);
  }
  return { serials: serials, relaciones: relacionesMarcaModelo };
}

function getSensorizeitDataSources() {
  const sheet = SpreadsheetApp.openById(CONFIG_IDS.SENSORIZEIT).getSheetByName('INV SENSORIZEIT');
  const data = sheet.getDataRange().getValues();
  const serials = [];
  const relacionesFull = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) serials.push(row[0].toString().trim());
    const tipo = row[9] ? row[9].toString().trim() : '';
    const marca = row[10] ? row[10].toString().trim() : '';
    const modelo = row[11] ? row[11].toString().trim() : '';

    if (tipo) {
      if (!relacionesFull[tipo]) relacionesFull[tipo] = {};
      if (marca) {
        if (!relacionesFull[tipo][marca]) relacionesFull[tipo][marca] = new Set();
        if (modelo) relacionesFull[tipo][marca].add(modelo);
      }
    }
  }
  const estructurado = {};
  for (let t in relacionesFull) {
    estructurado[t] = {};
    for (let m in relacionesFull[t]) {
      estructurado[t][m] = Array.from(relacionesFull[t][m]);
    }
  }
  return { serials: serials, relaciones: estructurado };
}

function getFlotaDataSources() {
  const sheet = SpreadsheetApp.openById(CONFIG_IDS.FLOTA).getSheetByName('INV FLOTA');
  const data = sheet.getDataRange().getValues();
  const serials = [];
  const relacionesMarcaModelo = {};

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) serials.push(row[0].toString().trim());
    if (row[2]) {
      const marca = row[2].toString().trim();
      if (!relacionesMarcaModelo[marca]) relacionesMarcaModelo[marca] = new Set();
      if (row[3]) relacionesMarcaModelo[marca].add(row[3].toString().trim());
    }
  }
  for (let marca in relacionesMarcaModelo) {
    relacionesMarcaModelo[marca] = Array.from(relacionesMarcaModelo[marca]);
  }
  return { serials: serials, relaciones: relacionesMarcaModelo };
}

function getConsumiblesDataSources() {
  const sheet = SpreadsheetApp.openById(CONFIG_IDS.CONSUMIBLES).getSheetByName('ENTRADA CONSUMIBLE');
  const data = sheet.getDataRange().getValues();
  const aplicaPara = new Set();
  const relacionesFull = {}; 

  for (let i = 3; i < data.length; i++) {
    const row = data[i];
    const prod = row[1] ? row[1].toString().trim() : '';
    const marca = row[2] ? row[2].toString().trim() : '';
    const modelo = row[3] ? row[3].toString().trim() : '';
    const aplica = row[4] ? row[4].toString().trim() : '';
    
    if (aplica) aplicaPara.add(aplica);
    if (prod) {
      if (!relacionesFull[prod]) relacionesFull[prod] = {};
      if (marca) {
        if (!relacionesFull[prod][marca]) relacionesFull[prod][marca] = new Set();
        if (modelo) relacionesFull[prod][marca].add(modelo);
      }
    }
  }
  const estructurado = {};
  for (let p in relacionesFull) {
    estructurado[p] = {};
    for (let m in relacionesFull[p]) {
      estructurado[p][m] = Array.from(relacionesFull[p][m]);
    }
  }
  return { aplicaPara: Array.from(aplicaPara).sort(), relaciones: estructurado };
}

/**
 * Procesa el guardado seguro según el formulario de registro seleccionado.
 */
function saveRecord(formType, payload) {
  try {
    let sheet, rowData;
    
    if (formType === 'SIM') {
      sheet = SpreadsheetApp.openById(CONFIG_IDS.SIM).getSheetByName('SIM');
      rowData = [
        payload.serial,
        payload.telefono || "",
        payload.ip || "",
        payload.puk || "",
        payload.operadora,
        payload.propietario,
        payload.procesador,
        payload.fecha
      ];
    } else if (formType === 'ROUTER') {
      sheet = SpreadsheetApp.openById(CONFIG_IDS.ROUTER).getSheetByName('ROUTER');
      rowData = [payload.serial, payload.imei || "", payload.marca, payload.modelo, payload.fecha];
    } else if (formType === 'SENSORIZEIT') {
      sheet = SpreadsheetApp.openById(CONFIG_IDS.SENSORIZEIT).getSheetByName('INV SENSORIZEIT');
      rowData = [payload.serial, payload.imei || "", payload.dev_eui || "", payload.app_eui || "", payload.app_key || "", payload.appskey || "", payload.netskey || "", payload.at_pin || "", payload.ota_pin || "", payload.tipo_sensor, payload.marca, payload.modelo, payload.fecha];
    } else if (formType === 'FLOTA') {
      sheet = SpreadsheetApp.openById(CONFIG_IDS.FLOTA).getSheetByName('INV FLOTA');
      rowData = [
        payload.serial,
        payload.imei || "",
        payload.marca,
        payload.modelo,
        payload.fecha
      ];
    } else if (formType === 'CONSUMIBLES') {
      sheet = SpreadsheetApp.openById(CONFIG_IDS.CONSUMIBLES).getSheetByName('ENTRADA CONSUMIBLE');
      const lastRow = sheet.getLastRow();
      let nextLote = 1;
      if (lastRow >= 4) {
        const lastLoteVal = sheet.getRange(lastRow, 1).getValue();
        if (!isNaN(lastLoteVal) && lastLoteVal !== "") {
          nextLote = Number(lastLoteVal) + 1;
        } else {
          nextLote = lastRow - 2;
        }
      }
      rowData = [
        nextLote,
        payload.nombre_producto,
        payload.marca,
        payload.modelo,
        payload.aplica_para,
        Number(payload.cantidad),
        payload.fecha
      ];
    } else {
      throw new Error("Formulario de registro no reconocido: " + formType);
    }
    
    sheet.appendRow(rowData);

    // Invalida la caché al registrar un nuevo activo
    try {
      var allCacheKeys = [
        "inv:CONSUMIBLES:PRINCIPAL",
        "inv:FLOTA:PRINCIPAL",
        "inv:FLOTA:REGIONAL",
        "inv:ROUTER:PRINCIPAL",
        "inv:ROUTER:REGIONAL",
        "inv:SENSORIZEIT:PRINCIPAL",
        "inv:SENSORIZEIT:REGIONAL",
        "inv:SIM:PRINCIPAL",
        "inv:SIM:REGIONAL",
        "inv:SIM:PROPIEDAD"
      ];
      CacheService.getScriptCache().removeAll(allCacheKeys);
    } catch (cErr) {
      try {
        CacheService.getScriptCache().removeAll();
      } catch (err) {}
    }

    return { success: true, message: "Registro guardado exitosamente." };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
