# Arquitectura del Sistema - Melmac Credit Form

## Visión General

MelmacCreditForm es un sistema de formularios dinámicos diseñado para instituciones financieras que requiere procesamiento de solicitudes de crédito con vista PDF en tiempo real.

## Arquitectura de Componentes

### Componente Principal: MelmacCreditForm

```
MelmacCreditForm
├── Props Interface
│   ├── config: Object (configuración completa)
│   ├── onDataChange: Function (callback de cambios)
│   ├── onSubmit: Function (callback de envío)
│   ├── initialData: Object (datos iniciales)
│   └── readOnly: Boolean (modo lectura)
│
├── State Management
│   ├── answers: Object (datos del formulario)
│   ├── errors: Object (errores de validación)
│   ├── currentPage: Number (página actual)
│   ├── signature: String (firma digital)
│   ├── showPDF: Boolean (visibilidad PDF)
│   ├── isMobile: Boolean (detección móvil)
│   ├── highlightedField: String (campo destacado)
│   ├── focusedFields: Object (campos con foco)
│   ├── isSubmitting: Boolean (estado de envío)
│   ├── saveStatus: String ('idle'|'saving'|'saved'|'error')
│   └── hasUnsavedChanges: Boolean (cambios pendientes)
│
├── Managers & Utilities
│   ├── AutoSaveManager (clase)
│   │   ├── save(): Boolean
│   │   ├── load(): Object
│   │   ├── clear(): Boolean
│   │   └── getInfo(): Object
│   │
│   ├── Security Utilities
│   │   ├── sanitizeString()
│   │   ├── sanitizeObject()
│   │   ├── isValidEmail()
│   │   ├── isValidPhone()
│   │   ├── containsMaliciousPatterns()
│   │   ├── encodeData()
│   │   └── decodeData()
│   │
│   └── Custom Hooks
│       └── useDebounce()
│
└── UI Components (renderizados internamente)
    ├── Header (título y progreso)
    ├── Progress Bar (multi-nivel)
    ├── PDF Toggle Controls
    ├── Form Sections (dinámicas)
    ├── Field Renderers (por tipo)
    ├── Navigation Buttons
    ├── Signature Modal
    └── PDF Preview Panel
```

## Flujo de Datos

### 1. Inicialización

```
Usuario carga aplicación
    ↓
Component Mount
    ↓
Cargar configuración (config prop o default)
    ↓
Verificar localStorage para auto-save
    ↓
Combinar initialData + savedData
    ↓
Renderizar página actual
```

### 2. Interacción con Campos

```
Usuario ingresa datos en campo
    ↓
onChange event
    ↓
Sanitización (sanitizeString)
    ↓
Validación de patrones maliciosos
    ↓
Update state (answers)
    ↓
Trigger callbacks
    ├── onDataChange(newAnswers)
    └── debouncedSave(newAnswers)
    ↓
Limpiar errores de ese campo
    ↓
Highlight field (efecto visual)
    ↓
Update PDF preview
```

### 3. Auto-guardado

```
Cambio en formulario
    ↓
debouncedSave (1000ms delay)
    ↓
AutoSaveManager.save()
    ├── Validar tamaño de datos
    ├── Crear objeto con timestamp
    ├── Stringify y guardar en localStorage
    └── Return success/failure
    ↓
Update UI indicators
    ├── saveStatus = 'saved'
    ├── lastSaved = timestamp
    └── hasUnsavedChanges = false
```

### 4. Navegación entre Páginas

```
Usuario hace clic en "Continuar"
    ↓
validateCurrentPage()
    ├── Iterar sobre campos visibles
    ├── Ejecutar validateField() por cada campo
    ├── Acumular errores
    └── Return { isValid, firstErrorFieldId }
    ↓
¿Errores encontrados?
    ├── SÍ: Scroll a primer campo con error
    │       Focus en ese campo
    │       Mostrar errores
    │
    └── NO: ¿Es última página?
            ├── SÍ: handleSubmit()
            └── NO: setCurrentPage(currentPage + 1)
                    Scroll to top
```

### 5. Envío Final

```
Usuario hace clic en "Enviar"
    ↓
Validar página actual
    ↓
¿Válida?
    ├── NO: Mostrar errores
    │
    └── SÍ: setIsSubmitting(true)
            ↓
            onSubmit(answers) [callback prop]
            ↓
            ¿Promise resolved?
            ├── Success: Show success message
            │           Clear form (opcional)
            │           Clear localStorage
            │
            └── Error: Show error message
                       setIsSubmitting(false)
```

## Seguridad

### Capas de Protección

1. **Input Sanitization**
   - Escapar caracteres HTML peligrosos
   - Validación de patrones maliciosos
   - Límites de longitud por tipo de campo

2. **Validation**
   - Email: RFC 5322 compliant
   - Phone: 7-15 dígitos
   - Currency: Solo números y separadores
   - Campos requeridos

3. **Storage Security**
   - Cifrado base64 (ofuscación)
   - Límite de tamaño (500KB default)
   - Expiración automática (7 días)
   - Versionado de datos

4. **DoS Prevention**
   - Rate limiting en auto-save
   - Tamaño máximo de datos
   - Debounce en operaciones costosas

## Responsive Design

### Breakpoints

```
Mobile: < 1024px
  - Vista single column
  - PDF toggle a fullscreen overlay
  - Controles simplificados
  - Touch-optimized

Desktop: >= 1024px
  - Split view (form | PDF)
  - PDF collapsible
  - Keyboard shortcuts activos
  - Hover states
```

### Estrategia Mobile-First

1. Base styles para móvil
2. Media queries para desktop
3. Progressive enhancement
4. Touch-friendly targets (min 44px)

## Gestión de Estado

### Estado Local (useState)

```javascript
// Datos del formulario
answers: Object
errors: Object

// UI State
currentPage: Number
showPDF: Boolean
pdfCollapsed: Boolean
isMobile: Boolean
highlightedField: String
focusedFields: Object

// Modal State
showSignatureModal: Boolean
signatureFieldId: String
tempSignature: String

// Auto-save State
lastSaved: Number
saveStatus: String
hasUnsavedChanges: Boolean
savedDataInfo: Object
```

### No State Management Library

Razones para no usar Redux/Context:
- Component auto-contenido
- Estado no compartido con otros componentes
- Callback props suficientes para comunicación con padre
- Menor complejidad
- Mejor performance

## Configuración Dinámica

### Estructura del Objeto Config

```typescript
interface Config {
  branding: {
    companyName: string;
    logo: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    description: string;
    instructions: string;
    contactInfo: {
      phone: string;
      email: string;
      website: string;
    };
    disclaimer: string;
  };
  
  formData: {
    title: string;
    subtitle: string;
    sections: Section[];
  };
  
  pagesConfig: PageConfig[];
}

interface Section {
  id: string;
  title: string;
  icon: Component;
  fields: Field[];
}

interface Field {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: Option[];
  min?: number;
  max?: number;
  rows?: number;
  pdfMapping: PDFMapping;
}

interface PDFMapping {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}
```

## Performance

### Optimizaciones Implementadas

1. **Debouncing**
   - Auto-save: 1000ms
   - Búsqueda: 300ms (si se implementa)
   
2. **Memoization**
   - useCallback para funciones costosas
   - Evitar re-renders innecesarios

3. **Lazy Rendering**
   - Solo renderizar campos de página actual
   - Conditional rendering para PDF

4. **Event Delegation**
   - Listeners en nivel superior cuando es posible

5. **CSS Transitions**
   - Hardware acceleration (transform, opacity)
   - will-change para animaciones conocidas

## Extensibilidad

### Agregar Nuevos Tipos de Campo

```javascript
// 1. Agregar tipo al switch en renderField()
case 'nuevo_tipo':
  return (
    <div>
      {/* Implementación del campo */}
    </div>
  );

// 2. Agregar validación en validateField()
case 'nuevo_tipo':
  // Lógica de validación
  break;

// 3. Agregar icono en getFieldIcon()
case 'nuevo_tipo':
  return <NuevoIcon {...iconProps} />;
```

### Integrar con Backend

```javascript
// Ejemplo de integración
const handleSubmit = async (formData) => {
  try {
    const response = await fetch('/api/credit-applications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        ...formData,
        metadata: {
          source: 'web',
          version: '1.0.0',
          timestamp: Date.now()
        }
      })
    });
    
    if (!response.ok) throw new Error('Submit failed');
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error submitting:', error);
    throw error;
  }
};
```

## Testing Strategy

### Unit Tests

```javascript
// AutoSaveManager
- save() con datos válidos
- save() con datos excediendo límite
- load() con datos válidos
- load() con datos corruptos
- clear()

// Validation Functions
- isValidEmail() con emails válidos/inválidos
- isValidPhone() con números válidos/inválidos
- sanitizeString() con strings maliciosos
- validateField() por cada tipo de campo
```

### Integration Tests

```javascript
// Form Flow
- Navegación entre páginas
- Validación de campos requeridos
- Auto-guardado y recuperación
- Submit con todos los campos válidos
- Submit con campos inválidos
```

### E2E Tests

```javascript
// User Journeys
- Completar formulario completo
- Cerrar y reabrir navegador (auto-save)
- Cambiar entre móvil y desktop
- Completar con errores y corregir
```

## Browser Compatibility

### Soporte Objetivo

- Chrome/Edge: últimas 2 versiones
- Firefox: últimas 2 versiones
- Safari: últimas 2 versiones
- iOS Safari: iOS 13+
- Chrome Android: última versión

### Polyfills Necesarios

```javascript
// Si se necesita soporte IE11:
- @babel/polyfill
- react-app-polyfill/ie11
- Array.from
- Promise
- Object.assign
```

### Feature Detection

```javascript
// localStorage
if (typeof window !== 'undefined' && window.localStorage) {
  // usar localStorage
} else {
  // fallback a memoria
}

// smooth scroll
if ('scrollBehavior' in document.documentElement.style) {
  element.scrollIntoView({ behavior: 'smooth' });
} else {
  element.scrollIntoView();
}
```

## Deployment Architecture

### Production Stack

```
User Browser
    ↓
CDN (Cloudflare/Netlify Edge/Vercel Edge)
    ↓
Static Hosting (Netlify/Vercel/S3)
    ↓
API Gateway (si backend integrado)
    ↓
Backend Services (Node.js/Python/etc)
    ↓
Database (PostgreSQL/MongoDB)
```

### Build Process

```
Source Code
    ↓
Vite Build
    ├── Tree shaking
    ├── Code splitting
    ├── Minification
    ├── CSS optimization
    └── Asset hashing
    ↓
dist/
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   ├── vendor-[hash].js
    │   └── index-[hash].css
    └── images/
```

## Monitoring & Analytics

### Métricas Recomendadas

1. **Performance**
   - Time to Interactive (TTI)
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Cumulative Layout Shift (CLS)

2. **Usage**
   - Formularios iniciados
   - Formularios completados
   - Tasa de abandono por página
   - Tiempo promedio de completado
   - Campos con más errores

3. **Errors**
   - JavaScript errors
   - Failed submissions
   - Validation errors
   - localStorage failures

### Herramientas

- Google Analytics 4
- Sentry (error tracking)
- LogRocket (session replay)
- Lighthouse CI (performance)

## Futuras Mejoras

### Roadmap

1. **v1.1**
   - Generación de PDF real (server-side)
   - Exportar a múltiples formatos
   - Internacionalización (i18n)

2. **v1.2**
   - Drag & drop de archivos
   - Firma digital con canvas
   - Validaciones personalizadas avanzadas

3. **v2.0**
   - Multi-step wizard mejorado
   - Conditional fields
   - Integración con eSignature services
   - Modo offline completo (PWA)

---

**Versión:** 1.0.0
**Última actualización:** 2025-01-01
**Autor:** Melmac DOCS Team
