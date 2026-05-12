import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Contact, Search, Trash2, Edit2, ShieldAlert, Plus, Mail, Phone, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fetchLegacy } from './lib/api';
import { SessionUtil } from './lib/session';

interface ContactData {
  id: number;
  name: string;
  phone: string;
  email: string;
  state: boolean;
}

const contactSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Debe ser un correo válido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function ContactList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [contactToDelete, setContactToDelete] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ContactData | null>(null);
  
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  });

  const { data: contacts = [], isLoading, isError } = useQuery<ContactData[]>({
    queryKey: ['contacts'],
    queryFn: async () => {
      const data = await fetchLegacy('/contacts/');
      return Array.isArray(data) ? data : data.data || [];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      const enterpriseId = SessionUtil.getEnterpriseId() || 1;
      const payload = { ...data, enterprise_id: enterpriseId, state: true };
      
      if (editingContact) {
        return await fetchLegacy(`/contacts/${editingContact.id}/`, {
          method: 'PUT',
          body: JSON.stringify({ ...payload, id: editingContact.id, state: editingContact.state }),
        });
      } else {
        return await fetchLegacy('/contacts/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success(`Contacto ${editingContact ? 'actualizado' : 'creado'} con éxito`);
      closeForm();
    },
    onError: (error: any) => toast.error('Error al guardar', { description: error.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetchLegacy(`/contacts/${id}/`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contacto eliminado (estado inactivo)');
      setContactToDelete(null);
    },
    onError: (error: any) => toast.error('Error al eliminar', { description: error.message }),
  });

  const openForm = (contact?: ContactData) => {
    if (contact) {
      setEditingContact(contact);
      setValue('name', contact.name);
      setValue('email', contact.email);
      setValue('phone', contact.phone);
    } else {
      setEditingContact(null);
      reset();
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingContact(null);
    reset();
  };

  const onSubmit = (data: ContactFormData) => {
    saveMutation.mutate(data);
  };

  const filteredContacts = contacts.filter(c => 
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone || '').includes(searchQuery)
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Contact className="w-6 h-6 text-indigo-600" />
            Agenda de Contactos
          </h2>
          <p className="text-sm text-slate-500 mt-1">Módulo completamente migrado "tal cual" (Full CRUD)</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar contacto..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
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
           <div className="col-span-full py-12 text-center text-slate-500">Cargando contactos...</div>
        ) : isError ? (
           <div className="col-span-full py-12 text-center text-rose-500">Error al cargar la agenda (revisa tu sesión)</div>
        ) : filteredContacts.length > 0 ? (
          filteredContacts.map(contact => (
            <div key={contact.id} className="group relative bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openForm(contact)} className="p-1.5 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                {contact.state && (
                  <button onClick={() => setContactToDelete(contact.id)} className="p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{contact.name}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide ${contact.state ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {contact.state ? 'Activo' : 'Eliminado'}
                  </span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{contact.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{contact.phone}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-slate-500">No se encontraron contactos.</div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                {editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
              </Dialog.Title>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nombre Completo</label>
                <input {...register('name')} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="Ej. Juan Pérez" />
                {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Correo Electrónico</label>
                <input {...register('email')} type="email" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="juan@empresa.com" />
                {errors.email && <p className="text-xs text-rose-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Teléfono (Móvil)</label>
                <input {...register('phone')} type="tel" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="3001234567" />
                {errors.phone && <p className="text-xs text-rose-500">{errors.phone.message}</p>}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                <button type="button" onClick={closeForm} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50">
                  {saveMutation.isPending ? 'Guardando...' : 'Guardar Contacto'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Modal */}
      <Dialog.Root open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] bg-white p-6 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-4 text-center items-center">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <Dialog.Title className="text-xl font-semibold text-slate-900">¿Inactivar Contacto?</Dialog.Title>
              <Dialog.Description className="text-slate-500 text-sm">
                El contacto pasará a estado "Eliminado" en el sistema.
              </Dialog.Description>
              <div className="flex w-full gap-3 mt-2">
                <button onClick={() => setContactToDelete(null)} className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                  Cancelar
                </button>
                <button onClick={() => contactToDelete && deleteMutation.mutate(contactToDelete)} disabled={deleteMutation.isPending} className="flex-1 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors">
                  {deleteMutation.isPending ? 'Inactivando...' : 'Sí, inactivar'}
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
