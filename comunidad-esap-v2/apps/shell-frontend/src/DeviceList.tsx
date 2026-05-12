import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Smartphone, Search, Trash2, Edit2, ShieldAlert, Plus, Wifi, Laptop, Key, Cpu } from 'lucide-react';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fetchLegacy } from './lib/api';

interface DeviceType {
  id: number;
  name: string;
  description: string;
  icon: string;
}

interface DeviceData {
  id: number;
  name: string;
  type_device_id: number;
  mac: string;
  state: boolean;
}

const deviceSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  mac: z.string().min(11, 'La dirección MAC no es válida').max(17, 'La dirección MAC no es válida'),
  type_device_id: z.string().min(1, 'Debes seleccionar un tipo de dispositivo'),
  state: z.boolean().default(true)
});

type DeviceFormData = z.infer<typeof deviceSchema>;

export default function DeviceList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [deviceToDelete, setDeviceToDelete] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<DeviceData | null>(null);
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: { state: true }
  });

  // Fetch Device Types (Categorías)
  const { data: deviceTypes = [] } = useQuery<DeviceType[]>({
    queryKey: ['device_types'],
    queryFn: async () => {
      const data = await fetchLegacy('/device_type/');
      return Array.isArray(data) ? data : data.data || [];
    }
  });

  // Fetch Devices
  const { data: devices = [], isLoading, isError } = useQuery<DeviceData[]>({
    queryKey: ['devices'],
    queryFn: async () => {
      const data = await fetchLegacy('/devices/');
      return Array.isArray(data) ? data : data.data || [];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: DeviceFormData) => {
      const payload = { 
        ...data, 
        type_device_id: parseInt(data.type_device_id) 
      };
      
      if (editingDevice) {
        return await fetchLegacy(`/devices/${editingDevice.id}/`, {
          method: 'PUT',
          body: JSON.stringify({ ...payload, id: editingDevice.id }),
        });
      } else {
        return await fetchLegacy('/devices/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success(`Dispositivo ${editingDevice ? 'actualizado' : 'registrado'} exitosamente`);
      closeForm();
    },
    onError: (error: any) => toast.error('Error al guardar', { description: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetchLegacy(`/devices/${id}/`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Dispositivo eliminado correctamente');
      setDeviceToDelete(null);
    },
    onError: (error: any) => toast.error('Error al eliminar', { description: error.message }),
  });

  const openForm = (device?: DeviceData) => {
    if (device) {
      setEditingDevice(device);
      setValue('name', device.name);
      setValue('mac', device.mac);
      setValue('type_device_id', device.type_device_id.toString());
      setValue('state', device.state);
    } else {
      setEditingDevice(null);
      reset({ state: true });
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingDevice(null);
    reset();
  };

  const onSubmit = (data: DeviceFormData) => {
    saveMutation.mutate(data);
  };

  const getDeviceTypeName = (typeId: number) => {
    const type = deviceTypes.find(t => t.id === typeId);
    return type ? type.name : 'Desconocido';
  };

  const getDeviceIcon = (typeId: number) => {
    const type = deviceTypes.find(t => t.id === typeId);
    if (!type || !type.icon) return <Cpu className="w-5 h-5" />;
    if (type.icon.includes('mobile')) return <Smartphone className="w-5 h-5" />;
    if (type.icon.includes('pc') || type.icon.includes('laptop')) return <Laptop className="w-5 h-5" />;
    return <Wifi className="w-5 h-5" />;
  };

  const filteredDevices = devices.filter(d => 
    (d.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.mac || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-indigo-600" />
            Gestión de Dispositivos
          </h2>
          <p className="text-sm text-slate-500 mt-1">Control de acceso y MACs (Legacy Proxy API)</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o MAC..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dispositivo</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Categoría</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Dirección MAC</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="relative px-6 py-4 text-right"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Cargando dispositivos...</td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-rose-500 font-medium">Error al cargar datos. ¿Sesión activa?</td>
                </tr>
              ) : filteredDevices.length > 0 ? (
                filteredDevices.map((device) => (
                  <tr key={device.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                          {getDeviceIcon(device.type_device_id)}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{device.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {getDeviceTypeName(device.type_device_id)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded-md w-fit border border-slate-200">
                        <Key className="w-3 h-3 text-slate-400" />
                        {device.mac}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        device.state ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {device.state ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openForm(device)} className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-md hover:bg-indigo-50 transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeviceToDelete(device.id)} className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No se encontraron dispositivos</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-indigo-600" />
              {editingDevice ? 'Editar Dispositivo' : 'Registrar Dispositivo'}
            </Dialog.Title>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nombre del Dispositivo</label>
                <input {...register('name')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Ej. iPhone de Juan" />
                {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Categoría</label>
                <select {...register('type_device_id')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white">
                  <option value="">Selecciona un tipo...</option>
                  {deviceTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                {errors.type_device_id && <p className="text-xs text-rose-500">{errors.type_device_id.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Dirección MAC</label>
                <input {...register('mac')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono uppercase" placeholder="00:1A:2B:3C:4D:5E" />
                {errors.mac && <p className="text-xs text-rose-500">{errors.mac.message}</p>}
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-sm font-medium text-slate-700">Estado del Dispositivo</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('state')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  <span className="ml-3 text-sm font-medium text-slate-600">{watch('state') ? 'Activo' : 'Inactivo'}</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50">
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar Dispositivo'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Modal */}
      <Dialog.Root open={!!deviceToDelete} onOpenChange={(open) => !open && setDeviceToDelete(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-4 text-center items-center">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <Dialog.Title className="text-xl font-semibold text-slate-900">¿Eliminar Dispositivo?</Dialog.Title>
              <Dialog.Description className="text-slate-500 text-sm">
                Se eliminará el dispositivo y su MAC ya no tendrá acceso al sistema.
              </Dialog.Description>
              <div className="flex w-full gap-3 mt-2">
                <button onClick={() => setDeviceToDelete(null)} className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                  Cancelar
                </button>
                <button onClick={() => deviceToDelete && deleteMutation.mutate(deviceToDelete)} disabled={deleteMutation.isPending} className="flex-1 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors">
                  {deleteMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
