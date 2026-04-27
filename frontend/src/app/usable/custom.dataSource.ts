import { HttpClient, HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { ServerDataSource } from 'angular2-smart-table';
import { Observable, from } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { AnswerComponent } from '../pages/answer/answer.component';
import { getHeaders } from '../services/site.service';
import * as localforage from 'localforage';


export class CustomDataSource extends ServerDataSource {
  max_page;
  chart;
  datas;

  constructor(protected http: HttpClient, conf: any = {}, private parent) {
    super(http, conf);
  }

  protected requestElements(filtered?: boolean, sorted?: boolean, paginated?: boolean): Observable<any> {
    let httpParams = new HttpParams();
    if (filtered) httpParams = this.addFilterRequestParams(httpParams);
    if (sorted) httpParams = this.addSortRequestParams(httpParams);
    if (paginated) httpParams = this.addPagerRequestParams(httpParams);
    this.parent.loading = true;
    
    const requestUrl = this.conf.endPoint;
    const cacheKey = `custom_ds_cache_${requestUrl}_${httpParams.toString()}`;

    return this.http.get(requestUrl, { params: httpParams, observe: 'response', headers: getHeaders() }).pipe(
      tap((res: any) => {
        localforage.setItem(cacheKey, {
          body: res.body,
          headers: {
            total: res.headers.has(this.conf.totalKey) ? res.headers.get(this.conf.totalKey) : null
          }
        });
      }),
      catchError((error) => {
        return from(localforage.getItem(cacheKey)).pipe(
          map((cachedData: any) => {
            if (cachedData) {
              console.warn('Network unreachable. Loading data from local offline cache.');
              let cachedHeaders = {};
              if (cachedData.headers.total !== null) {
                cachedHeaders[this.conf.totalKey] = cachedData.headers.total.toString();
              }
              return new HttpResponse({
                body: cachedData.body,
                headers: new HttpHeaders(cachedHeaders),
                status: 200,
                statusText: 'OK (Cached)'
              });
            }
            throw error;
          })
        );
      })
    );
  }

  protected extractDataFromResponse(res: any): Array<any> {
    const rawData = res.body;
    const data = rawData.status ? rawData.data : [];
    this.parent.loading = false;
    if (data instanceof Array) {
      return data;
    }

    throw new Error(`Data must be an array.
    Please check that data extracted from the server response by the key '${this.conf.dataKey}' exists and is array.`);
  }

  protected extractTotalFromResponse(res: any): number {
    if (res.headers.has(this.conf.totalKey)) {
      return +res.headers.get(this.conf.totalKey);
    } else {
      this.chart = res.body.chart
      this.datas = res.body.dataTotal
      this.max_page = Math.floor(res.body[this.conf.totalKey]/10);
      return res.body[this.conf.totalKey];
    }
  }

  getTotalCount(){
    return this.lastRequestCount;
  }

  getData():any[]{
    return this.data;
  }
}
