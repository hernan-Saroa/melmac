import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Folder, Search, MoreVertical, File, ShieldAlert, Share2, Eye, Trash2, LayoutGrid, List } from 'lucide-react';
import { toast } from 'sonner';
import { fetchLegacy } from './lib/api';
import * as Dialog from '@radix-ui/react-dialog';

interface EnvelopeData {
  id: number;
  name: string;
  status: number;
  created_at: string;
  updated_at: string;
  user_name: string;
  document_count: number;
}

const statusMap: Record<number, { label: string, color: string }> = {
  1: { label: 'Carga de Documento', color: 'bg-blue-100 text-blue-700' },
  2: { label: 'Definir Participantes', color: 'bg-amber-100 text-amber-700' },
  3: { label: 'Configurar Envío', color: 'bg-purple-100 text-purple-700' },
  4: { label: 'Asignar Campos', color: 'bg-indigo-100 text-indigo-700' },
  5: { label: 'Diligenciamiento', color: 'bg-orange-100 text-orange-700' },
  6: { label: 'Finalizado', color: 'bg-emerald-100 text-emerald-700' },
  7: { label: 'Eliminado', color: 'bg-rose-100 text-rose-700' },
};

export default function FolderList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [envelopeToDelete, setEnvelopeToDelete] = useState<number | null>(null);

  // Obtener sobres/carpetas usando el Proxy Hacia Django
  const { data: envelopesData = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['envelopes'],
    queryFn: async () => {
      // Intentamos traer todo el listado o limitamos a 50 para no sobrecargar
      const data = await fetchLegacy(`/envelope/?_offset=0&_limit=50`);
      return data.data || [];
    }
  });

  const handleDelete = async (id: number) => {
    try {
      // Llama al stateEnvelope(7) tal como lo hacía el frontend viejo
      await fetchLegacy('/envelope/state/', {
        method: 'POST',
        body: JSON.stringify({ id, state: 7 })
      });
      toast.success('Carpeta enviada a la papelera');
      setEnvelopeToDelete(null);
      refetch();
    } catch (error) {
      toast.error('Error al intentar eliminar la carpeta');
    }
  };

  const filteredEnvelopes = (envelopesData as EnvelopeData[]).filter(env => {
    const nameMatch = (env.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch && env.status !== 7; // Ocultar los eliminados por defecto
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Header & Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Folder className="w-6 h-6 text-indigo-600" />
            Mi Unidad (Sobres)
          </h2>
          <p className="text-sm text-slate-500 mt-1">Gestión de carpetas y flujos documentales</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar sobre o carpeta..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap">
            + Nuevo Sobre
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="w-full py-24 flex flex-col items-center justify-center space-y-4 bg-white rounded-2xl border border-slate-100">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500">Cargando Mi Unidad...</p>
        </div>
      ) : isError ? (
        <div className="w-full py-12 text-center text-rose-500 bg-white rounded-2xl border border-slate-100">
          Error al cargar los datos. Verifica la sesión.
        </div>
      ) : filteredEnvelopes.length === 0 ? (
        <div className="w-full py-24 flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-slate-100 border-dashed">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Folder className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">Tu unidad está vacía</h3>
          <p className="text-slate-500 mt-1">Crea un nuevo sobre para empezar a gestionar documentos.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredEnvelopes.map(env => {
            const statusInfo = statusMap[env.status] || { label: 'Desconocido', color: 'bg-slate-100 text-slate-700' };
            return (
              <div key={env.id} className="group relative bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                    <Folder className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-50"><Share2 className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setEnvelopeToDelete(env.id); }} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-50"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                
                <h3 className="font-semibold text-slate-900 truncate mb-1" title={env.name || 'Sobre sin nombre'}>
                  {env.name || 'Sobre sin nombre'}
                </h3>
                
                <div className="flex flex-col gap-2 mt-3">
                  <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[11px] font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-3 border-t border-slate-100">
                    <span className="flex items-center gap-1"><File className="w-3 h-3" /> {env.document_count || 0} docs</span>
                    <span>{new Date(env.updated_at || env.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre del Sobre</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado del Flujo</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Propietario</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Modificado</th>
                <th scope="col" className="relative px-6 py-4 text-right"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredEnvelopes.map((env) => {
                const statusInfo = statusMap[env.status] || { label: 'Desconocido', color: 'bg-slate-100 text-slate-700' };
                return (
                  <tr key={env.id} className="hover:bg-slate-50/80 transition-colors group cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Folder className="w-5 h-5 text-indigo-400" />
                        <span className="text-sm font-medium text-slate-900">{env.name || 'Sobre sin nombre'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {env.user_name || 'Tú'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(env.updated_at || env.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setEnvelopeToDelete(env.id); }} className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog.Root open={!!envelopeToDelete} onOpenChange={(open) => !open && setEnvelopeToDelete(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-4 text-center items-center">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <Dialog.Title className="text-xl font-semibold text-slate-900">¿Eliminar Sobre?</Dialog.Title>
              <Dialog.Description className="text-slate-500 text-sm">
                Esta acción enviará la carpeta a la papelera (Estado: Eliminado).
              </Dialog.Description>
              <div className="flex w-full gap-3 mt-4">
                <button onClick={() => setEnvelopeToDelete(null)} className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                  Cancelar
                </button>
                <button onClick={() => envelopeToDelete && handleDelete(envelopeToDelete)} className="flex-1 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors">
                  Sí, eliminar
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
