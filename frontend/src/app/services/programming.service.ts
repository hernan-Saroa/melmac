import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BASE_URL, getHeaders } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class ProgrammingService {

  programming_available(id:string,ids:string,week:string) {
    const path = BASE_URL + 'programming_available/';
    let idU=""
    if (localStorage.getItem('session')){
      let user = JSON.parse(localStorage.getItem('session'))
      idU=user.enterprise;
    }
    let data = {idSubProyect:id,idTask:ids,enterprise_id:idU,weekdays:week};
    return this.http.post(path, data, { headers: getHeaders() });
  }


  constructor( private http: HttpClient) { }
}
