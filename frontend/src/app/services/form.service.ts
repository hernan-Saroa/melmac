import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BASE_URL } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class FormService {

  constructor(private http: HttpClient) { }

  view(consecutive) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/list/' + consecutive + '/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  list() {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  list_state(state) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/' + state + '/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  create(form_data) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    // const path = BASE_URL + 'form/' + user.enterprise + '/';
    const path = BASE_URL + 'form/';
    return this.http.post<{}>(path, form_data, { headers: reqHeader });
  }

  clone(form_id, form_data: {}) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/digital/' + form_id + '/';
    return this.http.put<{}>(path, form_data, { headers: reqHeader });
  }

  delete(form_id) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/delete/' + form_id + '/';
    return this.http.delete<{}>(path, { headers: reqHeader });
  }

  activate(form_id) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    let form_data = {id: form_id };
    const path = BASE_URL + 'form/activate/';
    return this.http.post<{}>(path, form_data, { headers: reqHeader });
  }

  create_consecutive(form_data: {}) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/consecutive/';
    return this.http.post<{}>(path, form_data, { headers: reqHeader });
  }

  // Detalle
  get_detail(form) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/detail/' + form + '/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  get_send() {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/send/' + user.enterprise + '/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  //share_forwarding
  share_forwarding(form) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/share_forwarding/' + form + '/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  share_forwarding_all(form_data) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/share_forwarding_all/';
    return this.http.post<{}>(path, form_data, { headers: reqHeader });
  }

  // Link
  update_link(form_data: {}) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/link/';
    return this.http.post<{}>(path, form_data, { headers: reqHeader });
  }

  // Share Link
  share_link(form_data: {}) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/share/';
    return this.http.post<{}>(path, form_data, { headers: reqHeader });
  }

  // Fields
  get_fields(form) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/field/' + form + '/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  // Fields
  get_fields_type(form, type) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/field/' + form + '/' + type + '/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  // Form all data
  get_data_form(form, consecutive='') {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    let path = BASE_URL + 'form/data/' + form + '/';
    if (consecutive != '') {
      path = BASE_URL + 'form/data/' + form + '/' + consecutive + '/';
    }
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  get_data_answer(form, consecutive, answer) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    let path = BASE_URL + 'form/data/' + form + '/' + consecutive + '/' + answer + '/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  // Consecutive
  get_data_consecutive(form) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/consecutive/data/' + form + '/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  // Form all data
  get_enterprise_token(token) {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    let path = BASE_URL + 'form/public/enterprise/' + token + '/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  get_form_token(token) {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    let path = BASE_URL + 'form/public/' + token + '/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  get_pdf_token(token, idUser = '0') {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    let path = BASE_URL + 'form/public/pdf/' + token + '/' + idUser + '/';
    // return this.http.get<{}>(path, { headers: reqHeader });
    return this.http.get(path, { responseType: 'arraybuffer', headers: reqHeader });
  }


  get_answer_token(token, current, consecutive, answer='') {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    let path = BASE_URL + 'form/public/' + token + '/' + consecutive + '/' + current + '/';
    if (answer != '') {
      path = BASE_URL + 'form/public/' + token + '/' + consecutive + '/' + current + '/' + answer + '/';
    }
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  uploadAdditionalData(data: FormData) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/data/user/additional/';
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }


  fieldHeadAdditionalData(data: FormData) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/field/data/head/additional/';
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }


  get_digital_ia_state(form) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    let path = BASE_URL + 'form/digital/ia/status/' + form + '/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

}
