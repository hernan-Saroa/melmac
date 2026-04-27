import { Component, OnInit,ChangeDetectionStrategy,ViewChild } from '@angular/core';
import { SwitchService } from '../../../../services/switch.service';
import { VisitsService } from '../../../../services/visits.service';
import { FormService } from '../../../../services/form.service';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../../usable/toast.service';
import { NbTagComponent, NbTagInputAddEvent } from '@nebular/theme';
import { concatMapTo } from 'rxjs/operators';

@Component({
    selector: 'ngx-modals-sub',
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './modals-sub.component.html',
    styleUrls: ['./modals-sub.component.scss'],
    standalone: false
})
export class ModalsSubComponent implements OnInit {

  data;
  source;
  valor1;
  inputItemNgModelName='Sub Proyecto General';
  textareaItemNgModel='';
  textareaItemNgModelObjet='';
  inputItemNgModelEmail='';
  titleModal;
  btnModal;
  btnLoadingModal=false;
  btnDisabledModal=false;
  titleState;
  idProyect;
  toggleNgModelState = true;
  timepicker;
  forms;
  vist=false;
  caracter: string = '';
  caracter_name: string = '';
  selectedItemNgModel=[];
  ngModelDateI = new Date();
  ngModelDateF = new Date();
  ngModelHourI = '08:00'
  ngModelHourF = '18:00'
  ngModelHourIP = '08:00'
  ngModelHourFP = '18:00'
  selectedItem = '0';
  selectedItemLunch = '0';
  days=[1,2,3,4,5,6];
  selectedItems2;
  idsubProyect='';
  form_visit_form;
  day_0;day_1;day_2;day_3;day_4;day_5;day_6;
  @ViewChild('inputName') inputName;


  constructor(
    private modalSS:SwitchService,
    private visitService:VisitsService,
    private formService:FormService,
    private processSubSS:SwitchService,
    private activatedRoute: ActivatedRoute,
    private toastService: ToastService) { }

  ngOnInit(): void {
    this.caracter_name = "20";
    this.caracter = "0";
    this.modalSS.$modalsing.subscribe((valor)=>{
      this.valor1=valor
    })

    this.formService.list_state(1).subscribe(
      response => {
        if (response['status']){
          this.forms=response['data']
        }
      }
    );

    // console.log(this.data)
    // console.log(this.source)


    if(this.data != undefined){

      let data = {sub_proyect_id:this.data.id}
      this.idsubProyect=this.data.id
      this.caracter_name = this.data.name.length;
      this.caracter = this.data.description.length;
      this.titleModal="Editar "
      this.btnModal="Editar"
      this.visitService.list_sub_proyect_unit(data).subscribe(
        response => {
          // console.log(response['data'])
          let dataresponse = response['data']
          this.inputName.nativeElement.focus();
          // console.log(dataresponse);
          this.inputItemNgModelName=dataresponse.name;
          //this.inputItemNgModelEmail=dataresponse.email;
          let emails = dataresponse.email.split(",")
          emails.forEach(element => {
            if (element != '') {
              this.trees.add(element.trim().toLowerCase());
            }
          });
          this.textareaItemNgModel=dataresponse.description;
          this.textareaItemNgModelObjet=dataresponse.goal;

          this.ngModelDateI = new Date(`${dataresponse.initial_date} ${dataresponse.initial_hour}:00`);
          this.ngModelDateF = new Date(`${dataresponse.finish_date} ${dataresponse.finish_hour}:00`);

          this.ngModelHourI = dataresponse.initial_hour;
          this.ngModelHourF = dataresponse.finish_hour;
          this.toggleNgModelState=dataresponse.state
          if(dataresponse.state){this.titleState="Activo";}else{this.titleState="Inactivo";}
          this.selectedItemNgModel=JSON.parse(dataresponse.id_forms);
          this.selectedItems2=JSON.parse(dataresponse.id_forms);
          this.days=JSON.parse(dataresponse.days_enabled);
          this.checkDays();
          let HI2 = dataresponse.start_time_enabled.split(":")
          let HF2 = dataresponse.end_time_enabled.split(":")
          //this.ngModelHourIP = new Date(2023, 0, 1, HI2[0], HI2[1]);
          this.ngModelHourIP = dataresponse.start_time_enabled
          this.ngModelHourFP = dataresponse.end_time_enabled;
          this.selectedItem=dataresponse.travel_time;
          this.selectedItemLunch=dataresponse.lunch_time;
        }
      );
    } else {
      this.titleModal="Crear nuevo "
      this.btnModal="Crear"
      this.titleState="Activo"
      this.checkDays();
    }
  }

  checkDays() {
    for (let index = 0; index < this.days.length; index++) {
      const element = this.days[index];

      switch (element) {
        case 0:
          this.day_0=true
          break;
        case 1:
          this.day_1=true
          break;
        case 2:
          this.day_2=true
          break;
        case 3:
          this.day_3=true
          break;
        case 4:
          this.day_4=true
          break;
        case 5:
          this.day_5=true
          break;
        case 6:
          this.day_6=true
          break;
        default:
          break;
      }
    }
  }
  
  amountWords(event: Event, type: number): void {
    // Obtener el valor del input
    // type: 1 // Caracteres nombre del subproyecto
    // type: 2 // Caracteres descripcion del subproyecto
    const input = (event.target as HTMLInputElement).value;
    if(type == 1){
      this.caracter_name = `${input.length}`;
    }else{
      this.caracter = `${input.length}`;
    }
  }

  sendDataModal(vist,end){
    this.vist=vist;
    if(end == 1){
      this.btnLoadingModal=true;
      this.btnDisabledModal=true;
      let date_pipe = new DatePipe("en-es");
      let date_valueI = date_pipe.transform(this.ngModelDateI, 'yyyy-MM-dd');
      let date_valueF = date_pipe.transform(this.ngModelDateF, 'yyyy-MM-dd');
      let date_hourI = this.ngModelHourI
      let date_hourF = this.ngModelHourF
      let date_hourIP = this.ngModelHourIP
      let date_hourFP = this.ngModelHourFP
      let idU=""
      let idUser=""
      if (localStorage.getItem('session')){
        let user = JSON.parse(localStorage.getItem('session'))
        idU=user.enterprise;
        idUser=user.id;
      }
      let list = [];
      let list_validate = Array.from(this.trees);
      list_validate.forEach(element => {
        if (this.isValidate(element)) {
          list.push(element)
        }
      });

      let data = {sub_proyect_id:this.idsubProyect,project_id:this.idProyect,state:this.toggleNgModelState,email:list,name:this.inputItemNgModelName,description:this.textareaItemNgModel,goal:this.textareaItemNgModelObjet,forms:this.selectedItemNgModel,initialDate:date_valueI,finishDate:date_valueF,initialHour:date_hourI,finishHour:date_hourF,star:date_hourIP,end:date_hourFP,travel:this.selectedItem,lunch:this.selectedItemLunch,days:this.days,idU:idU,idUser:idUser};
      // console.log(data)
      let form_data = {'clone': 1}
      if(this.idsubProyect == ''){
        this.formService.clone(this.form_visit_form, form_data).subscribe(
          response => {
            if (response['status']){
              setTimeout(()=>{
                this.visitService.create_sub_proyect(data).subscribe(
                  response => {
                    // console.log(response);
                    this.btnLoadingModal=false;
                    this.btnDisabledModal=false;
                    this.closeModal(response)
                  }
                );
              }, 2000);
            }
          }, error => {
            this.toastService.showToast('danger', 'Error', '¡Ha ocurrido un error, inténtalo más tarde!');
          }
        );
      } else {
        this.visitService.create_sub_proyect(data).subscribe(
          response => {
            // console.log(response);
            this.btnLoadingModal=false;
            this.btnDisabledModal=false;
            this.closeModal(response)
          }
        );
      }
    }
  }

  closeModal(value){
    this.valor1.close()
    if(this.data != undefined){
      setTimeout(()=>{
          this.visitService.listSubProyect(this.idProyect).subscribe(
            response => {
              this.source.source.data=response['data']
              this.source.source.refresh()
              if(value != "1"){
                this.toastService.showToast('success', 'Listo', 'Sub proyecto actualizado correctamente.');
              }
            }
          );
      }, 200);
    }else{
      if(value != "1"){
        setTimeout(()=>{
          this.processSubSS.$processSub.emit("crea subProyecto")
          this.toastService.showToast('success', 'Listo', 'Sub proyecto creado correctamente.');
        }, 200);
      }
    }
  }

  toggleClick(event:boolean){
    if(event){
      this.titleState="Activo";
    }else{
      this.titleState="Inactivo";
    }
  }

  toggleCheckbox(value){
    if (this.days.indexOf(value) !== -1) {
      this.days.splice(this.days.indexOf(value), 1);
    }else{
      this.days.push(value)
    }
  }

  checkValue(field) {
    switch (field) {
      case 2:
        if (this.inputItemNgModelEmail == ''){
          this.btnDisabledModal=true
          return 'basic';
        }
        if(this.inputItemNgModelEmail && this.inputItemNgModelEmail.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-.]+[.][a-zA-Z0-9.-]{2,}$/)){
          this.btnDisabledModal=false
          return 'success';
        }else{
          this.btnDisabledModal=true
          return 'danger';
        }
    }
  }

  trees: Set<string> = new Set([]);
  onTagRemove(tagToRemove: NbTagComponent): void {
    this.trees.delete(tagToRemove.text);
  }

  onValidate(data) {
    if (!this.isValidate(data)) {
      return 'danger';
    }
    return '';
  }

  isValidate(data: string): boolean{
    var REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-.]+[.][a-zA-Z0-9.-]{2,}$/;
    data = data.trim();
    return REGEX.test(data);
  }

  onTagAdd({ value, input }: NbTagInputAddEvent): void {
    if (value) {
      this.addTree(value);
    }
    input.nativeElement.value = '';
  }

  addTree(value) {
    if (this.trees.size < 5) {
      if (value != '' && value.trim() != '') {
        value = value.replace(/,/g,' ');
        let list_split = value.trim().split(' ');
        if (list_split.length > 1) {
          list_split.forEach(element => {
            if (element != '') {
              this.trees.add(element.trim().toLowerCase());
            }
          });
        } else {
          this.trees.add(value.trim().toLowerCase());
        }
      }
    }
  }

  onFocusAdd(input): void {
    if (input.value) {
      this.addTree(input.value);
    }
    input.value = '';
  }
}
