import { Component, OnInit } from '@angular/core';
import { SwitchService } from '../../../../services/switch.service';
import { VisitsService } from '../../../../services/visits.service';
import { DatePipe } from '@angular/common';
import { ToastService } from '../../../../usable/toast.service';
import { GeoportalService } from '../../../../services/geoportal.service';
import { AnswerService } from '../../../../services/answer.service';
import {formatCurrency, getCurrencySymbol} from '@angular/common';
@Component({
    selector: 'ngx-modals-task',
    templateUrl: './modals-task.component.html',
    styleUrls: ['./modals-task.component.scss'],
    standalone: false
})
export class ModalsTaskComponent implements OnInit {
  data;
  dataLogs;
  digital;
  logs;
  source;
  valor1;
  inputItemNgModelName;
  textareaItemNgModel='';
  inputItemNgModelNameDir;
  inputItemNgModelNum='';
  titleModal;
  btnModal;
  btnLoadingModal=false;
  btnDisabledModal=false;
  titleState;
  idSubProyect;
  task_id='';
  ngModelDateI;
  ngModelHourF;
  state_id;
  textTicket=""
  selectedItem="30";
  spamName=true;
  spamNameDir=true;
  spamNameDate=true;
  spamNameHour=true;
  addressList;
  selectedItemNgModel;
  divDir2=true;
  divDir1=false;
  divTraza=true;
  divMenu=false
  btnTraza=true
  btnMenu=true
  btnInfo=true
  answer=null
  email: string;
  number_id: string;
  field;
  fields;
  form;
  task_link_id;
  ticket=false;
  show_errors = false;
  characters = 0;
  maxCharacters = 500;

  constructor(
    private modalSS:SwitchService,
    private visitService:VisitsService,
    private toastService: ToastService,
    private geoportalService: GeoportalService,
    private answerService: AnswerService
  ) { }

  ngOnInit(): void {
    this.modalSS.$taskSub.subscribe((valor)=>{
      this.valor1=valor
      this.number_id = '';
      this.email = '';
    })

    if(this.data != undefined){
      if(this.data.answer_form_id != null){
        this.answer=this.data.answer_form_id
        this.btnInfo=false
      }
    }

    if(this.dataLogs != undefined){
      this.logs=this.dataLogs
      this.btnTraza=false
    }

    if(this.data != undefined){
      this.titleModal= this.ticket ? "Crear nueva " : "Editar "
      this.btnModal= this.ticket ? "Crear" : "Editar"
      this.inputItemNgModelName=this.data.name;
      this.textareaItemNgModel=this.data.description;
      this.inputItemNgModelNameDir=this.data.address;
      this.inputItemNgModelNum=this.data.phone;
      if(this.data.initial_date) {
        let FF = this.data.initial_date.split("-")
        this.ngModelDateI = new Date(Number(FF[0]), Number(FF[1])-1, Number(FF[2]));
      }
      // let HF = this.data.initial_hour.split(":")
      this.ngModelHourF = this.data.initial_hour;
      this.selectedItem = this.data.duration;
      this.task_id = this.data.id;
      this.state_id = this.data.state_id;
      this.textTicket = this.data.serial_number;

      if (this.data.answer_form_id && this.data.answer_form_id != '') {
        this.answerService.list_field(0, this.data.answer_form_id).subscribe(
          response => {
            if (response['status']){
              let data_answer_form = response['data']['list_form'][0]['fields'];
              this.fields.forEach((field, index) => {
                let position = data_answer_form.map(function(e) { return e.field; }).indexOf(Number(field.field));
                if (position != -1) {

                  if (field['field_type'] == '4' && data_answer_form[position]['answer'] != ''){
                    let temp = (''+data_answer_form[position]['answer']).split('-').reverse().join('-');
                    field.answer = temp;
                  } else {
                    field.answer = data_answer_form[position]['answer'];
                  }
                } else {
                  field.answer = "";
                }
              });
            }
          }
        );
      }
    } else {
      this.titleModal="Crear nueva "
      this.btnModal="Crear"
      this.fields.forEach((field, index) => {
        field.answer = "";
      });
    }
  }

  sendDataModal(decline=false){
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

    this.fields[0]['answer'] = this.inputItemNgModelNameDir
    this.fields[1]['answer'] = this.inputItemNgModelNum
    this.fields[2]['answer'] = this.textareaItemNgModel
    let answer_fields = {}
    //fields: {"field_31":"dwsefwe","field_32":"25"}

    let field_form = false;
    this.fields.forEach((field, index) => {
      answer_fields[`field_${field.field}`] = field.answer;

      if (field.required && index > 2) {
        let answer_val = field.answer + "";
        let answer_trimmed = answer_val.replace(/\s+/g, " ").trim();

        if (answer_trimmed == '') {
          field_form = true;
        }
      }
    });

    if (field_form) {
      this.show_errors = true;
      setTimeout(()=>{
        this.show_errors = false;
      }, 10000);
      return false;
    }

    this.btnLoadingModal=true;
    this.btnDisabledModal=true;
    let date_pipe = new DatePipe("en-es");
    let hourI = this.ngModelHourF;
    let date_valueI = date_pipe.transform(this.ngModelDateI, 'yyyy-MM-dd');
    let hourF = this.timeSum(hourI,this.selectedItem)
    let idU=""
    if (localStorage.getItem('session')){
      let user = JSON.parse(localStorage.getItem('session'))
      idU=user.id;
    }
    let data = {
      task_id:this.task_id,
      sub_proyect_id:this.idSubProyect,
      name:this.inputItemNgModelName,
      cellPhone:this.inputItemNgModelNum,
      dir:this.inputItemNgModelNameDir,
      description:this.textareaItemNgModel,
      fecha:date_valueI,
      hourI:hourI,
      hourF:hourF,
      user_id:idU,
      duration:this.selectedItem,
      state_id:this.state_id,
      Answer_Form_id:this.answer,
      answer_fields:answer_fields,
      form: this.form
    }
    if(decline) {
      data['task_link_id'] = '0'
    } else if(this.task_link_id == '1') {
      data['task_link_id'] = this.task_link_id
    }

    this.visitService.create_task(data).subscribe(
      response => {
        this.btnLoadingModal=false;
        this.btnDisabledModal=false;
        this.closeModal(response)
      }
    );
  }

  pulsar(e) {
    if(this.inputItemNgModelNum != null){
      if(this.inputItemNgModelNum.toString().length<10){
        if(e.keyCode > 65 && e.keyCode <= 90){
          return false;
        }
      }else{
        if(e.keyCode != 8){
          return false;
        }
      }
    }
  }

  checkValue(field) {
    switch (field) {
      case 1:
        if (this.number_id == '')
          return 'basic';
        return (this.number_id && this.number_id.toString().length > 4) ? 'success' : 'danger';
      case 2:
        if (this.email == '')
          return 'basic';
        return (this.email && this.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+[.][a-zA-Z0-9.]{2,}$/)) ? 'success' : 'danger';
      case 3:
        if (this.inputItemNgModelNum == '')
          return 'basic';
        return (this.inputItemNgModelNum && this.inputItemNgModelNum.toString().match(/^3[0-9]{9}$/)) ? 'success' : 'danger';
    }
  }

  viewTraza(option){
    if(option=="1"){
      this.btnMenu=false
      this.btnTraza=true
      this.divTraza=false
      this.divMenu=true
      this.btnDisabledModal=true
    }else if(option=="2"){
      this.divMenu=false
      this.divTraza=true
      this.btnMenu=true
      this.btnTraza=false
      this.btnDisabledModal=false
    }
  }

  closeModal(value){
    this.valor1.close()
    if(this.data != undefined){
      setTimeout(()=>{
          this.visitService.list_task(this.idSubProyect,"28").subscribe(
            response => {
              if(this.source != undefined){
                this.source.source.data=response['taskList']
                this.source.source.refresh()
              }else{
                setTimeout(()=>{
                  this.modalSS.$taskSub.emit("crea editada")
                }, 200);
              }
              if(value != "1"){
                this.toastService.showToast('success', 'Listo', 'Tarea actualizada correctamente.');
              }
            }
          );
      }, 200);
    }else{
      setTimeout(()=>{
        this.modalSS.$taskSub.emit("crea tarea")
        if(value != "1"){
          this.toastService.showToast('success', 'Listo', 'Tarea creada correctamente.');
        }
      }, 200);
    }
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

  selectSubProyect(){
    this.inputItemNgModelNameDir=this.selectedItemNgModel
    this.divDir1=false
    this.divDir2=true
  }

  viewPDF(){
    if (this.digital) {
      this.getDigitalPDF(0, this.data.answer_form_id);
    } else {
      this.getPDF(0, this.data.answer_form_id);
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

  typeField(type:number, validate=undefined) {
    if (type == 2 || type == 11) {
      return 'number';
    } else if (type == 4) {
      return 'date';
    } else if (type == 16) {
      return 'currency';
    } else {
      if (validate != undefined && validate.advanced == 'email') {
        return 'email';
      }
      return 'text';
    }
  }

  classField(type:number, table=false) {
    if (type == 4) {
      if (table) {
        return 'input-list-date';
      }
      return 'input-text-date';
    }
    return 'input-text';
  }

  onKeyNumber(type:number, event){
    if (type == 2 || type == 11 || type == 16) {
      let block_key = ["e", ".", ",", "E", "-", "+", "*"];
      if (block_key.includes(event.key)){
        event.preventDefault()
      }
    } else if (type == 5) {
      let key = event.keyCode;
      if (!((key >= 65 && key <= 90) || key == 8 || key == 32 || key == 192)){
        event.preventDefault()
      }
    }
  }

  patternField(type:number, validate) {
    if (type == 2 || type == 11) {
      return '';
    } else if (type == 4) {
      return '';
    } else if (type == 25) {
      return "[a-zA-Z ]{2,254}";
    }else if(type == 5){
      return "[a-zA-ZñÑáéíóúÁÉÍÓÚ \s]+";
    } else if (type == 16) {
      return '';
    } else {
      if (validate != undefined && validate.advanced == 'email') {
        return '.+@.+\..+';
      } else if (type == 1) {
        return '[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ #-]{2,254}';
      }
      return "";
    }
  }

  onErrorField(validate, index) {
    if (validate.advanced == 'email') {
      var REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+.[a-zA-Z0-9-]/;
      let value = this.fields[index]['answer'].trim();
      if (value != '') {
        return !REGEX.test(value);
      }
    }

    return false;
  }

  onRequired(field, index) {
    if (field.required) {
      let answer_trimmed = field.answer.replace(/\s+/g, " ").trim();
      if (answer_trimmed == '') {
        return true;
      }
    }
    return false;
  }

  onChangeValue(event, type:number, validate, index) {
    if (type == 16) {
      if (event.target.value != '') {
        let value = event.target.value.replace('$','').replace(/,/g,'').replace('.00','');
        let val = parseInt(value, 10);
        if (Number.isNaN(val)) {
          val = 0;
        }
        this.fields[index]['answer'] = formatCurrency (val, 'en-ES', getCurrencySymbol('USD', 'wide'));
      } else {
        this.fields[index]['answer'] = '';
      }
    } else {
      this.fields[index]['answer'] = event.target.value;
    }
  }

  getTime(index) {
    let datetime = new Date();
    let hour = '';
    if (datetime.getHours() < 10){
      hour = '0';
    }
    let minute = '';
    if (datetime.getMinutes() < 10){
      minute = '0';
    }
    this.fields[index]['answer'] = hour + datetime.getHours() + ':' + minute + datetime.getMinutes();
  }

  onKey(event){
    this.characters = event.target.value.length
   }

}
