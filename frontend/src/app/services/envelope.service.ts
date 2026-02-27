import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BASE_URL, getHeaders } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class EnvelopeService {

  list() {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}envelope/`;
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  list_offset(offset=0, limit=4) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}envelope/?_offset=` + offset + '&_limit=' + limit;
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  list_answer(data) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}envelope/list/answer/`;
    return this.http.post<[]>(path, data, { headers: reqHeader });
  }

  loading_form(data, ext = '') {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}envelope/${ext}`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  deleteFieldOrElement(action: string, id: number) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}envelope/delete/${action}/${id}/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  stateEnvelope(data) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}envelope/state/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  list_form(data) {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const path = `${BASE_URL}envelope/fields/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  get_envelope_token(option, answer, token) {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const path = `${BASE_URL}envelope/fill_out/` + option + '/' + answer + '/' + token + '/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  save_answer(answer_data) {
    const path = BASE_URL + 'envelope/answer/';
    return this.http.post<{}>(path, answer_data);
  }

  get_token_contact_public(answer_data) {
    const path = BASE_URL + 'envelope/answer/public/contact/';
    return this.http.post<{}>(path, answer_data);
  }

  save_approve(approve_data) {
    const path = BASE_URL + 'envelope/approve/';
    return this.http.post<{}>(path, approve_data);
  }

  save_verified(verified_data) {
    const path = BASE_URL + 'envelope/verified/';
    return this.http.post<{}>(path, verified_data);
  }

  validate_checker(verified_data) {
    const path = BASE_URL + 'envelope/checker/';
    return this.http.post<{}>(path, verified_data);
  }

  get_checker_file(verified_data) {
    const path = BASE_URL + 'envelope/checker/file/';
    return this.http.post(path, verified_data, { responseType: 'arraybuffer' });
  }

  get_identification() {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const path = BASE_URL + 'identification/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  get_envelope_table_pdf(data) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}envelope/answer/public/table/`;
    return this.http.post(path, data, { responseType: 'arraybuffer', headers: reqHeader });
  }

  get_envelope_traceability(envelope_id) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}envelope/traceability/${envelope_id}/`;
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  constructor( private http: HttpClient) { }
}
