import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Search, Edit2, Plus, Building2, PaintBucket, Users } from 'lucide-react';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fetchLegacy } from './lib/api';

interface Theme {
  id: number;
  name: string;
}

interface EnterpriseData {
  id: number;
  first_name: string;
  first_last_name: string;
  identification: number;
  email: string;
  phone: number;
  enterprise__theme_id: number;
  enterprise__max_users: number;
  enterprise__state: boolean;
  login_state: boolean;
}

const settingsSchema = z.object({
  first_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  first_last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  identification: z.string().min(5, 'La identificación debe tener entre 5 y 11 dígitos').max(11),
  email: z.string().email('Correo electrónico no válido'),
  phone: z.string().length(10, 'El teléfono debe tener 10 dígitos'),
  enterprise__theme_id: z.string().min(1, 'Debes seleccionar un tema'),
  enterprise__max_users: z.string().min(1).refine(val => parseInt(val) > 2, { message: 'Debe ser mayor a 2' }),
  enterprise__state: z.boolean().default(true),
  login_state: z.boolean().default(true),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEnterprise, setEditingEnterprise] = useState<EnterpriseData | null>(null);
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { enterprise__state: true, login_state: true }
  });

  // Fetch Themes (Temas de UI)
  const { data: themes = [] } = useQuery<Theme[]>({
    queryKey: ['themes'],
    queryFn: async () => {
      const data = await fetchLegacy('/theme_list/');
      return Array.isArray(data) ? data : data.data || [];
    }
  });

  // Fetch Enterprises
  const { data: enterprises = [], isLoading, isError } = useQuery<EnterpriseData[]>({
    queryKey: ['enterprises'],
    queryFn: async () => {
      const data = await fetchLegacy('/enterprise/');
      return Array.isArray(data) ? data : data.data || [];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: SettingsFormData) => {
      const payload = { 
        ...data, 
        identification: parseInt(data.identification),
        phone: parseInt(data.phone),
        enterprise__theme_id: parseInt(data.enterprise__theme_id),
        enterprise__max_users: parseInt(data.enterprise__max_users)
      };
      
      if (editingEnterprise) {
        return await fetchLegacy(`/enterprise/${editingEnterprise.id}/`, {
          method: 'PUT',
          body: JSON.stringify({ ...payload, id: editingEnterprise.id }),
        });
      } else {
        return await fetchLegacy('/enterprise/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enterprises'] });
      toast.success(`Configuración ${editingEnterprise ? 'actualizada' : 'registrada'} exitosamente`);
      closeForm();
    },
    onError: (error: any) => toast.error('Error al guardar', { description: error.message }),
  });

  const openForm = (enterprise?: EnterpriseData) => {
    if (enterprise) {
      setEditingEnterprise(enterprise);
      setValue('first_name', enterprise.first_name);
      setValue('first_last_name', enterprise.first_last_name);
      setValue('identification', enterprise.identification.toString());
      setValue('email', enterprise.email);
      setValue('phone', enterprise.phone.toString());
      setValue('enterprise__theme_id', enterprise.enterprise__theme_id?.toString() || '');
      setValue('enterprise__max_users', enterprise.enterprise__max_users?.toString() || '10');
      setValue('enterprise__state', enterprise.enterprise__state);
      setValue('login_state', enterprise.login_state);
    } else {
      setEditingEnterprise(null);
      reset({ enterprise__state: true, login_state: true });
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingEnterprise(null);
    reset();
  };

  const onSubmit = (data: SettingsFormData) => {
    saveMutation.mutate(data);
  };

  const getThemeName = (themeId: number) => {
    const theme = themes.find(t => t.id === themeId);
    return theme ? theme.name : 'Predeterminado';
  };

  const filteredEnterprises = enterprises.filter(ent => 
    (ent.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ent.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ent.identification?.toString() || '').includes(searchQuery)
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            Configuración de Empresas
          </h2>
          <p className="text-sm text-slate-500 mt-1">Gestión administrativa y variables del sistema (Proxy Legacy)</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar empresa o administrador..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nueva
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Sincronizando configuraciones...</div>
        ) : isError ? (
          <div className="col-span-full py-12 text-center text-rose-500">Error al cargar configuraciones.</div>
        ) : filteredEnterprises.length > 0 ? (
          filteredEnterprises.map((ent) => (
            <div key={ent.id} className="group relative bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openForm(ent)} className="p-1.5 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{ent.first_name} {ent.first_last_name}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide mt-1 ${ent.enterprise__state ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {ent.enterprise__state ? 'Empresa Activa' : 'Empresa Inactiva'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3 pt-4 border-t border-slate-50">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-500"><PaintBucket className="w-4 h-4" /> Tema UI</div>
                  <span className="font-medium text-slate-700">{getThemeName(ent.enterprise__theme_id)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-500"><Users className="w-4 h-4" /> Max Usuarios</div>
                  <span className="font-medium text-slate-700">{ent.enterprise__max_users}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-500">ID Administrador</div>
                  <span className="font-mono text-slate-600">{ent.identification}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500">No se encontraron empresas</div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              {editingEnterprise ? 'Editar Configuración de Empresa' : 'Registrar Nueva Empresa'}
            </Dialog.Title>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nombre del Administrador</label>
                  <input {...register('first_name')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  {errors.first_name && <p className="text-xs text-rose-500">{errors.first_name.message}</p>}
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Apellido</label>
                  <input {...register('first_last_name')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  {errors.first_last_name && <p className="text-xs text-rose-500">{errors.first_last_name.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Identificación (NIT/CC)</label>
                  <input {...register('identification')} type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  {errors.identification && <p className="text-xs text-rose-500">{errors.identification.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Teléfono</label>
                  <input {...register('phone')} type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  {errors.phone && <p className="text-xs text-rose-500">{errors.phone.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Correo Electrónico</label>
                  <input {...register('email')} type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Máximo de Usuarios</label>
                  <input {...register('enterprise__max_users')} type="number" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  {errors.enterprise__max_users && <p className="text-xs text-rose-500">{errors.enterprise__max_users.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Tema de Interfaz (UI)</label>
                <select {...register('enterprise__theme_id')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white">
                  <option value="">Selecciona un tema...</option>
                  {themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>{theme.name}</option>
                  ))}
                </select>
                {errors.enterprise__theme_id && <p className="text-xs text-rose-500">{errors.enterprise__theme_id.message}</p>}
              </div>

              <div className="flex items-center gap-6 pt-2 border-t border-slate-100">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('enterprise__state')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  <span className="ml-3 text-sm font-medium text-slate-600">Empresa {watch('enterprise__state') ? 'Activa' : 'Inactiva'}</span>
                </label>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('login_state')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  <span className="ml-3 text-sm font-medium text-slate-600">Admin {watch('login_state') ? 'Activo' : 'Bloqueado'}</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50">
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
