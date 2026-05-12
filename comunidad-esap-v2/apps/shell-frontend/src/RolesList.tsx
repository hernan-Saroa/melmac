import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, Search, Edit2, Plus, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fetchLegacy } from './lib/api';

interface RoleData {
  id: number;
  name: string;
  description: string;
  state: boolean;
}

interface PermitData {
  id: number;
  name: string;
}

const roleSchema = z.object({
  name: z.string().min(2, 'El nombre es requerido'),
  description: z.string().min(5, 'La descripción es requerida'),
  time_zone: z.string().default('America/Bogota'),
  is_admin: z.boolean().default(false),
  view_all: z.boolean().default(false),
  permits: z.array(z.number()).min(1, 'Debes seleccionar al menos un permiso')
});

type RoleFormData = z.infer<typeof roleSchema>;

export default function RolesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, control, reset, watch } = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { time_zone: 'America/Bogota', is_admin: false, view_all: false, permits: [] }
  });

  const { data: roles = [], isLoading, isError } = useQuery<RoleData[]>({
    queryKey: ['roles_list'],
    queryFn: async () => {
      const data = await fetchLegacy('/role/');
      return Array.isArray(data) ? data : data.data || [];
    }
  });

  const { data: availablePermits = [] } = useQuery<PermitData[]>({
    queryKey: ['permits_list'],
    queryFn: async () => {
      const data = await fetchLegacy('/permits/');
      return Array.isArray(data) ? data : data.data || [];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: RoleFormData) => {
      const response = await fetchLegacy('/role/', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      if (response && response.status === False || response.status === false) {
        throw new Error(response.message || 'Error al crear el rol');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles_list'] });
      toast.success('Rol creado exitosamente');
      setIsFormOpen(false);
      reset();
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  });

  const onSubmit = (data: RoleFormData) => {
    createMutation.mutate(data);
  };

  const filteredRoles = roles.filter(r => 
    (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-600" />
            Gestión de Roles
          </h2>
          <p className="text-sm text-slate-500 mt-1">Administración de perfiles y acceso a módulos</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar rol por nombre..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Cargando roles y permisos...</div>
        ) : isError ? (
          <div className="col-span-full py-12 text-center text-rose-500">Error al cargar la información.</div>
        ) : filteredRoles.length > 0 ? (
          filteredRoles.map((role) => (
            <div key={role.id} className="group relative bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-50 to-blue-50 text-indigo-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2">{role.name}</h3>
              <p className="text-sm text-slate-500 mb-6 min-h-[40px]">
                {role.description || 'Perfil personalizado para acceso a módulos de Melmac'}
              </p>
              
              <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  role.state ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {role.state ? 'Activo' : 'Inactivo'}
                </span>
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                  Ver permisos &rarr;
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-slate-100 border-dashed">
            <ShieldAlert className="w-12 h-12 text-slate-300 mb-3" />
            <p>No se encontraron roles registrados.</p>
          </div>
        )}
      </div>

      {/* Modal de Creación */}
      <Dialog.Root open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) reset(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-600" />
              Crear Nuevo Rol
            </Dialog.Title>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Nombre del Rol</label>
                  <input {...register('name')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Ej. Analista de Campo" />
                  {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Descripción</label>
                  <textarea {...register('description')} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none" placeholder="Describe brevemente las capacidades de este rol..." />
                  {errors.description && <p className="text-xs text-rose-500">{errors.description.message}</p>}
                </div>
              </div>

              <div className="flex gap-6 pt-4 border-t border-slate-100">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('is_admin')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  <span className="ml-3 text-sm font-medium text-slate-600">Es Administrador</span>
                </label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('view_all')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  <span className="ml-3 text-sm font-medium text-slate-600">Vista Global (Ver Todo)</span>
                </label>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-900">Asignar Permisos y Módulos</label>
                  {errors.permits && <span className="text-xs text-rose-500">{errors.permits.message}</span>}
                </div>
                
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-[250px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Controller
                    name="permits"
                    control={control}
                    render={({ field }) => (
                      <>
                        {availablePermits.map((permit) => (
                          <label key={permit.id} className="flex items-start gap-2 p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                            <input 
                              type="checkbox" 
                              className="mt-1 border-slate-300 text-indigo-600 focus:ring-indigo-500 rounded"
                              checked={field.value.includes(permit.id)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                field.onChange(checked 
                                  ? [...field.value, permit.id]
                                  : field.value.filter(val => val !== permit.id)
                                );
                              }}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-700">{permit.name}</span>
                              <span className="text-[10px] text-slate-400">ID: {permit.id}</span>
                            </div>
                          </label>
                        ))}
                      </>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50">
                  {createMutation.isPending ? 'Guardando...' : 'Crear Rol'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
