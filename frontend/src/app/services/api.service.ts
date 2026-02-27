import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BASE_URL, getHeaders } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private http: HttpClient,
  ) { }

  getApiList(){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}api/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  getApiEnterprise(){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}api/list/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  createApiEnterprise(data){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}api/list/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  updateApiEnterprise(data){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}api/list/`;
    return this.http.put<{}>(path, data, { headers: reqHeader });
  }

  getApiConsumption(){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}api/detail/list/`;
    return this.http.get<{}>(path, { headers: reqHeader });

  }
}
