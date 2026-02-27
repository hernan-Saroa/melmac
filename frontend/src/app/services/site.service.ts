import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';

export const BASE_URL = 'http://localhost:8000/';

@Injectable({
  providedIn: 'root'
})
export class SiteService {

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkToken();
  }

  login (data) {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const path = BASE_URL + 'login/';
    let env = sessionStorage.getItem('environment');
    if (env){
      data['ent'] = env.split(';')[1];
    }
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  logout(env?): void {
    // console.log('logout');
    let user = JSON.parse(localStorage.getItem('session')) || null;
    if (user){
      const reqHeader = getHeaders();
      const path = BASE_URL + 'logout/';
      this.http.get<{}>(path, { headers: reqHeader }).toPromise().then(response => {
        // console.log(response)
      });

      localStorage.removeItem('session');
    }
    let url = '/login';


    if (!env && sessionStorage.getItem('environment')){
      let env_part = sessionStorage.getItem('environment').split(';');
      env = this.router.url.split('/')[0];
    }

    if (env){
      url = '/login/' + env ;
    }

    this.router.navigate([url]);

  }

  public checkToken() {
    // console.log('checkToken');
    // console.log(this.router.url);
    const user = JSON.parse(localStorage.getItem('session')) || null;

    let env = null;
    if (sessionStorage.getItem('environment')){
      let env_part = sessionStorage.getItem('environment').split(';');
      let url_parts = this.router.url.split('/');
      // console.log(env_part, url_parts);
      if (url_parts[1] == env_part[0] || url_parts[2] == env_part[0]){
        env = env_part[0];
      }

    }
    if (user) {
      const reqHeader = getHeaders();
      const path = BASE_URL + 'login_validate/';
      let data = this.http.get<{}>(path, { headers: reqHeader });
      data.subscribe(
        data => {
          // console.log('subscribe');
          // console.log(data);
        },
        error => {
          if (this.router.url != '/site/recover-pass'){
            this.logout(env);
          }

          if (error.error['detail'] == 'Token inválido.'){
            window.location.reload();
          }
        },
      );
    } else {
      // console.log('Not session', env);
      let compare_array = ['/site/recover-pass'];
      if (env){
        compare_array.concat(['/site/'+env+'/login', '/site/'+env+'/', '/site/'+env+'/recover-pass'])
      }
      // console.log(compare_array , this.router.url)
      if (!compare_array.includes(this.router.url) && !this.router.url.startsWith('/public/')){
        this.logout(env);
      }
    }
  }

  public requestToken(email: string) {
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

  public requestTokenByPhone(phone: string, phone_ind: string, trace_token?) {
    const path = BASE_URL + 'send_token/';
    let enterprise = ''
    if (localStorage.getItem('session')){
      let user = JSON.parse(localStorage.getItem('session'))
      enterprise = user.enterprise
    }
    let data = {phone:phone,phone_ind:phone_ind,enterprise:enterprise};
    if (trace_token) {
      data['trace_token'] = trace_token
    }
    return this.http.post(path, data);
  }

  public requestTokenByEmail(email: string, token, pathname?, trace_token?) {
    const path = BASE_URL + 'send_token_email/';
    let enterprise = ''
    if (localStorage.getItem('session')){
      let user = JSON.parse(localStorage.getItem('session'))
      enterprise = user.enterprise
    }
    let data = {email:email, token:token, enterprise:enterprise, pathname:pathname };
    if (trace_token && trace_token != '') {
      data['trace_token'] = trace_token
    }
    return this.http.post(path, data);
  }

  public requestAuthorization(email: string, trace_token?, sign_name?: string, field_id?: string) {
    const path = BASE_URL + 'authorization/';
    let data = {email:email, sign_name:sign_name, field_id:field_id };
    if (trace_token && trace_token != '') {
      data['trace_token'] = trace_token
    }
    return this.http.post(path, data);
  }

  public requestBrowser(browser: string, trace_token?, ipAddress?: string, sign_name?: string, field_id?: string) {
    const path = BASE_URL + 'browser/';
    let data = {browser:browser, ipAddress:ipAddress, sign_name:sign_name, field_id:field_id};
    if (trace_token && trace_token != '') {
      data['trace_token'] = trace_token
    }
    return this.http.post(path, data);
  }


  public validateToken(email: string, token: string) {
    const path = BASE_URL + 'validate_token/';
    let env = sessionStorage.getItem('environment');
    let data = {email:email, token:token};
    if (env){
      data['ent'] = env.split(';')[1];
    }
    return this.http.post(path, data);
  }

  public validateTokenByPhone(phone: string, token: string, trace_token?, answer_data?) {
    const path = BASE_URL + 'validate_token/';
    let data = {phone:phone, token:token};
    if (trace_token) {
      data['trace_token'] = trace_token
    }
    if (answer_data) {
      data['answer_data'] = answer_data
    }
    return this.http.post(path, data);
  }

  public validateTokenByPhoneMail(phone: string, token: string, trace_token?, envelope?, type_user?, user?, answer_data?) {
    const path = BASE_URL + 'validate_token/';
    let data = {mail: phone, phone:phone, token:token};
    if (trace_token) {
      data['trace_token'] = trace_token
    }
    if (envelope) {
      data['envelope'] = envelope
    }
    if (type_user) {
      data['type_user'] = type_user
    }
    if (user) {
      data['user'] = user
    }
    if (answer_data) {
      data['answer_data'] = answer_data
    }
    return this.http.post(path, data);
  }

  public validateTokenByMail(mail: string, phone: string, token: string, trace_token?, envelope?, type_user?, user?, answer_data?) {
    const path = BASE_URL + 'validate_token/';
    let data = {
      mail: mail,
      phone:phone,
      token:token
    };
    if (trace_token) {
      data['trace_token'] = trace_token
    }
    if (envelope) {
      data['envelope'] = envelope
    }
    if (type_user) {
      data['type_user'] = type_user
    }
    if (user) {
      data['user'] = user
    }
    if(answer_data) {
      data['answer_data'] = answer_data
    }
    return this.http.post(path, data);
  }

  public setNewPassword(email:string, password:string, temporal_pass:string){
    const path = BASE_URL + 'recovery_pass/';
    let env = sessionStorage.getItem('environment');
    let data = {email:email, password:password, temporal_pass:temporal_pass, option:'change_password'};
    if (env){
      data['ent'] = env.split(';')[1];
    }
    return this.http.post(path, data);
  }

  checkLogged() {
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}login_validate/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  signup(data) {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const path = BASE_URL + 'signup/';
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  postFrameVideo(video, doc){
    const path = BASE_URL + 'general_resources/postFrameVideo/';
    let data = {video:video, doc:doc};
    return this.http.post(path, data);
  }

}
export function getHeaders(opt?){
  let user = JSON.parse(localStorage.getItem('session')) || null;
  let reqHeader;
  if (!opt){
    reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
  } else {
    reqHeader = new HttpHeaders({
      // 'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
  }
  return reqHeader;
}
