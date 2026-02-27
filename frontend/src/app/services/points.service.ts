import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BASE_URL, getHeaders } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class PointsService {
  loadAddresses(data) {
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}points/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  checkStatus(data) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}points/status/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  constructor( private http: HttpClient) { }
}
