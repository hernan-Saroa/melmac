import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BASE_URL, getHeaders } from './site.service';


@Injectable({
  providedIn: 'root'
})
export class ApisConfigService {

  constructor(private http: HttpClient) { }

  getApisConfig() {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}apis_config/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  createApisConfig(data) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}apis_config/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  updateApisConfig(data) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}apis_config/`;
    return this.http.put<{}>(path, data, { headers: reqHeader });
  }

  getApisConfigParams(id) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}apis_config_params/${id}/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  createApisConfigParams(data) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}apis_config_params/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  updateApisConfigParams(data) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}apis_config_params/`;
    return this.http.put<{}>(path, data, { headers: reqHeader });
  }

  getApisConfigForms(field_type, enterprise) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}apis_config/get_forms/${field_type}/${enterprise}/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

}
