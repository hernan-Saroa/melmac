import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, FileText, Home, Settings, Search, Bell, User, FilePlus2, Users, Contact, Activity, Smartphone, Folder, History, Layers, MapIcon, Briefcase, LayoutTemplate, FileSpreadsheet, LogOut, Fingerprint } from 'lucide-react';
import FloAdvisorChat from './FloAdvisorChat';
import { SessionUtil } from './lib/session';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const session = SessionUtil.getSession();

  useEffect(() => {
    if (!session || !session.token) {
      navigate('/login');
    }
  }, [navigate, session]);

  const handleLogout = () => {
    SessionUtil.removeSession();
    navigate('/login');
  };

  const allNavItems = [
    // --- SUPERADMIN (role === 1) ---
    { name: 'Inicio', path: '/', icon: Home, role: 1 },
    { name: 'Estadísticas Globales', path: '/stats', icon: Activity, role: 1 },
    { name: 'Empresas', path: '/enterprises', icon: Briefcase, role: 1 },
    { name: 'Plataforma', path: '/settings', icon: Settings, role: 1 },
    { name: 'APIs', path: '/apis', icon: LayoutTemplate, role: 1 },

    // --- CLIENTES (role === 2 o 3) filtrados por session.permission ---
    { name: 'Estadísticas', path: '/', icon: Activity, permission: 62 },
    { name: 'GeoPortal', path: '/geoportal', icon: MapIcon, permission: 60 },
    { name: 'Mi Unidad', path: '/drive', icon: Folder, permission: 68 },
    { name: 'Plantillas', path: '/forms', icon: LayoutTemplate, permission: 14 },
    { name: 'Informes', path: '/reports', icon: FileSpreadsheet, permission: 59 },
    { name: 'Proyectos', path: '/projects', icon: Briefcase, permission: 45 },
    { name: 'Servicio en Campo', path: '/tasks', icon: MapIcon, permission: 45 },
    { name: 'Biometría y OCR', path: '/enroll', icon: Fingerprint, permission: 45 },
    { name: 'Dispositivos', path: '/devices', icon: Smartphone, permission: 24 },
    { name: 'Usuarios', path: '/users', icon: Users, permission: 1 },
    { name: 'Roles', path: '/roles', icon: Users, permission: 9 },
    { name: 'Permisos', path: '/permits', icon: Settings, permission: 6 },
    { name: 'Contactos', path: '/contacts', icon: Contact, permission: 73 },
    { name: 'Planes', path: '/plans', icon: Layers, permission: 72 },
    { name: 'Auditoría', path: '/traceability', icon: History, permission: 53 },
    { name: 'Configuración', path: '/settings', icon: Settings, permission: 56 },
  ];

  const userRole = session?.role || 2;
  const userPermissions = session?.permission || [];

  const navItems = allNavItems.filter(item => {
    if (userRole === 1) {
      // El SuperAdmin SOLO ve sus ítems exclusivos
      return item.role === 1;
    } else {
      // Los clientes SOLO ven los ítems para los cuales tienen permisos explícitos
      return item.permission && userPermissions.includes(item.permission);
    }
  });

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      
      {/* Sidebar Mobile Toggle */}
      <button 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-sm text-slate-600"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 bg-white w-64 border-r border-slate-200 transform transition-transform duration-300 ease-in-out z-40 lg:relative lg:translate-x-0 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Melmac DOCS
          </span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Gestión Documental</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm shadow-sm uppercase">
                {session?.first_name ? session.first_name[0] : 'U'}
              </div>
              <div className="truncate max-w-[130px]">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {session?.first_name || 'Usuario'} {session?.last_name || ''}
                </p>
                <p className="text-xs text-slate-500 truncate" title={session?.email}>
                  {session?.email || 'SAROA S.A.S.'}
                </p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center flex-1">
            <div className="hidden lg:flex w-full max-w-md ml-4">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar en toda la plataforma..."
                  className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 ml-4">
            <button className="text-slate-400 hover:text-slate-500 relative p-2 rounded-full hover:bg-slate-50 transition-colors">
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
              <Bell className="h-5 w-5" />
            </button>
            <button className="text-slate-400 hover:text-slate-500 p-2 rounded-full hover:bg-slate-50 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-auto bg-slate-50/50">
          <Outlet />
        </div>
        
        {/* Widget Global FLO AI */}
        <FloAdvisorChat />
      </main>

    </div>
  );
}
