// ====================================================================
// MELMAC API ADAPTER
// Connects the React public form to the Melmac Django backend
// ====================================================================

const BASE_URL = 'http://localhost:8000/';

/**
 * Fetches the form structure + fields using the public token.
 * This is the SAME endpoint that Angular's FormComponent uses.
 * No authentication required.
 * 
 * Endpoint: GET form/public/{token}/
 * Returns: { status: true, form: { id, name, description, fields: [...], digital, consecutive, ... } }
 */
export async function getFormByToken(token) {
  const url = `${BASE_URL}form/public/${token}/`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Error cargando formulario: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetches the enterprise branding (logo, colors, name) for the form.
 * No authentication required.
 * 
 * Endpoint: GET form/public/enterprise/{token}/
 */
export async function getEnterpriseBranding(token) {
  const url = `${BASE_URL}form/public/enterprise/${token}/`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Error cargando branding: ${response.status}`);
  }

  return response.json();
}

/**
 * Submits the completed form answers to the Melmac backend.
 * Public endpoint — no authentication token required.
 * 
 * Endpoint: POST form/public/answer/{token}/
 */
export async function submitPublicAnswer(token, answerData) {
  const url = `${BASE_URL}form/public/answer/${token}/`;

  const isFormData = answerData instanceof FormData;

  const options = {
    method: 'POST',
    body: isFormData ? answerData : JSON.stringify(answerData),
  };

  if (!isFormData) {
    options.headers = { 'Content-Type': 'application/json' };
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Error enviando respuesta: ${response.status} - ${errorBody}`);
  }

  return response.json();
}

/**
 * Generates a temporal PDF preview with current form data.
 * Public endpoint — no authentication required.
 * 
 * Endpoint: POST answer/pdf/digital/temporal/{formId}/{token}/
 */
export async function getTemporalPDF(formId, token, data) {
  const url = `${BASE_URL}answer/pdf/digital/temporal/${formId}/${token}/`;

  const response = await fetch(url, {
    method: 'POST',
    body: data, // FormData
  });

  if (!response.ok) {
    throw new Error(`Error generando PDF: ${response.status}`);
  }

  return response.blob();
}

/**
 * Validates a document number against the ANI registry.
 */
export async function validateDocumentANI(documentNumber, formId) {
  const url = `${BASE_URL}api_data_ANI/${documentNumber}/${formId}/`;

  const response = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Error validando documento ANI: ${response.status}`);
  }

  return response.json();
}

/**
 * Extracts the public form token from the current URL.
 * Supports patterns:
 *  - /TOKEN              (simple)
 *  - /public/TOKEN       (from Angular redirect)
 *  - ?token=TOKEN        (query param)
 * 
 * @returns {string|null} The token
 */
export function extractTokenFromURL() {
  const params = new URLSearchParams(window.location.search);
  
  // Try query param first
  if (params.get('token')) {
    return params.get('token');
  }

  // Try path - get last non-empty segment
  const segments = window.location.pathname.split('/').filter(Boolean);
  
  if (segments.length > 0) {
    return segments[segments.length - 1];
  }

  return null;
}

export default {
  getFormByToken,
  getEnterpriseBranding,
  submitPublicAnswer,
  getTemporalPDF,
  validateDocumentANI,
  extractTokenFromURL,
};
