import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Search, Plus, Edit2, Trash2, GitMerge, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fetchLegacy } from './lib/api';

interface ProjectData {
  id: string;
  identificator: string;
  name: string;
  description: string;
  state: boolean;
}

const projectSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().min(5, 'La descripción es muy corta'),
  state: z.boolean().default(true),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function ProjectsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null);

  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: { state: true }
  });

  // Fetch Projects
  const { data: projects = [], isLoading, isError } = useQuery<ProjectData[]>({
    queryKey: ['visits_projects'],
    queryFn: async () => {
      // El backend legacy usa POST sin cuerpo para obtener la lista
      const response = await fetchLegacy('/list_proyect/', { method: 'POST', body: JSON.stringify({}) });
      return response.data || [];
    }
  });

  // Mutation para crear/editar proyecto
  const saveMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      // endpoint: create_proyect_task
      // body: name, description, state, proyect_id (vacío si es nuevo, id si edita)
      const payload = {
        name: data.name,
        description: data.description,
        state: data.state,
        proyect_id: editingProject ? editingProject.id : ''
      };
      const response = await fetchLegacy('/create_proyect_task/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (!response.status) throw new Error(response.message || 'Error al guardar');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits_projects'] });
      toast.success(`Proyecto ${editingProject ? 'actualizado' : 'creado'} exitosamente`);
      closeForm();
    },
    onError: (error: any) => toast.error('Error al guardar', { description: error.message }),
  });

  // Mutation para eliminar proyecto
  const deleteMutation = useMutation({
    mutationFn: async (idProyect: string) => {
      const response = await fetchLegacy('/delete_list_proyect/', {
        method: 'POST',
        body: JSON.stringify({ idProyect })
      });
      if (!response.status) throw new Error('Error al eliminar');
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visits_projects'] });
      toast.success('Proyecto eliminado correctamente');
    },
    onError: () => toast.error('No se pudo eliminar el proyecto'),
  });

  const openForm = (project?: ProjectData) => {
    if (project) {
      setEditingProject(project);
      setValue('name', project.name);
      setValue('description', project.description);
      setValue('state', project.state);
    } else {
      setEditingProject(null);
      reset({ state: true });
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProject(null);
    reset();
  };

  const onSubmit = (data: ProjectFormData) => {
    saveMutation.mutate(data);
  };

  const handleDelete = (project: ProjectData) => {
    if (confirm(`¿Estás seguro de eliminar el proyecto "${project.name}"? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(project.id);
    }
  };

  const filteredProjects = projects.filter(p => 
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.identificator || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-600" />
            Proyectos en Campo
          </h2>
          <p className="text-sm text-slate-500 mt-1">Gestión integral de proyectos, visitas operativas y tickets</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por ID, nombre..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => openForm()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nuevo Proyecto
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Cargando proyectos operativos...</div>
        ) : isError ? (
          <div className="col-span-full py-12 text-center text-rose-500">Error al cargar el portafolio de proyectos.</div>
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <div key={project.id} className="group relative bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col h-full">
              
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openForm(project)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar Proyecto">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(project)} disabled={deleteMutation.isPending} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 text-indigo-600 flex items-center justify-center border border-slate-100 shadow-sm">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded uppercase tracking-wider">{project.identificator}</span>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${project.state ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {project.state ? 'Operativo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-2">{project.name}</h3>
              <p className="text-sm text-slate-500 flex-1 line-clamp-3 mb-6">
                {project.description}
              </p>
              
              <div className="pt-4 border-t border-slate-50 mt-auto">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-xl transition-colors">
                  <GitMerge className="w-4 h-4" />
                  Gestionar Subproyectos
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
            <Briefcase className="w-12 h-12 text-slate-300 mb-3" />
            <p className="font-medium text-slate-600">No hay proyectos registrados</p>
            <p className="text-sm mt-1">Comienza creando un nuevo proyecto para asignar visitas en campo.</p>
          </div>
        )}
      </div>

      {/* Formulario Modal */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <Dialog.Title className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              {editingProject ? 'Actualizar Proyecto' : 'Crear Nuevo Proyecto'}
            </Dialog.Title>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nombre del Proyecto</label>
                <input {...register('name')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Ej. Expansión Red Norte" />
                {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Descripción u Objeto</label>
                <textarea {...register('description')} rows={4} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none" placeholder="Alcance operativo del proyecto..." />
                {errors.description && <p className="text-xs text-rose-500">{errors.description.message}</p>}
              </div>

              <div className="flex items-center justify-between pt-4 pb-2">
                <label className="text-sm font-medium text-slate-700">Estado Operativo</label>
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
                  {saveMutation.isPending ? 'Guardando...' : (editingProject ? 'Actualizar Proyecto' : 'Crear Proyecto')}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

    </div>
  );
}
