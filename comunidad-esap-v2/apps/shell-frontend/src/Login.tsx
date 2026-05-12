import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Lock, Mail, ChevronRight, Fingerprint } from 'lucide-react';
import { SessionUtil } from './lib/session';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Campos incompletos', { description: 'Por favor, ingresa correo y contraseña.' });
      return;
    }

    setIsLoading(true);
    try {
      // Usamos el API Gateway para que rutee la petición a Django
      const response = await fetch('/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.status) {
        // Almacenamos la sesión usando la misma estructura que Angular
        SessionUtil.setSession(data.data.parameters);
        toast.success('¡Bienvenido de nuevo!');
        navigate('/'); // Redirigir al Dashboard principal
      } else {
        toast.error('Error de autenticación', { description: data.message || 'Credenciales inválidas.' });
      }
    } catch (error) {
      toast.error('Error de conexión', { description: 'No se pudo contactar con el servidor.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* Lado Izquierdo - Branding & Glassmorphism */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-indigo-900 flex-col justify-between p-12">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-violet-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
              <Fingerprint className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Melmac <span className="text-emerald-400">DOCS</span></span>
          </div>

          <div className="space-y-6 max-w-lg">
            <h1 className="text-5xl font-extrabold text-white leading-tight tracking-tight">
              Gestión Documental & <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">
                KYC Avanzado
              </span>
            </h1>
            <p className="text-indigo-100 text-lg font-medium leading-relaxed">
              El ecosistema definitivo para firmas electrónicas, validación de identidad y flujos de trabajo inteligentes. Todo en una sola plataforma multitenant.
            </p>
          </div>
        </div>

        {/* Glassmorphic Card Showcase */}
        <div className="relative z-10 w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            </div>
            <span className="text-xs font-mono text-indigo-200 bg-white/5 px-2 py-1 rounded">Sistema 100% Operativo</span>
          </div>
          <div className="space-y-3">
            <div className="h-2 w-3/4 bg-white/20 rounded"></div>
            <div className="h-2 w-1/2 bg-white/20 rounded"></div>
            <div className="h-2 w-5/6 bg-white/20 rounded"></div>
          </div>
        </div>
      </div>

      {/* Lado Derecho - Formulario de Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Bienvenido de nuevo</h2>
            <p className="text-slate-500 font-medium">Ingresa tus credenciales para acceder a tu entorno corporativo.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                    placeholder="fabiana@tuproyecto.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Contraseña</label>
                  <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">¿Olvidaste tu contraseña?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-md disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Verificando credenciales...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Iniciar sesión
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-xs text-slate-400 font-medium">
              Términos y Condiciones · Política de Privacidad<br/>
              © 2026 Melmac S.A.S. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
