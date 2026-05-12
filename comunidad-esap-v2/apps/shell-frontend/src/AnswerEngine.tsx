import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchLegacy } from './lib/api';
import { toast } from 'sonner';
import { ChevronLeft, Save, Send, ShieldCheck, MapPin, Camera, Signature, Clock, Search, Navigation2 } from 'lucide-react';
import SignaturePad from './components/SignaturePad';

export default function AnswerEngine() {
  const { formId } = useParams();
  const navigate = useNavigate();

  // State para almacenar las respuestas del usuario
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [geoCoords, setGeoCoords] = useState<string>("0.0,0.0");
  const [isLocating, setIsLocating] = useState(false);

  // Intentar obtener geolocalización al cargar
  useEffect(() => {
    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoCoords(`${position.coords.latitude},${position.coords.longitude}`);
          setIsLocating(false);
        },
        (error) => {
          console.warn('Geolocalización denegada o fallida:', error);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  // Fetch Form Detail
  const { data: formData, isLoading } = useQuery({
    queryKey: ['form_detail', formId],
    queryFn: async () => {
      const data = await fetchLegacy(`/form/data/${formId}/`);
      return data.form; // El endpoint de data retorna { status: true, form: {...} }
    },
    enabled: !!formId
  });

  const handleInputChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const submitMutation = useMutation({
    mutationFn: async (payload: any) => {
      const data = await fetchLegacy('/answer/', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return data;
    },
    onSuccess: (data) => {
      if (data.status) {
        toast.success('Documento diligenciado correctamente');
        navigate(-1); // Regresar
      } else {
        toast.error(data.message || 'Error al guardar el formulario');
      }
    }
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validar requeridos
    let valid = true;
    formData?.fields?.forEach((f: any) => {
      if (f.required && !answers[f.field]) {
        valid = false;
        toast.warning(`El campo "${f.label}" es obligatorio`);
      }
    });

    if (!valid) return;

    const payload = {
      form: formId,
      fields: JSON.stringify(answers),
      position: JSON.stringify({ 
        lat: geoCoords.split(',')[0] || "0.0", 
        lon: geoCoords.split(',')[1] || "0.0" 
      }),
      online: 1, // Indica que es online
      source: 1, // 1: Web
    };
    
    submitMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!formData) {
    return <div className="p-8 text-center text-slate-500">Error cargando el formulario.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4 mr-1" /> Volver
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Info & PDF Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-violet-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <ShieldCheck className="w-12 h-12 text-indigo-300 mb-6" />
            <h1 className="text-3xl font-bold mb-3 tracking-tight">{formData.name}</h1>
            <p className="text-indigo-100/80 leading-relaxed text-sm">
              {formData.description || 'Diligencia la información solicitada en este documento oficial.'}
            </p>

            <div className="mt-8 p-4 bg-black/20 rounded-2xl border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs font-medium text-indigo-200">
                <span>Versión: {formData.version || '1.0'}</span>
                <span>{formData.consecutive ? 'Consecutivo' : 'Libre'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Dynamic Form Renderer */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
            <form onSubmit={onSubmit} className="space-y-8">
              
              {formData.fields?.map((field: any) => {
                // RENDERIZADO DINÁMICO DE CAMPOS
                const fieldType = parseInt(field.field_type, 10);
                
                // Tipo 1: Texto, 2: Número, 5: Letras, 11: Documento, 15: Ubicación, 16: Moneda, 20: NIT, 22: OTP, 23: País, 24: Serie, 25: Dirección
                if ([1, 2, 5, 11, 15, 16, 20, 22, 23, 24, 25].includes(fieldType)) {
                  return (
                    <div key={field.field} className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 tracking-wide uppercase flex items-center gap-1">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input 
                        type={field.field_type === 2 ? 'number' : 'text'}
                        className="w-full border-b-2 border-slate-200 py-3 text-slate-800 focus:outline-none focus:border-indigo-600 transition-colors bg-transparent placeholder-slate-300 font-medium"
                        placeholder={`Escribe ${field.label.toLowerCase()}...`}
                        value={answers[field.field] || ''}
                        onChange={(e) => handleInputChange(field.field, e.target.value)}
                        required={field.required}
                      />
                      {field.description && <p className="text-xs text-slate-400 mt-1">{field.description}</p>}
                    </div>
                  );
                }

                // Tipo 6: Textarea, Tipo 17: Tabla (fallback), Tipo 26: Llave-Valor
                if ([6, 17, 26].includes(fieldType)) {
                  return (
                    <div key={field.field} className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 tracking-wide uppercase flex items-center gap-1">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <textarea 
                        className="w-full border-2 border-slate-200 rounded-xl p-4 text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all bg-slate-50 placeholder-slate-300"
                        rows={4}
                        placeholder={`Describe ${field.label.toLowerCase()}...`}
                        value={answers[field.field] || ''}
                        onChange={(e) => handleInputChange(field.field, e.target.value)}
                        required={field.required}
                      />
                    </div>
                  );
                }

                // Tipo 4: Fecha, Tipo 19: Hora
                if ([4, 19].includes(fieldType)) {
                  return (
                    <div key={field.field} className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 tracking-wide uppercase flex items-center gap-1">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input 
                        type={fieldType === 19 ? "time" : "date"}
                        className="w-full border-b-2 border-slate-200 py-3 text-slate-800 focus:outline-none focus:border-indigo-600 transition-colors bg-transparent font-medium"
                        value={answers[field.field] || ''}
                        onChange={(e) => handleInputChange(field.field, e.target.value)}
                        required={field.required}
                      />
                    </div>
                  );
                }

                // Tipo 8: Archivo, Tipo 9: Captura, Tipo 10: Facial (fallback a archivo/cámara)
                if ([8, 9, 10].includes(fieldType)) {
                  return (
                    <div key={field.field} className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 tracking-wide uppercase flex items-center gap-1">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input 
                        type="file"
                        accept={fieldType === 8 ? "*/*" : "image/*"}
                        capture={fieldType === 8 ? undefined : "environment"}
                        className="w-full border-2 border-slate-200 border-dashed rounded-xl p-4 text-slate-800 focus:outline-none focus:border-indigo-600 transition-all bg-slate-50 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleInputChange(field.field, file.name); // Idealmente subir o leer base64
                          }
                        }}
                        required={field.required}
                      />
                    </div>
                  );
                }

                // Tipo 3: Selección Múltiple (Select)
                if (fieldType === 3) {
                  return (
                    <div key={field.field} className="space-y-2">
                      <label className="text-sm font-bold text-slate-700 tracking-wide uppercase flex items-center gap-1">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <div className="relative">
                        <select 
                          className="w-full border-2 border-slate-200 rounded-xl p-4 text-slate-800 focus:outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50 transition-all bg-slate-50 appearance-none"
                          value={answers[field.field] || ''}
                          onChange={(e) => handleInputChange(field.field, e.target.value)}
                          required={field.required}
                        >
                          <option value="">-- Seleccionar opción --</option>
                          {field.values?.map((opt: any) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                }

                // Tipo 12: Radio Buttons
                if (fieldType === 12) {
                  return (
                    <div key={field.field} className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 tracking-wide uppercase flex items-center gap-1">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <div className="flex flex-wrap gap-4">
                        {field.values?.map((opt: any) => (
                          <label key={opt.value} className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                            <input 
                              type="radio" 
                              name={`field_${field.field}`}
                              value={opt.value}
                              checked={answers[field.field] === opt.value}
                              onChange={(e) => handleInputChange(field.field, e.target.value)}
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                            />
                            <span className="text-sm font-medium text-slate-700">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }

                // Tipo 13: Checkbox
                if (fieldType === 13) {
                  return (
                    <div key={field.field} className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={answers[field.field] || false}
                          onChange={(e) => handleInputChange(field.field, e.target.checked)}
                          className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                        />
                        <span className="text-sm font-bold text-slate-700 tracking-wide uppercase">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </span>
                      </label>
                    </div>
                  );
                }

                // Tipo 7: Firma Manuscrita, Tipo 18: Firma con cédula
                if ([7, 18].includes(fieldType)) {
                  return (
                    <div key={field.field} className="space-y-3">
                      <label className="text-sm font-bold text-slate-700 tracking-wide uppercase flex items-center gap-1">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <SignaturePad 
                        initialValue={answers[field.field]}
                        onSignatureChange={(base64) => handleInputChange(field.field, base64)} 
                      />
                      {field.description && <p className="text-xs text-slate-400">{field.description}</p>}
                    </div>
                  );
                }

                // Tipo 14 o 27: Separador / Información
                if ([14, 27].includes(fieldType)) {
                  return (
                    <div key={field.field} className="bg-slate-50 p-4 rounded-xl border-l-4 border-indigo-500">
                      <p className="text-sm text-slate-600 italic">{field.description}</p>
                    </div>
                  );
                }

                // Tipo 21: Oculto
                if (fieldType === 21) {
                  return <input key={field.field} type="hidden" value={answers[field.field] || ''} />;
                }

                // Default para campos no implementados aún
                return null; // Ocultamos el fallback de error rojo completamente para que sea transparente
              })}

              <div className="pt-8 border-t border-slate-100 space-y-4">
                
                {/* Indicador de Geolocalización */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isLocating ? 'bg-amber-100 text-amber-600 animate-pulse' : geoCoords !== "0.0,0.0" ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700">Validación de Ubicación (GPS)</p>
                      <p className="text-xs text-slate-500">
                        {isLocating ? 'Obteniendo coordenadas seguras...' : geoCoords !== "0.0,0.0" ? `Coordenadas: ${geoCoords}` : 'Ubicación no disponible'}
                      </p>
                    </div>
                  </div>
                  {geoCoords !== "0.0,0.0" && <ShieldCheck className="w-5 h-5 text-emerald-500" />}
                </div>

                <button 
                  type="submit"
                  disabled={submitMutation.isPending || isLocating}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-xl font-bold hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                  {submitMutation.isPending ? 'Enviando Documento Seguro...' : (
                    <>
                      <Send className="w-5 h-5" /> Enviar y Firmar Documento
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
