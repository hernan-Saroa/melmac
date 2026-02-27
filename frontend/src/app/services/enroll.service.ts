import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BASE_URL } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class EnrollService {

  constructor(private http: HttpClient) { }

  view() {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'enroll/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  get_detail(pk) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'enroll/'+pk+'/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  // PDF
  get_pdf(id, enroll_pk) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'enroll/pdf/' + id + '/' + enroll_pk + '/';
    return this.http.get(path, { responseType: 'arraybuffer', headers: reqHeader });
  }

}
