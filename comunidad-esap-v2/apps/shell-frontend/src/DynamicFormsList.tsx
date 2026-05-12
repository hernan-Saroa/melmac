import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutTemplate, Search, Plus, Trash2, Edit2, Copy, ToggleLeft } from 'lucide-react';
import { toast } from 'sonner';
import { fetchLegacy } from './lib/api';

interface DynamicForm {
  id: string;
  name: string;
  description: string;
  serie_trd: string;
  consecutive: boolean;
  digital: boolean;
  creation_date: string;
  state: number;
}

export default function DynamicFormsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Obtener lista de formularios dinámicos
  const { data: forms = [], isLoading, isError } = useQuery<DynamicForm[]>({
    queryKey: ['dynamic_forms'],
    queryFn: async () => {
      try {
        // En algunas versiones de Django el endpoint es /form/list/0/ o /form/
        const response = await fetchLegacy('/form/');
        return response.data || [];
      } catch (error) {
        console.error('Error cargando plantillas:', error);
        // Si falla /form/, intentamos con /form/list/0/ (legacy fallback)
        try {
          const fallbackRes = await fetchLegacy('/form/list/0/');
          return fallbackRes.data || [];
        } catch (fallbackError) {
          console.error('Error en fallback:', fallbackError);
          throw error;
        }
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (formId: string) => {
      const response = await fetchLegacy(`/form/delete/${formId}/`, { method: 'DELETE' });
      if (!response.status) throw new Error('No se pudo borrar');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic_forms'] });
      toast.success('Plantilla eliminada correctamente');
    },
    onError: () => toast.error('No tienes permisos para eliminar esta plantilla'),
  });

  const activateMutation = useMutation({
    mutationFn: async (formId: string) => {
      const response = await fetchLegacy('/form/activate/', { 
        method: 'POST',
        body: JSON.stringify({ id: formId })
      });
      if (!response.status) throw new Error('Error al activar');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic_forms'] });
      toast.success('Plantilla reactivada');
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetchLegacy('/form/', { 
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (!response.status) throw new Error(response.message || 'Error al crear la plantilla');
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dynamic_forms'] });
      toast.success('Plantilla creada correctamente');
      setIsCreateModalOpen(false);
      // Opcional: redirigir al constructor
      // window.location.href = `/forms/builder/${data.id}`;
    },
    onError: (error: any) => {
      toast.error(error.message || 'No se pudo crear la plantilla');
    }
  });

  const filteredForms = forms.filter(form => 
    (form.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (form.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (form.serie_trd || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-indigo-600" />
            Plantillas y Formularios Dinámicos
          </h2>
          <p className="text-sm text-slate-500 mt-1">Constructor de documentos interactivos (Drag & Drop)</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar plantilla..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => window.location.href = '/forms/answer/1'}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
            title="Forzar prueba de motor con ID 1"
          >
            <LayoutTemplate className="w-4 h-4" /> Probar Motor Directo
          </button>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Crear Plantilla
          </button>
        </div>
      </div>

      {/* Modal de Creación Básica */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Nueva Plantilla</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Documento</label>
                <input id="new-template-name" type="text" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ej. Contrato de Prestación..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea id="new-template-desc" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" rows={3} placeholder="Breve descripción de la plantilla..." />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input id="new-template-digital" type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                  Digital (Requiere PDF base)
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input id="new-template-consecutive" type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                  Consecutivo
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl text-sm font-medium transition-colors">Cancelar</button>
              <button 
                onClick={() => {
                  const name = (document.getElementById('new-template-name') as HTMLInputElement).value;
                  const desc = (document.getElementById('new-template-desc') as HTMLTextAreaElement).value;
                  const digital = (document.getElementById('new-template-digital') as HTMLInputElement).checked ? '1' : '0';
                  const consecutive = (document.getElementById('new-template-consecutive') as HTMLInputElement).checked ? '1' : '0';
                  if (!name || !desc) {
                    toast.error('Nombre y descripción son requeridos');
                    return;
                  }
                  createMutation.mutate({ name, description: desc, digital, consecutive });
                }}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
              >
                {createMutation.isPending ? 'Creando...' : 'Crear y Continuar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Plantillas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Cargando plantillas desde el monolito...</div>
        ) : isError ? (
          <div className="col-span-full py-12 text-center text-rose-500">Error de conexión al cargar plantillas.</div>
        ) : filteredForms.length > 0 ? (
          filteredForms.map((form) => (
            <div key={form.id} className="group relative bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
              
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Clonar">
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    if(confirm('¿Eliminar plantilla?')) deleteMutation.mutate(form.id);
                  }} 
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 flex items-center justify-center border border-indigo-100/50 shadow-inner">
                  <LayoutTemplate className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {form.serie_trd ? form.serie_trd : 'Sin Serie TRD'}
                  </span>
                  <div className="flex gap-2 mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${form.consecutive ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                      {form.consecutive ? 'Serie' : 'Individual'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${form.digital ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {form.digital ? 'Digital' : 'Físico'}
                    </span>
                  </div>
                </div>
              </div>
              
              <h3 className="text-base font-bold text-slate-900 mb-2 leading-tight">{form.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-1">
                {form.description || 'Sin descripción asignada.'}
              </p>
              
              <div className="pt-4 border-t border-slate-50 mt-auto flex items-center justify-between">
                <span className="text-[10px] font-medium text-slate-400">
                  Creado: {new Date(form.creation_date).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => window.location.href = `/forms/answer/${form.id}`}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    Diligenciar
                  </button>
                  {form.state === 0 && (
                    <button 
                      onClick={() => activateMutation.mutate(form.id)}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded hover:bg-amber-100"
                    >
                      <ToggleLeft className="w-3.5 h-3.5" />
                      Reactivar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
            <LayoutTemplate className="w-12 h-12 text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">No se encontraron plantillas</p>
            <p className="text-sm mt-1">No hay formularios dinámicos creados todavía.</p>
          </div>
        )}
      </div>

    </div>
  );
}
