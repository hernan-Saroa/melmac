import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VisitsService } from '../../../services/visits.service';
import { AnswerService } from '../../../services/answer.service';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../../usable/toast.service';

@Component({
  selector: 'ngx-detail-visit',
  templateUrl: './detail-visit.component.html',
  styleUrls: ['./detail-visit.component.scss']
})
export class DetailVisitComponent implements OnInit {
  idTask;
  nameTask;
  descTask;
  datecTask;
  dateiTask;
  datefTask;
  duration;
  houriTask;
  hourfTask;
  phoneTask;
  serial_numberTask;
  stateTask;
  nameUser;
  addressTask;
  dataTraza;
  tamLogs=false;
  tamLogs2=true;
  tamSop=false;
  tamSop2=true;
  info=true;
  dataDoc;
  idAnswer;
  digitalAnswer;
  constructor(private activatedRoute: ActivatedRoute,private visitService:VisitsService,private answerService: AnswerService,private toastService: ToastService,) { }

  ngOnInit(): void {
    this.idTask = this.activatedRoute.snapshot.paramMap.get('id');
    console.log(this.idTask)
    let aux=this.idTask.split("-")
    console.log(aux[1])
    if(aux[1] == undefined){
      this.visitService.detail_task(this.idTask+'-T').subscribe(
        response => {
          let dataresponse = response['taskList']
          let dataresponse2 = response['formDigital']
          if (dataresponse2 != null) {
            this.digitalAnswer=dataresponse2[0].form_enterprise__digital
          }
          this.nameTask=dataresponse[0].name.toUpperCase();
          this.descTask=dataresponse[0].description
          this.datecTask=new DatePipe('en-EN').transform(dataresponse[0].creation_date, 'yyyy-MM-dd HH:mm:ss');
          this.dateiTask=dataresponse[0].finish_date
          this.datefTask=dataresponse[0].initial_date
          this.hourfTask=dataresponse[0].finish_hour
          this.houriTask=dataresponse[0].initial_hour
          this.phoneTask=dataresponse[0].phone
          this.addressTask=dataresponse[0].address
          this.serial_numberTask=dataresponse[0].serial_number
          this.stateTask=dataresponse[0].state__name.toUpperCase();
          this.duration=dataresponse[0].duration
          this.idAnswer=dataresponse[0].answer_form_id

          if(dataresponse[0].answer_form_id!=null){
            this.info=false
          }
          if(dataresponse[0].user__role_enterprise_id != null)
          {
            let name="";
            let lastName="";
            let secontName="";
            let secontLastName="";
              if (dataresponse[0].user__middle_name != null)
                secontName=dataresponse[0].user__middle_name
              if (dataresponse[0].user__first_name != null)
                name=dataresponse[0].user__first_name
              if (dataresponse[0].user__first_last_name != null)
                lastName=dataresponse[0].user__first_last_name
              if (dataresponse[0].user__first_last_name != null)
                secontLastName=dataresponse[0].user__second_last_name
              this.nameUser = name.toUpperCase()+" "+secontName.toUpperCase()+" "+lastName.toUpperCase()+" "+secontLastName.toUpperCase();
          }else{
            this.nameUser = "SIN ASIGNAR"
          }

          this.visitService.document_task(this.idTask).subscribe(
            response => {
              console.log(response)
              if(response['data'].length != 0){
                this.dataDoc=response['data']
              }else{
                this.tamSop2=false
                this.tamSop=true
              }
            }
          );

          this.visitService.list_trazability_task(this.idTask).subscribe(
            response => {
              if(response['data'].length != 0){
                this.dataTraza=response['data']
              }else{
                this.tamLogs2=false
                this.tamLogs=true
              }
            }
          );
          console.log(dataresponse)
      });
    }else{
      this.visitService.detail_task(aux[2]+'-A').subscribe(
        response => {
          let data2
          data2=response['taskList']['resp']
          console.log(response)
          this.idAnswer=aux[2]
          console.log(this.idAnswer)
          this.digitalAnswer=data2[0].answer_form__form_enterprise__digital
          this.info=false
          this.descTask=data2[2].value
          this.phoneTask=data2[1].value
          this.addressTask=data2[0].value
          this.datecTask=new DatePipe('en-EN').transform(response['create'], 'yyyy-MM-dd HH:mm:ss');
        });
      this.nameTask="TICKET #A-"+aux[1]
      this.dateiTask="NA"
      this.datefTask="NA"
      this.hourfTask="NA"
      this.houriTask="NA"
      this.serial_numberTask="#A-"+aux[1]
      this.nameUser = "SIN ASIGNAR"
      this.stateTask=" TICKET CREADO"
      this.tamLogs2=false
      this.tamLogs=true
      this.tamSop2=false
      this.tamSop=true
    }
  }

  viewPDF(digital,answer){
    if (digital) {
      this.getDigitalPDF(0, answer);
    } else {
      this.getPDF(0, answer);
    }
  }

  viewPDF2(){
    if (this.digitalAnswer) {
      this.getDigitalPDF(0, this.idAnswer);
    } else {
      this.getPDF(0, this.idAnswer);
    }
  }


  getDigitalPDF(consecutive, id) {
    this.answerService.getDigitalPDF(consecutive, id).subscribe(
      response => {
        this.downLoadFile(response, "application/pdf");
      },
      error => {
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      }
    );
  }

  getPDF(consecutive, id) {
    this.answerService.get_pdf(consecutive, id).subscribe(
      response => {
        this.downLoadFile(response, "application/pdf");
      },
      error => {
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      }
    );
  }

  downLoadFile(data: any, type: string) {
    let blob = new Blob([data], { type: type});
    let url = window.URL.createObjectURL(blob);
    let pwa = window.open(url);
    if (!pwa || pwa.closed || typeof pwa.closed == 'undefined') {
      console.log('Error');
    }
  }
}
