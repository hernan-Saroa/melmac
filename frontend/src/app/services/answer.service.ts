import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BASE_URL } from './site.service';
import { NbWindowRef } from '@nebular/theme';

@Injectable({
  providedIn: 'root'
})
export class AnswerService {

  private windowRef: NbWindowRef

  setWindowRef(windowRef: NbWindowRef): void {
    this.windowRef = windowRef;
  }

  getWindowRef(): NbWindowRef {
    return this.windowRef;
  }

  constructor(private http: HttpClient) {}

  create(answer_data) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      // 'Content-Type': 'multipart/encrypted',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/';
    return this.http.post<{}>(path, answer_data, { headers: reqHeader });
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

  // Secuencia
  get_sequence(form, answer=null) {
    // let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      // 'Authorization': 'Token ' + user.token
    });
    let path = BASE_URL + 'form/sequence/' + form + '/';
    if (answer != null) {
      path = BASE_URL + 'form/sequence/' + form + '/' + answer + '/';
    }
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  // Todas las respuestas
  list() {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  list_state(state) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/' + state + '/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  // Respuestas por formulario
  list_form(form) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/form/' + form + '/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  // Respuestas por formulario consecutivo
  list_form_consecutive(form) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/form/consecutive/' + form + '/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  // Respuestas
  list_field(consecutive, answer) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/' + consecutive + '/' + answer + '/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  list_state_answer(id) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/state_answer/' + id + '/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  delete(consecutive, answer) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/' + consecutive + '/' + answer + '/';
    return this.http.delete<{}>(path, { headers: reqHeader });
  }

  // PDF
  get_pdf(consecutive, answer) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/pdf/' + consecutive + '/' + answer + '/';
    return this.http.get(path, { responseType: 'arraybuffer', headers: reqHeader });
  }

  // PDF Documento
  get_pdf_document(consecutive, answer, type = null, field= null) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    if (type == null) {
      type = 0
    }
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    let path = BASE_URL + 'answer/pdf/document/' + consecutive + '/' + answer + '/'+  type + '/';
    if (field != null) {
      path = path + field + '/';
    }
    return this.http.get(path, { responseType: 'arraybuffer', headers: reqHeader });
  }

  getDigitalPDF(consecutive, answer) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/pdf/digital/' + consecutive + '/' + answer + '/';
    return this.http.get(path, { responseType: 'arraybuffer', headers: reqHeader });
  }

  getTemporalPDF(form, data) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      // 'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/pdf/digital/temporal/' + form + '/';
    return this.http.post(path, data, { responseType: 'arraybuffer', headers: reqHeader });
  }

  // Public
  getTemporalPublicPDF(token, form, data) {
    const path = BASE_URL + 'answer/pdf/digital/temporal/' + form + '/' + token + '/';
    return this.http.post(path, data, { responseType: 'arraybuffer'});
  }

  // Historico
  get_historical(id) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'historical/' + id + '/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  get_user_data_token(token) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + token
    });
    const path = BASE_URL + 'user_data_token/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  get_user() {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'user_list/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  get_admin() {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'admin_list/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  getMassiveAnswer() {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'massive-answer/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  uploadMassiveAnswer(data: FormData) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'massive-answer/';
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  createPublic(token, answer_data) {
    const path = BASE_URL + 'form/public/answer/' + token + '/';
    return this.http.post<{}>(path, answer_data, {});
  }

  registerElectronicSignature(data){
    const path = BASE_URL + 'enrolment_user_document/';
    return this.http.post<{}>(path, data, {});
  }

  getBiometricSignature(data){
    const path = BASE_URL + 'enrolment_user_validate/';
    return this.http.post<{}>(path, data, {});
  }

  getBiometricToken(data){
    const path = BASE_URL + 'get_token/';
    return this.http.post<{}>(path, data, {});
  }

  getBiometricMatch(data){
    const path = BASE_URL + 'get_video_match/';
    return this.http.post<{}>(path, data, {});
  }

  getImageMatch(data){
    const path = BASE_URL + 'get_image_match/';
    return this.http.post<{}>(path, data, {});
  }

  getOCR(data){
    const path = BASE_URL + 'get_ocr/';
    return this.http.post<{}>(path, data, {});
  }

  enrolmentUser(data){
    const path = BASE_URL + 'enrolment_user/';
    return this.http.post<{}>(path, data, {});
  }

  getImageMatchForm(data){
    const path = BASE_URL + 'get_image_match_form/';
    return this.http.post<{}>(path, data, {});
  }

  getDocumentInfoANI(data){
    const path = BASE_URL + 'get_token_auth_ani/';
    return this.http.post<{}>(path, data, {});
  }

  get_excel(consecutive, id) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/excel/' + consecutive + '/' + id + '/';
    return this.http.get(path, { responseType: 'arraybuffer', headers: reqHeader });
  }

  get_document_excel(data) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/excel/document/';
    let send = { headers: reqHeader }
    /* if (data['file']) {
      send['responseType'] = 'arraybuffer';
    } */
    return this.http.post(path, data, send);
  }

  create_document_zip_pdf(data) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/zip/pdf/document/';
    let send = { headers: reqHeader }
    return this.http.post(path, data, send);
  }

  stop_threads_zip(data){
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/zip/stop/thread/';
    let send = { headers: reqHeader }
    return this.http.post(path, data, send);
  }

  get_document_zip_pdf() {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/zip/pdf/list/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  get_pdf_to_zip_doc(id,opt) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/pdf/to/zip/'+ id + '/'+ opt + '/';
    return this.http.get(path, {responseType: 'arraybuffer', headers: reqHeader });
  }

  get_report_downloadFile(id) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/pdf/to/download/'+ id + '/';
    return this.http.get(path, {responseType: 'arraybuffer', headers: reqHeader });
  }

  getNitInfo(data){
    const path = BASE_URL + 'get_nit_info/';
    return this.http.post<{}>(path, data, {});
  }

  getDataANI(document,id_form){
    const path = BASE_URL + 'api_data_ANI/' + document +'/'+ id_form +'/';
    return this.http.get<{}>(path);
  }

  getValidateUnique(data) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/unique/validate/';
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  // PDF
  getUniqueState() {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'answer/unique/state/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  camDetect(img_data) {
    const path = BASE_URL + 'api_detect_doc/';
    return this.http.post<{}>(path, img_data);
  }

}
