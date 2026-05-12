import { useQueries } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Users, FileText, CheckCircle, Clock, ShieldCheck, Download, Calendar } from 'lucide-react';
import { fetchLegacy } from './lib/api';
import { SessionUtil } from './lib/session';

export default function Dashboard() {
  const enterpriseId = SessionUtil.getEnterpriseId() || '';
  
  // Usamos useQueries para lanzar múltiples llamadas al backend legado en paralelo
  const results = useQueries({
    queries: [
      {
        queryKey: ['stat_summary', enterpriseId],
        queryFn: async () => {
          const res = await fetchLegacy(`/statistics/summary/?enterprise_id=${enterpriseId}`);
          return res.data || {};
        }
      },
      {
        queryKey: ['stat_timeline', enterpriseId],
        queryFn: async () => {
          const res = await fetchLegacy(`/statistics/timeline/?enterprise_id=${enterpriseId}`);
          return res.data || [];
        }
      },
      {
        queryKey: ['stat_doc_types', enterpriseId],
        queryFn: async () => {
          const res = await fetchLegacy(`/statistics/document_types/?enterprise_id=${enterpriseId}`);
          return res.data || [];
        }
      }
    ]
  });

  const [summaryQuery, timelineQuery, docTypesQuery] = results;
  const isLoading = results.some(q => q.isLoading);
  const isError = results.some(q => q.isError);

  const summary = summaryQuery.data || {};
  const timeline = timelineQuery.data || [];
  const docTypes = docTypesQuery.data || [];

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (isLoading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Cargando métricas de Melmac...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full p-8 text-center bg-rose-50 rounded-2xl border border-rose-100 text-rose-600 mt-6 max-w-4xl mx-auto">
        No se pudieron cargar las estadísticas. Verifica que el servidor Django esté corriendo y tengas sesión activa.
      </div>
    );
  }

  // Tarjetas de Métricas Rápidas
  const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-4 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h4 className="text-2xl font-bold text-slate-900">{value || 0}</h4>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-7 h-7 text-indigo-600" />
            Dashboard Ejecutivo
          </h2>
          <p className="text-sm text-slate-500 mt-1">Visión global de métricas consumiendo el motor analítico de Django</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors">
          <Calendar className="w-4 h-4" /> Este Mes
        </button>
      </div>

      {/* Tarjetas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Documentos" value={summary.total_documents || 0} icon={FileText} colorClass="bg-indigo-50 text-indigo-600" />
        <StatCard title="Firmas Electrónicas" value={(summary.signatures?.grafo || 0) + (summary.signatures?.otp || 0)} icon={ShieldCheck} colorClass="bg-emerald-50 text-emerald-600" />
        <StatCard title="Transacciones (ANI)" value={summary.transactions?.registraduria || 0} icon={Users} colorClass="bg-amber-50 text-amber-600" />
        <StatCard title="Docs Pendientes" value={summary.unsigned_documents || 0} icon={Clock} colorClass="bg-rose-50 text-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Línea - Timeline */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Volumen de Creación de Documentos (Línea de Tiempo)</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeline} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="count" name="Documentos" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Torta - Tipos de Documento */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Distribución por Tipo</h3>
          <div className="h-80 w-full flex items-center justify-center">
            {docTypes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={docTypes}
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="name"
                  >
                    {docTypes.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400">No hay datos de distribución</p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {docTypes.map((type: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                {type.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
