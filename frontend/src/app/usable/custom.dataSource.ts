import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ServerDataSource } from 'ng2-smart-table';
import { ServerSourceConf } from 'ng2-smart-table/lib/lib/data-source/server/server-source.conf';
import { Observable } from 'rxjs-compat/Observable';
import { AnswerComponent } from '../pages/answer/answer.component';
import { getHeaders } from '../services/site.service';


export class CustomDataSource extends ServerDataSource {
  max_page;
  chart;
  datas;

  constructor(protected http: HttpClient, conf: ServerSourceConf | {} = {}, private parent) {
    super(http, conf);
  }

  protected requestElements(): Observable<any> {
    let httpParams = this.createRequesParams();
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
      this.chart = res.body.chart
      this.datas = res.body.dataTotal
      this.max_page = Math.floor(res.body[this.conf.totalKey]/10);
      return res.body[this.conf.totalKey];
    }
  }

  getTotalCount(){
    return (this as any).lastRequestCount;
  }

  getData():any[]{
    return (this as any).data;
  }
}
