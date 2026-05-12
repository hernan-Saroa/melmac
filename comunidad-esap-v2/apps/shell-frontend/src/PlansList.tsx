import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Search, Plus, Edit2, DollarSign, Package } from 'lucide-react';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fetchLegacy } from './lib/api';

interface PlanData {
  id: number;
  name: string;
  description: string;
  price: number;
}

const planSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().min(5, 'La descripción debe tener al menos 5 caracteres'),
  price: z.string().min(1, 'El valor es obligatorio'),
});

type PlanFormData = z.infer<typeof planSchema>;

export default function PlansList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanData | null>(null);

  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<PlanFormData>({
    resolver: zodResolver(planSchema)
  });

  // El endpoint legacy utiliza POST para listar en este caso específico
  const { data: plans = [], isLoading, isError } = useQuery<PlanData[]>({
    queryKey: ['plans_list'],
    queryFn: async () => {
      const response = await fetchLegacy('/list_plan/', { method: 'POST', body: JSON.stringify({}) });
      return response.data || [];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      const payload = { ...data, price: parseFloat(data.price) };
      // Usamos el endpoint heredado para crear
      const response = await fetchLegacy('/create_plan/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (!response.status) throw new Error(response.message || 'Error al guardar');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans_list'] });
      toast.success(`Plan de servicio guardado exitosamente`);
      closeForm();
    },
    onError: (error: any) => toast.error('Error al guardar', { description: error.message }),
  });

  const openForm = (plan?: PlanData) => {
    if (plan) {
      setEditingPlan(plan);
      setValue('name', plan.name);
      setValue('description', plan.description);
      setValue('price', plan.price.toString());
    } else {
      setEditingPlan(null);
      reset();
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingPlan(null);
    reset();
  };

  const onSubmit = (data: PlanFormData) => {
    saveMutation.mutate(data);
  };

  const filteredPlans = plans.filter(p => 
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            Portafolio de Planes
          </h2>
          <p className="text-sm text-slate-500 mt-1">Gestión de servicios y planes facturables</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar plan o servicio..."
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Cargando portafolio...</div>
        ) : isError ? (
          <div className="col-span-full py-12 text-center text-rose-500">Error al cargar los planes.</div>
        ) : filteredPlans.length > 0 ? (
          filteredPlans.map((plan) => (
            <div key={plan.id} className="group relative bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col h-full">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openForm(plan)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-50 to-purple-50 text-indigo-600 flex items-center justify-center mb-4">
                <Package className="w-6 h-6" />
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2">{plan.name}</h3>
              <p className="text-sm text-slate-500 flex-1 line-clamp-3 mb-6">
                {plan.description}
              </p>
              
              <div className="pt-4 border-t border-slate-50 flex items-end justify-between mt-auto">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Valor del Plan</span>
                <div className="flex items-center text-lg font-bold text-slate-900">
                  <DollarSign className="w-5 h-5 text-emerald-500 mr-1" />
                  {Number(plan.price).toLocaleString('es-CO')}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-slate-100 border-dashed">
            <Package className="w-12 h-12 text-slate-300 mb-3" />
            <p>No se encontraron planes registrados.</p>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              {editingPlan ? 'Editar Plan' : 'Crear Nuevo Plan'}
            </Dialog.Title>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nombre del Plan</label>
                <input {...register('name')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Ej. Plan Empresarial Pro" />
                {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Descripción detallada</label>
                <textarea {...register('description')} rows={4} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none" placeholder="Beneficios y características del plan..." />
                {errors.description && <p className="text-xs text-rose-500">{errors.description.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Valor (COP)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-slate-400" />
                  </div>
                  <input {...register('price')} type="number" className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="0.00" />
                </div>
                {errors.price && <p className="text-xs text-rose-500">{errors.price.message}</p>}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50">
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar Plan'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
