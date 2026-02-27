
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BASE_URL, getHeaders } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService{

  constructor(
    private http: HttpClient,
  ) { }

  // Permits

  getPermits(){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}permits/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  getPermitsGrouped(ent?){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}permits/group/` + (ent ? '?ent='+ent : '');
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  updatePermit(data, pk){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}permits/${pk}/`;
    return this.http.put<{}>(path, data, { headers: reqHeader });
  }

  // Permits Per Role

  getPermitsRole(id: number) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}permits_role/${id}/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  updatePermitsRole(id: number, data) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}permits_role/${id}/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  // Permits Per Enterprise
  getPermitsEnterprise(id: number){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}permits/ent/${id}/`;
    return this.http.get<any>(path, { headers: reqHeader });
  }

  updatePermitsEnterprise(id: any, selected: number[]) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}permits/ent/${id}/`;
    return this.http.post<{}>(path, {selected: selected}, { headers: reqHeader });
  }

  // Roles by Enterprise

  getRoles(){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}role/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  createRole(data){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}role/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  updateRole(pk:number, data: { name: string; description: string; permits: any[]; time_zone: string; }) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}role/${pk}/`;
    return this.http.put<{}>(path, data, { headers: reqHeader });
  }

  deleteRole(pk: number) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}role/${pk}/`;
    return this.http.delete<{}>(path, { headers: reqHeader });
  }

  // Type Device by Enterprise

  getDeviceTypes(){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}device_type/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }


  getDeviceTypeDetail(pk){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}device_type/${pk}/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  createDeviceType(data){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}device_type/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  updateDeviceType(pk:number, data) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}device_type/${pk}/`;
    return this.http.put<{}>(path, data, { headers: reqHeader });
  }

  deleteDeviceType(pk: number) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}device_type/${pk}/`;
    return this.http.delete<{}>(path, { headers: reqHeader });
  }

  // Projects by Enterprise

  getProjects(){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}projects/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  createProject(data){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}projects/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  updateProject(pk:number, data){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}projects/${pk}/`;
    return this.http.put<{}>(path, data, { headers: reqHeader });
  }

  deleteProject(pk:number){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}projects/${pk}/`;
    return this.http.delete<{}>(path, { headers: reqHeader });
  }

  // Location(Puntos de inicio) by Enterprise

  getLocations(){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}locations/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  createLocation(data){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}locations/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  updateLocation(pk:number, data){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}locations/${pk}/`;
    return this.http.put<{}>(path, data, { headers: reqHeader });
  }

  deleteLocation(pk:number){
    const reqHeader = getHeaders();
    const path = `${BASE_URL}locations/${pk}/`;
    return this.http.delete<{}>(path, { headers: reqHeader });
  }

  getCountry() {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}country_list/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  getCity() {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}city_list/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }
}
