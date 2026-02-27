import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

/** rxjs Imports */
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

/** EmbedDashboard SDK import */
import { embedDashboard } from '@superset-ui/embedded-sdk';

@Injectable({
  providedIn: 'root'
})
export class SupersetService {
  
  /**
   * API URL of Superset to send request
   */
  private supersetDomain = 'http://localhost:8088';
  private apiUrl = '/api/v1/security';

  /**
   * @param {HttpClient} http Http Client to send requests.
   */
  constructor(private http: HttpClient) { }

  /**
   * 
   * @returns { access token }
   */
  private fetchAccessToken(): Observable<any> {
    const body = {
      "username": "admin", // Usuario administrador de superset
      "password": "admin", // Contraseña del usuario administrador de superset
      "provider": "db",
      "refresh": true
    };

    const headers = new HttpHeaders({ "Content-Type": "application/json" });

    return this.http.post<any>(`${this.supersetDomain}${this.apiUrl}/login`, body, { headers });
  }

  /**
   * 
   * @returns { guest token } using @param { accessToken }
   */
  private fetchGuestToken(accessToken: any, idDashboard: string): Observable<any> {
    const body = {
      "resources": [
        {
          "type": "dashboard",
          "id": idDashboard,
        }
      ],
      /**
       * rls: Row Level Security, this differs for client to client ,like what to show each client
       */
      "rls": [], //{ "clause": "stage_of_development = 'Pre-clinical'" }
      "user": {
        "username": "henrry.saroa", // Usuario invitado de superset
        "first_name": "Henrry",
        "last_name": "Rojas",
      }
    };

    const acc = accessToken["access_token"]; //accessToken is an object in which there are two tokens access_token and refresh_token ,out of which we just need to send access_token to get guest_token
    const headers = new HttpHeaders({
      "Content-Type": "application/json",
      "Authorization": `Bearer ${acc}`,
    });
    //guest_token URL should end with forward_slash(/)
    return this.http.post<any>(`${this.supersetDomain}${this.apiUrl}/guest_token/`, body, { headers });
  }
  /**
   * 
   * @returns { guest Token }
   */
  getGuestToken(idDashboard: string): Observable<any> {
    return this.fetchAccessToken().pipe(
      catchError((error) => {
        console.error(error);
        return throwError(error);
      }),
      switchMap((accessToken: any) => this.fetchGuestToken(accessToken, idDashboard))
    );
  }
  /**
   * 
   * @returns { dashboard }
   */
  embedDashboard(idDashboard: string): Observable<void> {
    return new Observable((observer) => {
      this.getGuestToken(idDashboard).subscribe(
        (token) => {
          embedDashboard({
            id: idDashboard, // Replace with your dashboard ID
            supersetDomain: this.supersetDomain,
            mountPoint: document.getElementById('dashboard'),
            fetchGuestToken: () => token["token"],
            dashboardUiConfig: {
              hideTitle: true,
              hideChartControls: true,
              hideTab: true,
            },
          });
          observer.next();
          observer.complete();
        },
        (error) => {
          console.error(error)
          observer.error(error);
        }
      );
    });
  }
}
