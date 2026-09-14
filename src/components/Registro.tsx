/**
 * ====================================================================
 * PROYECTO: Sistema Central de Inventarios
 * DESARROLLO & ARQUITECTURA: Victor Solorzano (Silocom C.A.)
 * ASISTENCIA TÉCNICA: Google AI Studio & Opencode (Obsidian)
 * ROL: Frontend React (Componente Registro)
 * ====================================================================
 */

import React, { useState } from 'react';
import {
  InventoryModule,
  InitialDataSources,
  SimPayload,
  RouterPayload,
  SensorizeitPayload,
  FlotaPayload,
  ConsumiblesPayload,
  AnyPayload,
} from '../types';
import { saveRecord } from '../services/api';
import {
  PlusCircle,
  Smartphone,
  Router as RouterIcon,
  Cpu,
  Truck,
  Package,
  AlertTriangle,
  HelpCircle,
  X,
} from 'lucide-react';

interface RegistroProps {
  catalogs: InitialDataSources | null;
  onUpdateCatalogs: (updatedCatalogs: InitialDataSources) => void;
  onShowToast: (type: 'success' | 'error' | 'warning' | 'info', text: string) => void;
}

export const Registro: React.FC<RegistroProps> = ({
  catalogs,
  onUpdateCatalogs,
  onShowToast,
}) => {
  const [activeForm, setActiveForm] = useState<InventoryModule>('SIM');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Modal para agregar nuevos valores a los catálogos en mayúsculas
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalConfig, setModalConfig] = useState<{
    targetField: string;
    label: string;
    parentKey?: string;
    grandParentKey?: string;
  } | null>(null);
  const [modalInputValue, setModalInputValue] = useState<string>('');

  // Fecha actual YYYY-MM-DD
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // Estados de formularios individuales
  const [simForm, setSimForm] = useState<SimPayload>({
    serial: '',
    telefono: '',
    ip: '',
    puk: '',
    operadora: '',
    propietario: '',
    procesador: '',
    fecha: getTodayDate(),
  });

  const [routerForm, setRouterForm] = useState<RouterPayload>({
    serial: '',
    imei: '',
    marca: '',
    modelo: '',
    fecha: getTodayDate(),
  });

  const [sensorForm, setSensorForm] = useState<SensorizeitPayload>({
    serial: '',
    imei: '',
    dev_eui: '',
    app_eui: '',
    app_key: '',
    appskey: '',
    netskey: '',
    at_pin: '',
    ota_pin: '',
    tipo_sensor: '',
    marca: '',
    modelo: '',
    fecha: getTodayDate(),
  });

  const [flotaForm, setFlotaForm] = useState<FlotaPayload>({
    serial: '',
    imei: '',
    marca: '',
    modelo: '',
    fecha: getTodayDate(),
  });

  const [consumiblesForm, setConsumiblesForm] = useState<ConsumiblesPayload>({
    nombre_producto: '',
    marca: '',
    modelo: '',
    aplica_para: '',
    cantidad: 1,
    fecha: getTodayDate(),
  });

  // Validaciones en tiempo real
  const [serialError, setSerialError] = useState<string | null>(null);
  const [ipError, setIpError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Validación de serial único contra catálogo existente (N/A no se valida)
  const checkSerialUniqueness = (serial: string, moduleType: InventoryModule) => {
    if (!serial.trim() || serial.trim().toUpperCase() === 'N/A' || moduleType === 'CONSUMIBLES') {
      setSerialError(null);
      return;
    }

    if (!catalogs) {
      setSerialError(null);
      return;
    }

    const sTrim = serial.trim().toUpperCase();
    let existingSerials: string[] = [];

    if (moduleType === 'SIM') existingSerials = catalogs.sim.serials;
    if (moduleType === 'ROUTER') existingSerials = catalogs.router.serials;
    if (moduleType === 'SENSORIZEIT') existingSerials = catalogs.sensorizeit.serials;
    if (moduleType === 'FLOTA') existingSerials = catalogs.flota.serials;

    const isDuplicate = existingSerials.some(
      (item) => item.toUpperCase() === sTrim
    );

    if (isDuplicate) {
      setSerialError(`El serial "${sTrim}" ya se encuentra registrado en la base de datos.`);
    } else {
      setSerialError(null);
    }
  };

  // Validación de formato de teléfono obligatorio para SIM (^58\d{10}$)
  const validatePhoneNumber = (phone: string): boolean => {
    const pTrim = phone.trim();
    if (!pTrim || pTrim.toUpperCase() === 'N/A') {
      setPhoneError(null);
      return true;
    }

    const phoneRegex = /^58\d{10}$/;
    if (!phoneRegex.test(pTrim)) {
      setPhoneError('Formato obligatorio: 58 seguido de 10 dígitos.');
      return false;
    }

    setPhoneError(null);
    return true;
  };

  // Validación de formato de IP
  const validateIpAddress = (ip: string) => {
    if (!ip || ip.trim() === '' || ip.trim().toUpperCase() === 'N/A') {
      setIpError(null);
      return true;
    }
    const ipv4Regex =
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipv4Regex.test(ip.trim())) {
      setIpError('Formato de IP inválido (Ej: 10.150.22.45 o N/A)');
      return false;
    }
    setIpError(null);
    return true;
  };

  // Apertura del modal para "[+ Agregar Nuevo...]"
  const promptAddNewOption = (
    field: string,
    label: string,
    parentKey?: string,
    grandParentKey?: string
  ) => {
    setModalConfig({ targetField: field, label, parentKey, grandParentKey });
    setModalInputValue('');
    setModalOpen(true);
  };

  // Confirmación de adición al catálogo local
  const handleConfirmAddOption = () => {
    if (!modalConfig || !modalInputValue.trim() || !catalogs) {
      setModalOpen(false);
      return;
    }

    const newValue = modalInputValue.trim().toUpperCase();
    const updated = JSON.parse(JSON.stringify(catalogs)) as InitialDataSources;
    const { targetField, parentKey, grandParentKey } = modalConfig;

    if (activeForm === 'SIM') {
      if (targetField === 'operadora') {
        if (!updated.sim.operadoras.includes(newValue)) {
          updated.sim.operadoras.push(newValue);
        }
        setSimForm((prev) => ({ ...prev, operadora: newValue }));
      } else if (targetField === 'propietario') {
        if (!updated.sim.relaciones[newValue]) {
          updated.sim.relaciones[newValue] = [];
        }
        setSimForm((prev) => ({ ...prev, propietario: newValue, procesador: '' }));
      } else if (targetField === 'procesador' && parentKey) {
        if (!updated.sim.relaciones[parentKey]) {
          updated.sim.relaciones[parentKey] = [];
        }
        if (!updated.sim.relaciones[parentKey].includes(newValue)) {
          updated.sim.relaciones[parentKey].push(newValue);
        }
        setSimForm((prev) => ({ ...prev, procesador: newValue }));
      }
    } else if (activeForm === 'ROUTER') {
      if (targetField === 'marca') {
        if (!updated.router.relaciones[newValue]) {
          updated.router.relaciones[newValue] = [];
        }
        setRouterForm((prev) => ({ ...prev, marca: newValue, modelo: '' }));
      } else if (targetField === 'modelo' && parentKey) {
        if (!updated.router.relaciones[parentKey]) {
          updated.router.relaciones[parentKey] = [];
        }
        if (!updated.router.relaciones[parentKey].includes(newValue)) {
          updated.router.relaciones[parentKey].push(newValue);
        }
        setRouterForm((prev) => ({ ...prev, modelo: newValue }));
      }
    } else if (activeForm === 'FLOTA') {
      if (targetField === 'marca') {
        if (!updated.flota.relaciones[newValue]) {
          updated.flota.relaciones[newValue] = [];
        }
        setFlotaForm((prev) => ({ ...prev, marca: newValue, modelo: '' }));
      } else if (targetField === 'modelo' && parentKey) {
        if (!updated.flota.relaciones[parentKey]) {
          updated.flota.relaciones[parentKey] = [];
        }
        if (!updated.flota.relaciones[parentKey].includes(newValue)) {
          updated.flota.relaciones[parentKey].push(newValue);
        }
        setFlotaForm((prev) => ({ ...prev, modelo: newValue }));
      }
    } else if (activeForm === 'SENSORIZEIT') {
      if (targetField === 'tipo_sensor') {
        if (!updated.sensorizeit.relaciones[newValue]) {
          updated.sensorizeit.relaciones[newValue] = {};
        }
        setSensorForm((prev) => ({ ...prev, tipo_sensor: newValue, marca: '', modelo: '' }));
      } else if (targetField === 'marca' && parentKey) {
        if (!updated.sensorizeit.relaciones[parentKey]) {
          updated.sensorizeit.relaciones[parentKey] = {};
        }
        if (!updated.sensorizeit.relaciones[parentKey][newValue]) {
          updated.sensorizeit.relaciones[parentKey][newValue] = [];
        }
        setSensorForm((prev) => ({ ...prev, marca: newValue, modelo: '' }));
      } else if (targetField === 'modelo' && parentKey && grandParentKey) {
        if (!updated.sensorizeit.relaciones[grandParentKey]?.[parentKey]) {
          if (!updated.sensorizeit.relaciones[grandParentKey]) {
            updated.sensorizeit.relaciones[grandParentKey] = {};
          }
          updated.sensorizeit.relaciones[grandParentKey][parentKey] = [];
        }
        if (!updated.sensorizeit.relaciones[grandParentKey][parentKey].includes(newValue)) {
          updated.sensorizeit.relaciones[grandParentKey][parentKey].push(newValue);
        }
        setSensorForm((prev) => ({ ...prev, modelo: newValue }));
      }
    } else if (activeForm === 'CONSUMIBLES') {
      if (targetField === 'nombre_producto') {
        if (!updated.consumibles.relaciones[newValue]) {
          updated.consumibles.relaciones[newValue] = {};
        }
        setConsumiblesForm((prev) => ({ ...prev, nombre_producto: newValue, marca: '', modelo: '' }));
      } else if (targetField === 'marca' && parentKey) {
        if (!updated.consumibles.relaciones[parentKey]) {
          updated.consumibles.relaciones[parentKey] = {};
        }
        if (!updated.consumibles.relaciones[parentKey][newValue]) {
          updated.consumibles.relaciones[parentKey][newValue] = [];
        }
        setConsumiblesForm((prev) => ({ ...prev, marca: newValue, modelo: '' }));
      } else if (targetField === 'modelo' && parentKey && grandParentKey) {
        if (!updated.consumibles.relaciones[grandParentKey]?.[parentKey]) {
          if (!updated.consumibles.relaciones[grandParentKey]) {
            updated.consumibles.relaciones[grandParentKey] = {};
          }
          updated.consumibles.relaciones[grandParentKey][parentKey] = [];
        }
        if (!updated.consumibles.relaciones[grandParentKey][parentKey].includes(newValue)) {
          updated.consumibles.relaciones[grandParentKey][parentKey].push(newValue);
        }
        setConsumiblesForm((prev) => ({ ...prev, modelo: newValue }));
      } else if (targetField === 'aplica_para') {
        if (!updated.consumibles.aplicaPara.includes(newValue)) {
          updated.consumibles.aplicaPara.push(newValue);
        }
        setConsumiblesForm((prev) => ({ ...prev, aplica_para: newValue }));
      }
    }

    onUpdateCatalogs(updated);
    setModalOpen(false);
    onShowToast('info', `Opción "${newValue}" agregada al catálogo local.`);
  };

  // Envío del formulario activo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (serialError) {
      onShowToast('error', 'Por favor corrija el error de serial duplicado antes de guardar.');
      return;
    }

    if (ipError) {
      onShowToast('error', 'El formato de dirección IP es inválido.');
      return;
    }

    let payloadToSave: AnyPayload | null = null;

    if (activeForm === 'SIM') {
      if (!simForm.serial.trim() || !simForm.operadora || !simForm.propietario || !simForm.procesador) {
        onShowToast('warning', 'Complete todos los campos obligatorios de la SIM.');
        return;
      }
      if (!validatePhoneNumber(simForm.telefono || '')) {
        onShowToast('error', 'El número de teléfono no cumple el formato obligatorio: 58 seguido de 10 dígitos.');
        return;
      }
      payloadToSave = simForm;
    } else if (activeForm === 'ROUTER') {
      if (!routerForm.serial.trim() || !routerForm.marca || !routerForm.modelo) {
        onShowToast('warning', 'Complete los campos obligatorios del Router.');
        return;
      }
      payloadToSave = routerForm;
    } else if (activeForm === 'SENSORIZEIT') {
      // Validación estricta de los 9 campos técnicos obligatorios (ninguno puede estar vacío, se permite N/A)
      const technicalFields: { key: keyof SensorizeitPayload; label: string }[] = [
        { key: 'serial', label: 'SERIAL' },
        { key: 'imei', label: 'IMEI' },
        { key: 'dev_eui', label: 'DEV EUI' },
        { key: 'app_eui', label: 'APP EUI' },
        { key: 'app_key', label: 'APP KEY' },
        { key: 'appskey', label: 'APPSKEY' },
        { key: 'netskey', label: 'NETSKEY' },
        { key: 'at_pin', label: 'AT PIN' },
        { key: 'ota_pin', label: 'OTA PIN' },
      ];

      for (const field of technicalFields) {
        const val = sensorForm[field.key];
        if (!val || String(val).trim() === '') {
          onShowToast('warning', `Complete el campo ${field.label} o marque N/A si no aplica.`);
          return;
        }
      }

      if (!sensorForm.tipo_sensor || !sensorForm.marca || !sensorForm.modelo) {
        onShowToast('warning', 'Complete los campos de Tipo, Marca y Modelo del Sensor.');
        return;
      }

      payloadToSave = sensorForm;
    } else if (activeForm === 'FLOTA') {
      if (!flotaForm.serial.trim() || !flotaForm.marca || !flotaForm.modelo) {
        onShowToast('warning', 'Complete los campos obligatorios de Flota GPS.');
        return;
      }
      payloadToSave = flotaForm;
    } else if (activeForm === 'CONSUMIBLES') {
      if (!consumiblesForm.nombre_producto || !consumiblesForm.marca || !consumiblesForm.modelo || !consumiblesForm.aplica_para) {
        onShowToast('warning', 'Complete los campos requeridos del Consumible.');
        return;
      }
      if (Number(consumiblesForm.cantidad) <= 0) {
        onShowToast('warning', 'La cantidad debe ser mayor a 0.');
        return;
      }
      payloadToSave = consumiblesForm;
    }

    if (!payloadToSave) return;

    setIsSubmitting(true);

    try {
      const response = await saveRecord(activeForm, payloadToSave);

      if (response && response.success) {
        onShowToast('success', response.message || `Registro de ${activeForm} guardado con éxito.`);

        // Actualizar el índice local de seriales para prevenir reingresos (excepto N/A)
        if (catalogs && 'serial' in payloadToSave && payloadToSave.serial) {
          const registeredSerial = payloadToSave.serial.trim().toUpperCase();
          if (registeredSerial !== 'N/A') {
            const updated = JSON.parse(JSON.stringify(catalogs)) as InitialDataSources;
            if (activeForm === 'SIM') updated.sim.serials.push(registeredSerial);
            if (activeForm === 'ROUTER') updated.router.serials.push(registeredSerial);
            if (activeForm === 'SENSORIZEIT') updated.sensorizeit.serials.push(registeredSerial);
            if (activeForm === 'FLOTA') updated.flota.serials.push(registeredSerial);
            onUpdateCatalogs(updated);
          }
        }

        // Resetear formulario manteniendo la fecha de hoy
        const today = getTodayDate();
        if (activeForm === 'SIM') {
          setSimForm({
            serial: '',
            telefono: '',
            ip: '',
            puk: '',
            operadora: '',
            propietario: '',
            procesador: '',
            fecha: today,
          });
        } else if (activeForm === 'ROUTER') {
          setRouterForm({ serial: '', imei: '', marca: '', modelo: '', fecha: today });
        } else if (activeForm === 'SENSORIZEIT') {
          setSensorForm({
            serial: '',
            imei: '',
            dev_eui: '',
            app_eui: '',
            app_key: '',
            appskey: '',
            netskey: '',
            at_pin: '',
            ota_pin: '',
            tipo_sensor: '',
            marca: '',
            modelo: '',
            fecha: today,
          });
        } else if (activeForm === 'FLOTA') {
          setFlotaForm({ serial: '', imei: '', marca: '', modelo: '', fecha: today });
        } else if (activeForm === 'CONSUMIBLES') {
          setConsumiblesForm({
            nombre_producto: '',
            marca: '',
            modelo: '',
            aplica_para: '',
            cantidad: 1,
            fecha: today,
          });
        }

        setSerialError(null);
        setIpError(null);
        setPhoneError(null);
      } else {
        onShowToast('error', response?.error || response?.message || 'Error al guardar el registro en Google Sheets.');
      }
    } catch (err) {
      onShowToast('error', `Fallo de conexión al guardar: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formTabs = [
    { id: 'SIM', label: 'Tarjeta SIM', icon: Smartphone },
    { id: 'ROUTER', label: 'Router', icon: RouterIcon },
    { id: 'SENSORIZEIT', label: 'Sensorizeit', icon: Cpu },
    { id: 'FLOTA', label: 'Flota GPS', icon: Truck },
    { id: 'CONSUMIBLES', label: 'Consumibles', icon: Package },
  ] as const;

  return (
    <div id="registro-container" className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Selector de Tipo de Formulario */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 overflow-x-auto">
        <div className="flex items-center space-x-1.5 min-w-max">
          {formTabs.map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeForm === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-form-${tab.id.toLowerCase()}`}
                onClick={() => {
                  setActiveForm(tab.id as InventoryModule);
                  setSerialError(null);
                  setIpError(null);
                  setPhoneError(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-150 ${
                  isCurrent
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isCurrent ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tarjeta Principal del Formulario */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-blue-600" />
              Nuevo Registro: {activeForm}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Inserción directa en Google Sheets. Las fórmulas automáticas existentes se preservan intactas.
            </p>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
            Formulario Activo
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ========================================================================= */}
          {/* FORMULARIO 1: TARJETAS SIM */}
          {/* ========================================================================= */}
          {activeForm === 'SIM' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Serial (limpio, sin placeholder) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Serial (ICCID) <span className="text-rose-600">*</span>
                </label>
                <input
                  id="sim-input-serial"
                  type="text"
                  required
                  value={simForm.serial}
                  onChange={(e) => {
                    const val = e.target.value.trim().toUpperCase();
                    setSimForm((prev) => ({ ...prev, serial: val }));
                    checkSerialUniqueness(val, 'SIM');
                  }}
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 ${
                    serialError
                      ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-500'
                      : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
                {serialError && (
                  <p className="text-xs text-rose-600 font-medium mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {serialError}
                  </p>
                )}
              </div>

              {/* Teléfono con botón N/A - ÚNICO campo con placeholder y texto explicativo obligatorio */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Número de Teléfono
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSimForm((p) => ({ ...p, telefono: 'N/A' }));
                      setPhoneError(null);
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
                  >
                    Marcar N/A
                  </button>
                </div>
                <input
                  id="sim-input-telefono"
                  type="text"
                  placeholder="58xxxxxxxxxx"
                  value={simForm.telefono || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSimForm((p) => ({ ...p, telefono: val }));
                    validatePhoneNumber(val);
                  }}
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 ${
                    phoneError
                      ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-500'
                      : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Formato obligatorio: 58 seguido de 10 dígitos.
                </p>
                {phoneError && (
                  <p className="text-xs text-rose-600 font-medium mt-0.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {phoneError}
                  </p>
                )}
              </div>

              {/* IP con validación y botón N/A (limpio, sin placeholder) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Dirección IP
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSimForm((p) => ({ ...p, ip: 'N/A' }));
                      setIpError(null);
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
                  >
                    Marcar N/A
                  </button>
                </div>
                <input
                  id="sim-input-ip"
                  type="text"
                  value={simForm.ip || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSimForm((p) => ({ ...p, ip: val }));
                    validateIpAddress(val);
                  }}
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 ${
                    ipError
                      ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-500'
                      : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
                {ipError && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{ipError}</p>
                )}
              </div>

              {/* PUK con botón N/A (limpio, sin placeholder) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Código PUK
                  </label>
                  <button
                    type="button"
                    onClick={() => setSimForm((p) => ({ ...p, puk: 'N/A' }))}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
                  >
                    Marcar N/A
                  </button>
                </div>
                <input
                  id="sim-input-puk"
                  type="text"
                  value={simForm.puk || ''}
                  onChange={(e) => setSimForm((p) => ({ ...p, puk: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Operadora con [+ Agregar Nueva...] */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Operadora <span className="text-rose-600">*</span>
                </label>
                <select
                  id="sim-select-operadora"
                  required
                  value={simForm.operadora}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      promptAddNewOption('operadora', 'Nueva Operadora');
                    } else {
                      setSimForm((p) => ({ ...p, operadora: e.target.value }));
                    }
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Seleccione Operadora...</option>
                  {catalogs?.sim.operadoras.map((op) => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                  <option value="__NEW__" className="font-bold text-blue-600">
                    [+ Agregar Nueva Operadora...]
                  </option>
                </select>
              </div>

              {/* Propietario (Cascada Nivel 1) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Propietario <span className="text-rose-600">*</span>
                </label>
                <select
                  id="sim-select-propietario"
                  required
                  value={simForm.propietario}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      promptAddNewOption('propietario', 'Nuevo Propietario');
                    } else {
                      setSimForm((p) => ({
                        ...p,
                        propietario: e.target.value,
                        procesador: '',
                      }));
                    }
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Seleccione Propietario...</option>
                  {catalogs &&
                    Object.keys(catalogs.sim.relaciones).map((prop) => (
                      <option key={prop} value={prop}>
                        {prop}
                      </option>
                    ))}
                  <option value="__NEW__" className="font-bold text-blue-600">
                    [+ Agregar Nuevo Propietario...]
                  </option>
                </select>
              </div>

              {/* Procesador (Cascada Nivel 2 dependiente de Propietario) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Procesador / Plan <span className="text-rose-600">*</span>
                </label>
                <select
                  id="sim-select-procesador"
                  required
                  disabled={!simForm.propietario}
                  value={simForm.procesador}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      promptAddNewOption('procesador', 'Nuevo Procesador', simForm.propietario);
                    } else {
                      setSimForm((p) => ({ ...p, procesador: e.target.value }));
                    }
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {simForm.propietario
                      ? 'Seleccione Procesador...'
                      : 'Primero elija Propietario'}
                  </option>
                  {simForm.propietario &&
                    catalogs?.sim.relaciones[simForm.propietario]?.map((proc) => (
                      <option key={proc} value={proc}>
                        {proc}
                      </option>
                    ))}
                  {simForm.propietario && (
                    <option value="__NEW__" className="font-bold text-blue-600">
                      [+ Agregar Nuevo Procesador...]
                    </option>
                  )}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Fecha de Ingreso <span className="text-rose-600">*</span>
                </label>
                <input
                  id="sim-input-fecha"
                  type="date"
                  required
                  value={simForm.fecha}
                  onChange={(e) => setSimForm((p) => ({ ...p, fecha: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FORMULARIO 2: ROUTERS */}
          {/* ========================================================================= */}
          {activeForm === 'ROUTER' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Serial (limpio, sin placeholder) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Serial del Router <span className="text-rose-600">*</span>
                </label>
                <input
                  id="router-input-serial"
                  type="text"
                  required
                  value={routerForm.serial}
                  onChange={(e) => {
                    const val = e.target.value.trim().toUpperCase();
                    setRouterForm((p) => ({ ...p, serial: val }));
                    checkSerialUniqueness(val, 'ROUTER');
                  }}
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 ${
                    serialError
                      ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-500'
                      : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
                {serialError && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{serialError}</p>
                )}
              </div>

              {/* IMEI con botón N/A (limpio, sin placeholder) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    IMEI
                  </label>
                  <button
                    type="button"
                    onClick={() => setRouterForm((p) => ({ ...p, imei: 'N/A' }))}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
                  >
                    Marcar N/A
                  </button>
                </div>
                <input
                  id="router-input-imei"
                  type="text"
                  value={routerForm.imei || ''}
                  onChange={(e) => setRouterForm((p) => ({ ...p, imei: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Marca en cascada */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Marca <span className="text-rose-600">*</span>
                </label>
                <select
                  id="router-select-marca"
                  required
                  value={routerForm.marca}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      promptAddNewOption('marca', 'Nueva Marca de Router');
                    } else {
                      setRouterForm((p) => ({ ...p, marca: e.target.value, modelo: '' }));
                    }
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Seleccione Marca...</option>
                  {catalogs &&
                    Object.keys(catalogs.router.relaciones).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  <option value="__NEW__" className="font-bold text-blue-600">
                    [+ Agregar Nueva Marca...]
                  </option>
                </select>
              </div>

              {/* Modelo dependiente de Marca */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Modelo <span className="text-rose-600">*</span>
                </label>
                <select
                  id="router-select-modelo"
                  required
                  disabled={!routerForm.marca}
                  value={routerForm.modelo}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      promptAddNewOption('modelo', 'Nuevo Modelo de Router', routerForm.marca);
                    } else {
                      setRouterForm((p) => ({ ...p, modelo: e.target.value }));
                    }
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {routerForm.marca ? 'Seleccione Modelo...' : 'Primero elija Marca'}
                  </option>
                  {routerForm.marca &&
                    catalogs?.router.relaciones[routerForm.marca]?.map((mod) => (
                      <option key={mod} value={mod}>
                        {mod}
                      </option>
                    ))}
                  {routerForm.marca && (
                    <option value="__NEW__" className="font-bold text-blue-600">
                      [+ Agregar Nuevo Modelo...]
                    </option>
                  )}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Fecha de Ingreso <span className="text-rose-600">*</span>
                </label>
                <input
                  id="router-input-fecha"
                  type="date"
                  required
                  value={routerForm.fecha}
                  onChange={(e) => setRouterForm((p) => ({ ...p, fecha: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FORMULARIO 3: SENSORIZEIT (9 Campos Técnicos con botón N/A y Cascada)     */}
          {/* ========================================================================= */}
          {activeForm === 'SENSORIZEIT' && (
            <div className="space-y-6">
              {/* Sección 1: Catálogos en cascada y Fecha */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Tipo de Sensor (Cascada Nivel 1) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Tipo de Sensor <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="sensor-select-tipo"
                    required
                    value={sensorForm.tipo_sensor}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        promptAddNewOption('tipo_sensor', 'Nuevo Tipo de Sensor');
                      } else {
                        setSensorForm((p) => ({
                          ...p,
                          tipo_sensor: e.target.value,
                          marca: '',
                          modelo: '',
                        }));
                      }
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Seleccione Tipo...</option>
                    {catalogs &&
                      Object.keys(catalogs.sensorizeit.relaciones).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    <option value="__NEW__" className="font-bold text-blue-600">
                      [+ Agregar Nuevo Tipo...]
                    </option>
                  </select>
                </div>

                {/* Marca (Cascada Nivel 2 dependiente de Tipo) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Marca <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="sensor-select-marca"
                    required
                    disabled={!sensorForm.tipo_sensor}
                    value={sensorForm.marca}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        promptAddNewOption('marca', 'Nueva Marca', sensorForm.tipo_sensor);
                      } else {
                        setSensorForm((p) => ({ ...p, marca: e.target.value, modelo: '' }));
                      }
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">
                      {sensorForm.tipo_sensor ? 'Seleccione Marca...' : 'Primero elija Tipo'}
                    </option>
                    {sensorForm.tipo_sensor &&
                      catalogs?.sensorizeit.relaciones[sensorForm.tipo_sensor] &&
                      Object.keys(catalogs.sensorizeit.relaciones[sensorForm.tipo_sensor]).map(
                        (m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        )
                      )}
                    {sensorForm.tipo_sensor && (
                      <option value="__NEW__" className="font-bold text-blue-600">
                        [+ Agregar Nueva Marca...]
                      </option>
                    )}
                  </select>
                </div>

                {/* Modelo (Cascada Nivel 3 dependiente de Tipo y Marca) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Modelo <span className="text-rose-600">*</span>
                  </label>
                  <select
                    id="sensor-select-modelo"
                    required
                    disabled={!sensorForm.marca}
                    value={sensorForm.modelo}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        promptAddNewOption(
                          'modelo',
                          'Nuevo Modelo',
                          sensorForm.marca,
                          sensorForm.tipo_sensor
                        );
                      } else {
                        setSensorForm((p) => ({ ...p, modelo: e.target.value }));
                      }
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">
                      {sensorForm.marca ? 'Seleccione Modelo...' : 'Primero elija Marca'}
                    </option>
                    {sensorForm.tipo_sensor &&
                      sensorForm.marca &&
                      catalogs?.sensorizeit.relaciones[sensorForm.tipo_sensor]?.[
                        sensorForm.marca
                      ]?.map((mod) => (
                        <option key={mod} value={mod}>
                          {mod}
                        </option>
                      ))}
                    {sensorForm.marca && (
                      <option value="__NEW__" className="font-bold text-blue-600">
                        [+ Agregar Nuevo Modelo...]
                      </option>
                    )}
                  </select>
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Fecha de Ingreso <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="sensor-input-fecha"
                    type="date"
                    required
                    value={sensorForm.fecha}
                    onChange={(e) => setSensorForm((p) => ({ ...p, fecha: e.target.value }))}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Sección 2: Los 9 Campos Técnicos (Cada uno con botón N/A y sin placeholders) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-blue-600" />
                      Parámetros Técnicos Obligatorios (9 Campos)
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Todos los campos son obligatorios. Marque &quot;N/A&quot; en aquellos que no apliquen a este modelo.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* 1. SERIAL */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        Serial <span className="text-rose-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setSensorForm((p) => ({ ...p, serial: 'N/A' }));
                          setSerialError(null);
                        }}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-100/60 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors"
                      >
                        Marcar N/A
                      </button>
                    </div>
                    <input
                      id="sensor-input-serial"
                      type="text"
                      required
                      value={sensorForm.serial}
                      onChange={(e) => {
                        const val = e.target.value.trim().toUpperCase();
                        setSensorForm((p) => ({ ...p, serial: val }));
                        if (val === 'N/A') {
                          setSerialError(null);
                        } else {
                          checkSerialUniqueness(val, 'SENSORIZEIT');
                        }
                      }}
                      className={`w-full px-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-2 ${
                        serialError
                          ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-500'
                          : 'border-slate-300 focus:ring-blue-500'
                      }`}
                    />
                    {serialError && (
                      <p className="text-[10px] text-rose-600 font-medium mt-1">{serialError}</p>
                    )}
                  </div>

                  {/* 2. IMEI */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        IMEI <span className="text-rose-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setSensorForm((p) => ({ ...p, imei: 'N/A' }))}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-100/60 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors"
                      >
                        Marcar N/A
                      </button>
                    </div>
                    <input
                      id="sensor-input-imei"
                      type="text"
                      required
                      value={sensorForm.imei || ''}
                      onChange={(e) => setSensorForm((p) => ({ ...p, imei: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 3. DEV EUI */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        DEV EUI <span className="text-rose-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setSensorForm((p) => ({ ...p, dev_eui: 'N/A' }))}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-100/60 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors"
                      >
                        Marcar N/A
                      </button>
                    </div>
                    <input
                      id="sensor-input-dev_eui"
                      type="text"
                      required
                      value={sensorForm.dev_eui || ''}
                      onChange={(e) => setSensorForm((p) => ({ ...p, dev_eui: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 4. APP EUI */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        APP EUI <span className="text-rose-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setSensorForm((p) => ({ ...p, app_eui: 'N/A' }))}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-100/60 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors"
                      >
                        Marcar N/A
                      </button>
                    </div>
                    <input
                      id="sensor-input-app_eui"
                      type="text"
                      required
                      value={sensorForm.app_eui || ''}
                      onChange={(e) => setSensorForm((p) => ({ ...p, app_eui: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 5. APP KEY */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        APP KEY <span className="text-rose-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setSensorForm((p) => ({ ...p, app_key: 'N/A' }))}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-100/60 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors"
                      >
                        Marcar N/A
                      </button>
                    </div>
                    <input
                      id="sensor-input-app_key"
                      type="text"
                      required
                      value={sensorForm.app_key || ''}
                      onChange={(e) => setSensorForm((p) => ({ ...p, app_key: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 6. APPSKEY */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        APPSKEY <span className="text-rose-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setSensorForm((p) => ({ ...p, appskey: 'N/A' }))}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-100/60 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors"
                      >
                        Marcar N/A
                      </button>
                    </div>
                    <input
                      id="sensor-input-appskey"
                      type="text"
                      required
                      value={sensorForm.appskey || ''}
                      onChange={(e) => setSensorForm((p) => ({ ...p, appskey: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 7. NETSKEY */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        NETSKEY <span className="text-rose-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setSensorForm((p) => ({ ...p, netskey: 'N/A' }))}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-100/60 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors"
                      >
                        Marcar N/A
                      </button>
                    </div>
                    <input
                      id="sensor-input-netskey"
                      type="text"
                      required
                      value={sensorForm.netskey || ''}
                      onChange={(e) => setSensorForm((p) => ({ ...p, netskey: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 8. AT PIN */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        AT PIN <span className="text-rose-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setSensorForm((p) => ({ ...p, at_pin: 'N/A' }))}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-100/60 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors"
                      >
                        Marcar N/A
                      </button>
                    </div>
                    <input
                      id="sensor-input-at_pin"
                      type="text"
                      required
                      value={sensorForm.at_pin || ''}
                      onChange={(e) => setSensorForm((p) => ({ ...p, at_pin: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 9. OTA PIN */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                        OTA PIN <span className="text-rose-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setSensorForm((p) => ({ ...p, ota_pin: 'N/A' }))}
                        className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-100/60 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors"
                      >
                        Marcar N/A
                      </button>
                    </div>
                    <input
                      id="sensor-input-ota_pin"
                      type="text"
                      required
                      value={sensorForm.ota_pin || ''}
                      onChange={(e) => setSensorForm((p) => ({ ...p, ota_pin: e.target.value }))}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FORMULARIO 4: FLOTA GPS */}
          {/* ========================================================================= */}
          {activeForm === 'FLOTA' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Serial (limpio, sin placeholder) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Serial del Dispositivo GPS <span className="text-rose-600">*</span>
                </label>
                <input
                  id="flota-input-serial"
                  type="text"
                  required
                  value={flotaForm.serial}
                  onChange={(e) => {
                    const val = e.target.value.trim().toUpperCase();
                    setFlotaForm((p) => ({ ...p, serial: val }));
                    checkSerialUniqueness(val, 'FLOTA');
                  }}
                  className={`w-full px-3.5 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 ${
                    serialError
                      ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-500'
                      : 'border-slate-300 focus:ring-blue-500'
                  }`}
                />
                {serialError && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{serialError}</p>
                )}
              </div>

              {/* IMEI con botón N/A (limpio, sin placeholder) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    IMEI
                  </label>
                  <button
                    type="button"
                    onClick={() => setFlotaForm((p) => ({ ...p, imei: 'N/A' }))}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition-colors"
                  >
                    Marcar N/A
                  </button>
                </div>
                <input
                  id="flota-input-imei"
                  type="text"
                  value={flotaForm.imei || ''}
                  onChange={(e) => setFlotaForm((p) => ({ ...p, imei: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Marca en cascada */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Marca <span className="text-rose-600">*</span>
                </label>
                <select
                  id="flota-select-marca"
                  required
                  value={flotaForm.marca}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      promptAddNewOption('marca', 'Nueva Marca');
                    } else {
                      setFlotaForm((p) => ({ ...p, marca: e.target.value, modelo: '' }));
                    }
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Seleccione Marca...</option>
                  {catalogs &&
                    Object.keys(catalogs.flota.relaciones).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  <option value="__NEW__" className="font-bold text-blue-600">
                    [+ Agregar Nueva Marca...]
                  </option>
                </select>
              </div>

              {/* Modelo dependiente de Marca */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Modelo <span className="text-rose-600">*</span>
                </label>
                <select
                  id="flota-select-modelo"
                  required
                  disabled={!flotaForm.marca}
                  value={flotaForm.modelo}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      promptAddNewOption('modelo', 'Nuevo Modelo', flotaForm.marca);
                    } else {
                      setFlotaForm((p) => ({ ...p, modelo: e.target.value }));
                    }
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {flotaForm.marca ? 'Seleccione Modelo...' : 'Primero elija Marca'}
                  </option>
                  {flotaForm.marca &&
                    catalogs?.flota.relaciones[flotaForm.marca]?.map((mod) => (
                      <option key={mod} value={mod}>
                        {mod}
                      </option>
                    ))}
                  {flotaForm.marca && (
                    <option value="__NEW__" className="font-bold text-blue-600">
                      [+ Agregar Nuevo Modelo...]
                    </option>
                  )}
                </select>
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Fecha de Ingreso <span className="text-rose-600">*</span>
                </label>
                <input
                  id="flota-input-fecha"
                  type="date"
                  required
                  value={flotaForm.fecha}
                  onChange={(e) => setFlotaForm((p) => ({ ...p, fecha: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* FORMULARIO 5: CONSUMIBLES */}
          {/* ========================================================================= */}
          {activeForm === 'CONSUMIBLES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nombre de Producto (Cascada Nivel 1) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Nombre de Producto <span className="text-rose-600">*</span>
                </label>
                <select
                  id="consumible-select-producto"
                  required
                  value={consumiblesForm.nombre_producto}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      promptAddNewOption('nombre_producto', 'Nuevo Producto');
                    } else {
                      setConsumiblesForm((p) => ({
                        ...p,
                        nombre_producto: e.target.value,
                        marca: '',
                        modelo: '',
                      }));
                    }
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Seleccione Producto...</option>
                  {catalogs &&
                    Object.keys(catalogs.consumibles.relaciones).map((prod) => (
                      <option key={prod} value={prod}>
                        {prod}
                      </option>
                    ))}
                  <option value="__NEW__" className="font-bold text-blue-600">
                    [+ Agregar Nuevo Producto...]
                  </option>
                </select>
              </div>

              {/* Marca (Cascada Nivel 2 dependiente de Producto) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Marca <span className="text-rose-600">*</span>
                </label>
                <select
                  id="consumible-select-marca"
                  required
                  disabled={!consumiblesForm.nombre_producto}
                  value={consumiblesForm.marca}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      promptAddNewOption('marca', 'Nueva Marca', consumiblesForm.nombre_producto);
                    } else {
                      setConsumiblesForm((p) => ({ ...p, marca: e.target.value, modelo: '' }));
                    }
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {consumiblesForm.nombre_producto
                      ? 'Seleccione Marca...'
                      : 'Primero elija Producto'}
                  </option>
                  {consumiblesForm.nombre_producto &&
                    catalogs?.consumibles.relaciones[consumiblesForm.nombre_producto] &&
                    Object.keys(
                      catalogs.consumibles.relaciones[consumiblesForm.nombre_producto]
                    ).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  {consumiblesForm.nombre_producto && (
                    <option value="__NEW__" className="font-bold text-blue-600">
                      [+ Agregar Nueva Marca...]
                    </option>
                  )}
                </select>
              </div>

              {/* Modelo (Cascada Nivel 3 dependiente de Producto y Marca) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Modelo <span className="text-rose-600">*</span>
                </label>
                <select
                  id="consumible-select-modelo"
                  required
                  disabled={!consumiblesForm.marca}
                  value={consumiblesForm.modelo}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      promptAddNewOption(
                        'modelo',
                        'Nuevo Modelo',
                        consumiblesForm.marca,
                        consumiblesForm.nombre_producto
                      );
                    } else {
                      setConsumiblesForm((p) => ({ ...p, modelo: e.target.value }));
                    }
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">
                    {consumiblesForm.marca ? 'Seleccione Modelo...' : 'Primero elija Marca'}
                  </option>
                  {consumiblesForm.nombre_producto &&
                    consumiblesForm.marca &&
                    catalogs?.consumibles.relaciones[consumiblesForm.nombre_producto]?.[
                      consumiblesForm.marca
                    ]?.map((mod) => (
                      <option key={mod} value={mod}>
                        {mod}
                      </option>
                    ))}
                  {consumiblesForm.marca && (
                    <option value="__NEW__" className="font-bold text-blue-600">
                      [+ Agregar Nuevo Modelo...]
                    </option>
                  )}
                </select>
              </div>

              {/* Aplica Para */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Aplica Para <span className="text-rose-600">*</span>
                </label>
                <select
                  id="consumible-select-aplica"
                  required
                  value={consumiblesForm.aplica_para}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      promptAddNewOption('aplica_para', 'Nueva Categoría de Aplicación');
                    } else {
                      setConsumiblesForm((p) => ({ ...p, aplica_para: e.target.value }));
                    }
                  }}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Seleccione Aplicación...</option>
                  {catalogs?.consumibles.aplicaPara.map((ap) => (
                    <option key={ap} value={ap}>
                      {ap}
                    </option>
                  ))}
                  <option value="__NEW__" className="font-bold text-blue-600">
                    [+ Agregar Nueva Aplicación...]
                  </option>
                </select>
              </div>

              {/* Cantidad (limpio, sin placeholder) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Cantidad a Ingresar <span className="text-rose-600">*</span>
                </label>
                <input
                  id="consumible-input-cantidad"
                  type="number"
                  min="1"
                  required
                  value={consumiblesForm.cantidad}
                  onChange={(e) =>
                    setConsumiblesForm((p) => ({ ...p, cantidad: Number(e.target.value) }))
                  }
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Fecha de Ingreso <span className="text-rose-600">*</span>
                </label>
                <input
                  id="consumible-input-fecha"
                  type="date"
                  required
                  value={consumiblesForm.fecha}
                  onChange={(e) => setConsumiblesForm((p) => ({ ...p, fecha: e.target.value }))}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>
          )}

          {/* Botón de Envío */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              id="btn-submit-registro"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando en Google Sheets...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Guardar Registro</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal para [+ Agregar Nuevo...] (sin placeholder) */}
      {modalOpen && modalConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                {modalConfig.label}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              El valor ingresado se guardará en <strong>MAYÚSCULAS</strong> y estará disponible de inmediato en la lista desplegable.
            </p>

            <input
              id="modal-input-new-option"
              type="text"
              autoFocus
              value={modalInputValue}
              onChange={(e) => setModalInputValue(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirmAddOption();
                }
              }}
              className="w-full px-3.5 py-2 text-sm font-medium uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAddOption}
                disabled={!modalInputValue.trim()}
                className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                Agregar Opción
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Registro;
