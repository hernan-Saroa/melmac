import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BASE_URL, getHeaders } from './site.service';
@Injectable({
  providedIn: 'root'
})
export class DigitalService {

  constructor(private http: HttpClient) { }

  create(data: FormData) {
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}form/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  list() {
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}form/digital/`;
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  createData(id, data: {}) {
    const reqHeader = getHeaders(1);
    const path = BASE_URL + 'form/digital/' + id + '/';
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  // PDF
  getDataDigital(id) {
    const reqHeader = getHeaders(1);
    const path = BASE_URL + 'form/digital/' + id + '/';
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  getPDF(id) {
    const reqHeader = getHeaders(1);
    const path = BASE_URL + 'form/digital/pdf/' + id + '/';
    return this.http.get(path, { responseType: 'arraybuffer', headers: reqHeader });
  }


}
