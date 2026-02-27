import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BASE_URL, getHeaders } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  view() {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = getHeaders();
    const path = BASE_URL + 'user/' + user.enterprise + '/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  create(user_data: {}) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = getHeaders();
    user_data['enterprise_id'] = user.enterprise;
    const path = BASE_URL + 'user/' + user.enterprise + '/';
    return this.http.post<{}>(path, user_data, { headers: reqHeader });
  }

  update(user_data: {}) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = getHeaders();
    const path = BASE_URL + 'user/' + user.enterprise + '/' + user_data['id'] + '/';
    return this.http.put<{}>(path, user_data, { headers: reqHeader });
  }

  delete(id: number) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = getHeaders();
    const path = BASE_URL + 'user/' + user.enterprise + '/' + id + '/';
    return this.http.delete<{}>(path, { headers: reqHeader });
  }

  get_role() {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = getHeaders();
    const path = BASE_URL + 'get_role/' + user.enterprise + '/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  get_identification() {
    const reqHeader = getHeaders();
    const path = BASE_URL + 'identification/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  update_profile(user_data){
    const reqHeader = getHeaders();
    const path = BASE_URL + 'update_profile/';
    return this.http.post<{}>(path, user_data, { headers: reqHeader });
  }

  getMassiveUsers() {
    const reqHeader = getHeaders();
    const path = BASE_URL + 'massive-users/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  uploadMassiveUsers(data: FormData){
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}massive-users/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  getMassiveError(pk){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}massive-users/${pk}/error/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  getNotifications(pos) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}user/notification/`+pos+'/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  markAsReaded(data: any) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}user/notification/status/`;
    return this.http.post<{}>(path, {id: data, status: 1}, { headers: reqHeader });
  }

  markAsDeleted(id: any) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}user/notification/status/`;
    return this.http.post<{}>(path, {id: [id], status: 2}, { headers: reqHeader });
  }

  get_user_role(id:any) {
    const path = BASE_URL + 'get_user_role/';
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    let data = {idRole:id};

    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

}
