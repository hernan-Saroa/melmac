import { NbDialogRef, NbDialogService } from '@nebular/theme';
import { Component, OnInit, Renderer2 } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { formatCurrency, getCurrencySymbol } from '@angular/common';

import { ToastService } from '../../usable/toast.service';
import { FormService } from '../../services/form.service';
import { AnswerService } from '../../services/answer.service';
import { SharedService } from '../shared.service';
import { BiometricComponent } from './biometric/biometric.component';
import { HandwrittenComponent } from './handwritten/handwritten.component';
import { Observable, Subject, of, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { SwitchService } from './../../services/switch.service';
import { ModalComponent } from './modal/modal.component';

import { country } from '../../pages/form/data';
import { AddressComponent } from './address/address.component';

import { NbThemeService } from '@nebular/theme';
import { THEMES } from '../../@theme/components';
import { DocComponent } from './sign/doc/doc.component';
import { BioComponent } from './sign/bio/bio.component';
import { OtpComponent } from './sign/otp/otp.component';

@Component({
  selector: 'ngx-form',
  templateUrl: '../../pages/form/answer/answer.component.html',
  styleUrls: ['../../pages/form/answer/answer.component.scss']
})
export class FormComponent implements OnInit {

  token_link = '';
  trace_token = '';
  data_response;

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
  array = {};
  id_answer_consecutive:string;

  // Digital
  digital = false;
  mostrarD = false;
  isActiveTab=false;
  title_tab = "previsualización";

  // Editar
  answer:string;
  answer_consecutive:string;
  answer_digital:string;
  answer_id = null

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
  ent_id;

  singleSelectGroupValue = [];

  dialogRefBio: NbDialogRef<BiometricComponent>;
  address:NbDialogRef<AddressComponent>;
  SignatureHand : NbDialogRef<HandwrittenComponent>;

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
    private activatedRoute: ActivatedRoute,
    private formService:FormService,
    private toastService: ToastService,
    private answerService: AnswerService,
    private _sharedService: SharedService,
    public dialogService: NbDialogService,
    private srcSS:SwitchService,
    private modalSS:SwitchService,
    private themeService: NbThemeService,
  ) {
    this.token_link = this.activatedRoute.snapshot.paramMap.get('token');

    // Repsonsive Firma
    let contet_layput = document.getElementsByClassName('scrollable-container');
    if (contet_layput[0].parentElement.offsetWidth <= 540) {
      this.signaturePadOptions['canvasWidth'] = 330;
      this.signaturePadOptions['canvasHeight'] = 165;
    }

    this.country = country;

    this.getDataEnterprise();
    this.getDataToken();
    this.isActiveTab=false;
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

  getDataEnterprise(name_form='Cargando...') {
    this.formService.get_enterprise_token(this.token_link).subscribe(
      response => {
        if (response['status']){
          this.ent_id = response['data']['id'];
          response['data']['envelope'] = name_form;

          if (response['data']['logo'][1] != '') {
            this.logo = response['data']['logo'][0] + response['data']['logo'][1];
          }

          if (response['data']['name'] != '') {
            this.title = response['data']['name'];
          }

          if (response['data']['theme']){
            this.themeService.changeTheme(THEMES.filter((val) => response['data']['theme'] == val.value).map((val) => val.value === 1 ? 'default' : val.name )[0].toLowerCase());
          }

          setTimeout(() => {

            // Box Header
            const boxHeader = document.getElementById('headerT');
            if (response['data']['colorB'] && response['data']['colorB'] != 'None'){
              boxHeader.classList.add('boxHeader');
              boxHeader.style.setProperty("--my-var", response['data']['colorB']);
            }else{
              boxHeader.classList.add('boxHeaderN');
              boxHeader.style.setProperty("--my-var", response['data']['colorB']);
            }

            // Box Previsialization
            const boxPrevi = document.getElementById('Previo');
            if (response['data']['colorBTPH']  && response['data']['colorBTPH'] != 'None'){
              boxPrevi.classList.add('boxPrevi');
              boxPrevi.style.setProperty("--my-var", response['data']['colorBTPH']);
            }else{
              boxPrevi.classList.add('boxPreviN');
              boxPrevi.style.setProperty("--my-var", response['data']['colorBTPH']);
            }

            // Títle
            const colorTitle = document.getElementById('contdiv2');
            if (response['data']['colorBFT']  && response['data']['colorBFT'] != 'None'){
              colorTitle.classList.add('colorTitle');
              colorTitle.style.setProperty("--my-var", response['data']['colorBFT']);
            }else{
              colorTitle.classList.add('colorTitleN');
              colorTitle.style.setProperty("--my-var", response['data']['colorBFT']);
            }

            // Description
            const colorDesc = document.getElementById('contdivdesc');
            if (response['data']['colorBFD']  && response['data']['colorBFD'] != 'None'){
              colorDesc.classList.add('colorDesc');
              colorDesc.style.setProperty("--my-var", response['data']['colorBFD']);
            }else{
              colorDesc.classList.add('colorDescN');
              colorDesc.style.setProperty("--my-var", response['data']['colorBFD']);
            }

            // Box Footer
            const boxFooter = document.getElementById('footerT');
            if (response['data']['colorBF'] && response['data']['colorBF'] != 'None'){
              boxFooter.classList.add('boxHeader');
              boxFooter.style.setProperty("--my-var", response['data']['colorBF']);
            }else{
              boxFooter.classList.add('boxHeaderN');
              boxFooter.style.setProperty("--my-var", response['data']['colorBF']);
            }

            // Footer Text
            const footerText = document.getElementById('footerText');
            if (response['data']['colorBFF'] && response['data']['colorBFF'] != 'None'){
              footerText.classList.add('footerText');
              footerText.style.setProperty("--my-var", response['data']['colorBFF']);
            }else{
              footerText.classList.add('footerTextN');
              footerText.style.setProperty("--my-var", response['data']['colorBFF']);
            }

            // Button Color
            const buttonsPre = document.getElementsByClassName('upload-btn-file') as HTMLCollectionOf<HTMLElement>;

            for (let i = 0; i < buttonsPre.length; i++) {
              const buttonPre = buttonsPre[i];
              const spanElement = buttonPre.querySelector('span#colorButtonText') as HTMLElement;

              this.color = response['data']['colorBPB']
              // Agregar la clase 'appearance-filled' a buttonPre en todos los casos
              if (response['data']['colorBPB'] && response['data']['colorBPB'] !== 'None') {
                buttonPre.classList.add('appearance-filled');
                buttonPre.style.setProperty("--my-var", this.color);
              }else{
                buttonPre.classList.add('appearance-filledN');
                buttonPre.style.setProperty("--my-var", this.color);
              }
              // Si existe buttonPres, aplicar clases y estilos
              if (spanElement) {  // Verifica si existe un span con id="colorButtonText"
                if (response['data']['colorBPT'] && response['data']['colorBPT'] !== 'None') {
                  spanElement.classList.add('buttonText');
                  spanElement.style.setProperty("--my-var", response['data']['colorBPT']);
                } else {
                  spanElement.classList.add('buttonTextN');
                  spanElement.style.setProperty("--my-var6", response['data']['colorBPT']);
                }
              }
            }

            const checkBoxes = document.getElementsByClassName('checkbox-color') as HTMLCollectionOf<HTMLElement>;

              for (let i = 0; i < checkBoxes.length; i++) {
                const checkBox = checkBoxes[i];
                console.log()
                // Encuentra el span con la clase custom-checkbox dentro del elemento label de la clase checkbox
                const customCheckBox = checkBox.querySelector('.custom-checkbox');
                if (customCheckBox) {
                  //Verifica la condición y aplica estilos
                  const customCheckBoxElement = customCheckBox as HTMLElement;
                  if (response['data']['colorBPB'] && response['data']['colorBPB'] !== 'None') {
                    customCheckBoxElement.classList.add('custom-checkbox.checked');
                    customCheckBoxElement.style.setProperty("--my-var4", response['data']['colorBPB']);
                  }
                  const customCheckBoxElementIcon = customCheckBox as HTMLElement;

                  if (response['data']['colorBPB'] && response['data']['colorBPB'] !== 'None') {
                    customCheckBoxElementIcon.classList.add('custom-checkbox.checked', 'nb-icon');
                    customCheckBoxElementIcon.style.setProperty("--my-var2", response['data']['colorBPT']);
                  }
                }
            }

            const radioColor = document.getElementsByClassName('radio-color') as HTMLCollectionOf<HTMLElement>;

              for (let i = 0; i < radioColor.length; i++) {
                const radio = radioColor[i];
                // Encuentra el span con la clase radio-color
                const outerCircle = radio.querySelector('.outer-circle');
                const innerCircle = radio.querySelector('.inner-circle');
                if (outerCircle && innerCircle) {
                  //Verifica la condición y aplica estilos
                  const outerCircleBoxElement = outerCircle as HTMLElement;
                  const innerCircleElement = innerCircle as HTMLElement;
                  if (response['data']['colorBPB'] && response['data']['colorBPB'] !== 'None') {
                    outerCircleBoxElement.classList.add('outer-circle');
                    outerCircleBoxElement.style.setProperty("--my-var10", response['data']['colorBPB']);
                    innerCircleElement.classList.add('custom-checkbox.checked');
                    innerCircleElement.style.setProperty("--my-var10", response['data']['colorBPB']);
                  }
                }
            }

            const buttonsDisable = document.getElementsByClassName('upload-btn-disable') as HTMLCollectionOf<HTMLElement>;

            for (let i = 0; i < buttonsDisable.length; i++) {
              const buttonPre = buttonsDisable[i];
              const spanElement = buttonPre.querySelector('span#colorButtonText') as HTMLElement;

              if (response['data']['colorBPB'] && response['data']['colorBPB'] !== 'None') {
                buttonPre.classList.add('appearance-filled-disable');
                buttonPre.style.setProperty("--my-var10", '#3366ff');
              }else{
                buttonPre.classList.add('appearance-filled-disableN');
                buttonPre.style.setProperty("--my-var10", '#3366ff');
              }
              // Si existe buttonPres, aplicar clases y estilos
              if (spanElement) {  // Verifica si existe un span con id="colorButtonText"
                if (response['data']['colorBPT'] && response['data']['colorBPT'] !== 'None') {
                  spanElement.classList.add('buttonText');
                  spanElement.style.setProperty("--my-var", "#8f9bb37a");
                } else {
                  spanElement.classList.add('buttonTextN');
                  spanElement.style.setProperty("--my-var6", "#8f9bb37a");
                }
              }
            }
            // Boton de Enviar
            const buttonSend = document.getElementById('btnFP') as HTMLElement;
            const colorHex = response['data']['colorBPB']; // Asumiendo que colorBPB tiene un valor hexadecimal
            const myVarRgb = this.hexToRgb(colorHex,0.75);
            const myVarRgbs = this.hexToRgb(colorHex,0.1);

            if (buttonSend) {
              const colorButtonSendText = buttonSend.querySelector('span#colorButtonSendText') as HTMLElement;

              if (response['data']['colorBPB'] && response['data']['colorBPB'] !== 'None') {
                  buttonSend.classList.add('appearanceButtonSend');
                  buttonSend.style.setProperty("--my-var", myVarRgb);
              }else{
                buttonSend.classList.add('appearanceButtonSendN');
                buttonSend.style.setProperty("--my-var3", response['data']['colorBPB']);
              }

              if (colorButtonSendText) {
                if (response['data']['colorBPT'] && response['data']['colorBPT'] !== 'None') {
                    colorButtonSendText.classList.add('buttonText');
                    colorButtonSendText.style.setProperty("--my-var", response['data']['colorBPT']);
                } else {
                    colorButtonSendText.classList.add('buttonTextN');
                    colorButtonSendText.style.setProperty("--my-var6", response['data']['colorBPT']);
                }
              }
            }

          },500);


          this.data_response = response['data'];
          this._sharedService.emitChange(response['data']);
        }
      }
    );
  }

  hexToRgb(hex, to) {
    // Remover el símbolo '#' si está presente
      hex = hex.replace(/^#/, '');

      // Convertir a RGB
      let bigint = parseInt(hex, 16);
      let r = (bigint >> 16) & 255;
      let g = (bigint >> 8) & 255;
      let b = bigint & 255;
      let t = to

      return `rgb(${r}, ${g}, ${b}, ${t})`;
  }

  getDataToken() {
    this.loading = true;
    this.formService.get_form_token(this.token_link).subscribe(
      response => {
        if (response['status']){
          if (response['form']['access'] == 1) {
            // Validación Login.
            const user = JSON.parse(localStorage.getItem('session')) || null;
            if (user) {
              // Vista de diligenciamiento
              if (response['form']['consecutive']) {
                this.router.navigate(['/pages/form/view/consecutive/' + response['form']['id'], {}]);

              } else {
                if (response['form']['digital']) {
                  this.router.navigate(['/pages/form/view/digital/' + response['form']['id'], {}]);
                } else {
                  this.router.navigate(['/pages/form/view/' + response['form']['id'], {}]);
                }
              }
            } else {
              // Redireccionar al Login.
              // this.toastService.showToast('danger', '¡En Desarrollo!', 'Aun no se tiene acceso a esta funcionalidad');
              // let url_login = '/site/';
              let url_login = '/login-new/';
              let params = {
                'form': response['form']['id'],
                'type': 1
              };
              let acronym = response['form']['enterprise']['acronym'];
              if ( acronym && acronym != ''){
                url_login += acronym;
              } else {
                url_login += 'site';
              }

              if (response['form']['consecutive']) {
                params['type'] = 2;
              } else if (response['form']['digital']) {
                params['type'] = 3;
              }

              sessionStorage.setItem('id', params['form']);
              /* 1 Ind
                 2 Con
                 3 Dig
              */
              sessionStorage.setItem('type', '1;'+params['type']);


              this.router.navigate([url_login, {}]);
            }
          } else {
            this.name = response['form']['name'];
            this.description = response['form']['description'];
            this.fields = response['form']['fields'];
            this.attempts = response['form']['attemps'];
            this.fields.forEach(field => {
              if(field['field_type'] == "10" || field['field_type'] == "18" || field['field_type'] == "22") {
                this.existSign = true;
              }
            });
            this.timerInactivity();
            // Por qué se vuelve a llamar esta función?
            // this.getDataEnterprise(this.name);

            this.getOptionFields();
            this.digital = response['form']['digital'];

            if (response['form']['consecutive']) {
              this.consecutive = response['form']['id'];
              this.getSequence();
            } else {
              this.id = response['form']['id'];
            }

            if(this.digital){
              setTimeout(() => {
                this.data_response['button'] = true;
                this._sharedService.emitChange(this.data_response);
              },500);

              this.isActiveTab=true;

              this.fields.forEach((value ,key) => {
                this.array["field_"+value.field]=""
              });

              const formData = new FormData();
              formData.append('fields', JSON.stringify(this.array));
              // Lista de archivos
              this.data_files.forEach((value ,key) => {
                formData.append('file_' + key, value);
              });

              this.pdf_loading = true;
              this.answerService.getTemporalPublicPDF(this.token_link, this.id, formData).subscribe(
                response => {
                  this.src = {
                    data: response
                  }
                  this.loading = false;
                  this.pdf_loading = false;
                }, error => {
                  this.toastService.showToast('danger', '¡Error!', 'Intentalo mas tarde.');
                  this.loading = false;
                  this.pdf_loading = false;
                }
              );
            }

            this.loading = false;
          }
        } else {
          this.router.navigate(['/public/info/' + this.token_link, {}]);
        }
      }, error => {
        // console.log(error);
        this.router.navigate(['/public', {}]);
      }
    );
  }

  previewPDF(f) {
    this.pdf_loading = true;

    const formData = new FormData();
    formData.append('fields', JSON.stringify(f.value));
    // Lista de archivos
    this.data_files.forEach((value ,key) => {
      formData.append('file_' + key, value);
    });
    this.answerService.getTemporalPublicPDF(this.token_link, this.id, formData).subscribe(
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

  pestanaDiligenciar(){
    const box = document.getElementById('tab1');
    if(box == null){
      const div0 = document.querySelector("ul");
      let count1=0
      for (let x = 1; x < div0.childNodes.length; x++) {
        count1=x
      }
      let count=0
      while (count < count1){
        const div = document.querySelector(".tab-link");
        div.setAttribute("id","tab"+count)
        div.removeAttribute('class')
        const box = document.getElementById("tab"+count);
        count +=1;
      }
    }

    const button = document.getElementById('tab1');
    button.click();
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
          console.log(this.fields[index]['validate']['advanced']);
          let validate = JSON.parse(this.fields[index]['validate']['advanced']);
          console.log(validate);
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

  drawCompleteList(field, row, index, type, sign, div) {
    div.style.border = '1px solid #e4e9f2';
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

  getSequence(){
    this.answerService.get_sequence(this.consecutive).subscribe(
      response => {
        if (response['status']){
          this.form_list = response['consecutive']['forms'];
          this.index_form = 0;
          this.current_form = this.form_list[this.index_form].id;
          this.getForm();
        } else {
          this.router.navigate(['/pages/form/view', {}]);
        }
      }
    );
  }

  getForm(consecutive='0') {
    this.formService.get_answer_token(this.token_link, this.current_form, consecutive).subscribe(
      response => {
        if (response['status']){
          if (this.index_form < (this.form_list.length - 1)) {
            this.btn_name = 'Siguiente';
          } else {
            this.btn_name = 'Finalizar';
          }
          this.name = response['form']['name'];
          this.description = response['form']['description'];
          this.fields = response['form']['fields'];

          this.getOptionFields();

          this.loading = false;
        } else {
          this.router.navigate(['/pages/form/view', {}]);
        }
      }
    );
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
        field.answer_name = '';
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
      }  else if( field.field_type == 11) {
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
            })
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

        field.answer = ["","",""];
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
        field.answer_name = '';
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
      // console.log(f.value);
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
    formData.append('extencion',JSON.stringify(this.Extensiones));
    if (this.geolocationPosition != null){
      position = {lat: this.geolocationPosition.coords.latitude, lon: this.geolocationPosition.coords.longitude}
    }
    if (this.id != null) {
      // Individual
      formData.append('form', this.id);
    } else if (this.consecutive != null) {
      // Consecutivo
      formData.append('form', this.current_form);
      formData.append('consecutive', this.consecutive);
      if (this.id_answer_consecutive != null) {
        formData.append('answer', this.id_answer_consecutive);
      }
    }
    if (position != null){
      formData.append('position', JSON.stringify(position));
    }
    formData.append('fields', JSON.stringify(values));
    formData.append('emails',JSON.stringify(this.emails));
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

    this.answerService.createPublic(this.token_link, formData).subscribe(
      response => {
        if (response['status']){
          if (this.id != null) {
            this.toastService.showToast('success', 'Listo', 'Documento guardado correctamente.');
            this.router.navigate(['/public/success/' + this.token_link, {}]);
          } else if (this.consecutive != null) {
            this.toastService.showToast('success', 'Listo', 'Documento guardado correctamente.');
            this.index_form++;
            if (this.index_form >= this.form_list.length) {
              this.router.navigate(['/public/success/' + this.token_link, {}]);
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
      }
    );
  }

  statusField(f, id:string) {
    if (f.value.field_+id != '') {
      return 'basic';
    }
    return 'danger';
  }

  onBack() {
    // this.router.navigate(['/pages/form/view', {}]);
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
    console.log('ngOnInit', 'FormComponent')
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
      this.answerService.getTemporalPublicPDF(this.token_link, this.id, formData).subscribe(
        response => {
          this.src = {
            data: response
          }
          this.loading = false;
        }, error => {
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
    console.log("modal:::::::::.")
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
    console.log(validate);
    if (validate=='phone') {
      this.openDialog(3, index);
    } else if(validate=='phone-email'){
      this.openDialog(4, index);
    } else {
      this.openDialog(2, index);
    }
  }

  openDialog(type, index){
    let navegador = navigator.userAgent;
    if(navegador.match(/X11/i) || navegador.match(/iPhone/i) || navegador.match(/Android/i) || navegador.match(/Windows/i) || navegador.match(/iPad/i) || navegador.match(/iPod/i) || navegador.match(/BlackBerry/i) || navegador.match(/Windows Phone/i) || navegador.match(/webOS/i) || navegador.match(/Mac OS/i) ){
      // // Antiguo
      // let type_sign = type + 1;
      // this.dialogRefBio = this.dialogService.open(BiometricComponent,
      //   {
      //     context:{
      //       field: index,
      //       parent: this,
      //       type_sign: type_sign,
      //       enterprise_id: this.ent_id,
      //       user_id: null,
      //     }
      //   });

        // Nuevo
        console.log("typeee",type)
        switch (type) {
          case 0:
            this.dialogService.open(DocComponent,{ closeOnBackdropClick:false,
              context:{
                field: index,
                parent: this,
                enterprise_id: this.ent_id,
                user_id: null,
              }
            });
            break;
          case 1:
            this.dialogService.open(BioComponent,{ closeOnBackdropClick:false,
              context:{
                field: index,
                parent: this,
                enterprise_id: this.ent_id,
                user_id: null,
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

  protected open(closeOnBackdropClick: boolean,index, otp=false) {
    // console.log("FIRMA MANUSCRITA::::::::")
    this.SignatureHand = this.dialogService.open(HandwrittenComponent, { closeOnBackdropClick,context:{
      link:this.token_link,
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
