import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BASE_URL, getHeaders } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class SystemService {

  constructor(private http: HttpClient) { }

  getLogs(filter){
    const reqHeader = getHeaders(0);
    const path = `${BASE_URL}system/log/`;
    return this.http.post(path, filter, { headers: reqHeader });
  }
}
