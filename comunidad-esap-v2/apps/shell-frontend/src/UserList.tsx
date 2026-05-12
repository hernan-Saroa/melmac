import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Search, Filter, Trash2, Edit2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { fetchLegacy } from './lib/api';
import { SessionUtil } from './lib/session';

interface User {
  id: number;
  first_name: string;
  middle_name: string;
  first_last_name: string;
  second_last_name: string;
  identification: string;
  phone: string;
  email: string;
  login_state: boolean;
  role_enterprise_id: number;
}

export default function UserList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const enterpriseId = SessionUtil.getEnterpriseId() || 1; // Fallback a 1 para pruebas si no hay sesión

  // Obtener usuarios usando el Proxy Hacia Django
  const { data: users = [], isLoading, isError } = useQuery<User[]>({
    queryKey: ['users', enterpriseId],
    queryFn: async () => {
      // Usamos el cliente API que inyecta el Token legado automáticamente
      const data = await fetchLegacy(`/user/${enterpriseId}/`);
      return Array.isArray(data) ? data : data.data || [];
    }
  });

  // Mutación para borrar (tal cual el endpoint legado)
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetchLegacy(`/user/${enterpriseId}/${id}/`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado', { description: 'El usuario fue borrado exitosamente del sistema legado.' });
      setUserToDelete(null);
    },
    onError: (error: any) => toast.error('Error al intentar borrar el usuario', { description: error.message }),
  });

  const filteredUsers = users.filter(user => {
    const fullName = `${user.first_name || ''} ${user.first_last_name || ''}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           (user.identification && user.identification.toString().includes(searchQuery)) ||
           (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Header & Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Gestión de Usuarios
          </h2>
          <p className="text-sm text-slate-500 mt-1">Módulo migrado consumiendo API legado (Django)</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, correo o cédula..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
            + Nuevo Usuario
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Identificación</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre Completo</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Correo</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Teléfono</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                <th scope="col" className="relative px-6 py-4 text-right"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Sincronizando con backend Django...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-rose-500 font-medium">
                    No estás autenticado o la sesión expiró.
                  </td>
                </tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.identification}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                      {`${user.first_name || ''} ${user.first_last_name || ''}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{user.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.login_state ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                      }`}>
                        {user.login_state ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-slate-400 hover:text-indigo-600 p-1 rounded-md transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setUserToDelete(user.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog.Root open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <Dialog.Title className="text-xl font-semibold text-slate-900">
                ¿Eliminar Usuario?
              </Dialog.Title>
              <Dialog.Description className="text-slate-500 text-sm">
                Estás a punto de eliminar permanentemente este usuario del sistema legado. Esta acción no se puede deshacer.
              </Dialog.Description>
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => userToDelete && deleteMutation.mutate(userToDelete)}
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
