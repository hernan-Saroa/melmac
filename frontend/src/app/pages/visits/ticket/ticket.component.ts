import { Component, OnInit,ViewChild } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { NbSidebarService, NbDialogService,NbDialogRef } from '@nebular/theme';
import { VisitsService } from '../../../services/visits.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DatePipe, Location } from '@angular/common';
import { ToastService } from '../../../usable/toast.service';
import { ModalsTaskComponent } from '../task/modals-task/modals-task.component';
import { SwitchService } from '../../../services/switch.service';
import { GeoportalService } from '../../../services/geoportal.service';
import { AnswerService } from '../../../services/answer.service';
import { FormService } from '../../../services/form.service';
@Component({
    selector: 'ngx-ticket',
    templateUrl: './ticket.component.html',
    styleUrls: ['./ticket.component.scss'],
    standalone: false
})
export class TicketComponent implements OnInit {

  idsubProyect;
  idMainForm;
  tickets;
  taskc;
  task;
  procces;
  Ntickets=0;
  Ntaskc=0;
  Ntask=0;
  Nprocces=0;
  Nrest=0;
  Nfinish=0
  rest;
  finish;
  dataTraza;
  digital;
  subProyectName;
  fields_form = [];
  permitDialogRef: NbDialogRef<ModalsTaskComponent>;
  constructor(
    private sidebarService: NbSidebarService,
    private activatedRoute: ActivatedRoute,
    private visitService:VisitsService,
    private dialogService :NbDialogService,
    private router: Router,
    private modalSS:SwitchService,
    private formService:FormService,
    private answerService: AnswerService,
    private _location: Location
  ){
    this.modalSS.$taskSub.subscribe((valor)=>{
      this.consultList()
    })
   }

  ngOnInit(): void {
    setTimeout(() => {
      this.sidebarService.compact('menu-sidebar');
    }, 600);

    this.idsubProyect = this.activatedRoute.snapshot.paramMap.get('id');
    this.idMainForm = this.activatedRoute.snapshot.paramMap.get('mainF');
    let data = {sub_proyect_id:this.idsubProyect}
    this.visitService.list_sub_proyect_unit(data).subscribe(
      response => {
        let dataresponse = response['data']
        this.subProyectName="DE " +dataresponse.name.toUpperCase();
    });
    this.getFieldsForm();
    this.consultList();
  }

  drop(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {

      if(event.previousContainer.id == 'Columrest'){
        this.reestTask(event.previousContainer.data[event.previousIndex], event)
      }

      if(event.previousContainer.id == 'ColumTicket'){ //Crear tarea
        this.openTask(0,4,event.previousContainer.data[event.previousIndex])
        //this.createtask(event.previousContainer.data[event.previousIndex]['resp'], event)
      }

    }
  }

  reestTask(data, event) {
    let data_content = {
      subProyect:this.idsubProyect,
      answer:data.id,
      name:data.name,
      direccion:data.address,
      telefono:data.phone,
      fecha:"",
      hora:"",
      descripcion:data.description,
      rest:'1',
      taskId:data.id,
      ticket:"",
      idTicket:data.serial_number,
      digital:"",
      idAnswer:""
    };
    const dialogRef = this.dialogService.open(ConfirmDialog, {
      context: {
        data: data_content
      }
    });
    dialogRef.onClose.subscribe(result => {
      if (result == true) {
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex,
        );
        this.consultList();
      }
    });
  }

  openTask(value,option,ticket=undefined){

    let data;
    switch (option) {
      case 1:
        data=this.taskc[value]
        break;
      case 2:
        data=this.task[value]
        break;
      case 3:
        data=this.rest[value]
        break;
      case 4:
        try {
          data=ticket
          data['answer_form_id'] = data['id']
          data['name'] = data['serial']
          data['description'] = data['resp'][2]['value']
          data['address'] = data['resp'][0]['value']
          data['phone'] = data['resp'][1]['value']
          data['id'] = ''
        } catch (error) {
          console.error(error)
        }
        break;
      default:
        break;
    }
    //historial de tarea
    let str_data = JSON.stringify(this.fields_form)
    let resp_fields = JSON.parse(str_data)
    this.answerService.list_field(0, data['answer_form_id']).subscribe(response =>{
      if(response['status']) {
        let answers = response['data']['list_form'][0]['fields']
        answers.forEach(resp => {
          let field = resp_fields.find(f => f.field == resp.field)
          if(field) {
            let value = resp.answer
            if(field.field_type == '4' && value != '') {
              value = (''+value).split('-').reverse().join('-');
            }
            field.answer = value
          }
        });
      }
    })
    this.visitService.list_trazability_task(data.id).subscribe(
      response => {
        if(response['data'].length != 0){
          this.dataTraza=response['data']
        }else{
          this.dataTraza=undefined
        }
      }
    );

    setTimeout(()=>{
      let closeOnBackdropClick = false
      this.permitDialogRef = this.dialogService.open(ModalsTaskComponent, { closeOnBackdropClick,context:{
          dataLogs:this.dataTraza,
          data:data,
          source:undefined,
          idSubProyect:this.idsubProyect,
          fields:resp_fields,
          form:this.idMainForm,
          task_link_id: ticket != undefined ? '1' : '0',
          ticket: ticket != undefined
        } });
      setTimeout(()=>{
          this.modalSS.$taskSub.emit(this.permitDialogRef)
      }, 500);
    }, 300);

  }

  createtask(data, event) {

    let data0;
    let data1;
    let data2;
    let data4;
    let digital;
    let idAnswer;
    
    if(data[0]){ data0 = data[0].value }else{ data0 = "" }
    if(data[1]){ data1 = data[1].value }else{ data1 = "" }
    if(data[2]){ data4 = data[2].value }else{ data2 = "" }
    digital=data[0].answer_form__form_enterprise__digital
    idAnswer=data[0].answer_form_id
    
    let data_content = {
      subProyect:this.idsubProyect,
      answer:event.previousContainer.data[event.previousIndex]['id'],
      name:event.previousContainer.data[event.previousIndex]['serial'],
      idTicket:event.previousContainer.data[event.previousIndex]['serial_number_id'],
      direccion:data0,
      telefono:data1,
      fecha:"",
      hora:"",
      descripcion:data4,
      rest:'',
      taskId:'',
      ticket:event.previousContainer.data[event.previousIndex]['serial'],
      digital:digital,
      idAnswer:idAnswer
    };
    const dialogRef = this.dialogService.open(ConfirmDialog, {
      context: {
        data: data_content
      }
    });
    dialogRef.onClose.subscribe(result => {
      if (result == true) {
        transferArrayItem(
          event.previousContainer.data,
          event.container.data,
          event.previousIndex,
          event.currentIndex,
        );
        this.consultList();
      }
    });
  }

  consultList(){
    this.visitService.list_form_answer_task(this.idsubProyect,this.idMainForm).subscribe(
      response => {
        this.tickets=response['data']
        this.Ntickets=this.tickets.length
      }
    );

    //Tareas creadas
    this.visitService.list_task(this.idsubProyect,"28").subscribe(
      response => {
        if(response['formDigital'].length != 0){
          this.digital=response['formDigital'][0].form_enterprise__digital
        }
        this.taskc=response['taskList']
        this.Ntaskc=this.taskc.length
      }
    );

    //Tareas programadas
    this.visitService.list_task(this.idsubProyect,"23").subscribe(
      response => {
        if(response['formDigital'].length != 0){
          this.digital=response['formDigital'][0].form_enterprise__digital
        }
        this.task=response['taskList']
        this.Ntask=this.task.length
      }
    );

    //Tareas en proceso
    this.visitService.list_task(this.idsubProyect,"24").subscribe(
      response => {
        if(response['formDigital'].length != 0){
          this.digital=response['formDigital'][0].form_enterprise__digital
        }
        this.procces=response['taskList']
        this.Nprocces=this.procces.length
      }
    );

    //Tareas en reasignadas
    this.visitService.list_task(this.idsubProyect,"25").subscribe(
      response => {
        if(response['formDigital'].length != 0){
          this.digital=response['formDigital'][0].form_enterprise__digital
        }
        this.rest=response['taskList']
        this.Nrest=this.rest.length
      }
    );

    //Tareas en finalizadas
    this.visitService.list_task(this.idsubProyect,"26").subscribe(
      response => {
        if(response['formDigital'].length != 0){
          this.digital=response['formDigital'][0].form_enterprise__digital
        }
        this.finish=response['taskList']
        this.Nfinish=this.finish.length
      }
    );

    //Tareas en finalizadas por admin
    this.visitService.list_task(this.idsubProyect,"27").subscribe(
      response => {
        if(response['formDigital'].length != 0){
          this.digital=response['formDigital'][0].form_enterprise__digital
        }
        for (let index = 0; index < response['taskList'].length; index++) {
          const element = response['taskList'][index];
          this.finish.push(element)
        }
      }
    );

  }

  getFieldsForm(){
    this.formService.get_data_form(this.idMainForm).subscribe(
      response => {
        if (response['status']){
          this.fields_form = response['form']['fields'];
        }
      }
    );
  }

  programming(){
    this.router.navigate(['/pages/visits/programming/create/' + this.idsubProyect+'/1', {}]);
  }

  addtask(){
    let closeOnBackdropClick = false
    this.permitDialogRef = this.dialogService.open(ModalsTaskComponent, { closeOnBackdropClick,context:{
        data : undefined,
        source:undefined,
        idSubProyect:this.idsubProyect,
        digital:this.digital,
        fields:this.fields_form,
        form:this.idMainForm
      } });
    setTimeout(()=>{
        this.modalSS.$taskSub.emit(this.permitDialogRef)
    }, 500);
  }

  onBack() {
    this._location.back();
  }

}


/*Modal de creacion de tarea*/

@Component({
    selector: 'confirm-dialog',
    template: `
  <div class="row">
  <div class="col-md-12" style="width: 1000px;">
    <div class="col-md-12 mx-auto container">
      <nb-card>
        <nb-card-header>
        <h2 class="text-center">Crear Tarea <i title="Cerrar" class="nb-close" style="float: right;font-size: 38px;cursor: pointer;" (click)="close(false)"></i></h2>
        </nb-card-header>
        <nb-card-body class="col-12" style="max-height: 350px;overflow-y: auto;">
              <div class="form-group">
                <label for="inputTicket" class="titleLabel" style="font-weight: 900;font-size: 20px;"> TICKET: {{textTicket}}</label>
                <input type="text" autocomplete="off" hidden="true" nbInput fullWidth fieldSize="small" shape="semi-round" placeholder="#Ticket" [(ngModel)]="inputItemNgModelTicket" id="inputTicket"><br>
                <span style="color: red;" [hidden]="spamName">*Campo requerido</span>
              </div>
              <div class="form-group">
                <label for="inputName" class="titleLabel"> Nombre de la tarea </label>
                <input type="text" autocomplete="off" nbInput fullWidth fieldSize="small" shape="semi-round" placeholder="Ingrese nombre de la tarea" [(ngModel)]="inputItemNgModelName" id="inputName">
              </div>
              <div class="form-group">
                <label for="inputDescription" class="titleLabel"> Descripción de la tarea </label>
                <textarea nbInput fullWidth placeholder="Ingrese una descripción para la tarea" shape="semi-round" [(ngModel)]="textareaItemNgModel" id="inputDescription"></textarea>
              </div>
              <div class="form-group">
                <label for="inputDir" class="titleLabel"> Dirección de la visita *</label>
                <div class="d-flex">
                  <input *ngIf="!divDir1" type="text" class="mr-2" nbInput fullWidth fieldSize="small" shape="semi-round" placeholder="Ingrese una dirección, donde se debe realizar la visita" [(ngModel)]="inputItemNgModelNameDir" id="inputDir">
                  <button *ngIf="!divDir1" nbTooltip="Agregar dirección desde un punto Fijo" nbTooltipPlacement="top" nbTooltipStatus="primary" nbTooltipPlacement="left" shape="round" outline nbButton (click)="btnDireccion(true)"><nb-icon icon="map"></nb-icon></button>
                </div>
                <div class="d-flex">
                  <nb-select *ngIf="!divDir2" fullWidth placeholder="Seleccionar dirección..." class="mr-2" fieldSize="small" shape="semi-round" [(ngModel)]="selectedItemNgModel" (selectedChange)="selectSubProyect()">
                    <nb-option-group title="{{sub.name}}" *ngFor="let sub of addressList; let i=index;">
                      <nb-option value="{{data.address}}" *ngFor="let data of sub.json_path;">- {{data.name}}: {{data.address}}</nb-option>
                    </nb-option-group>
                  </nb-select>
                  <button *ngIf="!divDir2" nbTooltip="Agregar dirección manual" nbTooltipPlacement="top" nbTooltipStatus="primary" nbTooltipPlacement="left" shape="round" outline nbButton (click)="btnDireccion(false)"><nb-icon icon="edit"></nb-icon></button>
                </div>
                <span style="color: red;" [hidden]="spamNameDir">* Campo requerido</span>
              </div>
              <div class="form-group">
                <label for="inputNum" class="titleLabel"> Número de contacto </label>
                <input type="number" nbInput fullWidth fieldSize="small" shape="semi-round" placeholder="Ingrese un número de contacto" [(ngModel)]="inputItemNgModelNum" id="inputNum">
              </div>
              <div class="col-md-12 d-flex pl-0 pr-0">
                <div class="form-group col-md-4 pl-0">
                  <label for="inputDataOne" class="titleLabel"> Fecha para la visita </label><br>
                  <input nbInput [nbDatepicker]="ngmodelI" [(ngModel)]="ngModelDateI" id="inputDataOne">
                  <nb-datepicker #ngmodelI></nb-datepicker><br>
                  <span style="color: red;" [hidden]="spamNameDate">*Campo requerido</span>
                </div>

                <div class="form-group col-md-4 pr-0 pl-4">
                  <label for="inputDataTwo" class="titleLabel"> Hora de llegada al punto de visita </label><br>
                  <input class="ngModleHour" nbInput type="text" [nbTimepicker]="timepickerF" [(ngModel)]="ngModelHourF"/>
                  <nb-timepicker #timepickerF></nb-timepicker><br>
                  <span style="color: red;" [hidden]="spamNameHour">*Campo requerido</span>
                </div>

                <div class="form-group col-md-4 pr-0 pl-4">
                  <label for="inputDataTwo" class="titleLabel"> Duración de visita </label><br>
                  <nb-select fullWidth [(selected)]="selectedItem">
                    <nb-option value="30">30 minutos</nb-option>
                    <nb-option value="60">1 hora</nb-option>
                    <nb-option value="90">1 hora y 30 minutos</nb-option>
                    <nb-option value="120">2 horas</nb-option>
                    <nb-option value="150">2 horas y 30 minutos</nb-option>
                  </nb-select>
                </div>
              </div>
        </nb-card-body>
        <nb-card-footer class="text-right">
          <button nbButton shape="rectangle" status="primary" (click)="sendDataModal('1')" class="mr-3" [nbSpinner]="btnLoadingModal" nbSpinnerStatus="warning" [disabled]="btnDisabledModal">Crear tarea</button>
          <button nbButton shape="rectangle" status="danger" style="float: left;" (click)="sendDataModal('0')" class="mr-3" [nbSpinner]="btnLoadingModal" nbSpinnerStatus="warning" [disabled]="btnDisabledModal">Rechazar tarea</button>
          <button nbButton shape="rectangle" status="info" style="float: left;" class="mr-2" (click)="viewPDF()">Información general</button>
        </nb-card-footer>
      </nb-card>
    </div>
  </div>
</div>
`,
    standalone: false
})

export class ConfirmDialog {
  public data: {
    subProyect:string,
    answer:string,
    name:string,
    direccion:string,
    telefono:string,
    fecha:string,
    hora:string,
    descripcion:string,
    rest:string,
    taskId:string,
    ticket:string,
    idTicket:string,
    digital:string,
    idAnswer:string,
  }

  inputItemNgModelTicket;
  inputItemNgModelName;
  textareaItemNgModel;
  inputItemNgModelNameDir;
  inputItemNgModelNum;
  ngModelDateI;
  ngModelHourF;
  textTicket;
  selectedItem="30";
  idSubProyect;
  rest;
  task_id;
  btnLoadingModal=false;
  btnDisabledModal=false;
  spamName=true;
  spamNameDir=true;
  spamNameDate=true;
  spamNameHour=true;
  addressList;
  selectedItemNgModel;
  divDir2=true;
  divDir1=false;

  constructor(
   public dialogRef: NbDialogRef<ConfirmDialog>,private visitService:VisitsService,private geoportalService: GeoportalService,private answerService: AnswerService,private toastService: ToastService, ){}

   ngOnInit(): void {
    this.idSubProyect=this.data.subProyect
    if(this.data.rest != "1"){
      this.inputItemNgModelName="Ticket #"+this.data.name;
    }else{
      this.inputItemNgModelName=this.data.name;
    }
    this.textareaItemNgModel=this.data.descripcion;
    this.inputItemNgModelNameDir=this.data.direccion;
    this.inputItemNgModelNum=this.data.telefono;
    this.rest=this.data.rest
    this.task_id=this.data.taskId
    this.inputItemNgModelTicket=this.data.idTicket
    this.textTicket=this.data.idTicket
    if(this.data.fecha != ''){
      let FF = this.data.fecha.split("-")
      this.ngModelDateI = this.data.fecha;
    }
    if(this.data.hora != ''){
      let HF = this.data.hora.split(":")
      this.ngModelHourF = new Date(2023, 0, 1, Number(HF[0]), Number(HF[1]));
    }
  }

  close(response:boolean){
    this.dialogRef.close(response);
  }

  btnDireccion(opt){
    if(opt){
      this.divDir2=false
      this.divDir1=true
      if(this.addressList == undefined)
        this.geoportalService.listAddresses().subscribe(
          response => {
            if (response['status']) {
              this.addressList=response['data']
            }
          }
        );
    }else{
      this.divDir1=false
      this.divDir2=true
    }

  }

  sendDataModal(valor){
    if(this.inputItemNgModelName == '' || this.inputItemNgModelName == undefined){
      this.spamName=false;
      setTimeout(()=>{this.spamName=true;}, 5000);
      return false;
    }
    if(this.inputItemNgModelNameDir == '' || this.inputItemNgModelNameDir == undefined){
      this.spamNameDir=false;
      setTimeout(()=>{this.spamNameDir=true;}, 5000);
      return false;
    }

    if(this.ngModelDateI == '' || this.ngModelDateI == undefined){
      this.spamNameDate=false;
      setTimeout(()=>{this.spamNameDate=true;}, 5000);
      return false;
    }

    if(this.ngModelHourF == '' || this.ngModelHourF == undefined){
      this.spamNameHour=false;
      setTimeout(()=>{this.spamNameHour=true;}, 5000);
      return false;
    }
    this.btnLoadingModal=true;
    this.btnDisabledModal=true;
    let date_pipe = new DatePipe("en-es");
    let hourI = date_pipe.transform(this.ngModelHourF, 'HH:mm');
    let date_valueI = date_pipe.transform(this.ngModelDateI, 'yyyy-MM-dd');
    let hourF = this.timeSum(hourI,this.selectedItem)
    let idU=""
    if (localStorage.getItem('session')){
      let user = JSON.parse(localStorage.getItem('session'))
      idU=user.id;
    }
    let data = {ticket:this.inputItemNgModelTicket,task_id:this.task_id,sub_proyect_id:this.idSubProyect,name:this.inputItemNgModelName,cellPhone:this.inputItemNgModelNum,dir:this.inputItemNgModelNameDir,description:this.textareaItemNgModel,fecha:date_valueI,hourI:hourI,hourF:hourF,user_id:idU,duration:this.selectedItem,task_link_id:valor,Answer_Form_id:this.data.answer,rest:this.rest}
    this.visitService.create_task(data).subscribe(
      response => {
        this.btnLoadingModal=false;
        this.btnDisabledModal=false;
        this.close(true)
        this.toastService.showToast('success', 'Listo', 'Se ha creado el ticket #'+ this.data.name +' como tarea.');
      }
    );
  }

  selectSubProyect(){
    this.inputItemNgModelNameDir=this.selectedItemNgModel
    this.divDir1=false
    this.divDir2=true
  }

  timeSum(hourI,min){
    let time;
    let minf;
    let min1;
    let minf2;
    let hourF;
    time=hourI.split(":")
    min1=Number(time[1])+Number(min);
    minf = Number(min1) / 60
    minf=minf.toString()
    minf = parseInt(minf)
    hourF = Number(time[0])+minf;
    if(hourF<10){hourF="0"+hourF}
    minf2=minf*60
    minf = min1 - minf2
    if(minf<10){minf="0"+minf}

    return hourF+":"+minf
  }

  viewPDF(){
    if (this.data.digital) {
      this.getDigitalPDF(0, this.data.idAnswer);
    } else {
      this.getPDF(0, this.data.idAnswer);
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
