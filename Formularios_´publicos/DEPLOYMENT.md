# Guía de Despliegue - Melmac Credit Form

Esta guía proporciona instrucciones paso a paso para desplegar el sistema MelmacCreditForm en diferentes plataformas.

## Tabla de Contenidos

1. [Prerequisitos](#prerequisitos)
2. [Build Local](#build-local)
3. [Despliegue en Netlify](#despliegue-en-netlify)
4. [Despliegue en Vercel](#despliegue-en-vercel)
5. [Despliegue Manual en Servidor](#despliegue-manual-en-servidor)
6. [Variables de Entorno](#variables-de-entorno)
7. [Configuración de DNS](#configuración-de-dns)
8. [SSL/TLS](#ssltls)
9. [Monitoreo y Logs](#monitoreo-y-logs)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisitos

Antes de comenzar, asegúrate de tener instalado:

- Node.js >= 16.0.0
- npm >= 8.0.0 (o yarn >= 1.22.0)
- Git

Verificar versiones:
```bash
node --version
npm --version
git --version
```

---

## Build Local

### 1. Clonar el Repositorio

```bash
git clone https://github.com/your-org/melmac-credit-form.git
cd melmac-credit-form
```

### 2. Instalar Dependencias

```bash
npm install
```

O con yarn:
```bash
yarn install
```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Editar `.env` con tus valores específicos.

### 4. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### 5. Crear Build de Producción

```bash
npm run build
```

Los archivos optimizados se generarán en la carpeta `dist/`

### 6. Preview del Build

```bash
npm run preview
```

---

## Despliegue en Netlify

### Opción A: Deploy desde Git (Recomendado)

1. **Conectar Repositorio:**
   - Ir a https://app.netlify.com
   - Click en "Add new site" > "Import an existing project"
   - Conectar con GitHub/GitLab/Bitbucket
   - Seleccionar el repositorio

2. **Configurar Build:**
   ```
   Base directory: (dejar vacío)
   Build command: npm run build
   Publish directory: dist
   ```

3. **Variables de Entorno:**
   - Ir a "Site settings" > "Environment variables"
   - Agregar las variables del archivo `.env.example`

4. **Deploy:**
   - Click en "Deploy site"
   - Netlify creará automáticamente la URL

### Opción B: Deploy Manual

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Build local
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Configuración Avanzada Netlify

El archivo `netlify.toml` ya incluye:
- Redirects para SPA
- Headers de seguridad
- Optimizaciones de caché
- Node version específica

---

## Despliegue en Vercel

### Opción A: Deploy desde Git (Recomendado)

1. **Conectar Repositorio:**
   - Ir a https://vercel.com
   - Click en "Add New..." > "Project"
   - Import desde GitHub/GitLab/Bitbucket
   - Seleccionar el repositorio

2. **Configuración Automática:**
   - Vercel detecta automáticamente Vite
   - Las configuraciones en `vercel.json` se aplican automáticamente

3. **Variables de Entorno:**
   - Agregar en "Project Settings" > "Environment Variables"
   - Copiar desde `.env.example`

4. **Deploy:**
   - Click en "Deploy"
   - Vercel construye y despliega automáticamente

### Opción B: Deploy con CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy a Producción
vercel --prod
```

### Configuración de Dominios

1. Ir a "Settings" > "Domains"
2. Agregar tu dominio personalizado
3. Configurar DNS según las instrucciones

---

## Despliegue Manual en Servidor

### Prerequisitos del Servidor

- Servidor con Ubuntu 20.04+ / CentOS 8+
- Nginx o Apache
- Node.js instalado
- Certificado SSL (Let's Encrypt recomendado)

### Pasos de Instalación

1. **Preparar el Build:**
```bash
# En tu máquina local
npm run build

# Comprimir
tar -czf dist.tar.gz dist/
```

2. **Copiar al Servidor:**
```bash
scp dist.tar.gz usuario@servidor:/var/www/
```

3. **En el Servidor:**
```bash
cd /var/www
tar -xzf dist.tar.gz
chown -R www-data:www-data dist/
```

4. **Configurar Nginx:**

Crear `/etc/nginx/sites-available/melmac-credit-form`:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    root /var/www/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Caché para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

5. **Activar Sitio:**
```bash
ln -s /etc/nginx/sites-available/melmac-credit-form /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Configurar SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
sudo systemctl reload nginx
```

---

## Variables de Entorno

### Variables Requeridas

```bash
# API Configuration
VITE_API_URL=https://api.your-bank.com
VITE_API_KEY=your_api_key_here

# PDF Service
VITE_PDF_SERVICE_URL=https://pdf-service.your-bank.com
```

### Variables Opcionales

```bash
# Analytics
VITE_ANALYTICS_ID=UA-XXXXXXXXX-X
VITE_GTM_ID=GTM-XXXXXXX

# Feature Flags
VITE_ENABLE_PDF_PREVIEW=true
VITE_ENABLE_AUTOSAVE=true

# Debug
VITE_DEBUG=false
```

### Configuración por Entorno

**Desarrollo:**
```bash
VITE_ENV=development
VITE_API_URL=http://localhost:3001
VITE_DEBUG=true
```

**Staging:**
```bash
VITE_ENV=staging
VITE_API_URL=https://staging-api.your-bank.com
VITE_DEBUG=true
```

**Producción:**
```bash
VITE_ENV=production
VITE_API_URL=https://api.your-bank.com
VITE_DEBUG=false
```

---

## Configuración de DNS

### Para Netlify

Agregar estos registros DNS:

```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: your-site.netlify.app
```

### Para Vercel

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Para Servidor Propio

```
Type: A
Name: @
Value: [IP de tu servidor]

Type: CNAME
Name: www
Value: tu-dominio.com
```

---

## SSL/TLS

### Let's Encrypt (Gratis)

```bash
# Ubuntu/Debian
sudo apt install certbot
sudo certbot certonly --webroot -w /var/www/dist -d tu-dominio.com
```

### Renovación Automática

```bash
# Agregar a crontab
0 0 1 * * /usr/bin/certbot renew --quiet
```

---

## Monitoreo y Logs

### Netlify

- Logs: Dashboard > Deploys > [Seleccionar deploy] > Deploy log
- Analytics: Dashboard > Analytics
- Forms: Dashboard > Forms

### Vercel

- Logs: Dashboard > Deployments > [Seleccionar deployment] > Logs
- Analytics: Dashboard > Analytics
- Real-time logs: `vercel logs`

### Servidor Propio

```bash
# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# System logs
journalctl -u nginx -f
```

### Configurar Monitoreo

Servicios recomendados:
- Sentry (errores)
- LogRocket (sesiones de usuario)
- Google Analytics (métricas)
- UptimeRobot (disponibilidad)

---

## Troubleshooting

### Error: Module not found

**Problema:** Dependencias faltantes tras deploy

**Solución:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Error: Blank page after deploy

**Problema:** Rutas incorrectas o base URL

**Solución en `vite.config.js`:**
```javascript
export default defineConfig({
  base: '/', // O tu subdirectorio
  // ...
})
```

### Error: localStorage not available

**Problema:** Auto-guardado falla en ciertos navegadores

**Solución:** Ya está manejado en el código. Verificar que no se esté forzando localStorage.

### Error: Build fails with memory issues

**Problema:** Servidor sin suficiente RAM

**Solución:**
```bash
# Aumentar límite de memoria Node.js
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Error: CORS issues

**Problema:** API no acepta requests desde el dominio

**Solución:** Configurar CORS en el backend:
```javascript
// Express.js ejemplo
app.use(cors({
  origin: 'https://tu-dominio.com',
  credentials: true
}));
```

### Error: PDF preview not working

**Problema:** Servicio de PDF no responde

**Solución:**
1. Verificar `VITE_PDF_SERVICE_URL`
2. Verificar que el servicio esté corriendo
3. Revisar console para errores específicos

### Performance Issues

**Problema:** Aplicación lenta

**Solución:**
1. Verificar build optimization:
```javascript
// vite.config.js
build: {
  minify: 'terser',
  terserOptions: {
    compress: {
      drop_console: true
    }
  }
}
```

2. Habilitar compresión en servidor:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

3. Usar CDN para assets estáticos

---

## Checklist Final de Despliegue

- [ ] Build local funciona correctamente
- [ ] Variables de entorno configuradas
- [ ] SSL/TLS configurado
- [ ] DNS apuntando correctamente
- [ ] Headers de seguridad configurados
- [ ] Compresión habilitada
- [ ] Caché configurado
- [ ] Backup strategy definida
- [ ] Monitoreo configurado
- [ ] Logs accesibles
- [ ] Documentación actualizada
- [ ] Equipo notificado

---

## Contacto y Soporte

Para problemas o preguntas adicionales:

- Email: devops@melmac-docs.com
- Slack: #melmac-support
- Issues: https://github.com/your-org/melmac-credit-form/issues

---

**Última actualización:** 2025-01-01
