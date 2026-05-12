import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { FilePlus2 } from 'lucide-react';

const documentSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  author: z.string().min(3, 'El autor debe tener al menos 3 caracteres'),
  type: z.string().min(1, 'Seleccione un tipo de documento'),
});

type DocumentFormData = z.infer<typeof documentSchema>;

export default function DocumentForm() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema)
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const createDocumentMutation = useMutation({
    mutationFn: async (newDoc: DocumentFormData) => {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc),
      });
      if (!response.ok) throw new Error('Error al guardar en base de datos');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      reset();
      toast.success('Documento guardado', {
        description: 'El registro ha sido almacenado en PostgreSQL y está en revisión.',
      });
      navigate('/documents');
    },
    onError: (error) => {
      toast.error('Error al guardar', {
        description: error.message || 'Intente nuevamente más tarde.',
      });
    }
  });

  const onSubmit = (data: DocumentFormData) => {
    createDocumentMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <FilePlus2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Nuevo Documento</h2>
            <p className="text-sm text-slate-500">Crea un nuevo registro documental con validación Zod</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <Input 
              label="Título del Documento" 
              placeholder="Ej. Acta de Reunión 001"
              {...register('title')}
              error={errors.title?.message}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="Autor o Responsable" 
                placeholder="Nombre completo"
                {...register('author')}
                error={errors.author?.message}
              />
              
              <div className="w-full space-y-1.5">
                <label className="text-sm font-medium leading-none text-slate-700">
                  Tipo de Documento
                </label>
                <select
                  {...register('type')}
                  className={`flex h-10 w-full rounded-lg border bg-slate-50 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:bg-white transition-colors ${errors.type ? 'border-rose-500 focus-visible:ring-rose-500' : 'border-slate-200'}`}
                >
                  <option value="">Seleccione una opción...</option>
                  <option value="acta">Acta</option>
                  <option value="reporte">Reporte Financiero</option>
                  <option value="contrato">Contrato Legal</option>
                </select>
                {errors.type && <p className="text-sm text-rose-500">{errors.type.message}</p>}
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => reset()} disabled={createDocumentMutation.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createDocumentMutation.isPending}>
              {createDocumentMutation.isPending ? 'Guardando...' : 'Guardar Documento'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
