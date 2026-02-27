import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { BASE_URL, getHeaders } from './site.service';
//export const BASE_URL = 'http://localhost:8000/';

@Injectable({
  providedIn: 'root'
})
export class LandingService {

  constructor(
    private http: HttpClient,
  ) { }
  
  landingFormData(data) {
    const reqHeader = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    const path = BASE_URL + 'landingform/';
    return this.http.post<{}>(path, data, { headers: reqHeader });
  }
  
}
