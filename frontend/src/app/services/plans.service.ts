import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BASE_URL, getHeaders } from './site.service';
@Injectable({
  providedIn: 'root'
})
export class PlansService {
  constructor(private http: HttpClient) { }
  list() {
    const reqHeader = getHeaders();
    const path = BASE_URL + 'list_plan/';
    return this.http.post<{}>(path, { headers: reqHeader });
  }
  create_plan(data){
    const reqHeader = getHeaders();
    const path = BASE_URL + 'create_plan/';
    return this.http.post<{}>(path, data,{ headers: reqHeader });
  }
  create_service_plan(data){
    const reqHeader = getHeaders();
    const path = BASE_URL + 'create_service_plan/';
    return this.http.post<{}>(path, data,{ headers: reqHeader });
  }

  list_home_item_user(){
    let data;
     if (localStorage.getItem('session')){
       let user = JSON.parse(localStorage.getItem('session'))
       data = {user_id:user.id};
     }
     const reqHeader = getHeaders();
     const path = BASE_URL + 'list_home_item_user/';
     return this.http.post<{}>(path, data,{ headers: reqHeader });
   }
}
