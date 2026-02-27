import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BASE_URL, getHeaders } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class RoutingService {

  uploadFile(data: FormData) {
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}routes/load/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  uploadOrder(data: FormData) {
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}routes/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  checkStatus(id, step?) {
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}routes/status/${id}/` + (step ? `?step=${step}` : '');
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  getAllUploads(){
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}routes/all/`;
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  getProcess(id){
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}routes/${id}/`;
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  generate_routes(data) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}routes/generate/`;
    return this.http.post<[]>(path, data, { headers: reqHeader });

  }

  changeRoute(data) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}routes/change/`;
    return this.http.post<[]>(path, data, { headers: reqHeader });
  }

  getFieldWorkers(){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}get_field_workers/`;
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  assignMessagers(data) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}routes/assign/`;
    return this.http.post<[]>(path, data, { headers: reqHeader });
  }

  getServices(){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}services/`;
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  getServiceDetail(id){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}services/${id}/`;
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  getTraceLocation(id: any) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}service_location/${id}/trace/`;
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  changeState(data){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}chnage_state/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  getElementFile(data: { id: any; type: any; }) {
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}routing/download_file/`;
    // return this.http.post<Blob>(path, data, { headers: reqHeader.append('Accept', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')});
    return this.http.post(path, data, {responseType: "blob",
      headers: reqHeader});
  }

  constructor( private http: HttpClient) { }
}
