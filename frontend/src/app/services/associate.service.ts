import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BASE_URL } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class AssociateService {

  constructor(private http: HttpClient) { }

  get_role() {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'role_list/';
    return this.http.get<[]>(path, { headers: reqHeader });
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

  view(form:string, option:string) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/associate/' + form + '/' + option + '/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  create(id:string, form:string, option:string) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/associate/' + form + '/' + option + '/';
    return this.http.post<{}>(path, {'id': id}, { headers: reqHeader });
  }

  delete(id:string, form:string, option:string) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'form/associate/' + form + '/' + option + '/' + id + '/';
    return this.http.delete<{}>(path, { headers: reqHeader });
  }

  get_enterprise_process(name) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'enterprise_process/'+name+'/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }
}
