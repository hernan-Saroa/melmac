import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BASE_URL, getHeaders } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = BASE_URL;

  constructor(private http: HttpClient) {}

  getSummary(enterpriseId?: string, startDate?: string, endDate?: string, formId?: string): Observable<any> {
    const reqHeader = getHeaders();
    let params = new HttpParams();
    if (enterpriseId) params = params.append('enterprise_id', enterpriseId);
    if (startDate) params = params.append('start_date', startDate);
    if (endDate) params = params.append('end_date', endDate);
    if (formId && formId !== 'all') params = params.append('form_id', formId);
    return this.http.get(`${this.apiUrl}statistics/summary/`, { headers: reqHeader, params });
  }

  getFieldDistribution(enterpriseId?: string, formId?: string): Observable<any> {
    const reqHeader = getHeaders();
    let params = new HttpParams();
    if (enterpriseId) params = params.append('enterprise_id', enterpriseId);
    if (formId && formId !== 'all') params = params.append('form_id', formId);
    return this.http.get(`${this.apiUrl}statistics/fields/`, { headers: reqHeader, params });
  }

  exportAuditTrail(enterpriseId?: string, startDate?: string, endDate?: string, formId?: string): Observable<Blob> {
    const reqHeader = getHeaders();
    let params = new HttpParams();
    if (enterpriseId) params = params.append('enterprise_id', enterpriseId);
    if (startDate) params = params.append('start_date', startDate);
    if (endDate) params = params.append('end_date', endDate);
    if (formId && formId !== 'all') params = params.append('form_id', formId);
    return this.http.get(`${this.apiUrl}statistics/export/`, { 
      headers: reqHeader, 
      params: params,
      responseType: 'blob' 
    });
  }

  getTimeline(enterpriseId?: string, startDate?: string, endDate?: string, formId?: string): Observable<any> {
    const reqHeader = getHeaders();
    let params = new HttpParams();
    if (enterpriseId) params = params.append('enterprise_id', enterpriseId);
    if (startDate) params = params.append('start_date', startDate);
    if (endDate) params = params.append('end_date', endDate);
    if (formId && formId !== 'all') params = params.append('form_id', formId);
    return this.http.get(`${this.apiUrl}statistics/timeline/`, { headers: reqHeader, params });
  }

  getTopEnterprises(startDate?: string, endDate?: string): Observable<any> {
    const reqHeader = getHeaders();
    let params = new HttpParams();
    if (startDate) params = params.append('start_date', startDate);
    if (endDate) params = params.append('end_date', endDate);
    return this.http.get(`${this.apiUrl}statistics/top_enterprises/`, { headers: reqHeader, params });
  }

  getServices(enterpriseId?: string, startDate?: string, endDate?: string, formId?: string): Observable<any> {
    const reqHeader = getHeaders();
    let params = new HttpParams();
    if (enterpriseId) params = params.append('enterprise_id', enterpriseId);
    if (startDate) params = params.append('start_date', startDate);
    if (endDate) params = params.append('end_date', endDate);
    if (formId && formId !== 'all') params = params.append('form_id', formId);
    return this.http.get(`${this.apiUrl}statistics/services/`, { headers: reqHeader, params });
  }

  getActivePlans(): Observable<any> {
    const reqHeader = getHeaders();
    return this.http.get(`${this.apiUrl}statistics/active_plans/`, { headers: reqHeader });
  }

  getUserTypes(enterpriseId?: string, startDate?: string, endDate?: string): Observable<any> {
    const reqHeader = getHeaders();
    let params = new HttpParams();
    if (enterpriseId) params = params.append('enterprise_id', enterpriseId);
    if (startDate) params = params.append('start_date', startDate);
    if (endDate) params = params.append('end_date', endDate);
    return this.http.get(`${this.apiUrl}statistics/user_types/`, { headers: reqHeader, params });
  }

  getDocumentTypes(enterpriseId?: string, startDate?: string, endDate?: string, formId?: string): Observable<any> {
    const reqHeader = getHeaders();
    let params = new HttpParams();
    if (enterpriseId) params = params.append('enterprise_id', enterpriseId);
    if (startDate) params = params.append('start_date', startDate);
    if (endDate) params = params.append('end_date', endDate);
    if (formId && formId !== 'all') params = params.append('form_id', formId);
    return this.http.get(`${this.apiUrl}statistics/document_types/`, { headers: reqHeader, params });
  }

  getSharedDocuments(enterpriseId?: string, startDate?: string, endDate?: string, formId?: string): Observable<any> {
    const reqHeader = getHeaders();
    let params = new HttpParams();
    if (enterpriseId) params = params.append('enterprise_id', enterpriseId);
    if (startDate) params = params.append('start_date', startDate);
    if (endDate) params = params.append('end_date', endDate);
    if (formId && formId !== 'all') params = params.append('form_id', formId);
    return this.http.get(`${this.apiUrl}statistics/shared_documents/`, { headers: reqHeader, params });
  }

  getTemplateMetrics(enterpriseId?: string, startDate?: string, endDate?: string, formId?: string): Observable<any> {
    const reqHeader = getHeaders();
    let params = new HttpParams();
    if (enterpriseId) params = params.append('enterprise_id', enterpriseId);
    if (startDate) params = params.append('start_date', startDate);
    if (endDate) params = params.append('end_date', endDate);
    if (formId && formId !== 'all') params = params.append('form_id', formId);
    return this.http.get(`${this.apiUrl}statistics/template_metrics/`, { headers: reqHeader, params });
  }

  getBillableTransactions(enterpriseId?: string, startDate?: string, endDate?: string, formId?: string): Observable<any> {
    const reqHeader = getHeaders();
    let params = new HttpParams();
    if (enterpriseId) params = params.append('enterprise_id', enterpriseId);
    if (startDate) params = params.append('start_date', startDate);
    if (endDate) params = params.append('end_date', endDate);
    if (formId && formId !== 'all') params = params.append('form_id', formId);
    return this.http.get(`${this.apiUrl}statistics/billable_transactions/`, { headers: reqHeader, params });
  }
}
