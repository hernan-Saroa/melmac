
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BASE_URL, getHeaders } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  constructor(
    private http: HttpClient,
  ) { }

  getDevices(){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}devices/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  getDeviceDetail(pk){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}devices/${pk}/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  createDevice(data){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}devices/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  updateDevice(pk, data){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}devices/${pk}/`;
    return this.http.put<{}>(path, data, { headers: reqHeader });
  }

  deleteDevice(pk){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}devices/${pk}/`;
    return this.http.delete<{}>(path, { headers: reqHeader });
  }

  getMassiveDevices() {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}massive-devices/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  uploadMassiveDevices(data: FormData) {
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}massive-devices/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  getMassiveError(pk){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}massive-devices/${pk}/error/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

}
