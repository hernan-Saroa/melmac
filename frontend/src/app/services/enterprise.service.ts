import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BASE_URL, getHeaders } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class EnterpriseService {

  acronyms = null;
  last_check = null;

  constructor(private http: HttpClient) { }

  view() {
    const reqHeader = getHeaders();
    const path = BASE_URL + 'enterprise/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  create(user_data: {}) {
    const reqHeader = getHeaders();
    const path = BASE_URL + 'enterprise/';
    return this.http.post<{}>(path, user_data, { headers: reqHeader });
  }

  update(user_data: {}) {
    const reqHeader = getHeaders();
    const path = BASE_URL + 'enterprise/' + user_data['id'] + '/';
    return this.http.put<{}>(path, user_data, { headers: reqHeader });
  }

  get_theme() {
    const reqHeader = getHeaders();
    const path = BASE_URL + 'theme_list/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  updateTheme(data: {}) {
    const reqHeader = getHeaders();
    const path = BASE_URL + 'enterprise/theme/';
    return this.http.put<{}>(path, data, { headers: reqHeader });
  }

  getAcronyms(){
    const path = BASE_URL + 'enterprise/acronym_list/';
    return this.http.get<{}>(path);
  }

  getDetails(){
    const reqHeader = getHeaders();
    const path = BASE_URL + 'enterprise/detail/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  emailEnterprise(data) {
    const reqHeader = getHeaders();
    const path = BASE_URL + 'enterprise/emails_general/';
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  updateDetails(data){
    const reqHeader = getHeaders(1);
    const path = BASE_URL + 'enterprise/detail/';
    return this.http.put<[]>(path, data, { headers: reqHeader });
  }

  // Public Enterprise
  get_enterprise_token(token) {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    let path = BASE_URL + 'enterprise/public/' + token + '/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  send_public_share(data,data1,data2,data3,data4,data5,data6) {
    console.log(data)
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const path = BASE_URL + 'enterprise/public/share/'+data+'/'+data1+'/'+data2+'/'+data3+'/'+data4+'/'+data5+'/'+data6+'/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  getAttempts(idEnterprise) {
    const reqHeader = getHeaders();
    const path = BASE_URL + 'enterprise/attempts/' + idEnterprise;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  saveAttempts(data) {
    const reqHeader = getHeaders();
    const path = BASE_URL + 'enterprise/attempts/';
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  eventSengrid(data) {
    const reqHeader = getHeaders();
    const path = BASE_URL + 'sendgrid-event/';
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

}
