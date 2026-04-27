# 🏦 Melmac Credit Form - Sistema de Formularios Dinámicos

Sistema profesional de solicitudes de crédito con vista PDF en tiempo real, diseñado para instituciones financieras (bancos, fintech, cooperativas).

## 🌟 Características Principales

### ✅ Formularios 100% Dinámicos
- Agregar/quitar campos vía configuración JSON
- Sin necesidad de tocar código
- Validación automática personalizable
- Múltiples tipos de campos soportados

### 🎨 Personalización Completa
- Branding personalizable (colores, logo, textos)
- Configurable desde backend administrativo
- White-label ready
- Temas personalizados por institución

### 💾 Auto-guardado Inteligente
- Guardado automático en localStorage
- Recuperación automática de sesiones
- Protección contra pérdida de datos
- Advertencias de cambios sin guardar

### 📄 Vista PDF en Tiempo Real
- Preview del PDF mientras se completa
- Sincronización instantánea de campos
- Controles de zoom y navegación
- Vista responsive (móvil y desktop)

### 🔒 Seguridad OWASP Compliant
- Sanitización contra XSS
- Validación robusta de datos
- Rate limiting
- Prevención de inyección de código

### 📱 100% Responsive
- Optimizado para móviles
- Diseño adaptativo
- Touch-friendly
- Cross-browser compatible (incluye IE)

## 🚀 Instalación Rápida

### Prerequisitos
```bash
node >= 16.0.0
npm >= 8.0.0
```

### Instalación
```bash
# Clonar el repositorio
git clone https://github.com/your-org/melmac-credit-form.git
cd melmac-credit-form

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El servidor se iniciará en `http://localhost:3000`

## 📦 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Linter
```

## 🎯 Uso Básico

### Importación Simple

```jsx
import { MelmacCreditForm } from './MelmacCreditForm';

function App() {
  const handleDataChange = (data) => {
    console.log('Datos actualizados:', data);
  };

  const handleSubmit = async (data) => {
    // Enviar a tu backend
    const response = await fetch('/api/credit-applications', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  };

  return (
    <MelmacCreditForm 
      onDataChange={handleDataChange}
      onSubmit={handleSubmit}
      initialData={{}}
      readOnly={false}
    />
  );
}
```

### Props Disponibles

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `config` | Object | No | Configuración del formulario (usa default si no se provee) |
| `onDataChange` | Function | No | Callback cuando cambian los datos |
| `onSubmit` | Function | No | Callback al enviar el formulario |
| `initialData` | Object | No | Datos precargados |
| `readOnly` | Boolean | No | Modo solo lectura |

## ⚙️ Configuración

### Estructura de Configuración

```javascript
const customConfig = {
  branding: {
    companyName: 'Mi Banco',
    logo: 'https://mi-banco.com/logo.png',
    primaryColor: '#0066CC',
    secondaryColor: '#004499',
    accentColor: '#00AA44',
    description: 'Sistema de solicitudes...',
    instructions: 'Complete todos los campos...',
    contactInfo: {
      phone: '(601) 123-4567',
      email: 'info@mibanco.com',
      website: 'www.mibanco.com'
    }
  },
  formData: {
    title: 'Solicitud de Crédito',
    subtitle: 'Complete el formulario...',
    sections: [
      {
        id: 'datos_personales',
        title: 'Datos Personales',
        icon: User,
        fields: [...]
      }
    ]
  },
  pagesConfig: [...]
};
```

### Tipos de Campos Soportados

- **text**: Campos de texto simple
- **email**: Email con validación RFC 5322
- **tel**: Teléfono (formato internacional)
- **textarea**: Texto multilínea
- **select**: Dropdown con opciones
- **radio**: Botones de radio
- **checkbox**: Casillas de verificación
- **date**: Selector de fecha
- **number**: Números con min/max
- **currency**: Montos con formato
- **signature**: Firma digital segura

### Ejemplo de Campo

```javascript
{
  id: 'email',
  type: 'email',
  label: 'Correo Electrónico',
  placeholder: 'juan@email.com',
  required: true,
  pdfMapping: { 
    page: 1, 
    x: 460, 
    y: 280, 
    width: 200, 
    height: 20 
  }
}
```

## 🔧 Personalización Avanzada

### Colores y Branding

```javascript
const branding = {
  primaryColor: '#0066CC',      // Color principal
  secondaryColor: '#004499',    // Color secundario
  accentColor: '#00AA44',       // Color de acento (éxito)
  logo: 'https://...'           // URL del logo
};
```

### Páginas del Formulario

```javascript
const pagesConfig = [
  {
    title: "Información Personal",
    description: "Datos básicos",
    sections: ['datos_personales', 'contacto']
  },
  {
    title: "Información Laboral",
    description: "Datos de empleo",
    sections: ['informacion_laboral']
  }
];
```

## 🚀 Despliegue

### Netlify

1. Conecta tu repositorio
2. Configuración:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Deploy

### Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Build Manual

```bash
# Crear build de producción
npm run build

# Los archivos estarán en /dist
# Sirve con cualquier servidor web estático
```

## 📁 Estructura del Proyecto

```
melmac-credit-form/
├── src/
│   ├── MelmacCreditForm.jsx   # Componente principal
│   ├── main.jsx                # Punto de entrada
│   └── index.css               # Estilos globales
├── public/                     # Archivos públicos
├── dist/                       # Build de producción
├── index.html                  # HTML principal
├── package.json                # Dependencias
├── vite.config.js             # Configuración Vite
├── netlify.toml               # Config Netlify
├── vercel.json                # Config Vercel
├── .env.example               # Variables de entorno
└── README.md                  # Este archivo
```

## 🔐 Seguridad

### Implementaciones de Seguridad

- ✅ Sanitización de inputs (XSS prevention)
- ✅ Validación de datos robusta
- ✅ Protección CSRF
- ✅ Rate limiting en auto-guardado
- ✅ Validación de tamaños máximos
- ✅ Cifrado básico localStorage
- ✅ Detección de patrones maliciosos

### Validaciones Implementadas

```javascript
// Email (RFC 5322 compliant)
isValidEmail(email)

// Teléfono (7-15 dígitos)
isValidPhone(phone)

// Patrones maliciosos
containsMaliciousPatterns(input)

// Sanitización
sanitizeString(input)
sanitizeObject(obj)
```

## 📊 API de Callbacks

### onDataChange

```javascript
const handleDataChange = (formData) => {
  // formData: Object con todos los campos
  console.log('Campos completados:', Object.keys(formData).length);
  
  // Guardar en tu estado/redux
  dispatch(updateFormData(formData));
};
```

### onSubmit

```javascript
const handleSubmit = async (formData) => {
  try {
    // Validar datos adicionales
    if (!isValidBusinessLogic(formData)) {
      throw new Error('Validación personalizada falló');
    }
    
    // Enviar a backend
    const response = await api.post('/applications', formData);
    
    // Manejar respuesta
    if (response.ok) {
      showSuccessMessage();
    }
  } catch (error) {
    showErrorMessage(error.message);
  }
};
```

## 🎨 Personalización de UI

### Animaciones

Todas las animaciones están implementadas en CSS y son completamente personalizables:

- `fadeIn`: Fade in suave
- `slideUp`: Slide desde abajo
- `shake`: Efecto de shake para errores
- `pulse`: Efecto de pulsación
- `spin`: Rotación (loading)

### Temas Personalizados

```javascript
// Tema corporativo
const corporateTheme = {
  primaryColor: '#1E40AF',
  secondaryColor: '#1E3A8A',
  accentColor: '#10B981'
};

// Tema fintech
const fintechTheme = {
  primaryColor: '#7C3AED',
  secondaryColor: '#6D28D9',
  accentColor: '#F59E0B'
};
```

## 🐛 Troubleshooting

### localStorage no disponible

El componente detecta automáticamente si localStorage está disponible. En modo incógnito o si está bloqueado, el auto-guardado se deshabilitará sin errores.

### Errores de validación

```javascript
// Los errores se muestran automáticamente
// Acceder programáticamente:
const errors = validateCurrentPage();
console.log('Errores:', errors);
```

### Problemas de responsive

El componente ajusta automáticamente su layout en breakpoint `1024px`. Para personalizar:

```javascript
const checkMobile = () => {
  const customBreakpoint = 768; // Tu breakpoint
  setIsMobile(window.innerWidth < customBreakpoint);
};
```

## 📝 Variables de Entorno

Crear `.env` en la raíz:

```bash
VITE_API_URL=https://api.tu-banco.com
VITE_PDF_SERVICE_URL=https://pdf.tu-banco.com
VITE_ANALYTICS_ID=UA-XXXXXXXXX-X
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

MIT License - ver archivo `LICENSE` para detalles

## 👥 Soporte

- 📧 Email: soporte@melmac-docs.com
- 📚 Documentación: https://docs.melmac-docs.com
- 🐛 Issues: https://github.com/your-org/melmac-credit-form/issues

## 🙏 Agradecimientos

- React Team
- Vite
- Lucide Icons
- Toda la comunidad open source

---

**Hecho con ❤️ por Melmac DOCS Team**
