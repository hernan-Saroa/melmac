import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BASE_URL, getHeaders } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class TraceabilityService {

  constructor(private http: HttpClient) { }

  list(user?) {
    const reqHeader = getHeaders(1);
    let path = `${BASE_URL}traceability/`;
    if (user) {
      path += `enterprise/` + user + `/`;
    }
    return this.http.get<[]>(path, { headers: reqHeader });
  }

   // TXT
   get_txt_enterprise(data) {
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}traceability/get_txt/`;
    return this.http.post(path, data, { responseType: 'arraybuffer', headers: reqHeader });
  }

  get_public_trace_document(token){
    const path = `${BASE_URL}public/trace_doc/`;
    return this.http.post(path, {token: token});
  }

}
