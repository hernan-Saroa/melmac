import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BASE_URL, getHeaders } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService{

  constructor(
    private http: HttpClient,
  ) { }

  get_indicator(option:string){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}data_statistics/indicator/${option}`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  get_graph(option:string){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}data_statistics/graph/${option}`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

}
