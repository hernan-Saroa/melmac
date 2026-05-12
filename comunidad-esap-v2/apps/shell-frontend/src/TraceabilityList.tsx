import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Search, Download, ShieldCheck, User, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { fetchLegacy } from './lib/api';

interface TraceabilityData {
  id: number;
  name_user: string;
  action: string;
  description: string;
  creation_date: string;
}

export default function TraceabilityList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Fetch Action Enum Maps
  const { data: actionsMap = {} } = useQuery({
    queryKey: ['traceability_actions'],
    queryFn: async () => {
      const data = await fetchLegacy('/traceability/');
      return data.action || {};
    }
  });

  // Fetch Audit Logs (Traceability)
  const { data: traceLogs = [], isLoading, isError } = useQuery<TraceabilityData[]>({
    queryKey: ['traceability_logs'],
    queryFn: async () => {
      // Usando el endpoint de la tabla legacy
      const data = await fetchLegacy('/traceability/trace_inbox/?_limit=100');
      return Array.isArray(data) ? data : data.data || [];
    }
  });

  const downloadTxt = async () => {
    setIsDownloading(true);
    try {
      const response = await fetchLegacy('/traceability/get_txt/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Envía filtros vacíos para descargar todo el rango actual
      });

      // Como la respuesta es texto/blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'melmac_logs.txt');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Archivo de auditoría (TXT) descargado correctamente');
    } catch (error) {
      toast.error('Error al descargar el log de trazabilidad');
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredLogs = traceLogs.filter(log => 
    (log.name_user || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-600" />
            Auditoría y Trazabilidad
          </h2>
          <p className="text-sm text-slate-500 mt-1">Registro inmutable de acciones de usuarios en la plataforma</p>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por usuario o descripción..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={downloadTxt}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-xl transition-colors shadow-sm disabled:opacity-70"
          >
            {isDownloading ? (
              <div className="w-4 h-4 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Download className="w-4 h-4" />
            )}
            Exportar TXT
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha y Hora</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Usuario Responsable</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Acción</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Descripción del Evento</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">Cargando registros de auditoría...</td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-rose-500 font-medium">Error al cargar datos. ¿Sesión activa?</td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log, index) => {
                  const mappedAction = actionsMap[log.action] || log.action || 'Desconocida';
                  const dateObj = new Date(log.creation_date);
                  return (
                    <tr key={log.id || index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-slate-600 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {dateObj.toLocaleDateString('es-CO')}
                          <span className="text-slate-400">|</span>
                          {dateObj.toLocaleTimeString('es-CO')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          {log.name_user}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                          {mappedAction}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-md truncate">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate" title={log.description}>{log.description}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No hay registros de trazabilidad para mostrar</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
