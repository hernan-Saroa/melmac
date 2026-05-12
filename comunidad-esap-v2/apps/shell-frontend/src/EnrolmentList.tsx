import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Fingerprint, Search, ShieldCheck, UserCheck, ScanFace, FileSignature, AlertCircle, Plus, UploadCloud } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { fetchLegacy } from './lib/api';
import { SessionUtil } from './lib/session';

interface EnrollData {
  id: number;
  user_name: string;
  profile__name: string;
  profile__type_identification__name: string;
  profile__identification: string;
  creation_date: string;
}

export default function EnrolmentList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [fileFront, setFileFront] = useState<File | null>(null);
  const [fileBack, setFileBack] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState('');
  
  const queryClient = useQueryClient();
  const enterpriseId = SessionUtil.getEnterpriseId() || 1;

  // Fetch Enrollments
  const { data: enrolls = [], isLoading, isError } = useQuery<EnrollData[]>({
    queryKey: ['enroll_list'],
    queryFn: async () => {
      const response = await fetchLegacy('/enroll/');
      return response.data || [];
    }
  });

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result as string;
        // Quitar metadata ej. "data:image/jpeg;base64,"
        encoded = encoded.replace(/^data:(.*,)?/, '');
        resolve(encoded);
      };
      reader.onerror = error => reject(error);
    });
  };

  const ocrMutation = useMutation({
    mutationFn: async () => {
      if (!fileFront || !fileBack || !documentId) {
        throw new Error('Debes subir ambas caras del documento y digitar la cédula');
      }
      
      const b64Front = await getBase64(fileFront);
      const b64Back = await getBase64(fileBack);

      const response = await fetchLegacy('/get_ocr/', {
        method: 'POST',
        body: JSON.stringify({
          id_api: 1, 
          token_api: "test", 
          image: b64Front,
          image_back: b64Back,
          document: documentId,
          enterprise: enterpriseId
        })
      });

      if (response && response.status === false) {
        throw new Error(response.message || 'Error en validación biométrica/OCR');
      }
      return response;
    },
    onSuccess: (data) => {
      toast.success('Validación OCR exitosa', { description: 'Los datos coinciden con la Registraduría' });
      setIsFormOpen(false);
      setFileFront(null);
      setFileBack(null);
      setDocumentId('');
    },
    onError: (error: any) => toast.error('Error Biométrico', { description: error.message }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    ocrMutation.mutate();
  };

  const filteredEnrolls = enrolls.filter(e => 
    (e.profile__name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.profile__identification || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full min-h-screen bg-[#F8FAFC] p-4 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* HEADER PRINCIPAL WORLD CLASS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Fingerprint className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Biometría y Enrolamiento</h1>
            <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
              <ScanFace className="w-4 h-4 text-violet-500" /> Verificación de Identidad Digital (OCR)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          {/* Global Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cédula, nombre..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all placeholder:text-slate-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-semibold rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]">
            <ScanFace className="w-4 h-4" /> Validar Identidad
          </button>
        </div>
      </div>

      {/* DASHBOARD DE KPIS DE IDENTIDAD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase">Enrolados</p>
            <p className="text-2xl font-black text-slate-800">{enrolls.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/60 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase">Verificados OCR</p>
            <p className="text-2xl font-black text-emerald-600">--</p>
          </div>
        </div>
      </div>

      {/* DATA TABLE DE ENROLADOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Identificación</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Responsable (Usuario)</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Enrolamiento</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-2"></div>
                      Cargando base biométrica...
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-rose-500">Error al contactar con el API biométrico.</td></tr>
              ) : filteredEnrolls.length > 0 ? (
                filteredEnrolls.map((enroll) => (
                  <tr key={enroll.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-bold text-slate-900">{enroll.profile__identification}</div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">{enroll.profile__type_identification__name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-slate-400" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{enroll.profile__name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {enroll.user_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(enroll.creation_date).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3.5 h-3.5" /> Enrolado
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Fingerprint className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="font-medium text-slate-600">No hay usuarios enrolados</p>
                      <p className="text-xs mt-1">Sube un documento para iniciar la validación biométrica OCR.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de OCR */}
      <Dialog.Root open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if(!open) {setFileFront(null); setFileBack(null); setDocumentId('');} }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 animate-in fade-in" />
          <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] bg-white p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
            <Dialog.Title className="text-2xl font-black text-slate-900 mb-2 flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-xl">
                <ScanFace className="w-6 h-6 text-violet-600" />
              </div>
              Motor OCR Huawei
            </Dialog.Title>
            <Dialog.Description className="text-sm font-medium text-slate-500 mb-6">
              Sube la fotografía frontal y trasera del documento de identidad. Nuestra IA extraerá los datos y validará su autenticidad.
            </Dialog.Description>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Número de Documento (Validación cruzada)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none text-sm font-medium text-slate-900" 
                  placeholder="Ej. 1010202030"
                  value={documentId}
                  onChange={(e) => setDocumentId(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* File Front */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cara Frontal</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-violet-400 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-6 h-6 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500 font-semibold">{fileFront ? fileFront.name : "Subir Foto"}</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setFileFront(e.target.files?.[0] || null)} />
                  </label>
                </div>

                {/* File Back */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cara Trasera</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-violet-400 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <UploadCloud className="w-6 h-6 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500 font-semibold">{fileBack ? fileBack.name : "Subir Foto"}</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setFileBack(e.target.files?.[0] || null)} />
                  </label>
                </div>
              </div>

              {ocrMutation.isError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <p className="text-xs font-medium text-rose-700">{ocrMutation.error?.message}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={ocrMutation.isPending || !fileFront || !fileBack || !documentId} className="px-5 py-2.5 flex items-center gap-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-lg shadow-violet-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100">
                  {ocrMutation.isPending ? 'Procesando IA...' : 'Ejecutar OCR'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
