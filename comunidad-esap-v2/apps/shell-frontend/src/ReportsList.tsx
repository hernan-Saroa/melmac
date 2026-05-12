import { useState } from 'react';
import { FileSpreadsheet, FileArchive, Download, Search, Filter, Calendar } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchLegacy } from './lib/api';
import { toast } from 'sonner';

export default function ReportsList() {
  const [selectedForm, setSelectedForm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch disponibles formularios para reportar
  const { data: formsData, isLoading: isLoadingForms } = useQuery({
    queryKey: ['forms_list'],
    queryFn: async () => {
      const res = await fetchLegacy('/form/');
      return res.json();
    }
  });

  // Mutación para generar Excel
  const generateExcel = useMutation({
    mutationFn: async (dataFilter: any) => {
      const res = await fetchLegacy('/answer/excel/document/', {
        method: 'POST',
        body: JSON.stringify(dataFilter)
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status) {
        toast.success('Reporte Excel generado correctamente', { description: 'Revisa tus descargas' });
      } else {
        toast.error('Aviso', { description: data.message || 'No se pudo generar el reporte' });
      }
    },
    onError: () => toast.error('Error al contactar con el servidor')
  });

  // Mutación para generar ZIP/PDF
  const generateZip = useMutation({
    mutationFn: async (dataFilter: any) => {
      const res = await fetchLegacy('/answer/zip/pdf/document/', {
        method: 'POST',
        body: JSON.stringify(dataFilter)
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.status) {
        toast.success('Proceso ZIP iniciado', { description: 'El servidor está empaquetando los PDFs' });
      } else {
        toast.error('Aviso', { description: data.detail || 'Fallo al solicitar el ZIP' });
      }
    },
    onError: () => toast.error('Error al contactar con el servidor')
  });

  const handleGenerateExcel = () => {
    if (!selectedForm) {
      toast.warning('Selecciona un formulario primero');
      return;
    }
    generateExcel.mutate({
      id: selectedForm,
      date_init: startDate || null,
      date_end: endDate || null,
      type_report: 1
    });
  };

  const handleGenerateZip = () => {
    if (!selectedForm) {
      toast.warning('Selecciona un formulario primero');
      return;
    }
    generateZip.mutate({
      id: [selectedForm],
      date_init: startDate || null,
      date_end: endDate || null,
      type_report: 1
    });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-300">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Centro de Informes</h1>
          <p className="text-slate-500 mt-1">Exporta datos transaccionales, auditorías y documentos masivos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Filtros Card */}
        <div className="col-span-1 md:col-span-3 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">Parámetros del Reporte</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Formulario Selector */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Seleccionar Plantilla / Formulario</label>
              <select
                value={selectedForm}
                onChange={(e) => setSelectedForm(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">-- Elige un formulario --</option>
                {isLoadingForms ? (
                  <option disabled>Cargando...</option>
                ) : (
                  formsData?.data?.map((form: any) => (
                    <option key={form.id} value={form.id}>{form.name}</option>
                  ))
                )}
              </select>
            </div>

            {/* Fecha Inicio */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Fecha de Inicio</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Fecha Fin */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Fecha de Fin</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones de Exportación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Generar Excel */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Exportar a Excel (.xlsx)</h3>
              <p className="text-sm text-slate-600 mb-4">
                Genera una sábana de datos plana con todas las respuestas y metadata de los documentos filtrados. Ideal para inteligencia de negocios.
              </p>
              <button
                onClick={handleGenerateExcel}
                disabled={generateExcel.isPending}
                className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-70"
              >
                {generateExcel.isPending ? 'Procesando...' : (
                  <>
                    <Download className="w-4 h-4" />
                    Generar Reporte Excel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Generar ZIP de PDFs */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-indigo-100 text-indigo-600 rounded-2xl">
              <FileArchive className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-800 mb-1">Descargar Documentos (ZIP)</h3>
              <p className="text-sm text-slate-600 mb-4">
                Empaqueta todos los PDFs generados (junto con firmas y anexos) en un archivo comprimido. El proceso se envía en segundo plano.
              </p>
              <button
                onClick={handleGenerateZip}
                disabled={generateZip.isPending}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70"
              >
                {generateZip.isPending ? 'Empaquetando...' : (
                  <>
                    <Download className="w-4 h-4" />
                    Empaquetar PDFs en ZIP
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
