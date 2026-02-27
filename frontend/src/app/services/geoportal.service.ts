import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BASE_URL, getHeaders } from './site.service';
@Injectable({
  providedIn: 'root'
})
export class GeoportalService {

  listAnswer(position, filter_options) {
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}geoportal/answer/`+ position + '/';

    if (filter_options.date_ini != null || filter_options.date_fin != null || filter_options.doc || filter_options.role || filter_options.user){
      return this.http.post<[]>(path, filter_options, { headers: reqHeader });
    }
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  listAddresses(list=false) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = `${BASE_URL}geoportal/` + (list ? '?list=1' : '');
    return this.http.get<{}>(path, { headers: reqHeader });
  }

  loadAddresses(data) {
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}geoportal/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  get_user() {
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}user_list/1/`;
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  listUser(data?) {
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}user_geo_list/`;
    return this.http.post<[]>(path, data ? data : null, { headers: reqHeader });
  }

  listUserPath(user, date) {
    const reqHeader = getHeaders(1);
    const path = `${BASE_URL}geoportal/user/`;
    return this.http.post<[]>(path, { user: user, date: date } ,{ headers: reqHeader });
  }

  checkStatus(data) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}geoportal/status/`;
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }

  getDataDevices(data){

    // const reqHeader = new HttpHeaders({
    //   'Accept': 'text/csv',
    //   'Content-Type': 'application/vnd.flux',
    //   'Authorization': 'Token wV40UF-6Jhb7I1KuoBNMkh2hYI5zzYi_w4VKjEv8AlPr1nOf2Jr8vUhhlYUFWicLJ-GpEmPFY122w8yz3Zq-HQ=='
    // });
    // const path = `http://habilidapp.com:8086/api/v2/query?orgID=f61d8184457ee3e2`;

    // let data_sent =
    // 'union(tables:[\
    //   from(bucket: "Devices")\
    //     |> range(start: -24h)\
    //     |> filter(fn: (r) => r["_measurement"] == "cpuinfo")\
    //     |> filter(fn: (r) => r["_field"] == "siblings")\
    //     |> aggregateWindow(every: 24h, fn: last, createEmpty: false)\
    //     |> unique(column: "serial_no")\
    //     |> group(columns: ["host", "_measurement", "serial_no"], mode: "by")\
    //     |> max()\
    //     |> yield(name: "max_core")\
    //     |> rename(columns: {"_value":"core_max"}),\
    //   from(bucket: "Devices")\
    //     |> range(start: -24h)\
    //     |> filter(fn: (r) => r["_measurement"] == "cpuinfo")\
    //     |> filter(fn: (r) => r["_field"] == "vendor_id")\
    //     |> filter(fn: (r) => r["cpuinfo_name"] == "proc0")\
    //     |> aggregateWindow(every: 24h, fn: last, createEmpty: false)\
    //     |> unique(column: "serial_no")\
    //     |> group(columns: ["host", "_measurement", "serial_no"], mode: "by")\
    //     |> yield(name: "cpu_model"),\
    //   from(bucket: "Devices")\
    //     |> range(start: -24h)\
    //     |> filter(fn: (r) => r["_measurement"] == "proc_meminfo")\
    //     |> filter(fn: (r) => r["_field"] == "MemTotal")\
    //     |> unique(column: "serial_no")\
    //     |> group(columns: ["serial_no"])\
    //     |> aggregateWindow(every: 24h, fn: last, createEmpty: false)\
    //     |> rename(columns: {_value: "Ram"})\
    //     |> yield(name: "ram"),\
    //   from(bucket: "Devices")\
    //     |> range(start: -24h)\
    //     |> filter(fn: (r) => r["_measurement"] == "disks")\
    //     |> filter(fn: (r) => r["_value"] != -1)\
    //     |> unique(column: "serial_no")\
    //     |> aggregateWindow(every: 24h, fn: mean, createEmpty: false)\
    //     |> yield(name: "disk"),\
    //   from(bucket: "Devices")\
    //     |> range(start: -24h)\
    //     |> filter(fn: (r) => r["_measurement"] == "geo")\
    //     |> filter(fn: (r) => r["_field"] == "latitud" or r["_field"] == "longitud")\
    //     |> unique(column: "serial_no")\
    //     |> aggregateWindow(every: 24h, fn: last, createEmpty: false)\
    //     |> yield(name: "geo")\
    // ])';

    const reqHeader = getHeaders();
    const path = `${BASE_URL}devices/data/`;
    return this.http.get<{}>(path, { headers: reqHeader});
  }

  get_follow_role() {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + user.token
    });
    const path = BASE_URL + 'role_list/follow/';
    return this.http.get<[]>(path, { headers: reqHeader });
  }

  constructor(private http: HttpClient) { }
}
