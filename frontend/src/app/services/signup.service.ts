import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BASE_URL, getHeaders } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class SignupService {

  constructor( private http: HttpClient) { }

  signup(data) {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const path = BASE_URL + 'signup/';
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  requestToken(email: string) {
    const path = BASE_URL + 'send_token/';
    let env = sessionStorage.getItem('environment');
    let enterprise = ''
    if (localStorage.getItem('session')){
      let user = JSON.parse(localStorage.getItem('session'))
      enterprise = user.enterprise
    }
    let data = {email:email,enterprise:enterprise};
    if (env){
      data['ent'] = env.split(';')[1];
    }
    return this.http.post(path, data);
  }

  validateToken(email: string, token: string) {
    const path = BASE_URL + 'validate_token/';
    let env = sessionStorage.getItem('environment');
    let data = {email:email, token:token};
    if (env){
      data['ent'] = env.split(';')[1];
    }
    return this.http.post(path, data);
  }

  setNewPassword(email:string, password:string, temporal_password:string){
    const path = BASE_URL + 'recovery_pass/';
    let env = sessionStorage.getItem('environment');
    let data = {email:email, password:password, temporal_pass:temporal_password};
    if (env){
      data['ent'] = env.split(';')[1];
    }
    return this.http.post(path, data);
  }

}
