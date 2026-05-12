import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Search, Filter, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';

interface Document {
  id: string;
  title: string;
  status: string;
  date: string;
  author: string;
}

export default function DataTable() {
  const [searchQuery, setSearchQuery] = useState('');
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Reemplazo de useEffect + useState por React Query
  const { data: documents = [], isLoading, isError } = useQuery<Document[]>({
    queryKey: ['documents'],
    queryFn: async () => {
      const response = await fetch('/api/documents');
      if (!response.ok) throw new Error('Error al cargar documentos');
      return response.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('No se pudo borrar');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documento eliminado', { description: 'El registro fue borrado de PostgreSQL.' });
      setDocToDelete(null);
    },
    onError: () => toast.error('Error al intentar borrar el documento'),
  });

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Aprobado':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Aprobado</span>;
      case 'En Revisión':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3.5 h-3.5" /> En Revisión</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200"><AlertCircle className="w-3.5 h-3.5" /> {status}</span>;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Header & Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" />
            Gestión de Documentos
          </h2>
          <p className="text-sm text-slate-500 mt-1">Módulo migrado a NestJS + React Query</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por título, autor o ID..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-sm">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID Documento</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Título</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Autor</th>
                <th scope="col" className="relative px-6 py-4"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Cargando datos usando React Query...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-rose-500 font-medium">
                    Ocurrió un error al cargar los documentos.
                  </td>
                </tr>
              ) : filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{doc.id.split('-')[0]}-{doc.id.substring(doc.id.length - 4)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">{doc.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(doc.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{doc.author}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => setDocToDelete(doc.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron resultados para "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Radix Dialog for Deletion Confirmation */}
      <Dialog.Root open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <Dialog.Title className="text-xl font-semibold text-slate-900">
                ¿Eliminar documento?
              </Dialog.Title>
              <Dialog.Description className="text-slate-500 text-sm">
                Esta acción borrará permanentemente el registro de la base de datos PostgreSQL. Esta acción no se puede deshacer.
              </Dialog.Description>
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  onClick={() => setDocToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => docToDelete && deleteMutation.mutate(docToDelete)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Borrando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
