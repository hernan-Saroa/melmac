import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BASE_URL } from '../../services/site.service';

@Injectable({
  providedIn: 'root'
})
export class ServicesService {

  constructor(
    private http: HttpClient
  ) { }

  /**
   * 
   * @param token para la autenticación en el servicio backend
   * @param hash es la clave para otener la data de la firma
   * @returns 
   */
  get_auth_data(token: string, hash: string) {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + token
    });
    const path = `${BASE_URL}api/v2/auth/get_data/${hash}/`;
    return this.http.get<{}>(path, { headers: reqHeader });
  }
}
