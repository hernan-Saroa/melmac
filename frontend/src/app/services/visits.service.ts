import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BASE_URL, getHeaders } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class VisitsService {

  listProyect() {
    const path = BASE_URL + 'list_proyect/';
    let data ={}
    if (localStorage.getItem('session')){
      let user = JSON.parse(localStorage.getItem('session'))
      data = {idEnt:user.enterprise};
    }

    return this.http.post(path, data, { headers: getHeaders() });
  }

  deleteListProyect(idProy) {
    const path = BASE_URL + 'delete_list_proyect/';
    let data = {idProyect:idProy};

    return this.http.post(path, data, { headers: getHeaders() });
  }

  listSubProyect(id:string) {
    const path = BASE_URL + 'list_sub_proyect/';
    let idU=""
    if (localStorage.getItem('session')){
      let user = JSON.parse(localStorage.getItem('session'))
      idU=user.enterprise;
    }
    let data = {idProyect:id,idEnt:idU};

    return this.http.post(path, data, { headers: getHeaders() });
  }

  listProgramming(id:string) {
    const path = BASE_URL + 'list_programming/';
    let data = {idSubP:id};

    return this.http.post(path, data, { headers: getHeaders() });
  }

  list_task(id:string,ids:string,option=0) {
    const path = BASE_URL + 'list_task/';
    let data = {idSubP:id,idState:ids,option:option};

    return this.http.post(path, data, { headers: getHeaders() });
  }

  detail_task(id:string) {
    let data = {idtask:id};
    const path = BASE_URL + 'detail_task/';
    return this.http.post(path, data, { headers: getHeaders() });
  }

  document_task(id:string) {
    const path = BASE_URL + 'document_task/';
    let data = {idtask:id};
    return this.http.post(path, data, { headers: getHeaders() });
  }

  list_trazability_task(id:string) {
    const path = BASE_URL + 'list_trazability_task/';
    let data = {idTask:id};
    return this.http.post(path, data, { headers: getHeaders() });
  }

  create_proyect_task(name:string,description:string,state:boolean,proyect_id:string) {
    const path = BASE_URL + 'create_proyect_task/';
    let idU=""
    let idUser=""
    if (localStorage.getItem('session')){
      let user = JSON.parse(localStorage.getItem('session'))
      idU=user.enterprise;
      idUser=user.id;
    }
    let data = {name:name,description:description,state:state,proyect_id:proyect_id,enterprise_id:idU,idUser:idUser};

    return this.http.post(path, data, { headers: getHeaders() });
  }

  create_sub_proyect(data) {
    const path = BASE_URL + 'create_sub_proyect/';
    return this.http.post(path, data, { headers: getHeaders() });
  }

  create_task(data) {
    const path = BASE_URL + 'create_task/';
    return this.http.post(path, data, { headers: getHeaders() });
  }

  list_sub_proyect_unit(data) {
    const path = BASE_URL + 'list_sub_proyect_unit/';
    return this.http.post(path, data, { headers: getHeaders() });
  }

  list_form_answer_task(id:string,ids:string) {
    const path = BASE_URL + 'list_form_answer_task/';
    let data = {idSubP:id,idForm:ids};
    return this.http.post(path, data, { headers: getHeaders() });
  }

  change_state_task(idState:string,idTask:string,idUser:string) {
    const path = BASE_URL + 'change_state_task/';
    let data = {task_id:idTask,state_id:idState,user_id:idUser,observation:''};
    return this.http.post(path, data, { headers: getHeaders() });
  }

  list_proyect_subproyect(){
    const path = BASE_URL + 'list_proyect_subproyect/';
    let idU=""
    if (localStorage.getItem('session')){
      let user = JSON.parse(localStorage.getItem('session'))
      idU=user.enterprise;
    }
    let data = {idEnt:idU};
    return this.http.post(path, data, { headers: getHeaders() });
  }

  list_task_all(id:string,list:boolean) {
    const path = BASE_URL + 'list_task_all/';
    let data = {idSubP:id,listComplet:list};
    return this.http.post(path, data, { headers: getHeaders() });
  }



  constructor( private http: HttpClient) { }
}
