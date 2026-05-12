import { SessionUtil } from './session';

export async function fetchLegacy(endpoint: string, options: RequestInit = {}) {
  const token = SessionUtil.getToken();
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  
  if (token) {
    headers.set('Authorization', `Token ${token}`);
  }

  // Las rutas deben ir con /api/ para pasar por el Proxy de Vite -> NestJS -> Django
  const url = endpoint.startsWith('/') ? `/api${endpoint}` : `/api/${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Si la sesión expiró (401), la manejamos globalmente
    if (response.status === 401) {
      console.warn('Sesión expirada o inválida. Token regenerado o eliminado.');
      SessionUtil.removeSession();
      window.location.href = '/login'; // Forzamos el re-login
    }
    throw new Error(`Error en la petición: ${response.statusText}`);
  }

  return response.json();
}
