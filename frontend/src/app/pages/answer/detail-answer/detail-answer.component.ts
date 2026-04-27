import { Component, OnInit } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AnswerService } from '../../../services/answer.service';
import { ToastService } from '../../../usable/toast.service';
import { NbDialogRef } from '@nebular/theme';

@Component({
    selector: 'ngx-detail-answer',
    templateUrl: './detail-answer.component.html',
    styleUrls: ['./detail-answer.component.scss'],
    standalone: false
})
export class DetailAnswerComponent implements OnInit {

  data_sign;
  data_field;
  cardAccent;
  consecutive = 0;
  //forma_anomaly;
  individual_status;
  row_data_select;
  type_field;
  tool_tip;
  valor;
  pdf_view: boolean = false
  url_dowload;
  name_pdf = ''

  constructor(
    private answerService: AnswerService,
    private toastService: ToastService,
    public dialogRef: NbDialogRef<DetailAnswerComponent>
  ) { }

  public data
  public fraud
  public id


  ngOnInit(): void {
  }
  // Funcion que recibe un parametro para actualizar el estado del accent
  updateCardAccent(data) {
    if (data == 1) {
      this.cardAccent = 'warning';
      this.tool_tip = "Firma Presenta Irregularidades"
    } else if (data == 2){
      this.cardAccent = 'danger';
      this.tool_tip = "Firma Presenta Posible Fraude"
    } else {
      this.cardAccent = 'info';
      this.tool_tip = "Firma Esta Correcta"
    }
  }
  // Funcion que recibe un parametro para actualizar el estado del cardAcent
  cardAddStyle(status, tool_tip) {
    if (tool_tip){
      if (status == 1) {
        return 'Firma Presenta Irregularidades';
      } else if (status == 2){
        return 'Firma Presenta Posible Fraude';
      } else {
        return 'Firma Esta Correcta';
      }
    }else{
      if (status == 1) {
        return 'warning';
      } else if (status == 2){
        return 'danger';
      } else {
        return 'info';
      }
    }
  }
  // Funcion que recibe los parametros para mostrar los PDF de Soporte
  downLoadFile(data: any, type: string) {
    var blob = new Blob([data], { type: type.toString() });
    var url = window.URL.createObjectURL(blob);
    this.url_dowload = null;
    this.url_dowload = document.createElement("a");
    this.url_dowload.download = this.name_pdf + (type == "application/pdf" ? '.pdf' : '.xlsx');
    this.url_dowload.href = url;
    if(type == "application/pdf") {
      this.pdf_view = true
      setTimeout(() => {
        var div = document.getElementById('content_pdf_view');
        div.innerHTML = '<iframe style="width:100%;height:100%;" frameborder="0" src="' + url + '" />';
      }, 200);
    } else {
      this.url_dowload.click();
    }
  }
  // Funcion que permite descargar el soporte
  getPdfDocument(field, type) {
    this.answerService.get_pdf_document(this.consecutive, this.id, type, field.form_field).subscribe(
      response => {
        this.downLoadFile(response, "application/pdf");
      },error => {
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta más tarde.');
      }
    );

  }
  // Funcion que permite normalizar los textos
  setAnomaly(data){
    if (data.status == 2){
      if (data.anomaly.includes('-')){
        let anomaly = data.anomaly.split('-')
        return anomaly[0]
      }
      return data.anomaly
    }else if (data.status == 1 ){
      if (data.anomaly.includes('-')){
        let anomaly = data.anomaly.split('-')
        return anomaly[1]
      }
      return data.anomaly
    }else{
      return data.anomaly
    }
  }

  // Funcion que permite cerrar el modal
  close(){
    this.dialogRef.close(false);
  }

}
