import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BASE_URL, getHeaders } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class ParameterService {

  constructor(private http: HttpClient) { }

  list() {
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}parameter/`;
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  updateData(id, data: {}) {
    const reqHeader = getHeaders(1);
    const path = BASE_URL + 'parameter/' + id + '/';
    return this.http.put<{}>(path, data, { headers: reqHeader });
  }

  Parameterlist() {
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}value_parameter_list/`;
    return this.http.get<[]>(path, { headers: reqHeader });
  }
}
