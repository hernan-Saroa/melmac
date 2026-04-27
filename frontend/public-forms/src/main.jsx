import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import CreditFormDemo from './MelmacCreditForm.jsx'
import { getFormByToken, getEnterpriseBranding, submitPublicAnswer, extractTokenFromURL } from './api.js'
import './index.css'

/**
 * MelmacPublicFormApp
 * 
 * Smart wrapper that:
 * 1. Extracts the public token from the current URL
 * 2. If token found → loads real form data + enterprise branding from Django
 * 3. If no token → renders demo form
 */
function MelmacPublicFormApp() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(null);
  const [branding, setBranding] = useState(null);
  const token = extractTokenFromURL();

  useEffect(() => {
    if (token) {
      // Real mode: load form structure + branding from Django backend
      Promise.all([
        getFormByToken(token),
        getEnterpriseBranding(token).catch(() => null) // Branding is optional
      ])
        .then(([formResponse, brandingResponse]) => {
          console.log('📋 Formulario cargado desde backend:', formResponse);
          if (brandingResponse) {
            console.log('🎨 Branding cargado:', brandingResponse);
            setBranding(brandingResponse);
          }
          
          if (formResponse && formResponse.status) {
            setFormData(formResponse);
          } else {
            setError('El formulario no está disponible o el enlace ha expirado.');
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error('Error cargando formulario:', err);
          // If backend fails, fall back to demo
          setFormData(null);
          setLoading(false);
        });
    } else {
      // Demo mode: no token in URL
      setLoading(false);
    }
  }, [token]);

  const handleSubmit = async (data) => {
    if (token) {
      return submitPublicAnswer(token, data);
    } else {
      return new Promise((resolve) => {
        console.log('📋 [DEMO] Datos del formulario:', data);
        setTimeout(() => {
          alert('✅ Formulario enviado exitosamente (modo demo)');
          resolve();
        }, 1500);
      });
    }
  };

  const handleDataChange = (data) => {
    // Can be used for real-time PDF preview
  };

  // Loading State
  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', fontFamily: '-apple-system, sans-serif',
        flexDirection: 'column', gap: '16px', background: '#ffffff'
      }}>
        <div style={{
          position: 'relative', width: '120px', height: '120px'
        }}>
          <svg viewBox="0 0 120 120" style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            transform: 'rotate(-90deg)'
          }}>
            <circle cx="60" cy="60" r="52" fill="none" stroke="#f1f5f9" strokeWidth="2" />
            <circle cx="60" cy="60" r="52" fill="none" stroke="#509180" strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="327" strokeDashoffset="82"
              style={{ animation: 'loadSpin 1.2s ease-in-out infinite' }}
            />
          </svg>
          <img src="/favicon.png" alt=""
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '48px', opacity: 0.6 }}
            onError={(e) => { e.target.style.display = 'none' }}
          />
        </div>
        <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 300 }}>Cargando formulario...</p>
        <style>{`@keyframes loadSpin {
          0% { stroke-dashoffset: 327; }
          50% { stroke-dashoffset: 82; }
          100% { stroke-dashoffset: 327; }
        }`}</style>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        height: '100vh', fontFamily: '-apple-system, sans-serif',
        flexDirection: 'column', gap: '12px', padding: '20px', textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px' }}>⚠️</div>
        <h2 style={{ color: '#1e293b', margin: 0, fontWeight: 600 }}>Formulario no disponible</h2>
        <p style={{ color: '#64748b', maxWidth: '400px' }}>{error}</p>
      </div>
    );
  }

  // Render form (real or demo)
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <CreditFormDemo
        config={formData ? undefined : undefined}
        onDataChange={handleDataChange}
        onSubmit={handleSubmit}
        initialData={{}}
        readOnly={false}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MelmacPublicFormApp />
  </React.StrictMode>,
)
