import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { ServerDataSource } from 'angular2-smart-table';
import { Observable } from 'rxjs-compat/Observable';
import { HistorialComponent } from './historial.component';
import { getHeaders } from '../../services/site.service';


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
    return this.http.get(this.conf.endPoint, { params: httpParams, observe: 'response', headers: getHeaders() });
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
