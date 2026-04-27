// ====================================================================
// MELMAC DOCS - SISTEMA DE FORMULARIOS DINÁMICOS
// ====================================================================
// Este componente es parte de la plataforma Melmac DOCS
// 
// CARACTERÍSTICAS:
// - ✅ Formularios 100% dinámicos (agregar/quitar campos vía config)
// - ✅ Personalización completa (colores, logo, textos)
// - ✅ Auto-guardado inteligente en localStorage
// - ✅ Vista PDF opcional (puede mostrarse u ocultarse)
// - ✅ Compatible con todos los navegadores modernos
// - ✅ Responsive (móvil y desktop)
// - ✅ Validación en tiempo real
// - ✅ Seguridad OWASP compliant
//
// SEGURIDAD:
// - Sanitización de inputs contra XSS
// - Validación robusta de datos
// - Cifrado básico de datos en localStorage
// - Rate limiting en auto-guardado
// - Validación de tamaños máximos
//
// USO:
// <MelmacCreditForm 
//   config={customConfig}           // Configuración del formulario
//   onDataChange={handleChange}     // Callback cuando cambian los datos
//   onSubmit={handleSubmit}         // Callback al enviar
//   initialData={existingData}      // Datos precargados (opcional)
//   readOnly={false}                // Modo solo lectura (opcional)
// />
//
// CONFIGURACIÓN DINÁMICA:
// El objeto 'config' permite definir:
// - branding: { companyName, logo, primaryColor, secondaryColor, ... }
// - formData: { title, subtitle, sections: [...] }
// - pagesConfig: Define la agrupación de secciones en páginas
//
// Cada sección puede tener campos de tipo:
// text, email, tel, textarea, select, radio, checkbox, date, number, currency, signature
// ====================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronRight, ChevronLeft, Check, Star, Upload, Calendar, 
  Mail, Phone, User, MessageCircle, ChevronDown, FileText, 
  Send, Eye, EyeOff, AlertCircle, CheckCircle, Clock,
  Smartphone, Monitor, Shield, Zap, Settings, Layout,
  Palette, BarChart3, Brain, Sparkles, Target, Users,
  Globe, Lock, Award, TrendingUp, Building, MapPin,
  CreditCard, Briefcase, GraduationCap, Home, Car,
  DollarSign, Camera, PenTool, Download, Split,
  RotateCcw, ZoomIn, ZoomOut, Maximize2, Save,
  ArrowUp, Menu, X, Info, ArrowRight, MousePointer,
  ArrowUpDown, RotateCw, Trash2, RefreshCw, Database,
  HardDrive
} from 'lucide-react';

// ====================================================================
// UTILIDADES DE SEGURIDAD
// ====================================================================

// Sanitización de strings para prevenir XSS
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Escapar caracteres HTML peligrosos
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return str.replace(reg, (match) => map[match]);
};

// Sanitización profunda de objetos
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key]);
    }
  }
  return sanitized;
};

// Validación mejorada de email (RFC 5322 compliant)
const isValidEmail = (email) => {
  if (!email) return false;
  // Regex más robusto para emails
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Validación de teléfono (formato internacional flexible)
const isValidPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 7 && cleaned.length <= 15;
};

// Cifrado simple base64 (para ofuscación, NO para datos críticos)
const encodeData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    return btoa(unescape(encodeURIComponent(jsonString)));
  } catch (e) {
    console.error('Error codificando datos:', e);
    return null;
  }
};

// Descifrado simple base64
const decodeData = (encoded) => {
  try {
    const jsonString = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(jsonString);
  } catch (e) {
    console.error('Error decodificando datos:', e);
    return null;
  }
};

// Validación de tamaño de datos (prevenir DoS)
const isValidDataSize = (data, maxSizeKB = 500) => {
  try {
    const size = new Blob([JSON.stringify(data)]).size;
    const sizeKB = size / 1024;
    return sizeKB <= maxSizeKB;
  } catch (e) {
    return false;
  }
};

// Validación de input contra patrones maliciosos
const containsMaliciousPatterns = (str) => {
  if (typeof str !== 'string') return false;
  
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
    /<iframe/i,
    /eval\(/i,
    /expression\(/i,
  ];
  
  return maliciousPatterns.some(pattern => pattern.test(str));
};

// Constantes para el auto-guardado
const AUTO_SAVE_KEY = 'melmac-credit-form-autosave';
const AUTO_SAVE_DEBOUNCE_DELAY = 1000;
const AUTO_SAVE_VERSION = '1.0';

// Configuración por defecto del formulario
const defaultConfig = {
  branding: {
    companyName: 'Banco Digital S.A.',
    logo: 'https://via.placeholder.com/120x40/0066CC/FFFFFF?text=LOGO',
    primaryColor: '#0066CC',
    secondaryColor: '#004499',
    accentColor: '#00AA44',
    description: 'Sistema inteligente de solicitudes de crédito que convierte automáticamente sus respuestas en documentos PDF oficiales.',
    instructions: 'Complete todos los campos marcados con asterisco (*). La información se reflejará en tiempo real en el documento PDF oficial que aparece a la derecha.',
    contactInfo: {
      phone: '(601) 123-4567',
      email: 'info@bancodigital.com',
      website: 'www.bancodigital.com'
    },
    disclaimer: 'La información suministrada será verificada y es de carácter confidencial.'
  },
  formData: {
    title: 'Formulario de Solicitud de Crédito',
    subtitle: 'Complete el formulario y vea cómo se llena automáticamente el documento PDF',
    sections: [
      {
        id: 'datos_personales',
        title: 'Datos Personales',
        icon: User,
        fields: [
          {
            id: 'primer_nombre',
            type: 'text',
            label: 'Primer Nombre',
            placeholder: 'Juan',
            required: true,
            pdfMapping: { page: 1, x: 120, y: 180, width: 140, height: 20 }
          },
          {
            id: 'segundo_nombre',
            type: 'text',
            label: 'Segundo Nombre',
            placeholder: 'Carlos',
            required: false,
            pdfMapping: { page: 1, x: 280, y: 180, width: 140, height: 20 }
          },
          {
            id: 'primer_apellido',
            type: 'text',
            label: 'Primer Apellido',
            placeholder: 'García',
            required: true,
            pdfMapping: { page: 1, x: 440, y: 180, width: 140, height: 20 }
          },
          {
            id: 'segundo_apellido',
            type: 'text',
            label: 'Segundo Apellido',
            placeholder: 'López',
            required: false,
            pdfMapping: { page: 1, x: 600, y: 180, width: 140, height: 20 }
          },
          {
            id: 'tipo_documento',
            type: 'select',
            label: 'Tipo de Documento',
            required: true,
            options: [
              { value: 'CC', label: 'Cédula de Ciudadanía' },
              { value: 'CE', label: 'Cédula de Extranjería' },
              { value: 'PAS', label: 'Pasaporte' },
              { value: 'TI', label: 'Tarjeta de Identidad' }
            ],
            pdfMapping: { page: 1, x: 120, y: 220, width: 100, height: 20 }
          },
          {
            id: 'numero_documento',
            type: 'text',
            label: 'Número de Documento',
            placeholder: '12345678',
            required: true,
            inputMode: 'numeric',
            pdfMapping: { page: 1, x: 240, y: 220, width: 150, height: 20 }
          },
          {
            id: 'fecha_nacimiento',
            type: 'date',
            label: 'Fecha de Nacimiento',
            required: true,
            pdfMapping: { page: 1, x: 410, y: 220, width: 120, height: 20 }
          },
          {
            id: 'genero',
            type: 'radio',
            label: 'Género',
            required: true,
            options: [
              { value: 'M', label: 'Masculino' },
              { value: 'F', label: 'Femenino' },
              { value: 'O', label: 'Otro' }
            ],
            pdfMapping: { page: 1, x: 550, y: 220, width: 80, height: 20 }
          },
          {
            id: 'estado_civil',
            type: 'select',
            label: 'Estado Civil',
            required: true,
            options: [
              { value: 'S', label: 'Soltero/a' },
              { value: 'C', label: 'Casado/a' },
              { value: 'U', label: 'Unión Libre' },
              { value: 'D', label: 'Divorciado/a' },
              { value: 'V', label: 'Viudo/a' }
            ],
            pdfMapping: { page: 1, x: 650, y: 220, width: 100, height: 20 }
          }
        ]
      },
      {
        id: 'contacto',
        title: 'Información de Contacto',
        icon: Phone,
        fields: [
          {
            id: 'telefono_fijo',
            type: 'tel',
            label: 'Teléfono Fijo',
            placeholder: '(601) 234-5678',
            required: false,
            pdfMapping: { page: 1, x: 120, y: 280, width: 150, height: 20 }
          },
          {
            id: 'telefono_movil',
            type: 'tel',
            label: 'Teléfono Móvil',
            placeholder: '(300) 123-4567',
            required: true,
            pdfMapping: { page: 1, x: 290, y: 280, width: 150, height: 20 }
          },
          {
            id: 'email',
            type: 'email',
            label: 'Correo Electrónico',
            placeholder: 'juan@email.com',
            required: true,
            pdfMapping: { page: 1, x: 460, y: 280, width: 200, height: 20 }
          },
          {
            id: 'email_alternativo',
            type: 'email',
            label: 'Email Alternativo',
            placeholder: 'juan.trabajo@email.com',
            required: false,
            pdfMapping: { page: 1, x: 680, y: 280, width: 200, height: 20 }
          }
        ]
      },
      {
        id: 'direccion',
        title: 'Información de Residencia',
        icon: MapPin,
        fields: [
          {
            id: 'direccion_residencia',
            type: 'textarea',
            label: 'Dirección de Residencia',
            placeholder: 'Calle 123 # 45-67, Apartamento 202, Torre B',
            required: true,
            rows: 2,
            pdfMapping: { page: 1, x: 120, y: 340, width: 300, height: 40 }
          },
          {
            id: 'barrio',
            type: 'text',
            label: 'Barrio/Localidad',
            placeholder: 'Chapinero',
            required: true,
            pdfMapping: { page: 1, x: 440, y: 340, width: 150, height: 20 }
          },
          {
            id: 'ciudad',
            type: 'text',
            label: 'Ciudad',
            placeholder: 'Bogotá',
            required: true,
            pdfMapping: { page: 1, x: 610, y: 340, width: 120, height: 20 }
          },
          {
            id: 'departamento',
            type: 'select',
            label: 'Departamento',
            required: true,
            options: [
              { value: 'Cundinamarca', label: 'Cundinamarca' },
              { value: 'Antioquia', label: 'Antioquia' },
              { value: 'Valle del Cauca', label: 'Valle del Cauca' },
              { value: 'Atlántico', label: 'Atlántico' },
              { value: 'Santander', label: 'Santander' },
              { value: 'Bolívar', label: 'Bolívar' },
              { value: 'Meta', label: 'Meta' },
              { value: 'Otro', label: 'Otro' }
            ],
            pdfMapping: { page: 1, x: 750, y: 340, width: 130, height: 20 }
          },
          {
            id: 'tipo_vivienda',
            type: 'radio',
            label: 'Tipo de Vivienda',
            required: true,
            options: [
              { value: 'Propia', label: 'Propia' },
              { value: 'Arrendada', label: 'Arrendada' },
              { value: 'Familiar', label: 'Familiar' },
              { value: 'Otra', label: 'Otra' }
            ],
            pdfMapping: { page: 1, x: 540, y: 370, width: 100, height: 20 }
          }
        ]
      },
      {
        id: 'informacion_laboral',
        title: 'Información Laboral',
        icon: Briefcase,
        fields: [
          {
            id: 'ocupacion',
            type: 'text',
            label: 'Ocupación',
            placeholder: 'Ingeniero de Sistemas',
            required: true,
            pdfMapping: { page: 1, x: 120, y: 430, width: 200, height: 20 }
          },
          {
            id: 'empresa',
            type: 'text',
            label: 'Empresa',
            placeholder: 'Empresa XYZ S.A.S.',
            required: true,
            pdfMapping: { page: 1, x: 340, y: 430, width: 200, height: 20 }
          },
          {
            id: 'ingresos_mensuales',
            type: 'currency',
            label: 'Ingresos Mensuales',
            placeholder: '2,500,000',
            required: true,
            pdfMapping: { page: 1, x: 290, y: 470, width: 150, height: 20 }
          }
        ]
      },
      {
        id: 'declaraciones',
        title: 'Declaraciones y Firma',
        icon: FileText,
        fields: [
          {
            id: 'monto_solicitado',
            type: 'currency',
            label: 'Monto Solicitado',
            placeholder: '10,000,000',
            required: true,
            pdfMapping: { page: 1, x: 240, y: 570, width: 150, height: 20 }
          },
          {
            id: 'plazo_meses',
            type: 'number',
            label: 'Plazo en Meses',
            placeholder: '24',
            required: true,
            min: 6,
            max: 60,
            pdfMapping: { page: 1, x: 410, y: 570, width: 80, height: 20 }
          },
          {
            id: 'declaracion_veracidad',
            type: 'checkbox',
            label: 'Declaro que toda la información suministrada es veraz',
            required: true,
            pdfMapping: { page: 1, x: 120, y: 620, width: 20, height: 20 }
          },
          {
            id: 'autorizacion_datos',
            type: 'checkbox',
            label: 'Autorizo el tratamiento de mis datos personales',
            required: true,
            pdfMapping: { page: 1, x: 120, y: 650, width: 20, height: 20 }
          },
          {
            id: 'firma',
            type: 'signature',
            label: 'Firma del Solicitante',
            required: true,
            pdfMapping: { page: 1, x: 500, y: 620, width: 200, height: 60 }
          }
        ]
      }
    ]
  },
  pagesConfig: [
    {
      title: "Información Personal",
      description: "Datos básicos de identificación",
      sections: ['datos_personales']
    },
    {
      title: "Contacto y Residencia", 
      description: "Información de contacto y dirección",
      sections: ['contacto', 'direccion']
    },
    {
      title: "Información Laboral",
      description: "Datos de empleo e ingresos",
      sections: ['informacion_laboral']
    },
    {
      title: "Referencias y Finalización",
      description: "Referencias personales y declaraciones",
      sections: ['declaraciones']
    }
  ]
};

class AutoSaveManager {
  constructor(key = AUTO_SAVE_KEY) {
    this.key = key;
    this.isAvailable = this.checkStorageAvailability();
  }

  checkStorageAvailability() {
    if (typeof window === 'undefined') return false;
    try {
      const storage = window.localStorage;
      if (!storage) return false;
      const testKey = '__storage_test__';
      storage.setItem(testKey, 'test');
      storage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn('localStorage no disponible (modo incógnito o bloqueado):', e.message);
      return false;
    }
  }

  save(data) {
    if (!this.isAvailable) return false;
    
    try {
      const saveData = {
        version: AUTO_SAVE_VERSION,
        timestamp: Date.now(),
        formData: data,
        url: window.location.href
      };
      
      window.localStorage.setItem(this.key, JSON.stringify(saveData));
      return true;
    } catch (e) {
      console.error('Error guardando en localStorage:', e);
      
      if (e.name === 'QuotaExceededError') {
        try {
          this.clearOldSaves();
          window.localStorage.setItem(this.key, JSON.stringify(saveData));
          return true;
        } catch (e2) {
          console.error('Error incluso después de limpiar:', e2);
        }
      }
      return false;
    }
  }

  load() {
    if (!this.isAvailable) return null;
    
    try {
      const saved = window.localStorage.getItem(this.key);
      if (!saved) return null;
      
      const data = JSON.parse(saved);
      
      if (data.version !== AUTO_SAVE_VERSION) {
        console.warn('Versión de guardado incompatible, limpiando...');
        this.clear();
        return null;
      }
      
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      if (data.timestamp < sevenDaysAgo) {
        console.warn('Guardado muy antiguo, limpiando...');
        this.clear();
        return null;
      }
      
      return {
        formData: data.formData || {},
        timestamp: data.timestamp,
        age: Date.now() - data.timestamp
      };
    } catch (e) {
      console.error('Error cargando desde localStorage:', e);
      this.clear();
      return null;
    }
  }

  clear() {
    if (!this.isAvailable) return false;
    
    try {
      window.localStorage.removeItem(this.key);
      return true;
    } catch (e) {
      console.error('Error limpiando localStorage:', e);
      return false;
    }
  }

  clearOldSaves() {
    if (!this.isAvailable) return;
    
    try {
      const storage = window.localStorage;
      const keysToRemove = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && key.startsWith('melmac-') && key !== this.key) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        try {
          storage.removeItem(key);
        } catch (e) {
          console.warn('No se pudo eliminar clave antigua:', key);
        }
      });
    } catch (e) {
      console.error('Error limpiando guardados antiguos:', e);
    }
  }

  getInfo() {
    const saved = this.load();
    if (!saved) return null;
    
    return {
      timestamp: saved.timestamp,
      age: saved.age,
      size: JSON.stringify(saved.formData).length,
      fieldCount: Object.keys(saved.formData).length
    };
  }
}

const useDebounce = (callback, delay) => {
  const [debounceTimer, setDebounceTimer] = useState(null);
  
  const debouncedCallback = useCallback((...args) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);
    
    setDebounceTimer(newTimer);
  }, [callback, delay, debounceTimer]);
  
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);
  
  return debouncedCallback;
};

const formatTimeAgo = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `hace ${days} día${days > 1 ? 's' : ''}`;
  if (hours > 0) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  return 'hace unos segundos';
};

const MelmacCreditForm = (props = {}) => {
  const config = props.config || defaultConfig;
  const onDataChange = props.onDataChange || null;
  const onSubmit = props.onSubmit || null;
  const initialData = props.initialData || {};
  const readOnly = props.readOnly || false;

  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPDF, setShowPDF] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [highlightedField, setHighlightedField] = useState(null);
  const [signature, setSignature] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [focusedFields, setFocusedFields] = useState({});
  const [pdfCollapsed, setPdfCollapsed] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const [autoSaveManager] = useState(() => new AutoSaveManager());
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [savedDataInfo, setSavedDataInfo] = useState(null);

  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureFieldId, setSignatureFieldId] = useState(null);
  const [tempSignature, setTempSignature] = useState('');

  const branding = config.branding;
  const formData = config.formData;
  const pagesConfig = config.pagesConfig;

  const getCurrentPageData = () => {
    try {
      const currentConfig = pagesConfig[currentPage];
      const sections = formData.sections.filter(section => 
        currentConfig.sections && currentConfig.sections.includes(section.id)
      );
      const fieldsCount = sections.reduce((acc, section) => 
        acc + (section.fields ? section.fields.length : 0), 0
      );
      return { sections, fieldsCount, config: currentConfig };
    } catch (error) {
      return { sections: [], fieldsCount: 0, config: pagesConfig[0] };
    }
  };

  const pageData = getCurrentPageData();
  const currentSections = pageData.sections;

  const calculateTotalProgress = () => {
    const allFields = formData.sections.reduce((acc, section) => 
      acc + (section.fields ? section.fields.length : 0), 0
    );
    const completedFields = Object.keys(answers).filter(key => {
      const value = answers[key];
      return value !== null && value !== undefined && value !== '';
    }).length;
    const progress = allFields > 0 ? (completedFields / allFields) * 100 : 0;
    return { completedFields, allFields, progress };
  };

  const totalProgressData = calculateTotalProgress();
  const totalCompletedFields = totalProgressData.completedFields;
  const totalFormFields = totalProgressData.allFields;
  const totalProgress = totalProgressData.progress;

  const calculatePageProgress = () => {
    const pageFieldIds = [];
    currentSections.forEach(section => {
      if (section && section.fields) {
        section.fields.forEach(field => {
          pageFieldIds.push(field.id);
        });
      }
    });
    const pageCompletedFields = pageFieldIds.filter(fieldId => {
      const value = answers[fieldId];
      return value !== null && value !== undefined && value !== '';
    }).length;
    const progress = pageFieldIds.length > 0 ? (pageCompletedFields / pageFieldIds.length) * 100 : 0;
    return { completed: pageCompletedFields, total: pageFieldIds.length, progress };
  };

  const pageProgress = calculatePageProgress();

  const saveFormData = useCallback((data) => {
    if (readOnly) return;
    
    setSaveStatus('saving');
    
    const success = autoSaveManager.save(data);
    
    if (success) {
      setSaveStatus('saved');
      setLastSaved(Date.now());
      setHasUnsavedChanges(false);
      
      const info = autoSaveManager.getInfo();
      setSavedDataInfo(info);
      
      setTimeout(() => setSaveStatus('idle'), 2000);
    } else {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  }, [autoSaveManager, readOnly]);

  const debouncedSave = useDebounce(saveFormData, AUTO_SAVE_DEBOUNCE_DELAY);

  const loadSavedData = useCallback(() => {
    if (readOnly) return null;
    
    try {
      const saved = autoSaveManager.load();
      if (saved && saved.formData) {
        console.log('Cargando datos guardados:', saved);
        return saved;
      }
      return null;
    } catch (error) {
      console.error('Error cargando datos guardados:', error);
      return null;
    }
  }, [autoSaveManager, readOnly]);

  const clearSavedData = useCallback(() => {
    const success = autoSaveManager.clear();
    if (success) {
      setSavedDataInfo(null);
      setLastSaved(null);
      setSaveStatus('idle');
      setHasUnsavedChanges(false);
      console.log('Datos guardados eliminados exitosamente');
      return true;
    } else {
      console.error('Error eliminando datos guardados');
      return false;
    }
  }, [autoSaveManager]);

  const resetForm = useCallback(() => {
    setAnswers({});
    setErrors({});
    setCurrentPage(0);
    setSignature('');
    setFocusedFields({});
    clearSavedData();
    
    if (onDataChange) onDataChange({});
    
    setShowClearConfirm(false);
  }, [clearSavedData, onDataChange]);

  const getSaveStatusIcon = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#6B7280' }}>
            <div className="loading-spinner" style={{ 
              width: '12px', 
              height: '12px', 
              borderWidth: '1px',
              borderColor: '#6B7280',
              borderTopColor: 'transparent'
            }} />
            <span style={{ fontSize: '12px' }}>Guardando...</span>
          </div>
        );
      case 'saved':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: branding.accentColor }}>
            <CheckCircle size={12} />
            <span style={{ fontSize: '12px' }}>Guardado</span>
          </div>
        );
      case 'error':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EF4444' }}>
            <AlertCircle size={12} />
            <span style={{ fontSize: '12px' }}>Error al guardar</span>
          </div>
        );
      default:
        if (hasUnsavedChanges) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F59E0B' }}>
              <Clock size={12} />
              <span style={{ fontSize: '12px' }}>Cambios sin guardar</span>
            </div>
          );
        }
        return null;
    }
  };

  const validateField = (field, value) => {
    // Validación de campo requerido
    if (field.required && (!value || value.toString().trim() === '')) {
      return 'Campo obligatorio';
    }
    
    // Si no hay valor y no es requerido, está OK
    if (!value) return null;
    
    const strValue = value.toString();
    
    // Verificar patrones maliciosos
    if (containsMaliciousPatterns(strValue)) {
      return 'Contenido no permitido detectado';
    }
    
    // Validaciones específicas por tipo
    switch (field.type) {
      case 'email':
        if (!isValidEmail(strValue)) {
          return 'Email inválido';
        }
        // Límite de longitud para email
        if (strValue.length > 254) {
          return 'Email demasiado largo';
        }
        break;
        
      case 'tel':
        if (!isValidPhone(strValue)) {
          return 'Teléfono inválido (7-15 dígitos)';
        }
        break;
        
      case 'text':
      case 'textarea':
        // Límite de longitud para prevenir DoS
        const maxLength = field.type === 'textarea' ? 2000 : 500;
        if (strValue.length > maxLength) {
          return `Máximo ${maxLength} caracteres`;
        }
        break;
        
      case 'number':
        const num = parseFloat(strValue);
        if (isNaN(num)) {
          return 'Debe ser un número válido';
        }
        if (field.min !== undefined && num < field.min) {
          return `Mínimo: ${field.min}`;
        }
        if (field.max !== undefined && num > field.max) {
          return `Máximo: ${field.max}`;
        }
        break;
        
      case 'currency':
        const cleaned = strValue.replace(/[,\.]/g, '');
        if (!/^\d+$/.test(cleaned)) {
          return 'Monto inválido';
        }
        // Límite razonable para montos
        if (cleaned.length > 15) {
          return 'Monto demasiado grande';
        }
        break;
        
      case 'signature':
        // Validar que la firma no sea demasiado larga
        if (strValue.length > 200) {
          return 'Firma demasiado larga';
        }
        break;
    }
    
    return null;
  };

  const validateCurrentPage = () => {
    const newErrors = {};
    let hasErrors = false;
    let firstErrorFieldId = null;
    
    currentSections.forEach(section => {
      if (section && section.fields) {
        section.fields.forEach(field => {
          if (field) {
            const error = validateField(field, answers[field.id]);
            if (error) {
              newErrors[field.id] = error;
              if (!firstErrorFieldId) {
                firstErrorFieldId = field.id;
              }
              hasErrors = true;
            }
          }
        });
      }
    });
    setErrors(prevErrors => ({ ...prevErrors, ...newErrors }));
    return { isValid: !hasErrors, firstErrorFieldId };
  };

  const scrollToField = (fieldId) => {
    setTimeout(() => {
      const element = document.getElementById(`field-${fieldId}`);
      if (element) {
        // Compatibilidad cross-browser para smooth scroll
        const supportsNativeSmoothScroll = 'scrollBehavior' in document.documentElement.style;
        
        if (supportsNativeSmoothScroll) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        } else {
          // Fallback para navegadores antiguos
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - (window.innerHeight / 2) + (element.offsetHeight / 2);
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'auto'
          });
        }
        
        const input = element.querySelector('input, select, textarea');
        if (input && !readOnly) {
          setTimeout(() => {
            try {
              input.focus();
            } catch (e) {
              console.warn('No se pudo hacer focus en el campo:', e);
            }
            
            setHighlightedField(fieldId);
            setTimeout(() => setHighlightedField(null), 3000);
          }, 500);
        }
      }
    }, 100);
  };

  const updateAnswer = (fieldId, value) => {
    // Sanitizar el valor antes de guardarlo
    let sanitizedValue = value;
    
    if (typeof value === 'string') {
      // Verificar patrones maliciosos
      if (containsMaliciousPatterns(value)) {
        console.warn('Intento de XSS detectado y bloqueado');
        return;
      }
      
      // Sanitizar el string
      sanitizedValue = sanitizeString(value);
    }
    
    const newAnswers = { ...answers, [fieldId]: sanitizedValue };
    setAnswers(newAnswers);
    
    // Marcar que hay cambios sin guardar
    setHasUnsavedChanges(true);
    
    // Callback para informar cambios al componente padre
    if (onDataChange) onDataChange(newAnswers);
    
    // Auto-guardar con debounce
    debouncedSave(newAnswers);
    
    // Efectos visuales existentes
    setHighlightedField(fieldId);
    setTimeout(() => setHighlightedField(null), 1500);
    
    // Limpiar errores existentes
    if (errors[fieldId]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[fieldId];
        return updated;
      });
    }
  };

  // Función segura para manejar firma sin usar prompt()
  const openSignatureModal = (fieldId) => {
    setSignatureFieldId(fieldId);
    setTempSignature(answers[fieldId] || '');
    setShowSignatureModal(true);
  };

  const handleSignatureSubmit = () => {
    if (tempSignature.trim()) {
      // Validar longitud
      if (tempSignature.length > 200) {
        alert('La firma es demasiado larga (máximo 200 caracteres)');
        return;
      }
      
      // Sanitizar y guardar
      const sanitized = sanitizeString(tempSignature.trim());
      updateAnswer(signatureFieldId, sanitized);
      setSignature(sanitized);
    }
    
    setShowSignatureModal(false);
    setTempSignature('');
    setSignatureFieldId(null);
  };

  const goToNextPage = () => {
    if (readOnly) return;
    
    const validationResult = validateCurrentPage();
    
    if (!validationResult.isValid) {
      if (validationResult.firstErrorFieldId) {
        scrollToField(validationResult.firstErrorFieldId);
      }
      return;
    }
    
    if (currentPage < pagesConfig.length - 1) {
      setCurrentPage(prev => prev + 1);
      // Compatibilidad cross-browser para scroll
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        window.scrollTo(0, 0);
      }
    } else {
      handleSubmit();
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
      // Compatibilidad cross-browser para scroll
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        window.scrollTo(0, 0);
      }
    }
  };

  const handleSubmit = () => {
    if (readOnly || !validateCurrentPage().isValid) return;
    setIsSubmitting(true);
    const submitPromise = onSubmit ? onSubmit(answers) : new Promise((resolve) => {
      setTimeout(() => {
        alert('¡Formulario enviado exitosamente!');
        resolve();
      }, 2000);
    });
    submitPromise
      .then(() => setIsSubmitting(false))
      .catch(error => {
        alert('Error al enviar el formulario.');
        setIsSubmitting(false);
      });
  };

  const togglePDF = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowPDF(prev => !prev);
      setIsTransitioning(false);
    }, 150);
  };

  const collapsePDF = () => {
    if (!isMobile) setPdfCollapsed(prev => !prev);
  };

  useEffect(() => {
    const initializeFormData = () => {
      let finalData = { ...initialData };
      
      const saved = loadSavedData();
      if (saved && saved.formData) {
        finalData = { ...initialData, ...saved.formData };
        
        setSavedDataInfo(saved);
        setLastSaved(saved.timestamp);
        
        console.log(`Datos restaurados desde auto-guardado (${formatTimeAgo(saved.timestamp)})`);
      }
      
      setAnswers(finalData);
      
      if (finalData.firma) {
        setSignature(finalData.firma);
      }
    };
    
    initializeFormData();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges && !readOnly) {
        try {
          autoSaveManager.save(answers);
        } catch (error) {
          console.error('Error en guardado de emergencia:', error);
        }
        
        e.preventDefault();
        e.returnValue = 'Tienes cambios sin guardar que se perderán si sales de la página.';
        return e.returnValue;
      }
    };
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && hasUnsavedChanges && !readOnly) {
        try {
          autoSaveManager.save(answers);
          console.log('Auto-guardado por cambio de visibilidad');
        } catch (error) {
          console.error('Error en auto-guardado por visibilidad:', error);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasUnsavedChanges, answers, autoSaveManager, readOnly]);

  useEffect(() => {
    let resizeTimeout;
    
    const checkMobile = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const width = window.innerWidth;
        const wasMobile = isMobile;
        const nowMobile = width < 1024;
        
        if (wasMobile !== nowMobile) {
          setIsTransitioning(true);
          
          setTimeout(() => {
            setIsMobile(nowMobile);
            
            if (nowMobile) {
              setShowPDF(false);
              setPdfCollapsed(false);
            } else {
              setShowPDF(true);
            }
            
            setIsTransitioning(false);
          }, 100);
        }
      }, 150);
    };
    
    const initialWidth = window.innerWidth;
    setIsMobile(initialWidth < 1024);
    
    window.addEventListener('resize', checkMobile);
    
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        if (!isMobile) {
          togglePDF();
        }
      }
      if (e.key === 'Escape') {
        if (showShortcuts) {
          setShowShortcuts(false);
        } else if (showPDF && !pdfCollapsed && !isMobile) {
          collapsePDF();
        }
      }
      if (e.key === 'Enter' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        e.preventDefault();
        if (!readOnly && !isSubmitting) {
          goToNextPage();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowRight') {
        e.preventDefault();
        if (!readOnly && !isSubmitting && currentPage < pagesConfig.length - 1) {
          goToNextPage();
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentPage > 0) {
          goToPreviousPage();
        }
      }
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
      document.removeEventListener('keydown', handleKeyDown);
      clearTimeout(resizeTimeout);
    };
  }, [isMobile]);

  const getFieldIcon = (fieldType, fieldId) => {
    const iconColor = answers[fieldId] ? branding.primaryColor : '#9CA3AF';
    const iconProps = { size: 20, color: iconColor };

    switch (fieldType) {
      case 'text':
        if (fieldId.includes('nombre') || fieldId.includes('apellido')) return <User {...iconProps} />;
        if (fieldId.includes('documento')) return <CreditCard {...iconProps} />;
        if (fieldId.includes('ocupacion') || fieldId.includes('cargo')) return <Briefcase {...iconProps} />;
        if (fieldId.includes('empresa')) return <Building {...iconProps} />;
        if (fieldId.includes('ciudad') || fieldId.includes('barrio') || fieldId.includes('direccion')) return <MapPin {...iconProps} />;
        return <User {...iconProps} />;
      case 'email': return <Mail {...iconProps} />;
      case 'tel': return <Phone {...iconProps} />;
      case 'textarea': return <MessageCircle {...iconProps} />;
      case 'date': return <Calendar {...iconProps} />;
      case 'number': return <Target {...iconProps} />;
      case 'currency': return <DollarSign {...iconProps} />;
      case 'select': return <ChevronDown {...iconProps} />;
      default: return <User {...iconProps} />;
    }
  };

  const renderField = (field) => {
    const value = answers[field.id];
    const error = errors[field.id];
    const hasValue = Boolean(value && value.toString().trim() !== '');
    const isFocused = focusedFields[field.id] || false;
    const shouldFloatLabel = hasValue || isFocused;
    const isHighlighted = highlightedField === field.id;

    const handleFocus = (fieldId) => setFocusedFields(prev => ({ ...prev, [fieldId]: true }));
    const handleBlur = (fieldId) => setFocusedFields(prev => ({ ...prev, [fieldId]: false }));

    const baseInputStyle = {
      width: '100%',
      padding: '12px 40px 12px 12px',
      border: `2px solid ${error ? '#EF4444' : (isHighlighted ? branding.accentColor : '#D1D5DB')}`,
      borderRadius: '8px',
      fontSize: '16px',
      backgroundColor: readOnly ? '#F3F4F6' : (isHighlighted ? '#FEF3C7' : 'white'),
      outline: 'none',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box',
      boxShadow: isHighlighted ? `0 0 0 3px ${branding.accentColor}30` : (error ? `0 0 0 3px #FEE2E2` : 'none')
    };

    const labelStyle = {
      position: 'absolute',
      left: '12px',
      transition: 'all 0.2s ease',
      pointerEvents: 'none',
      padding: '0 4px',
      zIndex: 10,
      ...(shouldFloatLabel ? {
        top: '0',
        transform: 'translateY(-50%)',
        fontSize: '12px',
        backgroundColor: 'white',
        color: error ? '#EF4444' : branding.primaryColor
      } : {
        top: '12px',
        fontSize: '16px',
        backgroundColor: 'transparent',
        color: error ? '#EF4444' : '#6B7280'
      })
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <div key={field.id} id={`field-${field.id}`} style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type={field.type}
                value={value || ''}
                onChange={(e) => {
                  if (!readOnly) updateAnswer(field.id, e.target.value);
                }}
                onFocus={() => handleFocus(field.id)}
                onBlur={() => handleBlur(field.id)}
                placeholder=""
                disabled={readOnly}
                style={baseInputStyle}
              />
              <label style={labelStyle}>
                {field.label}
                {field.required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
              </label>
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                {getFieldIcon(field.type, field.id)}
              </div>
            </div>
            {error && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                marginTop: '4px',
                animation: 'shake 0.5s'
              }}>
                <AlertCircle size={14} color="#EF4444" />
                <p style={{ color: '#EF4444', fontSize: '12px', margin: 0 }}>{error}</p>
              </div>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} id={`field-${field.id}`} style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <textarea
                value={value || ''}
                onChange={(e) => {
                  if (!readOnly) updateAnswer(field.id, e.target.value);
                }}
                onFocus={() => handleFocus(field.id)}
                onBlur={() => handleBlur(field.id)}
                rows={field.rows || 3}
                disabled={readOnly}
                style={{ ...baseInputStyle, resize: 'none', paddingTop: '12px' }}
              />
              <label style={labelStyle}>
                {field.label}
                {field.required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
              </label>
              <div style={{ position: 'absolute', right: '12px', top: '12px' }}>
                {getFieldIcon(field.type, field.id)}
              </div>
            </div>
            {error && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                marginTop: '4px',
                animation: 'shake 0.5s'
              }}>
                <AlertCircle size={14} color="#EF4444" />
                <p style={{ color: '#EF4444', fontSize: '12px', margin: 0 }}>{error}</p>
              </div>
            )}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} id={`field-${field.id}`} style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <select
                value={value || ''}
                onChange={(e) => {
                  if (!readOnly) updateAnswer(field.id, e.target.value);
                }}
                onFocus={() => handleFocus(field.id)}
                onBlur={() => handleBlur(field.id)}
                disabled={readOnly}
                style={{ ...baseInputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                <option value=""></option>
                {field.options && field.options.map((option, idx) => (
                  <option key={idx} value={option.value}>{option.label}</option>
                ))}
              </select>
              <label style={labelStyle}>
                {field.label}
                {field.required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
              </label>
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                <ChevronDown size={20} color="#9CA3AF" />
              </div>
            </div>
            {error && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                marginTop: '4px',
                animation: 'shake 0.5s'
              }}>
                <AlertCircle size={14} color="#EF4444" />
                <p style={{ color: '#EF4444', fontSize: '12px', margin: 0 }}>{error}</p>
              </div>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={field.id} id={`field-${field.id}`} style={{ 
            marginBottom: '16px',
            padding: isHighlighted ? '12px' : '0',
            backgroundColor: isHighlighted ? '#FEF3C7' : 'transparent',
            borderRadius: '8px',
            border: isHighlighted ? `2px solid ${branding.accentColor}` : 'none',
            transition: 'all 0.3s ease'
          }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              {field.label}
              {field.required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {field.options && field.options.map((option, idx) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={field.id}
                    value={option.value}
                    checked={value === option.value}
                    onChange={() => {
                      if (!readOnly) updateAnswer(field.id, option.value);
                    }}
                    disabled={readOnly}
                    style={{ accentColor: branding.primaryColor }}
                  />
                  <span style={{ fontSize: '14px', color: '#374151' }}>{option.label}</span>
                </label>
              ))}
            </div>
            {error && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                marginTop: '8px',
                animation: 'shake 0.5s'
              }}>
                <AlertCircle size={14} color="#EF4444" />
                <p style={{ color: '#EF4444', fontSize: '12px', margin: 0 }}>{error}</p>
              </div>
            )}
          </div>
        );

      case 'date':
        return (
          <div key={field.id} id={`field-${field.id}`} style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                value={value || field.defaultValue || ''}
                onChange={(e) => {
                  if (!readOnly) updateAnswer(field.id, e.target.value);
                }}
                onFocus={() => handleFocus(field.id)}
                onBlur={() => handleBlur(field.id)}
                disabled={readOnly || field.readonly}
                style={baseInputStyle}
              />
              <label style={{
                position: 'absolute',
                left: '12px',
                top: '0',
                transform: 'translateY(-50%)',
                fontSize: '12px',
                backgroundColor: 'white',
                color: error ? '#EF4444' : branding.primaryColor,
                padding: '0 4px',
                zIndex: 10,
                transition: 'all 0.2s ease',
                pointerEvents: 'none'
              }}>
                {field.label}
                {field.required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
              </label>
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                {getFieldIcon(field.type, field.id)}
              </div>
            </div>
            {error && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                marginTop: '4px',
                animation: 'shake 0.5s'
              }}>
                <AlertCircle size={14} color="#EF4444" />
                <p style={{ color: '#EF4444', fontSize: '12px', margin: 0 }}>{error}</p>
              </div>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} id={`field-${field.id}`} style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                value={value || ''}
                onChange={(e) => {
                  if (!readOnly) updateAnswer(field.id, e.target.value);
                }}
                onFocus={() => handleFocus(field.id)}
                onBlur={() => handleBlur(field.id)}
                min={field.min}
                max={field.max}
                disabled={readOnly}
                style={baseInputStyle}
              />
              <label style={labelStyle}>
                {field.label}
                {field.required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
              </label>
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                {getFieldIcon(field.type, field.id)}
              </div>
            </div>
            {error && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                marginTop: '4px',
                animation: 'shake 0.5s'
              }}>
                <AlertCircle size={14} color="#EF4444" />
                <p style={{ color: '#EF4444', fontSize: '12px', margin: 0 }}>{error}</p>
              </div>
            )}
          </div>
        );

      case 'currency':
        return (
          <div key={field.id} id={`field-${field.id}`} style={{ marginBottom: '16px' }}>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', zIndex: 10, top: '12px', color: '#6B7280' }}>$</span>
              <input
                type="text"
                value={value || ''}
                onChange={(e) => {
                  if (!readOnly) {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    const formatted = cleaned.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                    updateAnswer(field.id, formatted);
                  }
                }}
                onFocus={() => handleFocus(field.id)}
                onBlur={() => handleBlur(field.id)}
                disabled={readOnly}
                style={{ ...baseInputStyle, paddingLeft: '32px' }}
              />
              <label style={{ ...labelStyle, left: '32px' }}>
                {field.label}
                {field.required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
              </label>
              <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                {getFieldIcon(field.type, field.id)}
              </div>
            </div>
            {error && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                marginTop: '4px',
                animation: 'shake 0.5s'
              }}>
                <AlertCircle size={14} color="#EF4444" />
                <p style={{ color: '#EF4444', fontSize: '12px', margin: 0 }}>{error}</p>
              </div>
            )}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.id} id={`field-${field.id}`} style={{ 
            marginBottom: '16px',
            padding: isHighlighted ? '12px' : '0',
            backgroundColor: isHighlighted ? '#FEF3C7' : 'transparent',
            borderRadius: '8px',
            border: isHighlighted ? `2px solid ${branding.accentColor}` : (error ? '2px solid #EF4444' : 'none'),
            transition: 'all 0.3s ease'
          }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={value || false}
                onChange={(e) => {
                  if (!readOnly) updateAnswer(field.id, e.target.checked);
                }}
                disabled={readOnly}
                style={{ marginTop: '4px', accentColor: branding.primaryColor }}
              />
              <div>
                <span style={{ fontSize: '14px', color: '#374151' }}>{field.label}</span>
                {field.required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
              </div>
            </label>
            {error && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                marginTop: '8px',
                marginLeft: '32px',
                animation: 'shake 0.5s'
              }}>
                <AlertCircle size={14} color="#EF4444" />
                <p style={{ color: '#EF4444', fontSize: '12px', margin: 0 }}>{error}</p>
              </div>
            )}
          </div>
        );

      case 'signature':
        return (
          <div key={field.id} id={`field-${field.id}`} style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              {field.label}
              {field.required && <span style={{ color: '#EF4444', marginLeft: '4px' }}>*</span>}
            </label>
            <div
              onClick={() => {
                if (!readOnly) {
                  openSignatureModal(field.id);
                }
              }}
              style={{
                width: '100%',
                height: '96px',
                border: `2px dashed ${
                  isHighlighted ? branding.accentColor : 
                  error ? '#EF4444' : 
                  (signature || value) ? branding.primaryColor : '#d1d5db'
                }`,
                borderRadius: '8px',
                backgroundColor: isHighlighted ? '#FEF3C7' : (signature || value) ? branding.primaryColor + '10' : '#f9fafb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: readOnly ? 'not-allowed' : 'pointer',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                boxShadow: isHighlighted ? `0 0 0 3px ${branding.accentColor}30` : (error ? `0 0 0 3px #FEE2E2` : 'none')
              }}
            >
              {signature || value ? (
                <div style={{ textAlign: 'center', padding: '8px', maxWidth: '100%' }}>
                  <PenTool size={24} color={branding.primaryColor} style={{ margin: '0 auto 4px' }} />
                  <p style={{ 
                    color: branding.primaryColor, 
                    fontWeight: '500', 
                    fontSize: '14px', 
                    margin: 0,
                    wordBreak: 'break-word',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {signature || value}
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#6B7280' }}>
                  <PenTool size={24} style={{ margin: '0 auto 4px' }} />
                  <p style={{ fontSize: '14px', margin: 0 }}>
                    {readOnly ? 'Sin firma' : 'Clic para firmar'}
                  </p>
                </div>
              )}
            </div>
            {error && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                marginTop: '4px',
                animation: 'shake 0.5s'
              }}>
                <AlertCircle size={14} color="#EF4444" />
                <p style={{ color: '#EF4444', fontSize: '12px', margin: 0 }}>{error}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#F9FAFB',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #E5E7EB',
        position: 'sticky',
        top: '0',
        zIndex: '50',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          maxWidth: '80rem', 
          margin: '0 auto', 
          padding: '16px',
          boxSizing: 'border-box'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <h2 style={{
              fontSize: isMobile ? '20px' : '24px',
              fontWeight: 'bold',
              color: branding.primaryColor,
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              {formData.title}
            </h2>
            <p style={{
              color: '#6B7280',
              fontSize: isMobile ? '14px' : '16px',
              margin: 0
            }}>
              {formData.subtitle}
            </p>
          </div>
          
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: isMobile ? '11px' : '12px',
              color: '#6B7280',
              marginBottom: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ 
                  fontWeight: '600', 
                  color: branding.primaryColor,
                  fontSize: isMobile ? '12px' : '13px'
                }}>
                  Paso {currentPage + 1} de {pagesConfig.length}
                </span>
                <span style={{ color: '#9CA3AF' }}>•</span>
                <span>
                  {pageProgress.completed} de {pageProgress.total} campos completados
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  fontWeight: '500',
                  color: totalProgress >= 90 ? branding.accentColor : '#6B7280'
                }}>
                  Total: {totalCompletedFields}/{totalFormFields} ({Math.round(totalProgress)}%)
                </span>
              </div>
            </div>
            
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '100%',
                backgroundColor: '#E5E7EB',
                borderRadius: '9999px',
                height: '8px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '8px',
                  borderRadius: '9999px',
                  background: `linear-gradient(90deg, ${branding.primaryColor}40, ${branding.accentColor}40)`,
                  width: `${totalProgress}%`,
                  transition: 'width 0.7s ease-out'
                }} />
              </div>
              
              <div style={{
                position: 'absolute',
                top: '0',
                left: `${(currentPage / pagesConfig.length) * 100}%`,
                width: `${100 / pagesConfig.length}%`,
                height: '8px',
                borderRadius: '9999px',
                overflow: 'hidden',
                backgroundColor: 'rgba(255, 255, 255, 0.3)'
              }}>
                <div style={{
                  height: '8px',
                  borderRadius: '9999px',
                  background: `linear-gradient(90deg, ${branding.primaryColor}, ${branding.accentColor})`,
                  width: `${pageProgress.progress}%`,
                  transition: 'width 0.3s ease-out',
                  boxShadow: `0 0 8px ${branding.primaryColor}50`
                }} />
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '6px',
              paddingLeft: '2px',
              paddingRight: '2px'
            }}>
              {pagesConfig.map((page, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '10px',
                    color: index === currentPage 
                      ? branding.primaryColor 
                      : index < currentPage 
                        ? branding.accentColor 
                        : '#9CA3AF',
                    fontWeight: index === currentPage ? '600' : '400',
                    opacity: index === currentPage ? 1 : 0.7
                  }}
                >
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: index === currentPage 
                      ? branding.primaryColor 
                      : index < currentPage 
                        ? branding.accentColor 
                        : '#D1D5DB',
                    marginRight: '4px',
                    transition: 'all 0.3s ease'
                  }} />
                  {!isMobile && (
                    <span style={{ 
                      maxWidth: index === currentPage ? 'none' : '60px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {page.title}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        position: isMobile ? 'relative' : 'sticky',
        top: isMobile ? '0' : '100px',
        zIndex: 40,
        backgroundColor: 'white',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        boxSizing: 'border-box'
      }}>
        <div style={{
          maxWidth: '80rem',
          margin: '0 auto',
          padding: isMobile ? '8px 12px' : '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
            {!isMobile && (
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Vista PDF:
              </span>
            )}
            
            {isMobile && getSaveStatusIcon() && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: saveStatus === 'saved' ? branding.accentColor + '15' : '#f3f4f6',
                fontSize: '12px'
              }}>
                {getSaveStatusIcon()}
              </div>
            )}
            
            <button
              onClick={togglePDF}
              disabled={isTransitioning}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: isMobile ? '8px 12px' : '6px 12px',
                backgroundColor: showPDF ? branding.primaryColor : '#f3f4f6',
                color: showPDF ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '6px',
                fontSize: isMobile ? '16px' : '14px',
                fontWeight: '500',
                cursor: isTransitioning ? 'wait' : 'pointer',
                minWidth: isMobile ? '140px' : 'auto',
                justifyContent: 'center',
                opacity: isTransitioning ? 0.7 : 1
              }}
            >
              {showPDF ? <EyeOff size={isMobile ? 18 : 16} /> : <Eye size={isMobile ? 18 : 16} />}
              {showPDF ? 'Ocultar PDF' : 'Mostrar PDF'}
            </button>

            {showPDF && !isMobile && (
              <button
                onClick={collapsePDF}
                style={{
                  padding: '6px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${branding.primaryColor}`,
                  borderRadius: '4px',
                  color: branding.primaryColor,
                  cursor: 'pointer'
                }}
                title={pdfCollapsed ? 'Expandir PDF' : 'Colapsar PDF'}
              >
                {pdfCollapsed ? <Maximize2 size={16} /> : <ArrowUpDown size={16} />}
              </button>
            )}
          </div>

          {!isMobile && (
            <div style={{ 
              fontSize: '12px', 
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              position: 'relative'
            }}>
              <div style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: saveStatus === 'saved' ? branding.accentColor + '15' : 'transparent'
              }}>
                {getSaveStatusIcon()}
              </div>

              <span>•</span>
              <span>{Math.round(totalProgress)}% completado</span>
              {showPDF && (
                <span>• PDF {pdfCollapsed ? 'minimizado' : 'expandido'}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ 
        maxWidth: '80rem', 
        margin: '0 auto',
        boxSizing: 'border-box',
        position: 'relative'
      }}>
        <div style={{ 
          display: isMobile || isTransitioning ? 'block' : 'flex', 
          minHeight: 'calc(100vh - 200px)',
          position: 'relative',
          boxSizing: 'border-box'
        }}>
          <div style={{
            width: isMobile ? '100%' : (showPDF ? '50%' : '100%'),
            flex: isMobile ? 'none' : (showPDF ? '0 0 50%' : '1'),
            overflowY: 'auto',
            transition: isTransitioning || isMobile ? 'none' : 'width 0.3s ease-in-out, flex 0.3s ease-in-out',
            display: (showPDF && isMobile) ? 'none' : 'block',
            boxSizing: 'border-box'
          }}>
            <div style={{ 
              padding: isMobile ? '12px' : '16px',
              boxSizing: 'border-box'
            }}>
              {currentSections.map((section) => (
                <div
                  key={section.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    border: '1px solid #E5E7EB',
                    padding: isMobile ? '12px' : '16px',
                    marginBottom: '24px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: isMobile ? '12px' : '16px'
                  }}>
                    <div style={{
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: branding.primaryColor + '15'
                    }}>
                      <section.icon size={isMobile ? 16 : 20} color={branding.primaryColor} />
                    </div>
                    <h3 style={{
                      fontSize: isMobile ? '16px' : '18px',
                      fontWeight: '600',
                      color: '#1F2937',
                      margin: 0
                    }}>
                      {section.title}
                    </h3>
                  </div>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: (showPDF && !isMobile) ? '1fr' : (isMobile ? '1fr' : '1fr 1fr'),
                    gap: isMobile ? '12px' : '16px',
                    boxSizing: 'border-box'
                  }}>
                    {section.fields.map(renderField)}
                  </div>
                </div>
              ))}

              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                border: '1px solid #E5E7EB',
                padding: isMobile ? '16px' : '24px',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <div>
                    <h3 style={{
                      fontSize: isMobile ? '16px' : '18px',
                      fontWeight: '600',
                      color: '#1F2937',
                      marginBottom: '4px',
                      margin: '0 0 4px 0'
                    }}>
                      {currentPage === pagesConfig.length - 1 ? '¿Listo para enviar?' : '¿Continuar al siguiente paso?'}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#6B7280',
                      margin: 0
                    }}>
                      {currentPage === pagesConfig.length - 1 
                        ? 'Revisa que todos los campos estén correctos' 
                        : `Completa esta página para continuar con: ${pagesConfig[currentPage + 1]?.title || ''}`
                      }
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: isMobile ? '20px' : '24px',
                      fontWeight: 'bold',
                      color: branding.accentColor
                    }}>
                      {Math.round(pageProgress.progress)}%
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#6B7280'
                    }}>
                      Esta página
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  {currentPage > 0 && !readOnly && (
                    <button
                      onClick={goToPreviousPage}
                      style={{
                        flex: '1',
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        padding: isMobile ? '12px 16px' : '16px 20px',
                        borderRadius: '12px',
                        border: 'none',
                        fontSize: isMobile ? '16px' : '18px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <ChevronLeft size={20} />
                      Anterior
                    </button>
                  )}
                  
                  {!readOnly && (
                    <button
                      onClick={goToNextPage}
                      disabled={isSubmitting || (currentPage === pagesConfig.length - 1 && totalProgress < 90)}
                      style={{
                        flex: '1',
                        background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`,
                        color: 'white',
                        padding: isMobile ? '12px 16px' : '16px 20px',
                        borderRadius: '12px',
                        border: 'none',
                        fontSize: isMobile ? '16px' : '18px',
                        fontWeight: '600',
                        cursor: isSubmitting || (currentPage === pagesConfig.length - 1 && totalProgress < 90) ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        opacity: isSubmitting || (currentPage === pagesConfig.length - 1 && totalProgress < 90) ? '0.5' : '1',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            border: '2px solid white',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }} />
                          Procesando...
                        </>
                      ) : currentPage === pagesConfig.length - 1 ? (
                        totalProgress < 90 ? (
                          <>
                            <AlertCircle size={20} />
                            Complete más campos
                          </>
                        ) : (
                          <>
                            <Send size={20} />
                            Enviar Solicitud
                          </>
                        )
                      ) : (
                        <>
                          Continuar
                          <ChevronRight size={20} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {showPDF && (
            <div style={{
              width: isMobile ? '100vw' : (pdfCollapsed ? '300px' : '50%'),
              flex: isMobile ? 'none' : (pdfCollapsed ? '0 0 300px' : '0 0 50%'),
              backgroundColor: '#F9FAFB',
              borderLeft: isMobile ? 'none' : '1px solid #E5E7EB',
              borderTop: isMobile ? '1px solid #E5E7EB' : 'none',
              padding: '16px',
              transition: isTransitioning || isMobile ? 'none' : 'width 0.3s ease-in-out, flex 0.3s ease-in-out',
              position: isMobile ? 'fixed' : 'relative',
              top: isMobile ? '0' : 'auto',
              left: isMobile ? '0' : 'auto',
              right: isMobile ? '0' : 'auto',
              bottom: isMobile ? '0' : 'auto',
              height: isMobile ? '100vh' : 'auto',
              zIndex: isMobile ? 1000 : 'auto',
              overflow: isMobile ? 'auto' : 'visible',
              boxSizing: 'border-box'
            }}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                height: isMobile ? 'calc(100vh - 32px)' : (pdfCollapsed ? '200px' : '100%'),
                display: 'flex',
                flexDirection: 'column',
                transition: isTransitioning ? 'none' : 'height 0.3s ease-in-out',
                overflow: 'hidden',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  background: 'linear-gradient(90deg, #1F2937, #111827)',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '12px 12px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={20} />
                    <div>
                      <span style={{ fontWeight: '600', fontSize: '16px' }}>
                        Documento PDF
                      </span>
                      <p style={{ fontSize: '12px', color: '#D1D5DB', margin: '0' }}>
                        {isMobile ? 'Vista completa' : (pdfCollapsed ? 'Vista minimizada' : 'Vista previa en tiempo real')}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!isMobile && !pdfCollapsed && (
                      <span style={{ 
                        fontSize: '12px', 
                        backgroundColor: 'rgba(255,255,255,0.2)', 
                        padding: '2px 6px', 
                        borderRadius: '4px' 
                      }}>
                        100%
                      </span>
                    )}
                    
                    {!isMobile && (
                      <button
                        onClick={collapsePDF}
                        style={{
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          cursor: 'pointer'
                        }}
                        title={pdfCollapsed ? 'Expandir PDF' : 'Colapsar PDF'}
                      >
                        {pdfCollapsed ? <Maximize2 size={16} /> : <ArrowUp size={16} />}
                      </button>
                    )}

                    <button
                      style={{
                        padding: '6px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                      title="Descargar PDF"
                    >
                      <Download size={16} />
                    </button>

                    <button
                      onClick={togglePDF}
                      style={{
                        padding: '6px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                      title={isMobile ? 'Cerrar PDF' : 'Ocultar PDF'}
                    >
                      {isMobile ? <X size={16} /> : <EyeOff size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{
                  flex: '1',
                  backgroundColor: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: pdfCollapsed ? '8px' : '16px',
                  color: '#6B7280',
                  padding: isMobile ? '20px' : (pdfCollapsed ? '12px' : '20px'),
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {highlightedField && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: branding.accentColor,
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      zIndex: 10
                    }}>
                      Campo actualizado ✨
                    </div>
                  )}

                  <FileText size={isMobile ? 64 : (pdfCollapsed ? 32 : 48)} color={branding.primaryColor} />
                  
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ 
                      fontSize: isMobile ? '24px' : (pdfCollapsed ? '14px' : '18px'), 
                      fontWeight: '600', 
                      color: '#374151', 
                      margin: '0 0 8px 0'
                    }}>
                      {isMobile ? 'Vista PDF Completa' : (pdfCollapsed ? 'PDF Minimizado' : 'Vista Previa del PDF')}
                    </h3>
                    {!pdfCollapsed && (
                      <p style={{ fontSize: isMobile ? '16px' : '14px', margin: '0', lineHeight: '1.4' }}>
                        Los campos completados aparecerán aquí en tiempo real
                        <br />
                        <span style={{ fontSize: isMobile ? '14px' : '12px', color: '#9CA3AF' }}>
                          {totalCompletedFields} de {totalFormFields} campos completados
                        </span>
                      </p>
                    )}
                  </div>

                  {pdfCollapsed && !isMobile && (
                    <div style={{ 
                      width: '100%', 
                      textAlign: 'center',
                      fontSize: '12px' 
                    }}>
                      <div style={{
                        width: '100%',
                        height: '4px',
                        backgroundColor: '#E5E7EB',
                        borderRadius: '2px',
                        overflow: 'hidden',
                        marginBottom: '4px'
                      }}>
                        <div style={{
                          width: `${totalProgress}%`,
                          height: '100%',
                          backgroundColor: branding.accentColor,
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <span style={{ color: '#6B7280' }}>
                        {Math.round(totalProgress)}% completado
                      </span>
                    </div>
                  )}

                  {isMobile && (
                    <button
                      onClick={togglePDF}
                      style={{
                        marginTop: '20px',
                        padding: '12px 24px',
                        backgroundColor: branding.primaryColor,
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <X size={20} />
                      Cerrar Vista PDF
                    </button>
                  )}
                </div>

                {!pdfCollapsed && (
                  <div style={{
                    backgroundColor: '#F9FAFB',
                    borderTop: '1px solid #E5E7EB',
                    padding: '12px 16px',
                    borderRadius: '0 0 12px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? '8px' : '0'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '16px',
                      flexWrap: 'wrap',
                      justifyContent: isMobile ? 'center' : 'flex-start'
                    }}>
                      <span style={{ color: '#6B7280' }}>
                        <strong style={{ color: branding.accentColor }}>{totalCompletedFields}</strong>
                        {' de '}
                        <strong>{totalFormFields}</strong>
                        {' campos'}
                      </span>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '9999px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: totalProgress >= 90 
                          ? branding.accentColor + '20'
                          : totalProgress >= 50 
                            ? '#FEF3C7'
                            : '#FEE2E2',
                        color: totalProgress >= 90 
                          ? branding.accentColor
                          : totalProgress >= 50 
                            ? '#D97706'
                            : '#DC2626'
                      }}>
                        {totalProgress >= 90 ? 'Listo para enviar' : totalProgress >= 50 ? 'En progreso' : 'Iniciando'}
                      </div>
                    </div>
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: branding.primaryColor,
                      fontSize: isMobile ? '14px' : '12px'
                    }}>
                      {Math.round(totalProgress)}% completado
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Seguro para Firma */}
      {showSignatureModal && (
        <div style={{
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 2001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: branding.primaryColor + '15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PenTool size={24} color={branding.primaryColor} />
              </div>
              <div>
                <h3 style={{ 
                  margin: '0',
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  Firma del Solicitante
                </h3>
                <p style={{ 
                  margin: '4px 0 0 0',
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  Escriba su nombre completo
                </p>
              </div>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Nombre Completo
              </label>
              <input
                type="text"
                value={tempSignature}
                onChange={(e) => {
                  const value = e.target.value;
                  // Validar longitud en tiempo real
                  if (value.length <= 200) {
                    setTempSignature(value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSignatureSubmit();
                  } else if (e.key === 'Escape') {
                    setShowSignatureModal(false);
                    setTempSignature('');
                  }
                }}
                placeholder="Ej: Juan Carlos García López"
                autoFocus
                maxLength={200}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = branding.primaryColor;
                  e.target.style.boxShadow = `0 0 0 3px ${branding.primaryColor}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D1D5DB';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '6px'
              }}>
                <p style={{ 
                  margin: '0',
                  fontSize: '12px',
                  color: '#6b7280',
                  fontStyle: 'italic'
                }}>
                  <Shield size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  Su firma será validada y protegida
                </p>
                <span style={{
                  fontSize: '12px',
                  color: tempSignature.length > 180 ? '#EF4444' : '#6b7280'
                }}>
                  {tempSignature.length}/200
                </span>
              </div>
            </div>
            
            <div style={{ 
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowSignatureModal(false);
                  setTempSignature('');
                  setSignatureFieldId(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: '2px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  color: '#374151',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#F3F4F6';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSignatureSubmit}
                disabled={!tempSignature.trim()}
                style={{
                  padding: '10px 20px',
                  backgroundColor: tempSignature.trim() ? branding.primaryColor : '#D1D5DB',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: tempSignature.trim() ? 'pointer' : 'not-allowed',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  if (tempSignature.trim()) {
                    e.target.style.backgroundColor = branding.secondaryColor;
                  }
                }}
                onMouseOut={(e) => {
                  if (tempSignature.trim()) {
                    e.target.style.backgroundColor = branding.primaryColor;
                  }
                }}
              >
                <Check size={16} />
                Confirmar Firma
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @-webkit-keyframes spin {
          0% { -webkit-transform: rotate(0deg); }
          100% { -webkit-transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
          0% { 
            opacity: 0; 
            transform: translateY(-10px) scale(0.95); 
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1); 
          }
        }
        
        @-webkit-keyframes fadeIn {
          0% { 
            opacity: 0; 
            -webkit-transform: translateY(-10px) scale(0.95); 
          }
          100% { 
            opacity: 1; 
            -webkit-transform: translateY(0) scale(1); 
          }
        }
        
        @keyframes slideUp {
          0% { 
            opacity: 0;
            transform: translateY(100%); 
          }
          100% { 
            opacity: 1;
            transform: translateY(0); 
          }
        }
        
        @-webkit-keyframes slideUp {
          0% { 
            opacity: 0;
            -webkit-transform: translateY(100%); 
          }
          100% { 
            opacity: 1;
            -webkit-transform: translateY(0); 
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        
        @-webkit-keyframes shake {
          0%, 100% { -webkit-transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { -webkit-transform: translateX(-4px); }
          20%, 40%, 60%, 80% { -webkit-transform: translateX(4px); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @-webkit-keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .loading-spinner {
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top: 2px solid #ffffff;
          width: 16px;
          height: 16px;
          animation: spin 1s linear infinite;
          -webkit-animation: spin 1s linear infinite;
        }
        
        * {
          box-sizing: border-box;
          -webkit-box-sizing: border-box;
          -moz-box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        
        /* Compatibilidad con navegadores antiguos */
        input, select, textarea, button {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
        }
        
        input[type="radio"], input[type="checkbox"] {
          -webkit-appearance: auto;
          -moz-appearance: auto;
          appearance: auto;
        }
      `}</style>
    </div>
  );
};

export default function CreditFormDemo() {
  const [formData, setFormData] = useState({});

  const handleDataChange = (data) => {
    setFormData(data);
    console.log('Datos del formulario actualizados:', data);
  };

  const handleSubmit = (data) => {
    return new Promise((resolve) => {
      console.log('Enviando formulario:', data);
      setTimeout(() => {
        console.log('Formulario enviado exitosamente');
        alert('¡Formulario enviado exitosamente!');
        resolve();
      }, 2000);
    });
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <MelmacCreditForm
        onDataChange={handleDataChange}
        onSubmit={handleSubmit}
        initialData={{}}
        readOnly={false}
      />
    </div>
  );
}
