import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BASE_URL } from './site.service';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  constructor(private http: HttpClient) {}

  search(query: string): Observable<any> {
    let enterprise = ''
    if (localStorage.getItem('session')){
      let user = JSON.parse(localStorage.getItem('session'))
      enterprise = user.enterprise
    }
    const path = BASE_URL + `api/search?q=${query}&enterprise=${enterprise}&limit=${5}`;
    return this.http.get<{}>(path);
  }

  search_all(query: string, limit: number, offset: number): Observable<any> {
    let enterprise = ''
    if (localStorage.getItem('session')){
      let user = JSON.parse(localStorage.getItem('session'))
      enterprise = user.enterprise
    }
    const path = BASE_URL + `api/search?q=${query}&enterprise=${enterprise}&limit=${limit}&offset=${offset}`;
    return this.http.get<{}>(path);
  }

  uploadDocument(formData: FormData): Observable<any> {
    //return this.http.post('/api/upload/', formData);
    const path = BASE_URL + 'api/upload/';
    return this.http.post<{}>(path, formData);
  }

  traceability_search(dato: string, word: string ) {
    const path = BASE_URL + 'traceability_search/';
    let enterprise = ''
    let user_id = ''
    if (localStorage.getItem('session')){
      let user = JSON.parse(localStorage.getItem('session'))
      enterprise = user.enterprise
      user_id = user.id
    }
    let data = {id_answer:dato,word:word,enterprise:enterprise, user: user_id};
    return this.http.post(path, data);
  }
}
