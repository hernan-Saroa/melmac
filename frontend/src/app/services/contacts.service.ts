import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BASE_URL, getHeaders } from './site.service';

@Injectable({
  providedIn: 'root'
})
export class ContactsService {

  constructor(private http: HttpClient) { }

  model: string = "contacts"

  view(state: string = "all") {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}${this.model}/`;
    let options = {headers: reqHeader}
    if(state != 'all') {
      options["params"] = { "state": state };
    }
    return this.http.get<[]>(path, options);
  }

  create(user_data: {}) {
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = getHeaders();
    user_data['enterprise_id'] = user.enterprise;
    const path = `${BASE_URL}${this.model}/`;
    return this.http.post<{}>(path, user_data, { headers: reqHeader });
  }

  update(user_data: {}) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}${this.model}/${user_data['id']}/`;
    return this.http.put<{}>(path, user_data, { headers: reqHeader });
  }

  delete(id: number) {
    const reqHeader = getHeaders();
    const path = `${BASE_URL}${this.model}/${id}/`;
    return this.http.delete<{}>(path, { headers: reqHeader });
  }
}
