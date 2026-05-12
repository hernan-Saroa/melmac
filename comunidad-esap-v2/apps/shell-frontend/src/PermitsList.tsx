import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings, Search, Edit2, ShieldAlert } from 'lucide-react';
import { fetchLegacy } from './lib/api';

interface PermitData {
  id: number;
  name: string;
  description: string;
  status: boolean;
}

export default function PermitsList() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: permits = [], isLoading, isError } = useQuery<PermitData[]>({
    queryKey: ['permits_list'],
    queryFn: async () => {
      const data = await fetchLegacy('/permits/');
      return Array.isArray(data) ? data : data.data || [];
    }
  });

  const filteredPermits = permits.filter(p => 
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            Configuración de Permisos
          </h2>
          <p className="text-sm text-slate-500 mt-1">Diccionario global de capacidades del sistema</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar permiso por nombre..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre del Permiso</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Cargando diccionario...</td></tr>
              ) : isError ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-rose-500">Error al cargar la información.</td></tr>
              ) : filteredPermits.length > 0 ? (
                filteredPermits.map((permit) => (
                  <tr key={permit.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">#{permit.id}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">{permit.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{permit.description || 'Sin descripción'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        permit.status ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {permit.status ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No se encontraron permisos.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
