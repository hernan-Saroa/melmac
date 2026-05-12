import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, MapPin, MapIcon, Building2, ChevronDown, CheckCircle2, Clock, Map, LayoutGrid, CalendarDays, FileText } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { fetchLegacy } from './lib/api';
import { SessionUtil } from './lib/session';

interface TaskData {
  id: number;
  name: string;
  description: string;
  address: string;
  subproject__name: string;
  user__first_name: string;
  user__first_last_name: string;
  state__name: string;
  state_id: number;
  creation_date: string;
  initial_date: string;
  finish_date: string;
  initial_hour: string;
  finish_hour: string;
  serial_number: string;
}

interface ProjectGroup {
  idP: number;
  nameP: string;
  data: { id: number; name: string; mainF: number }[];
}

const taskSchema = z.object({
  name: z.string().min(3, 'Requerido'),
  description: z.string().min(5, 'Requerido'),
  dir: z.string().min(3, 'Requerido'),
  cellPhone: z.string().min(7, 'Requerido'),
  fecha: z.string().min(1, 'Requerido'),
  hourI: z.string().min(1, 'Requerido'),
  hourF: z.string().min(1, 'Requerido'),
  user_id: z.string().min(1, 'Requerido'),
  sub_proyect_id: z.string().min(1, 'Requerido'),
  duration: z.string().default("1"),
});

type TaskFormData = z.infer<typeof taskSchema>;

export default function TasksList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSubproject, setSelectedSubproject] = useState<string>('all');
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema)
  });

  const enterpriseId = SessionUtil.getEnterpriseId() || 1;

  // Fetch Projects/Subprojects Tree
  const { data: projectGroups = [] } = useQuery<ProjectGroup[]>({
    queryKey: ['projects_tree'],
    queryFn: async () => {
      const res = await fetchLegacy('/list_proyect_subproyect/', {
        method: 'POST',
        body: JSON.stringify({ idEnt: enterpriseId })
      });
      return Array.isArray(res) ? res : res.group || [];
    }
  });

  // Extracción de todos los IDs de subproyectos
  const allSubprojectIds = useMemo(() => {
    return projectGroups.flatMap(p => p.data.map(sp => sp.id)).join(',');
  }, [projectGroups]);

  // Fetch Tasks basado en la selección
  const { data: tasks = [], isLoading, isError } = useQuery<TaskData[]>({
    queryKey: ['tasks_all', selectedSubproject, allSubprojectIds],
    queryFn: async () => {
      if (!allSubprojectIds) return [];

      const isAll = selectedSubproject === 'all';
      const payload = {
        listComplet: isAll,
        idSubP: isAll ? allSubprojectIds : selectedSubproject
      };

      const response = await fetchLegacy('/list_task_all/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return response.taskList || [];
    },
    enabled: !!allSubprojectIds
  });

  const createMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      const response = await fetchLegacy('/create_task/', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          user_id: parseInt(data.user_id),
          sub_proyect_id: parseInt(data.sub_proyect_id),
          duration: parseInt(data.duration),
          Answer_Form_id: null,
          ticket: ""
        })
      });
      if (response && response.status === false) {
        throw new Error(response.message || 'Error al programar visita');
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks_all'] });
      toast.success('Visita programada exitosamente');
      setIsFormOpen(false);
      reset();
    },
    onError: (error: any) => toast.error('Error', { description: error.message }),
  });

  const filteredTasks = tasks.filter(t => 
    (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.serial_number || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Cálculos de KPIs
  const kpis = useMemo(() => {
    const counts = { porAsignar: 0, programadas: 0, enProceso: 0, reasignadas: 0, finalizadas: 0, total: tasks.length };
    tasks.forEach(t => {
      const stateName = (t.state__name || '').toLowerCase();
      if (stateName.includes('asignar')) counts.porAsignar++;
      else if (stateName.includes('programada')) counts.programadas++;
      else if (stateName.includes('proceso') || stateName.includes('curso')) counts.enProceso++;
      else if (stateName.includes('reasignada')) counts.reasignadas++;
      else if (stateName.includes('finalizada') || stateName.includes('completada')) counts.finalizadas++;
      else counts.porAsignar++; 
    });
    return counts;
  }, [tasks]);

  return (
    <div className="w-full h-full min-h-screen bg-[#F8FAFC] p-4 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* HEADER PRINCIPAL WORLD CLASS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Map className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Servicio en Campo</h1>
            <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500" /> Logística, Rutas y Visitas
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Global Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Ticket #, Nombre..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-semibold rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]">
            <Plus className="w-4 h-4" /> Programar Visita
          </button>
        </div>
      </div>

      {/* ÁRBOL DE PROYECTOS Y KPIS */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Selector de Proyecto */}
        <div className="xl:col-span-1 bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 flex flex-col justify-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Contexto Operativo</p>
          <div className="relative">
            <Building2 className="absolute left-4 top-3.5 w-5 h-5 text-indigo-500" />
            <select 
              className="w-full pl-12 pr-10 py-3.5 border-2 border-slate-100 bg-slate-50 hover:bg-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/20 outline-none appearance-none transition-all cursor-pointer"
              value={selectedSubproject}
              onChange={(e) => setSelectedSubproject(e.target.value)}
            >
              <option value="all">Todos los Proyectos Globales</option>
              {projectGroups.map(group => (
                <optgroup key={group.idP} label={group.nameP}>
                  {group.data.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-4 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Dashboard de KPIs */}
        <div className="xl:col-span-3 bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Métricas en Tiempo Real</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-3xl font-black text-slate-800">{kpis.total}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">Total Tickets</span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-3xl font-black text-indigo-600">{kpis.porAsignar}</span>
              <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">Por Asignar</span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-50/50 border border-sky-100">
              <span className="text-3xl font-black text-sky-600">{kpis.programadas}</span>
              <span className="text-[10px] font-bold text-sky-700 uppercase mt-1">Programadas</span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-50/50 border border-amber-100">
              <span className="text-3xl font-black text-amber-500">{kpis.enProceso}</span>
              <span className="text-[10px] font-bold text-amber-700 uppercase mt-1">En Proceso</span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-50/50 border border-rose-100">
              <span className="text-3xl font-black text-rose-500">{kpis.reasignadas}</span>
              <span className="text-[10px] font-bold text-rose-700 uppercase mt-1">Reasignadas</span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-3xl font-black text-emerald-600">{kpis.finalizadas}</span>
              <span className="text-[10px] font-bold text-emerald-700 uppercase mt-1">Finalizadas</span>
            </div>

          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Ticket #</th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nombre</th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Descripción</th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">F. Creación</th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">F. Programación</th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hora Inicio</th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hora Fin</th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Subproyecto</th>
                <th scope="col" className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="relative px-4 py-3 text-right"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-2"></div>
                      Cargando plataforma de servicios en campo...
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr><td colSpan={10} className="px-6 py-12 text-center text-rose-500">Error al contactar con el API.</td></tr>
              ) : filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-mono font-bold text-slate-500">
                      {task.serial_number || `T-${task.id}`}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-slate-900 truncate max-w-[150px]" title={task.name}>
                      {task.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 truncate max-w-[200px]" title={task.description}>
                      {task.description}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {new Date(task.creation_date).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {task.initial_date ? new Date(task.initial_date).toLocaleDateString('es-CO') : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{task.initial_hour || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">{task.finish_hour || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 truncate max-w-[150px]" title={task.subproject__name}>
                      {task.subproject__name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                        ${(task.state__name||'').toLowerCase().includes('finalizada') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          (task.state__name||'').toLowerCase().includes('proceso') ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                          'bg-slate-50 text-slate-700 border-slate-200'}`}
                      >
                        {task.state__name || 'PENDIENTE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <button className="text-indigo-600 hover:text-indigo-900 font-medium text-xs">Editar</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <LayoutGrid className="w-10 h-10 text-slate-300 mb-3" />
                      <p className="font-medium text-slate-600">Sin registros operativos</p>
                      <p className="text-xs mt-1">Intenta seleccionar otro subproyecto o ajusta tu búsqueda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Creación Tarea (Oculto en vista inicial, mismo implementado anteriormente) */}
      <Dialog.Root open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) reset(); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Programar Servicio en Campo
            </Dialog.Title>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Nombre del Ticket</label>
                  <input {...register('name')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Ej. Instalación o Visita..." />
                  {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Descripción detallada</label>
                  <textarea {...register('description')} rows={2} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none" placeholder="Contexto de la visita..." />
                  {errors.description && <p className="text-xs text-rose-500">{errors.description.message}</p>}
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-semibold text-slate-700">Dirección a Visitar</label>
                  <input {...register('dir')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  {errors.dir && <p className="text-xs text-rose-500">{errors.dir.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Teléfono</label>
                  <input {...register('cellPhone')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  {errors.cellPhone && <p className="text-xs text-rose-500">{errors.cellPhone.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Fecha de Programación</label>
                  <input {...register('fecha')} type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  {errors.fecha && <p className="text-xs text-rose-500">{errors.fecha.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Hora Inicio</label>
                  <input {...register('hourI')} type="time" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  {errors.hourI && <p className="text-xs text-rose-500">{errors.hourI.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Hora Fin</label>
                  <input {...register('hourF')} type="time" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  {errors.hourF && <p className="text-xs text-rose-500">{errors.hourF.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Subproyecto</label>
                  <select {...register('sub_proyect_id')} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm">
                    <option value="">Selecciona un subproyecto...</option>
                    {projectGroups.map(group => (
                      <optgroup key={group.idP} label={group.nameP}>
                        {group.data.map(sub => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {errors.sub_proyect_id && <p className="text-xs text-rose-500">{errors.sub_proyect_id.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Asignar a (Usuario ID)</label>
                  <input {...register('user_id')} type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Ej. 12" />
                  {errors.user_id && <p className="text-xs text-rose-500">{errors.user_id.message}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50">
                  {createMutation.isPending ? 'Programando...' : 'Guardar y Programar'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
