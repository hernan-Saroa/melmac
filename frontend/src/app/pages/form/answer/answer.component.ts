import { NbDialogRef, NbDialogService } from '@nebular/theme';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService } from '../../../services/form.service';
import { DigitalService } from '../../../services/digital.service';
import { AnswerService } from '../../../services/answer.service';
import { ToastService } from '../../../usable/toast.service';

import {formatCurrency, getCurrencySymbol} from '@angular/common';

import { FormGroup } from '@angular/forms';
import { BiometricComponent } from './biometric/biometric.component';
import { HandwrittenComponent } from './handwritten/handwritten.component';
import { Observable, Subject, of, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { SwitchService } from './../../../services/switch.service';
import { ModalComponent } from './modal/modal.component';

import { country } from '../data';
import { AddressComponent } from './address/address.component';
import { BioComponent } from './sign/bio/bio.component';
import { DocComponent } from './sign/doc/doc.component';
import { OtpComponent } from './sign/otp/otp.component';

@Component({
  selector: 'ngx-answer',
  templateUrl: './answer.component.html',
  styleUrls: ['./answer.component.scss']
})
export class AnswerComponent implements OnInit {

  // Trazabilidad de firmas.
  token_link = '';
  trace_token = '';

  // Data Design
  title = 'Diligenciar';
  logo = '';
  background = '';
  color = '';

  //GeoLocation
  geolocationPosition = null;

  // Individual
  id:string;
  name:string;
  description:string;

  // Consecutivo
  consecutive:string;
  index_form: number;
  current_form: string;
  form_list = [];
  id_answer_consecutive:string;

  // Versión del Documento en la Respuesta
  version;
  version_consecutive;

  // Digital
  digital = false;
  mostrarD = true;
  isActiveTab=false;
  title_tab = "previsualización";

  // Editar
  answer:string;
  answer_consecutive:string;
  answer_digital:string;
  answer_id = null

  answer_duplicate: Boolean = false;

  fields = [];
  Extensiones = [];
  attempts = [];

  emails = [];

  // Archivos
  data_files = [];

  // Digital - PDF
  src;

  btn_name = 'Enviar';
  sendForm:FormGroup;
  loading = false;
  enable = true;

  dialogRefBio: NbDialogRef<BiometricComponent>;
  address:NbDialogRef<AddressComponent>;
  SignatureHand : NbDialogRef<HandwrittenComponent>;
  singleSelectGroupValue = [];

  // Registraduri
  data_ani = [];
  array_ani = [];

  // Firma
  // @ViewChild(SignaturePad) signaturePad: SignaturePad;
  private signaturePadOptions: Object = { // passed through to szimek/signature_pad constructor
    'minWidth': 0.5,
    'Width': 0.5,
    'canvasWidth': 360,
    'canvasHeight': 180
  };

  options = [];
  filteredOptions$: Observable<any[]>;
  load_data = false;

  // País - Departamento/Estado - Ciudad
  public country: any;

  // Tipos de Documento
  type_identification = [
    {'id': 1, 'name': 'Cédula de ciudadanía'},
    {'id': 2, 'name': 'Tarjeta de identidad'},
    {'id': 3, 'name': 'Cédula de extranjería'},
    {'id': 4, 'name': 'Pasaporte'},
    {'id': 5, 'name': 'Permiso de permanencia'},
    {'id': 6, 'name': 'Permiso por protección temporal'},
  ];

  // Campo de validación única
  unique_fields = [];

  // Preview
  pdf_view = false;
  pdf_loading = false;
  page_viewer = 1;
  page_total;

  ListenerMouseEvent: Function;
  listenerkeypress: Function;
  subjectTimer;
  attemptsCurrent = {}
  existSign = false
  sendingAutoForm = false

  position = null
  fillOut = '0'

  constructor(
    private renderer: Renderer2,
    private router: Router,
    private formService:FormService,
    private digitalService:DigitalService,
    private answerService:AnswerService,
    private toastService: ToastService,
    private activatedRoute: ActivatedRoute,
    public dialogService: NbDialogService,
    private srcSS:SwitchService,
    private modalSS:SwitchService,
  ) {
    this.id = this.activatedRoute.snapshot.paramMap.get('id');
    this.consecutive = this.activatedRoute.snapshot.paramMap.get('consecutive');
    this.answer = this.activatedRoute.snapshot.paramMap.get('answer');
    this.answer_consecutive = this.activatedRoute.snapshot.paramMap.get('answer_consecutive');
    this.answer_digital = this.activatedRoute.snapshot.paramMap.get('answer_digital');

    // Repsonsive Firma
    let contet_layput = document.getElementsByClassName('scrollable-container');
    if (contet_layput[0].parentElement.offsetWidth <= 540) {
      this.signaturePadOptions['canvasWidth'] = 330;
      this.signaturePadOptions['canvasHeight'] = 165;
    }

    this.loading = true;
    this.country = country;

    // Oganizar bien la parte de edición de consecutivo con la funcion secuencia y form
    if (this.answer != null) {
      this.id = this.activatedRoute.snapshot.paramMap.get('form');
      this.getAllDataAnswer(this.answer);
    } else if (this.id != null) {
      // Individual
      this.getAllData();
    } else if (this.consecutive != null || this.answer_consecutive != null) {
      // Consecutivo
      if (this.answer_consecutive != null) {
        this.consecutive = this.activatedRoute.snapshot.paramMap.get('form');
      }
      this.getSequence();
    } else {
      this.activatedRoute.data.subscribe(data => {
        // console.log(data)
        if (data['digital'] == 1) {
          this.digital = true;
          this.isActiveTab = true;
          if (this.answer_digital != null) {
            this.id = this.activatedRoute.snapshot.paramMap.get('form');
            this.getAllDataAnswer(this.answer_digital);
          } else {
            this.id = this.activatedRoute.snapshot.paramMap.get('digital');
            if (this.id != null) {
              this.getAllData();
            }
          }

          this.pdf_loading = true;
          const formData = new FormData();
          formData.append('fields', '{}');
          this.answerService.getTemporalPDF(this.id, formData).subscribe(
            response => {
              this.src = {
                data: response
              }
              this.loading = false;
              this.pdf_loading = false;
            }, error => {
              console.error(error);
              this.toastService.showToast('danger', '¡Error!', 'Intentalo mas tarde.');
              this.loading = false;
              this.pdf_loading = false;
            }
          );

        }
      });
    }
  }

  get status_bar() {
    let progress = 0;
    let total = this.fields.length;
    this.fields.forEach(field => {
      if (field.field_type == 23) {
        if (JSON.stringify(field.answer) != '["","",""]') {
          progress += 1;
        }
      } else if (field.field_type == 11 && field.label == 'Número de documento a validar biometricamente') {
        total -= 1;
      } else if (field.field_type == 14) {
        total -= 1;
      } else {
        if (field.answer != '') {
          progress += 1;
        }
      }
    });
    let progress_bar = (progress * 100) / total;

    if (progress_bar <= 25) {
      return 'danger';
    } else if (progress_bar <= 50) {
      return 'warning';
    } else if (progress_bar <= 75) {
      return 'info';
    } else {
      return 'success';
    }
  }

  get progress_bar() {
    let progress = 0;
    let total = this.fields.length;
    this.fields.forEach(field => {
      if (field.field_type == 23) {
        if (JSON.stringify(field.answer) != '["","",""]') {
          progress += 1;
        }
      } else if (field.field_type == 11 && field.label == 'Número de documento a validar biometricamente') {
        total -= 1;
      } else if (field.field_type == 14) {
        total -= 1;
      } else {
        if (field.answer != '') {
          progress += 1;
        }
      }
    });
    return Math.floor((progress * 100) / total);
  }

  previewPDF(f) {
    this.pdf_loading = true;

    const formData = new FormData();
    formData.append('fields', JSON.stringify(f.value));
    // Lista de archivos
    this.data_files.forEach((value ,key) => {
      formData.append('file_' + key, value);
    });
    this.answerService.getTemporalPDF(this.id, formData).subscribe(
      response => {
        this.src = {
          data: response
        }

        var file = new Blob([response]);
        var reader = new FileReader();
        reader.readAsBinaryString(file);
        reader.onloadend = () => {
            const count = (reader.result as string).match(/\/Type[\s]*\/Page[^s]/g).length;
            this.page_total = count;
        }

        this.pdf_view = true;
        this.pdf_loading = false;
      }, error => {
        console.error(error);
        this.toastService.showToast('danger', '¡Error!', 'Intentalo mas tarde.');
        this.pdf_loading = false;
      }
    );
  }

  closePreviewPDF(full_pdf_view: HTMLElement) {
    full_pdf_view.classList.remove('show_pdf_view');
    full_pdf_view.classList.add('hide_pdf_view');
    setTimeout(() => {
      this.pdf_view = false;
      full_pdf_view.classList.remove('hide_pdf_view');
      full_pdf_view.classList.add('show_pdf_view');
    }, 1000);
  }

  nextPagePreview(doc_content: HTMLElement) {
    if (this.page_viewer < this.page_total) {
      doc_content.classList.add('next_show_go');
      setTimeout(() => {
        if (this.page_viewer < this.page_total) {
          this.page_viewer += 1;
        }

        setTimeout(() => {
          doc_content.classList.remove('next_show_go');
        }, 500);
      }, 500);
    }
  }

  backPagePreview(doc_content) {
    if (this.page_viewer > 1) {
      doc_content.classList.add('back_show_go');
      setTimeout(() => {
        if (this.page_viewer > 1) {
          this.page_viewer -= 1;
        }

        setTimeout(() => {
          doc_content.classList.remove('back_show_go');
        }, 500);
      }, 500);
    }
  }

  drawComplete(sign, index, div) {
    // will be notified of szimek/signature_pad's onEnd event
    // console.log(sign.toDataURL());
    div.style.border = '1px solid #e4e9f2';
    this.fields[index]['answer'] = sign.toDataURL();
  }

  drawStart(sign, index) {
    // will be notified of szimek/signature_pad's onBegin event
    // console.log('begin drawing');
  }

  drawClear(sign, index, div, req) {
    if (req) {
      div.style.border = '1px solid red';
    }
    this.fields[index]['answer'] = '';
    sign.clear()
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

  typeValidate(name) {
    let data_name = name.split(' - ');
    let end_i = data_name.length - 1;
    if (data_name[end_i] == 'Fecha de expedición') {
      return 'date';
    }
    return 'text';
  }

  classValidate(name) {
    let data_name = name.split(' - ');
    let end_i = data_name.length - 1;
    if (data_name[end_i] == 'Fecha de expedición') {
      return 'input-text-date';
    }
    return 'input-text';
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
      if (type == 16) {
        let key = event.keyCode;
        if (((key >= 65 && key <= 90) || key == 13 || key == 32 || key == 189 || key == 192)){
          event.preventDefault()
        }
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
        return '[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ #-]+$';
        // return '[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ #-]{2,254}';
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

  onChangeValue(event, type:number, validate, index) {
    if (type == 16) {
      if (event.target.value != '') {
        let value = event.target.value.replace('$','').replace(/,/g,'').replace('.00','');
        let val = parseInt(value, 10);
        if (Number.isNaN(val)) {
          val = 0;
        }
        this.fields[index]['answer'] = formatCurrency(val, 'en-ES', getCurrencySymbol('USD', 'wide'));
      } else {
        this.fields[index]['answer'] = '';
      }
    } else if (type == 11) {
      if (event.target.value != '') {

        if (this.fields[index]['validate']) {

          let validate = JSON.parse(this.fields[index]['validate']['advanced']);

          if (validate.includes('registraduria')) {

            if (this.fields[index]['optionDocuments']) {
              this.getANI(event.target.value, index);
            }
          }
        }

      }
    } else if (type==20 && (event.target.value).length == 9 && Number(event.target.value)){
      this.fields[index]['answer'] = event.target.value;
    }
    else {
      this.fields[index]['answer'] = event.target.value;
    }
  }

  onChangeTypeDoc(event, index) {
    let validate = false;

    this.fields[index]['identification_answer'] = '';
    this.fields[index]['optionDocuments'].forEach(option => {
      let position = this.fields.map(function(e) { return e.field; }).indexOf(option['field']);
      if (position != -1) {
        this.fields[position]['answer'] = '';
        if (this.fields[position]['validate'] && this.fields[position]['validate']['advanced'] == "confirm_validation"){
          validate = true;
        }
      }
    });

    if (event == 1) {
      this.data_ani.forEach(element => {
        if (element.parent == this.fields[index]['field']) {
          element.fill_out = false;
          element.validate = validate;
        }
      });
    } else {
      this.data_ani.forEach(element => {
        if (element.parent == this.fields[index]['field']) {
          element.fill_out = true;
          element.validate = false;
        }
      });
    }
  }

  onChangeDoc(event, index) {
    if (event.target.value != '') {
      if (this.fields[index]['type_answer'] == 1 && this.fields[index]['optionDocuments'].length != undefined && this.fields[index]['optionDocuments'].length != 0) {
        if (this.fields[index]['validate']) {
          let validate = JSON.parse(this.fields[index]['validate']['advanced']);
          if (validate.includes('registraduria')) {
            if (this.fields[index]['optionDocuments']) {
              this.getANI(event.target.value, index);
            }
          }
        }
      } else {
        this.fields[index]['answer'] = this.fields[index]['type_answer'] + '-' + event.target.value;
      }
    } else {
      this.fields[index]['answer'] = '';
      this.fields[index]['optionDocuments'].forEach(option => {
        let position = this.fields.map(function(e) { return e.field; }).indexOf(option['field']);
        this.fields[position]['answer'] = '';
      });
    }
  }

  getANI(document, index) {
    this.loading = true;
    this.answerService.getDataANI(document,this.id).subscribe(
      response => {
        if (response['status']){
          let response_ani = response['data'];

          this.fields[index]['answer'] = this.fields[index]['type_answer'] + '-' + document;

          if (response_ani['description']=='No tiene creditos'){
            this.toastService.showToast('danger', 'COD:AP501', 'No se puede realizar el proceso con la registraduría, comuniquese con su administrador.');
          }else{
            this.fields[index]['optionDocuments'].forEach(option => {
              let position = this.fields.map(function(e) { return e.field; }).indexOf(option['field']);
              let value;
              switch (option['label']) {
                case 'Nombre':
                  value = response_ani['pName'];
                  this.fields[position]['answer'] = value;
                  break;
                case 'snombre':
                  value = response_ani['sName'];
                  this.fields[position]['answer'] = value;
                  break;
                case 'Apellido':
                  value = response_ani['pLastname'];
                  this.fields[position]['answer'] = value;
                  break;
                case 'sapellido':
                    value = response_ani['sLastname'];
                    this.fields[position]['answer'] = value;
                    break;
                case 'Identificacion':
                  value = response_ani['document'];
                  this.fields[position]['answer'] = value;
                  break;
                case 'fexpedicion':
                  value = response_ani['fexpedicion'];
                  if (this.fields[position]['validate']['advanced'] == "confirm_validation") {
                    this.fields[position]['answer_ani'] = value;
                  } else {
                    this.fields[position]['answer'] = value;
                  }
                  break;
                case 'Existencia':
                  value = response_ani['state'];
                  if (response_ani['document'] != '') {
                    this.fields[position]['answer'] = value == "True" ? 'Vivo' : 'Fallecido';
                  } else {
                    this.fields[position]['answer'] = '';
                  }
                  break;
                default:
                  break;
              }
            });
          }
          this.loading = false;
        }
      }, error => {
        // return false;
        this.loading = false;
      }
    );
  }

  onChangeValidateANI(event, index) {
    let position = this.data_ani.map(function(e) { return e.field; }).indexOf(this.fields[index]['field']);
    let position_field = this.fields.map(function(e) { return e.field; }).indexOf(this.data_ani[position]['parent']);

    if (position != -1 && position_field != -1 && this.fields[position_field]['type_answer'] == 1) {
      if (event.target.value != '' && this.fields[index]['answer_ani'] != '') {
        let date_ani = event.target.value.split('-');
        let date_answer =  date_ani[2] + '/' + date_ani[1] + '/' + date_ani[0];

        if (date_answer == this.fields[index]['answer_ani']) {
          // let position = this.data_ani.map(function(e) { return e.field; }).indexOf(this.fields[index]['field']);
          this.data_ani.forEach(element => {
            if (element.field_change == this.fields[index]['field']) {
              element.validate = false
            }
          });

          this.fields[index]['answer'] = this.fields[index]['answer_ani'];
          this.toastService.showToast('success', 'Validación', 'La fecha de expedición ingresada es correcta.');
        } else {

          this.data_ani.forEach(element => {
            if (element.field_change == this.fields[index]['field']) {
              element.validate = true
            }
          });

          this.fields[index]['answer'] = '';
          this.toastService.showToast('danger', '¡Datos no Coinciden!', 'El valor ingresado no coincide con los de la registraduría.');
        }
      } else {
        this.fields[index]['answer'] = '';
      }
    } else {
      let date_ani = event.target.value.split('-');
      let date_answer =  date_ani[2] + '/' + date_ani[1] + '/' + date_ani[0];
      this.fields[index]['answer'] = date_answer;
    }
  }

  onHiddenANI(field){
      let position = this.data_ani.map(function(e) { return e.field; }).indexOf(field);
      if (position != -1) {
        return this.data_ani[position]['validate'];
      }
      return false;
  }

  onDisabledANI(field){
    let position = this.data_ani.map(function(e) { return e.field; }).indexOf(field);
    if (position != -1) {
      return !this.data_ani[position]['fill_out'];
    }
    return true;
  }

  noMatches: boolean = false;
  optionSelected: boolean = false;

  private filter(value: string, options: any[]): any[] {
      const filterValue = value.toLowerCase();
      return options.filter(option => option.name.toLowerCase().includes(filterValue));
  }

  getFilteredOptions(value: string, values: any[]): Observable<any[]> {
      return of(value).pipe(
          map(filterString => {
              const filtered = this.filter(filterString, values);
              if (filtered.length === 0) {
                  this.noMatches = true;
                  return [{ value: '', name: 'No se encontraron coincidencias' }];
              } else {
                  this.noMatches = false;
              }
              return filtered;
          })
      );
  }

  onChange(input, index) {
      this.optionSelected = false;
      this.getFilteredOptions(input.value, this.fields[index]['values']).subscribe(filteredOptions => {
          this.fields[index]['values_of'] = of(filteredOptions);
      });

      if (input.value === "") {
          this.fields[index]['answer'] = "";
      }
  }

  // Actualizar las opciones sin abrir el menú desplegable
  onBlur(input, index) {
      if (!this.optionSelected && this.noMatches) {
          input.value = ''; // Limpiar el valor del input
          this.fields[index]['answer'] = ''; // Limpiar la respuesta en `fields`
          // Actualizar las opciones en segundo plano
          this.fields[index]['values_of'] = of(this.fields[index]['values']);
      }
  }

  filteredOptions(values) {
    let options = [];
    values.forEach(element => {
      options.push({
        'id': element.value,
        'name': element.label,
      });
    });
    return of(options);
  }

  onSelectionChange($event, index) {
    if ($event.id != undefined) {
      this.optionSelected = true;
      this.fields[index]['answer'] = $event.id;
      this.fields[index]['answer_name'] = $event.name;
    }
  }

  onChangeCountry(input, index) {
    this.fields[index]['countrys_of'] = this.getFilteredOptions(input.value, this.fields[index]['countrys']);
    if (input.value == "") {
      this.fields[index]['answer'] = ["","",""];
      this.fields[index]['answer_country'] = "";
      this.fields[index]['answer_state'] = "";
      this.fields[index]['answer_city'] = "";

      this.fields[index]['states'] = [];
      this.fields[index]['states_of'] = of([]);

      this.fields[index]['citys'] = [];
      this.fields[index]['citys_of'] = of([]);
    }
  }

  onSelectionChangeCountry($event, index) {
    if ($event.id != undefined) {
      this.fields[index]['answer_country'] = $event.name;

      let position = this.country.map(function(e) { return e.value; }).indexOf($event.id);
      this.fields[index]['answer_state'] = "";
      this.fields[index]['answer_city'] = "";
      let states = [];
      this.country[position]['state'].forEach(option => {
        states.push({
          'id': option.value,
          'name': option.label,
        });
      });
      this.fields[index]['states'] = states;
      this.fields[index]['states_of'] = of(states);
      // Asigna la respuesta
      this.fields[index]['answer'] = [$event.id, "", ""];
    }
  }

  onChangeState(input, index) {
    this.fields[index]['states_of'] = this.getFilteredOptions(input.value, this.fields[index]['states']);
    if (input.value == "") {
      this.fields[index]['answer'][1] = "";
      this.fields[index]['answer_state'] = "";
      this.fields[index]['answer_city'] = "";

      this.fields[index]['citys'] = [];
      this.fields[index]['citys_of'] = of([]);
    }
  }

  onSelectionChangeState($event, index) {
    if ($event.id != undefined) {
      this.fields[index]['answer_state'] = $event.name;

      let position_country = this.country.map(function(e) { return e.label; }).indexOf(this.fields[index]['answer_country']);
      this.fields[index]['answer_city'] = "";
      let citys = [];
      let position = this.country[position_country]['state'].map(function(e) { return e.value; }).indexOf($event.id);
      this.country[position_country]['state'][position]['cities'].forEach(option => {
        citys.push({
          'id': option.value,
          'name': option.label,
        });
      });
      this.fields[index]['citys'] = citys;
      this.fields[index]['citys_of'] = of(citys);
      // Asigna la respuesta
      this.fields[index]['answer'][1] = $event.id;
    }
  }

  onChangeCity(input, index) {
    this.fields[index]['citys_of'] = this.getFilteredOptions(input.value, this.fields[index]['citys']);
    if (input.value == "") {
      this.fields[index]['answer'][2] = "";
      this.fields[index]['answer_city'] = "";
    }
  }

  onSelectionChangeCity($event, index) {
    if ($event.id != undefined) {
      this.fields[index]['answer_city'] = $event.name;
      this.fields[index]['answer'][2] = $event.id;
    }
  }

  onSelectionKeyChange($event, index) {
    if ($event.id != undefined) {
      let answer_data = this.fields[index]['field_data'][$event.id];
      this.fields[index]['answer_name'] = $event.name;
      this.fields[index]['answer_json'] = answer_data;
      this.fields[index]['answer'] = JSON.stringify(answer_data);
    }
  }

  onChangeValueKey(event, index, key) {
    if (this.fields[index]['answer'] != '') {
      let answer = JSON.parse(this.fields[index]['answer']);;
      answer[key] = event.target.value;
      this.fields[index]['answer'] = JSON.stringify(answer);
    }
  }

  toggleCheckbox(checked: boolean, value, checkbox, index) {
    this.fields[index]['answer'] = checkbox.value;
    let array_checkbox = [];
    if (checkbox.value != '') {
      array_checkbox = JSON.parse(checkbox.value);
    }
    if (checked) {
      array_checkbox.push(value);
    } else {
      let position = array_checkbox.map(function(e) { return e; }).indexOf(value);
      array_checkbox.splice(position, 1);
    }
    if (JSON.stringify(array_checkbox) == "[]" ) {
      this.fields[index]['answer'] = '';
    } else {
      this.fields[index]['answer'] = JSON.stringify(array_checkbox);
    }
  }

  onCheck(answer: string, option: string) {
    if (answer != '') {
      let array_answer = JSON.parse(answer);
      if (array_answer.indexOf(option) !== -1) {
        return true;
      }
    }
    return false;
  }

  getLocation(index) {
    this.fields[index]['answer'] = '';
    if (this.geolocationPosition != null){
      this.fields[index]['answer'] = this.geolocationPosition.coords.latitude + ',' + this.geolocationPosition.coords.longitude;
    } else {
      this.toastService.showToast('warning', '¡No se pudo obtener la ubicación!', 'Recarga la página y asegúrate de darle el permiso de ubicación.');
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

  onLocation($event, option, index, required) {
    let location;
    let lat = '';
    let lon = '';
    if (this.fields[index]['answer'] != '') {
      location = this.fields[index]['answer'].split(',');
      lat = location[0];
      lon = location[1];
    }
    if (option == 1) {
      lat = $event.target.value;
    } else {
      lon = $event.target.value;
    }

    if ((lat == '' && lon == '')) {
      this.fields[index]['answer'] = '';
    } else {
      this.fields[index]['answer'] = lat + ',' + lon;
    }
  }

  valueLocation(answer: string, option) {
    // console.log('valueLocation');
    if (answer != '') {
      if (option == 1) {
        return answer.split(',')[0];
      } else {
        return answer.split(',')[1];
      }
    }
    return '';
  }

  getRow(index) {
    if (this.fields[index]['answer_row'] == undefined) {
      return 0;
    }
    return this.fields[index]['answer_row'];
  }

  addRowList(index) {
    if (this.fields[index]['answer_row'] == undefined) {
      this.fields[index]['answer_row'] = 1;
    } else {
      this.fields[index]['answer_row'] += 1;
    }
  }

  removeRowList(index) {
    if (this.fields[index]['answer_row'] == undefined) {
      this.fields[index]['answer_row'] = 1;
    } else {
      this.fields[index]['answer_row'] -= 1;
      if (this.fields[index]['answer'] != '') {
        let answer = JSON.parse(this.fields[index]['answer']);
        if (this.fields[index]['answer_row'] < answer.length -1) {
          answer.pop();
        }
        this.fields[index]['answer'] = JSON.stringify(answer);
      }
    }
  }

  upRow(index) {
    // console.log('upRow');
    if (this.fields[index]['now_row'] == undefined) {
      this.fields[index]['now_row'] = 1;
    } else {
      this.fields[index]['now_row'] += 1;
    }
    // console.log(this.fields[index]['now_row']);
  }

  downRow(index) {
    // console.log('downRow');
    if (this.fields[index]['now_row'] == undefined) {
      this.fields[index]['now_row'] = 1;
    } else {
      this.fields[index]['now_row'] -= 1;
    }
    // console.log(this.fields[index]['now_row']);
  }

  drawCompleteList(field, row, index, type, sign, div) {
    // will be notified of szimek/signature_pad's onEnd event
    // console.log('sign');
    // console.log(sign.toDataURL());
    div.style.border = '1px solid #e4e9f2';
    // this.fields[index]['answer'] = sign.toDataURL();
    this.onChangeValueList(sign.toDataURL(), field, row, index, type);
  }

  drawClearList(field, row, index, type, sign, div) {
    this.onChangeValueList('', field, row, index, type);
    sign.clear()
  }

  onChangeValueList(event, field, row, index, type) {
    let answer = [];
    let value;
    let value_field = ['3', '7', '12', '13', '15'];

    if (value_field.includes(type)) {
      value = event;
    } else {
      value = event.target.value;
    }
    if (this.fields[index]['answer'] != '') {
      answer = JSON.parse(this.fields[index]['answer']);
    }
    let p_row = answer.map(function(e, ind) { return ind; }).indexOf(row);
    if (p_row == -1) {
      answer[row] = [{
        'field': field,
        'answer': value
      }]
    } else {
      if (answer[row] == null) {
        answer[row] = [];
      }
      let p_field = answer[row].map(function(e) { return e.field; }).indexOf(field);
      if (p_field == -1) {
        answer[row].push({
          'field': field,
          'answer': value
        })
      } else {
        if (value != '') {
          answer[row][p_field]['answer'] = value;
        } else {
          answer[row].splice(p_field, 1)
        }
      }
    }
    // console.log(JSON.stringify(answer));
    if (JSON.stringify(answer) == '[[]]') {
      this.fields[index]['answer'] = '';
    } else {
      this.fields[index]['answer'] = JSON.stringify(answer);
    }
  }

  getValueField(field, row, index, type) {
    let answer = [];
    if (this.fields[index]['answer'] != '') {
      answer = JSON.parse(this.fields[index]['answer']);
    }
    let p_row = answer.map(function(e, ind) { return ind; }).indexOf(row);

    if (this.fields[index]['answer_row'] == undefined && answer.length - 1 > 0) {
      this.fields[index]['answer_row'] = answer.length - 1;
    }

    if (p_row != -1 && answer[row] != null) {
      let p_field = answer[row].map(function(e) { return e.field; }).indexOf(field);
      if (p_field != -1) {
        return answer[row][p_field]['answer'];
      }
    }

    return ''
  }

  toggleCheckboxList(field, row, index, type, checked: boolean, value) {
    let array_checkbox = [];
    let answer = this.getValueField(field, row, index, type);
    if (answer != '') {
      array_checkbox = answer;
    }
    if (checked) {
      array_checkbox.push(value);
    } else {
      let position = array_checkbox.map(function(e) { return e; }).indexOf(value);
      array_checkbox.splice(position, 1);
    }
    if (JSON.stringify(array_checkbox) == "[]" ) {
      this.onChangeValueList('', field, row, index, type);
    } else {
      this.onChangeValueList(array_checkbox, field, row, index, type);
    }
  }

  onCheckList(field, row, index, type, option: string) {
    let answer = this.getValueField(field, row, index, type);
    if (answer != '') {
      // let array_answer = JSON.parse(answer);
      if (answer.indexOf(option) !== -1) {
        return true;
      }
    }
    return false;
  }

  getLocationList(field, row, index, type) {
    this.onChangeValueList('', field, row, index, type);
    if (this.geolocationPosition != null){
      this.onChangeValueList(this.geolocationPosition.coords.latitude + ',' + this.geolocationPosition.coords.longitude, field, row, index, type);
    } else {
      this.toastService.showToast('warning', '¡No se pudo obtener la ubicación!', 'Recarga la página y asegúrate de darle el permiso de ubicación.');
    }
  }

  valueLocationList(field, row, index, type, option) {
    let answer = this.getValueField(field, row, index, type);
    if (answer != '') {
      if (option == 1) {
        return answer.split(',')[0];
      } else {
        return answer.split(',')[1];
      }
    }
    return '';
  }

  getValueNit(answer_nit, list_nit, label) {
    let list = [];
    if (list_nit != undefined && list_nit != '') {
      list = JSON.parse(list_nit);
    }

    let answer = [];
    if (answer_nit != '') {
      answer = JSON.parse(answer_nit);
    }
    let repsonse = [];
    answer.forEach(element => {
      for (let el in element) {
        let name = el.replace('_', " ").replace('_', " ");
        if (list.includes(name)) {
        repsonse.push({
          'label': label +' - '+name,
          'answer': element[el]
        })
        }
      }
    });
    // console.log(repsonse)
    return repsonse;
  }

  getAllData(){
    this.formService.get_data_form(this.id).subscribe(
      response => {
        if (response['status'] && !response['form']['public']){
          // console.log(response['form']['fields'])
          this.name = response['form']['name'];
          this.description = response['form']['description'];
          this.version = response['form']['version'];
          this.fields = response['form']['fields'];
          this.attempts = response['form']['attemps'];
          this.fields.forEach(field => {
            if(field['field_type'] == 10 || field['field_type'] == 18 || field['field_type'] == 22) {
              this.existSign = true;
            }
          });
          this.timerInactivity();
          this.getOptionFields();

          this.loading = false;
        } else {
          this.router.navigate(['/pages/form/view', {}]);
        }
      }
    );
  }

  getAllDataAnswer(answer){
    this.formService.get_data_answer(this.id, 0, answer).subscribe(
      response => {
        if (response['status'] && !response['form']['public']){
          // console.log(response['form']['fields'])
          this.name = response['form']['name'];
          this.description = response['form']['description'];
          this.version = response['form']['version'];
          this.fields = response['form']['fields'];
          this.answer_duplicate = response['form']['answer_duplicate'];

          // Validación de permisos para editar
          const user_data = JSON.parse(localStorage.getItem('session')) || null;
          let permit = 31;
          if (this.answer_duplicate) {
            permit = 70;
          }
          if (user_data && user_data['permission'].includes(permit)) {
            let break_for = false;
            this.fields.forEach((field, index) => {
              if (!break_for && ['10', '18'].includes(field['field_type'])) {
                this.toastService.showToast('warning', 'Editar', 'No puede editar esta respuesta, contiene campos no editables.');
                this.router.navigate(['/pages/answer', {}]);
                break_for = true;
              } else if (field['field_type'] == '4'){
                if (field['answer'] != ''){
                  let temp = (''+field['answer']).split('-').reverse().join('-');
                  this.fields[index]['answer'] = temp;
                }
              }
            });

            this.getOptionFields();

            this.loading = false;
          } else {
            this.toastService.showToast('danger', 'Editar', 'No tienes permiso para editar esta respuesta');
            this.router.navigate(['/pages/answer', {}]);
          }
        } else {
          if (response['message']) {
            this.toastService.showToast('danger', 'Editar', 'No puede editar esta respuesta, ' + response['message']);
          }
          this.router.navigate(['/pages/answer', {}]);
        }
      }
    );
  }

  getSequence(){
    this.answerService.get_sequence(this.consecutive, this.answer_consecutive).subscribe(
      response => {
        if (response['status']){
          this.form_list = response['consecutive']['forms'];
          if (this.answer_consecutive == null) {
            this.version_consecutive = response['version'];
          }
          this.index_form = 0;
          this.current_form = this.form_list[this.index_form].id;
          this.getForm('1');
        } else {
          this.router.navigate(['/pages/form/view', {}]);
        }
      }
    );
  }

  getForm(consecutive='') {
    if (this.answer_consecutive != null) {
      if (consecutive == '') {
        consecutive = '0';
      }
      this.formService.get_data_answer(this.current_form, consecutive, this.answer_consecutive).subscribe(
        response => {
          if (response['status'] && !response['form']['public']){
            if (this.index_form < (this.form_list.length - 1)) {
              this.btn_name = 'Siguiente';
            } else {
              this.btn_name = 'Finalizar';
            }
            // console.log(response['form']['fields'])
            this.name = response['form']['name'];
            this.description = response['form']['description'];
            this.fields = response['form']['fields'];
            this.version_consecutive = response['form']['version_consecutive'];
            this.version = response['form']['version'];

            this.getOptionFields();

            this.loading = false;
          } else {
            if (response['message']) {
              this.toastService.showToast('danger', 'Editar', 'No puede editar esta respuesta, ' + response['message']);
            }
            this.router.navigate(['/pages/answer', {}]);
          }
        }
      );
    } else {
      this.formService.get_data_form(this.current_form, consecutive).subscribe(
        response => {
          if (response['status'] && !response['form']['public']){
            if (this.index_form < (this.form_list.length - 1)) {
              this.btn_name = 'Siguiente';
            } else {
              this.btn_name = 'Finalizar';
            }
            // console.log(response['form']['fields'])
            this.name = response['form']['name'];
            this.description = response['form']['description'];
            this.fields = response['form']['fields'];
            this.version = this.form_list[this.index_form].version;

            this.getOptionFields();

            this.loading = false;
          } else {
            this.router.navigate(['/pages/form/view', {}]);
          }
        }
      );
    }
  }

  getOptionFields() {
    let countrys = [];
    this.country.forEach(option => {
      countrys.push({
        'id': option.value,
        'name': option.label,
      });
    });
    this.fields.forEach(field => {
      if ([1,2,5].includes(Number(field.field_type))) {
        if (field.validate && field.validate.special && JSON.parse(field.validate.special).includes('unique')) {
          this.unique_fields.push(field.field);
          field.duplicate = false;
          if (this.answer_duplicate) {
            let unique_data = {
              form: this.id,
              field: field.field,
              answer: field.answer,
            }

            if (field.answer != '') {
              // Edición de respuesta
              if (this.answer_digital != null) {
                unique_data['id'] = this.answer_digital;
              } else if (this.answer != null) {
                unique_data['id'] = this.answer;
              }
              this.answerService.getValidateUnique(unique_data).subscribe(
                response => {
                  if (response['status']) {}
                }, error => {
                  field.duplicate = true;
                }
              );
            }
          }
        }
      } else if (field.field_type == 3) {
        let options = [];
        field.values.forEach(option => {
          options.push({
            'id': option.value,
            'name': option.label,
          });
        });
        field.values = options;
        field.values_of = of(options);
        if (field.answer != '') {
          let position = field.values.map(function(e) { return e.id; }).indexOf(field.answer);
          if (position != -1) {
            field.answer_name = field.values[position]['name'];
          }
        } else {
          field.answer_name = '';
        }
      } else if (field.field_type == 21) {
        let label_data = field.label.split(" - ");
        let label = label_data[label_data.length-1];
        switch (label) {
          case "Nombre":
            field.label = label_data[0]+ " - Primer nombre"
            break;
          case "snombre":
            field.label = label_data[0]+ " - Segundo nombre"
            break;
          case "Apellido":
            field.label = label_data[0]+ " - Primer apellido"
            break;
          case "sapellido":
            field.label = label_data[0]+ " - Segundo apellido"
            break;
          case "fexpedicion":
            field.label = label_data[0]+ " - Fecha de expedición"
            break;
          case "Identificacion":
            field.label = label_data[0]+ " - Identificación"
            break;
          default:
            break;
        }

        if (field.answer != '') {
          // let date_ani = field.answer.split('-');
          // let date_answer =  date_ani[0] + '-' + date_ani[1] + '-' + date_ani[2];
          // field.answer_confirm = date_answer;
          field.answer_ani = field.answer;
          field.answer_confirm = '';
        } else {
          field.answer_ani = '';
          field.answer_confirm = '';
        }
      } else if( field.field_type == 11) {
        if (field.answer != '') {
          let data_identification = field.answer.split('-');
          field.type_answer = data_identification[0];
          field.identification_answer = data_identification[1];
        } else {
          field.type_answer = 1;
          field.identification_answer = '';
        }

        let validate = false;
        let field_change = '';
        let fill_out = false;

        if (field.optionDocuments.length != undefined) {
          field.optionDocuments.forEach(element => {
            let position = this.fields.map(function(e) { return e.field; }).indexOf(element.field);
            if (position != -1) {
              if (this.fields[position]['validate'] && this.fields[position]['validate']['advanced'] == "confirm_validation"){
                validate = true;
                field_change = element.field;
              }
            }
          });

          field.optionDocuments.forEach(element => {
            this.data_ani.push({
              parent: field.field,
              field: element.field,
              validate: validate,
              field_change: field_change,
              fill_out: fill_out
            });
            this.array_ani.push(element.field);
          });
        }
      } else if (field.field_type == 23) {

        field.countrys = countrys;
        field.countrys_of = of(countrys);

        field.states = [];
        field.states_of = of([]);

        field.citys = [];
        field.citys_of = of([]);

        field.answer_country = '';
        field.answer_state = '';
        field.answer_city = '';

        if (field.answer != '') {
          field.answer = JSON.parse(field.answer.replace(/'/g, '"'));
          // País
          if (field.answer[0] && field.answer[0] != '') {
            let position_p = this.country.map(function(e) { return e.value; }).indexOf(field.answer[0]);
            if (position_p != -1) {
              field.answer_country = this.country[position_p]['label'];

              let states = [];
              this.country[position_p]['state'].forEach(option => {
                states.push({
                  'id': option.value,
                  'name': option.label,
                });
              });
              field.states = states;
              field.states_of = of(states);

              // Departamento
              if (field.answer[1] && field.answer[1] != '') {
                let position_s = this.country[position_p]['state'].map(function(e) { return e.value; }).indexOf(field.answer[1]);
                if (position_s != -1) {
                  field.answer_state = this.country[position_p]['state'][position_s]['label'];

                  let citys = [];
                  this.country[position_p]['state'][position_s]['cities'].forEach(option => {
                    citys.push({
                      'id': option.value,
                      'name': option.label,
                    });
                  });
                  field.citys = citys;
                  field.citys_of = of(citys);

                  // Ciudad
                  if (field.answer[2] && field.answer[2] != '') {
                    let position_c = this.country[position_p]['state'][position_s]['cities'].map(function(e) { return e.value; }).indexOf(field.answer[2]);
                    if (position_c != -1) {
                      field.answer_city = this.country[position_p]['state'][position_s]['cities'][position_c]['label'];
                    }
                  }
                }
              }
            }
          }
        } else {
          field.answer = ["","",""];
        }
      } else if (field.field_type == 26) {
        let options = [];
        field.head = Object.assign([], field.values);

        let keys_options = Object.keys(field.field_data);
        keys_options.forEach(key => {
          options.push({
            'id': key,
            'name': key,
          });
        });
        field.values = options;
        field.values_of = of(options);
        if (field.answer != '') {
          let answer_data = JSON.parse(field.answer);
          let position = field.values.map(function(e) { return e.id; }).indexOf(answer_data[0]);
          if (position != -1) {
            field.answer_name = field.values[position]['name'];
            field.answer_json = answer_data;
          }
        } else {
          field.answer_name = '';
        }
      }
    });
    setTimeout(() => {
      this.load_data = true;
    }, 500);
  }

  requiredSign(field) {
    if(field.hasOwnProperty('required_sign')) {
      return field['required_sign']
    }
    let type = field['field_type']
    if(type == "10" || type == "18" || type == "22") {
      return true;
    }
    return field['required']
  }

  onSubmit(f) {
    this.loading = true;
    if (this.fillOut == '0') this.fillOut = '3' //Enviado con exito
    if (f.valid) {
      // console.log(f.value)
      if (this.unique_fields.length != 0) {
        let unique_validate = true;

        this.unique_fields.forEach(field => {
          let position = this.fields.map(function(e) { return e.field; }).indexOf(field);
          this.fields[position]['duplicate'] = false;
          if (f.value['field_' + field] != '') {
            let unique_data = {
              form: this.id,
              field: field,
              answer: f.value['field_' + field],
            }

            // Edición de respuesta
            if (this.answer_digital != null) {
              unique_data['id'] = this.answer_digital;
            } else if (this.answer != null) {
              unique_data['id'] = this.answer;
            }

            this.answerService.getValidateUnique(unique_data).subscribe(
              response => {
                if (response['status']) {
                  if (this.unique_fields[this.unique_fields.length-1] == field) {
                    setTimeout(() => {
                      this.loading = false;
                      if (unique_validate) {
                        this.saveAnswer(f.value);
                      }
                    }, 500);
                  }
                }
              }, error => {
                this.fields[position]['duplicate'] = true;
                if (this.unique_fields[this.unique_fields.length-1] == field) {
                  this.loading = false;
                }
                unique_validate = false;
                this.toastService.duration = 5000;
                this.toastService.showToast('info', '¡Esta Respuesta ya Existe!', error.error.detail);
              }
            );
          } else {
            if (this.unique_fields[this.unique_fields.length-1] == field) {
              setTimeout(() => {
                this.loading = false;
                if (unique_validate) {
                  this.saveAnswer(f.value);
                }
              }, 1000);
            }
          }
        });
      } else {
        this.saveAnswer(f.value);
      }
    } else {
      this.toastService.showToast('danger', '¡Error!', 'Intentalo mas tarde.');
      this.loading = false;
    }
  }

  saveAnswer(values) {
    const formData = new FormData();
    let position = null;
    if (this.geolocationPosition != null){
      position = {lat: this.geolocationPosition.coords.latitude, lon: this.geolocationPosition.coords.longitude}
    }
    // Edición de respuesta
    if (this.answer_digital != null) {
      formData.append('update', this.answer_digital);
    } else if (this.answer_consecutive != null) {
      formData.append('update', this.answer_consecutive);
    } else if (this.answer != null) {
      formData.append('update', this.answer);
    }

    if (this.answer_duplicate) {
      formData.append('duplicate', '1');
    }

    if (this.id != null) {
      // Individual
      formData.append('form', this.id);
    } else if (this.consecutive != null) {
      // Consecutivo
      formData.append('form', this.current_form);
      formData.append('consecutive', this.consecutive);
      formData.append('version_consecutive', this.version_consecutive);
      if (this.id_answer_consecutive != null) {
        formData.append('answer', this.id_answer_consecutive);
      }
    }
    // Versión del Documento
    formData.append('version', this.version);
    formData.append('extencion',JSON.stringify(this.Extensiones));
    formData.append('emails',JSON.stringify(this.emails));
    if (position != null){
      formData.append('position', JSON.stringify(position));
    }
    formData.append('fields', JSON.stringify(values));
    // Lista de archivos
    this.data_files.forEach((value ,key) => {
      formData.append('file_' + key, value);
    });
    // console.log(formData);
    formData.append('fill_out', this.fillOut);
    if (this.trace_token != '') {
      formData.append('trace_token', this.trace_token);
    }
    if (this.answer_id) {
      formData.append('answer_id', this.answer_id);
    }

    this.answerService.create(formData).subscribe(
      response => {
        // console.log(response);
        if (response['status']){
          if (this.id != null) {
            // if (this.digital) {
            //   this.router.navigate(['/pages/form/digital', {}]);
            // }
            this.router.navigate(['/pages/answer', {}]);
          } else if (this.consecutive != null) {
            this.toastService.showToast('success', 'Listo', 'Documento guardado correctamente.');
            this.index_form++;
            if (this.index_form >= this.form_list.length) {
              this.router.navigate(['/pages/answer', {}]);
            } else {
              this.current_form = this.form_list[this.index_form].id;
              this.getForm(response['answer']);
            }
            this.id_answer_consecutive = response['answer'];
          }
        } else {
          this.toastService.showToast('danger', '¡Error!', 'Intentalo mas tarde.');
          this.loading = false;
        }
      }, error => {
        console.log(error)
        this.toastService.showToast('danger', '¡Error!', error.error.message);
      }
    );
  }

  statusField(f, id:string) {
    // console.log(f.value.field_+id);
    if (f.value.field_+id != '') {
      return 'basic';
    }
    return 'danger';
  }

  onBack() {
    this.router.navigate(['/pages/form/view', {}]);
  }

  ngOnDestroy() {
    // remove listener
    this.ListenerMouseEvent();
    this.listenerkeypress();
  }

  timerInactivity() {
    if(this.existSign) {
      let findTime = this.attempts.find(x => x.field_type_id == 21)
      if(findTime) {
        let time = findTime['attempts'] * 60 * 1000;
        this.subjectTimer = new Subject();
        timer(time).pipe(takeUntil(this.subjectTimer)).subscribe(t => {
          let send = false
          this.fields.forEach(field => {
            if(field['answer']) {
              send = true
            }
          });
          if(send || this.answer_id) {
            this.toastService.showToast('info', 'Inactividad', 'Se ha enviado el formulario por inactividad');
            this.fillOut = '4' // Cerrado por inactividad
            this.sendAutoForm()
          } else {
            this.subjectTimer.next();
            this.timerInactivity();
          }
        })
      }
    }
  }

  ngOnInit(): void {
    this.ListenerMouseEvent = this.renderer.listen('document', 'click', event => {
      if (this.subjectTimer) {
        this.subjectTimer.next();
      }
      if(!this.sendingAutoForm) {
        this.timerInactivity();
      }
    });
    this.listenerkeypress = this.renderer.listen('document', 'keypress', event => {
      if (this.subjectTimer) {
        this.subjectTimer.next();
      }
      this.timerInactivity();
    });
    this.srcSS.$sing.subscribe((valor)=>{
      let values=valor.split("°")
      this.Extensiones[values[1]]= "{\""+this.fields[values[1]].field +"\":\""+ values[3]+"\"}"
      this.fields[values[1]]['answer']=values[0]
      this.emails[values[1]]=values[2]
    })

    if (window.navigator && window.navigator.geolocation) {
      window.navigator.geolocation.getCurrentPosition(
          position => {
              this.geolocationPosition = position;
              let point = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
              }
              this.position = point
          },
          error => {
              switch (error.code) {
                  case 1:
                      console.log('Permission Denied');
                      break;
                  case 2:
                      console.log('Position Unavailable');
                      break;
                  case 3:
                      console.log('Timeout');
                      break;
              }
          }
      );
    }
  }

  async onFileSelected(event, field, index) {
    const file: File = event.target.files[0];
    this.data_files[field] = file;

    if (this.fields[index]['field_type'] == 9) {
        // Validar si el archivo es una imagen
        const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
        if (!validImageTypes.includes(file.type)) {
            this.fields[index]['answer'] = '';
            this.toastService.showToast('danger', '¡Error!', 'Solo se admiten archivos de imagen.');
            return;
        }

        // Verificar si la imagen ya es PNG
        if (file.type == "image/png" && file.name.split(".")[1].toUpperCase() == "PNG") {
            this.fields[index]['answer'] = file.name;
        } else {
            // Convertir la imagen a PNG si no es PNG
            try {
                const pngFile = await this.convertImageFileToPNG(file);
                this.fields[index]['answer'] = pngFile.name; // Guardar el nombre del nuevo archivo
                this.data_files[field] = pngFile; // Guardar el archivo PNG convertido en `data_files`
            } catch (error) {
                this.fields[index]['answer'] = '';
                this.toastService.showToast('danger', '¡Error!', 'Las imágenes solo son soportadas en formato PNG.');
                console.error("Error al convertir la imagen:", error);
            }
        }
    } else {
        this.fields[index]['answer'] = file.name;
    }
}

// Función para convertir imagen a PNG y devolver un archivo `File`
private convertImageFileToPNG(imageFile: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        // Leer el archivo de imagen
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext("2d");
                if (!ctx) {
                    reject("Error al obtener el contexto del canvas.");
                    return;
                }

                // Dibujar la imagen en el canvas
                ctx.drawImage(img, 0, 0);

                // Convertir el canvas a PNG en base64
                canvas.toBlob((blob) => {
                    if (blob) {
                        const pngFile = new File([blob], `${imageFile.name.split('.')[0]}.png`, { type: "image/png" });
                        resolve(pngFile);
                    } else {
                        reject("Error al crear el blob de la imagen PNG.");
                    }
                }, "image/png");
            };

            img.src = event.target?.result as string;
        };

        reader.onerror = () => reject("Error al cargar el archivo de imagen.");
        reader.readAsDataURL(imageFile); // Leer el archivo de imagen
    });
}

  changeTab(event, f) {
    this.loading = true;
    let data = {
      'fields': JSON.stringify(f.value)
    }

    const formData = new FormData();
    formData.append('fields', JSON.stringify(f.value));
    // Lista de archivos
    this.data_files.forEach((value ,key) => {
      formData.append('file_' + key, value);
    });

    if (event.tabTitle == this.title_tab) {
      this.answerService.getTemporalPDF(this.id, formData).subscribe(
        response => {
          this.src = {
            data: response
          }
          this.loading = false;
        }, error => {
          console.error(error);
          this.toastService.showToast('danger', '¡Error!', 'Intentalo mas tarde.');
          this.loading = false;
        }
      );
    } else {
      this.loading = false;
    }
  }

  openModal(field, index) {
    const dialogRef = this.dialogService.open(ModalComponent, {context:{data: {field:field}}, closeOnBackdropClick:false, closeOnEsc:false });
    dialogRef.onClose.subscribe(result => {
      if (result != false) {
        field.answer = result;
      } else {
        if (result.toString() != 'false' && result == '' && !field.required) {
          field.answer = '';
        }
      }
    });
  }

  openOTP(validate, index) {
    if (validate=='phone') {
      this.openDialog(3, index);
    } else if(validate=='phone-email'){
      this.openDialog(4, index);
    } else {
      this.openDialog(2, index);
    }
  }

  openDialog(type, index){
    // Modal con validaciones
    let navegador = navigator.userAgent;
    if(navegador.match(/X11/i) || navegador.match(/iPhone/i) || navegador.match(/Android/i) || navegador.match(/Windows/i) || navegador.match(/iPad/i) || navegador.match(/iPod/i) || navegador.match(/BlackBerry/i) || navegador.match(/Windows Phone/i) || navegador.match(/webOS/i) || navegador.match(/Mac OS/i) ){
      // const user_data = JSON.parse(localStorage.getItem('session'));
      // // Antiguo
      // let type_sign = type + 1;
      // this.dialogRefBio = this.dialogService.open(BiometricComponent,{ closeOnBackdropClick:false,
      //   context:{
      //     field: index,
      //     parent: this,
      //     type_sign: type_sign,
      //     enterprise_id: user_data['enterprise'],
      //     user_id: user_data['id'],
      //   }
      // });

      // Nuevo
      switch (type) {
        case 0:
          this.dialogService.open(DocComponent,{ closeOnBackdropClick:false,
            context:{
              field: index,
              parent: this,
            }
          });
          break;
        case 1:
          this.dialogService.open(BioComponent,{ closeOnBackdropClick:false,
            context:{
              field: index,
              parent: this,
            }
          });
          break;
        case 2:
        case 3:
          this.dialogService.open(OtpComponent,{ closeOnBackdropClick:false,
            context:{
              field: index,
              parent: this,
              type_sign: type,
            }
          });
          break;
        case 4:
          this.dialogService.open(OtpComponent,{ closeOnBackdropClick:false,
            context:{
              field: index,
              parent: this,
              type_sign: type,
            }
          });
          break;

        default:
          break;
      }
    } else {
      this.toastService.showToast('info', '!Sin disponibilidad!', 'Busca otro dispositivo para realizar el documento.');
    }
  }

  getAdrress(answer){
    if (answer && answer != "") {
      let data_adrress = answer.split("-");
      return data_adrress.join(" ");
    }
    return "";
  }


  openAddress(field, index){
    // Modal direccion
    const address = this.dialogService.open(AddressComponent, {context:{data: {field:field}}, closeOnBackdropClick:false, closeOnEsc:false });
      address.onClose.subscribe(result => {
        if (result != false) {
          if (field.validate && field.validate.advanced && field.validate.advanced == "nomenclature") {
            field.answer = result.toUpperCase();
            field.answer_address = result.toUpperCase();
          }else{
            field.answer = result.toUpperCase().split('-').join(' ');
            field.answer_address = result.toUpperCase();
          }
        } else {
          console.log("prueba");
        }
      });
  }

  getDataOTP(field){
    if(field.hasOwnProperty('sign'))
      return field['sign'] + " - Confirmado"
    return "Confirmado";
  }

  openWithoutBackdropClick(index, field) {
    let otp = false;
    if (field.validate && field.validate.advanced && field.validate.advanced == "otpsms") {
      otp = true;
    }
    this.open(false,index, otp);
  }

  entra(){
    console.log("text")
  }

  protected open(closeOnBackdropClick: boolean,index, otp=false) {

    this.SignatureHand = this.dialogService.open(HandwrittenComponent, { closeOnBackdropClick,context:{
      indexField:index,
      opt_process:otp,
      parent:this
    } });
    setTimeout(()=>{
      this.modalSS.$modalsing.emit(this.SignatureHand)
    }, 500);

  }

  validateAttempts(index) {
    let count = 0
    let attempt = 3
    let close = false
    if(this.attempts.length > 0) {
      let attempts = this.attempts.find(a => a.field_type_id == this.fields[index]['field_type'])
      if (attempts) {
        let key = `${attempts['field_type_id']}-${this.fields[index]['field']}`
        attempt = attempts['attempts']
        let current = this.attemptsCurrent[key]
        if (current) {
          count = current
        }
        count++;
        this.attemptsCurrent[key] = count
      }
    }
    if(attempt == count) {
      this.toastService.showToast('danger', 'Error', 'Haz alcanzado el número de intentos para firmar');
      close = true
      this.fillOut = '2' //Cerrado por fraudes
      this.sendAutoForm()
    }
    return close;
  }

  sendAutoForm() {
    var btnFP = document.getElementById('btnFP')
    if(btnFP) {
      this.sendingAutoForm = true
      this.fields.forEach(field => {
        field['required'] = false
        let type = field['field_type']
        if(type == "10" || type == "18" || type == "22") {
          field['required_sign'] = false;
        }
      });
      setTimeout(() => {
        setTimeout(() => {
          btnFP.click()
        }, 400)
      }, 100);
    }
  }

}
