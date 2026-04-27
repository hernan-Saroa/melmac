import { Component, OnDestroy, OnInit } from "@angular/core";
import { HandwrittenComponent } from "./handwritten/handwritten.component";
import { NbDialogRef, NbDialogService, NbThemeService } from "@nebular/theme";
import { Subscription } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { formatCurrency, getCurrencySymbol } from '@angular/common';

import { EnvelopeService } from "../../services/envelope.service";
import { SwitchService } from "../../services/switch.service";
import { SharedService } from "../shared.service";
import { ToastService } from "../../usable/toast.service";
import { AnswerService } from "../../services/answer.service";
import { ModalComponent } from "../modal/modal.component";
import { hexToCSSFilter } from "hex-to-css-filter";

import { THEMES } from '../../@theme/components';
import { DocComponent } from "../form/sign/doc/doc.component";
import { OtpComponent } from "../form/sign/otp/otp.component";
import { BioComponent } from "../form/sign/bio/bio.component";
import { BiometricComponent } from "../form/biometric/biometric.component";

import { types } from '../../pages/form/create/types';

@Component({
    selector: "ngx-envelope",
    templateUrl: "./envelope.component.html",
    styleUrls: ["./envelope.component.scss"],
    standalone: false
})
export class EnvelopeComponent implements OnInit, OnDestroy {

  view_option = 1;

  // Data Design
  title = 'Diligenciar';
  logo = '';
  background = '';
  color = '';
  name:string;
  description:string;

  // Preview
  pdf_view = false;
  pdf_loading = false;

  // Progress
  page_total;
  offset_height = 57;

  send_view = true;
  index_form = 0;

  token_answer = '';
  token_link = '';
  option;
  validation = false;
  finish = 0;
  ent_id;
  geolocationPosition = null;

  token_response = {
    title: '',
    text: '',
  }

  envelope = [];
  answer;
  user;
  user_type;
  table_form = false;

  // Archivos
  data_files = [];
  fields = [];
  attempts = [];
  index_doc = 1;
  form;
  page = 1;
  field_index;
  field;
  URL;

  loading;

  SignatureHand : NbDialogRef<HandwrittenComponent>;
  dialogSign: Subscription;
  Extensiones = [];

  trace_token = '';
  dialogRefBio: NbDialogRef<BiometricComponent>;

  answer_id = null
  id:string

  position = null

  constructor(
    private activatedRoute: ActivatedRoute,
    public envelopeService: EnvelopeService,
    public dialogService: NbDialogService,
    private _sharedService: SharedService,
    private toastService: ToastService,
    private srcSS:SwitchService,
    private modalSS:SwitchService,
    private answerService:AnswerService,
    private themeService: NbThemeService,
  ) {
    this.token_answer = this.activatedRoute.snapshot.paramMap.get('answer');
    this.token_link = this.activatedRoute.snapshot.paramMap.get('token');

    this.activatedRoute.data.subscribe(data => {
      this.option = data['option'];
      // Option
      // 1 - Diligenciador
      // 2 - Aprobador
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.getDataToken();

    this.dialogSign = this.srcSS.$sing.subscribe((valor)=>{
      if (valor != "close") {
        let values=valor.split("@")
        this.Extensiones[values[1]]= "{\""+this.fields[values[1]].field +"\":\""+ values[2]+"\"}"
        this.fields[values[1]]['answer']=values[0]
      }
      this.notSelect();
    });

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

  ngOnDestroy() {
    this.dialogSign.unsubscribe();
  }

  previewPDF(f) {
    this.page = 1;
    this.pdf_view = true;
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
    if (this.page < this.form.pages_count) {
      this.send_view = false;
      doc_content.classList.add('next_show_go');
      setTimeout(() => {
        if (this.page < this.form.pages_count) {
          this.page += 1;
        }

        setTimeout(() => {
          doc_content.classList.remove('next_show_go');
          this.send_view = true;
        }, 500);
      }, 500);
    }
  }

  backPagePreview(doc_content: HTMLElement) {
    if (this.page > 1) {
      this.send_view = false;
      doc_content.classList.add('back_show_go');
      setTimeout(() => {
        if (this.page > 1) {
          this.page -= 1;
        }

        setTimeout(() => {
          doc_content.classList.remove('back_show_go');
          this.send_view = true;
        }, 500);
      }, 500);
    }
  }

  nextFormPreview(form_content: HTMLElement) {
    this.index_form += 1;
    if (this.index_form >= this.envelope.length) {
      this.index_form = 0;
    }
    this.form = this.envelope[this.index_form];
  }

  backFormPreview(form_content: HTMLElement) {
    this.index_form -= 1;
    if (this.index_form < 0) {
      this.index_form = this.envelope.length - 1;
    }
    this.form = this.envelope[this.index_form];
  }

  countFormValidate() {
    let validate = false;
    this.fields.forEach(field => {
      if (field.user.id == this.user && field.form_id == this.form.id) {
        validate = true;
      }
    });
    return validate;
  }

  get status_bar() {
    let progress = 0;
    let total = this.fields.length;
    this.fields.forEach(field => {
      if (field.user.id == this.user) {
        if (field.field_type == 23) {
          if (JSON.stringify(field.answer) != '["","",""]') {
            progress += 1;
          }
        } else {
          if (field.answer != '') {
            progress += 1;
          }
        }
      } else {
        total -= 1;
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
      if (field.user.id == this.user) {
        if (field.field_type == 23) {
          if (JSON.stringify(field.answer) != '["","",""]') {
            progress += 1;
          }
        } else {
          if (field.answer != '') {
            progress += 1;
          }
        }
      } else {
        total -= 1;
      }
    });
    return Math.floor((progress * 100) / total);
  }

  selectEnv(index) {
    this.page = 1;
    this.form = this.envelope[index];
  }

  getDataToken() {
    this.loading = true;
    this.envelopeService.get_envelope_token(this.option, this.token_answer, this.token_link).subscribe(
      response => {
        if (response['status']){
          // Datos de la empresa.
          this.view_option = response['envelope']['envelope_view_option'];

          this.ent_id = response['enterprise']['id'];
          this._sharedService.emitChange(response['enterprise']);
          this.user = response['envelope']['user'];

          if (response['enterprise']['logo'][1] != '') {
            this.logo = response['enterprise']['logo'][0] + response['enterprise']['logo'][1];
          }

          if (response['enterprise']['name'] != '') {
            this.title = response['enterprise']['name'];
          }

          if (response['enterprise']['theme']){
            this.themeService.changeTheme(THEMES.filter((val) => response['enterprise']['theme'] == val.value).map((val) => val.value === 1 ? 'default' : val.name )[0].toLowerCase());
          }

          setTimeout(() => {
            // Header
            const box0 = document.getElementById('headerT');
            if (response['enterprise']['colorB'] && response['enterprise']['colorB'] != 'None'){
              this.background = response['enterprise']['colorB']
              const box0 = document.getElementById('headerT');
              box0.classList.add('headerT');
              box0.style.setProperty("--my-var", this.background);
            }
            // console.log(box0.offsetHeight);
            // this.contentHeight = this.box0.nativeElement.offsetHeight;
            if (this.view_option == 1) {
              this.offset_height = box0.offsetHeight;
            } else if (this.view_option == 2) {
              this.offset_height = 0;
            }

            // Footer
            const box_foother = document.getElementById('footerT');
            box_foother.classList.add('headerT');
            if (response['enterprise']['colorBF'] && response['enterprise']['colorBF'] != 'None'){
              box_foother.style.setProperty("--my-var5", response['enterprise']['colorBF']);
            }
            if (response['enterprise']['colorBFT']  && response['enterprise']['colorBFT'] != 'None'){
              box_foother.style.setProperty("--my-var6", response['enterprise']['colorBFT']);
            }

            // // Título
            // const boxHeaderTitle = document.getElementById('contdiv2');
            // boxHeaderTitle.classList.add('color_base_2');
            // // Backgroud
            // if (response['enterprise']['colorBTP']  && response['enterprise']['colorBTP'] != 'None'){
            //   boxHeaderTitle.style.setProperty("--my-var6", response['enterprise']['colorBTP']);
            // }
          },1000);

          if (response['validation']) {
            this.validation = true;
            let form_data = {
              id: response['envelope']['id'],
              // user: response['envelope']['user'],
              answer: response['envelope']['answer'],
              edit: true,
            }
            if (this.option == 1 && this.validation) {
              this.user_type = response['envelope']['type_user'];

              const dialogRef = this.dialogService.open(ModalComponent, {context:{data: {type:10}}, closeOnBackdropClick:false, closeOnEsc:false });
              dialogRef.onClose.subscribe(result => {
                if (result == true) {
                  // Validar tipo y mostrar formulario de contacto.
                  if (this.user_type == 5) {
                    const dialogRefContact = this.dialogService.open(ModalComponent, {context:{data: {type:13}}, closeOnBackdropClick:false, closeOnEsc:false });
                    dialogRefContact.onClose.subscribe(data_contact => {
                      this.loading = true;

                      let form_data_contact = {
                        answer_token: this.token_answer,
                        envelope_token: this.token_link,
                        email: data_contact.email,
                        phone: data_contact.contact_phone.phoneNumber,
                        phone_ind: data_contact.contact_phone.phoneInd,
                        name: data_contact.name,
                      }
                      this.envelopeService.get_token_contact_public(form_data_contact).subscribe(
                        response => {
                          if (response['status']) {
                            console.log(response);
                            this.token_answer = response['data']['answer_token'];
                            this.token_link = response['data']['answer_user_token'];
                          } else {
                            this.validation = false;
                            this.token_response = response['message'];
                          }
                          this.loading = false;
                        }, error => {
                          // this.toastService.showToast('danger', 'Error!', 'Intentalo mas tarde.');
                          this.validation = false;
                          this.token_response = {
                            title: 'Error',
                            text: 'Comunícate con la persona encargada.',
                          };
                          this.loading = false;
                        }
                      );
                    });
                  }
                }
              });
            } else if (this.option == 2 && this.validation) {
              const dialogRef = this.dialogService.open(ModalComponent, {context:{data: {type:1}}, closeOnBackdropClick:false, closeOnEsc:false });
              dialogRef.onClose.subscribe(result => {
                if (result == true) {
                  // console.log('asdasd');
                }
              });
            }

            this.envelopeService.list_form(form_data).subscribe(
              response => {
                if (response['status']) {
                  this.envelope = response['data']['form'];
                  this.fields = response['data']['fields'];
                  this.id = response['data']['form']['id'];
                  this.attempts = response['data']['form']['attemps'];
                  this.form = this.envelope[0];
                  this.URL = response['data']['URL'];
                  console.log(this.URL);

                  if (this.user_type == 4) {
                    // Validar si es pdf aparte...........
                    this.fields.forEach(field => {
                      if (field.field_type == 17) {
                        field.answer = "";
                        if (field.description == '1') {
                          this.table_form = true;
                        }
                      }
                    });
                  }
                }
              }, error => {
                // this.toastService.showToast('danger', 'Error!', 'Intentalo mas tarde.');
                this.loading = false;
              }
            );
          } else {
            this.token_response = response['message']
          }
          this.loading = false;
        } else {
          this.loading = false;
        }
      }, error => {
        console.log(error);
      }
    );
  }

  changeDoc(value) {
    this.form = this.envelope[value-1];
    this.page = 1;
  }

  valNext(event, index){
    let next_position = index + 1;
    let next_process = true;

    while (next_process) {
      if (this.fields[next_position] !== undefined) {
        if (this.fields[next_position].user.id == this.user) {

          this.field_index = next_position;
          next_process = false;

          if (this.fields[next_position].form_id != this.form.id) {
            let position_form = this.envelope.map(function(e) { return e.id; }).indexOf(this.fields[next_position].form_id);
            if (position_form != -1) {
              this.form = this.envelope[position_form];
              this.index_doc = position_form + 1;
            }
          }
          this.page = this.fields[next_position].page;

          setTimeout(() => {
            document.getElementById('field_'+next_position)?.focus();
            // if(event.nextElementSibling.id != "container_pdf") {
            //   event.nextElementSibling.children[1].children[0].focus();
            // }
          }, 200);
        } else {
          next_position += 1;
        }
      } else {
        next_process = false;
        this.field_index = null;
        this.field = null;
      }
    }
  }

  selectField(event, field, index) {
        if (this.option == 1) {
      this.field_index = index;
      this.field = field;

      if ([1,2,5,6,25].includes(field.field_type)) {
        setTimeout(() => {
          event.children[1].children[0].focus();
        }, 200);
      } else if ([7].includes(field.field_type)) {
        this.openWithoutBackdropClick(index);
      } else if ([8,9].includes(field.field_type)) {
        setTimeout(() => {
          this.field_index = null;
        }, 500);
      } else if([10, 18, 22].includes(field.field_type)) {
        if(field.answer != "") return
        let navegador = navigator.userAgent;
        if(navegador.match(/X11/i) || navegador.match(/iPhone/i) || navegador.match(/Android/i) || navegador.match(/Windows/i) || navegador.match(/iPad/i) || navegador.match(/iPod/i) || navegador.match(/BlackBerry/i) || navegador.match(/Windows Phone/i) || navegador.match(/webOS/i) || navegador.match(/Mac OS/i) ){
          let firmComponent = null
          let type_sign = null
          switch (field.field_type) {
            case 10:
              firmComponent = BioComponent
              break;
            case 18:
              firmComponent = DocComponent
              break;
            case 22:
              type_sign = this.field.hasOwnProperty('validate') && this.field.validate.hasOwnProperty('advanced') && this.field.validate.advanced == 'phone' ? 3 : 2;
              firmComponent = OtpComponent
              break;
          }
          // if(field.field_type == 10 && navegador.match(/Mac OS/i)) {
          //   alert('Firma bio facial no soportada para: Mac OS')
          //   return;
          // }
          this.dialogService.open(firmComponent ,{ closeOnBackdropClick:false,
            context:{
              field: index,
              parent: this,
              user_id: this.field['user']['id'],
              type_user: this.field['user'].hasOwnProperty('type_user') ? this.field['user']['type_user'] : null,
              user: this.field['user'].hasOwnProperty('user') ? this.field['user']['user'] : null,
              enterprise_id: this.field['user'].hasOwnProperty('enterprise_id') ? this.field['user']['enterprise_id'] : null,
              type_sign: type_sign,
              envelope: true
            }
          });
        } else {
          this.toastService.showToast('info', '!Sin disponibilidad!', 'Busca otro dispositivo para realizar el documento.');
        }
      }
    }

  }

  notSelect() {
    this.field_index = null;
    this.field = null;
  }

  setColor(field, style) {
    switch (style) {
      case 'background':
        if (field.field_type == '17') {
          return 'none';
        }
        return field.isConfig ? 'transparent' : field.user.color;
      case 'table':
        return field.isConfig ? 'white' : field.user.color;
      case 'color':
        return field.isConfig ? field.color : 'white';
      default:
        return 'white';
    }

  }

  // Tamaño de la plantilla
  getHeight() {
    return (
      "height: " + this.form["pages"][this.page - 1]["height"] + "px;"
    );
  }

  getWidth() {
    return (
      "width: " +  this.form["pages"][this.page - 1]["width"] + "px;"
    );
  }

  getZoom (div_size: HTMLElement) {
    let calc = 100;
    if (div_size.offsetWidth > 450) {
      let mult = (100 * this.form["pages"][this.page - 1]["width"]) / div_size.offsetWidth;
      calc = 100 + (100-mult);
    }
    return "zoom: " + calc + "%;";
  }

  // Funciones para cargar opciones y textos.
  getTitle(field) {
    // console.log("A10")
    if(field.isConfig) {
      return field["label"];
    }
    if (
      field["field_type"] == "3" ||
      field["field_type"] == "12" ||
      field["field_type"] == "13"
    ) {
      if (field["option"] == "1") {
        // Busca el nombre de la opción
        return field["label"];
        let position = field["data"]["values"]
          .map(function (e) {
            return e.value;
          })
          .indexOf(field["option_value"]);
        return (
          field["label"] + " - " + field["data"]["values"][position]["label"]
        );
      }
      return "Texto - " + field["label"];
    } else if (
      field["field_type"] == "10" ||
      field["field_type"] == "18" ||
      field["field_type"] == "22"
    ) {
      return "Comprobante - " + field["label"];
    } else if (field["field_type"] == "17") {
      // Busca el nombre de la columna
      let position = field["fields"]
        .map(function (e) {
          return e.field;
        })
        .indexOf(field["column_value"]);

      if (position != -1) {
        return (
          field["row_field"] +
          " - " +
          field["fields"][position]["label"] +
          " - " +
          field["label"]
        );
      } else {
        return field["label"];
      }
    } else if (field["field_type"] == "4") {
      let name_option = "";
      switch (field["option"]) {
        case "0":
          name_option = "Completa - ";
          break;
        case "1":
          name_option = "Día - ";
          break;
        case "2":
          name_option = "Mes - ";
          break;
        case "3":
          name_option = "Año - ";
          break;

        default:
          break;
      }
      return name_option + field["label"];
    }
    return field["label"];
  }

  getLabel(field) {
    if(field.isConfig) {
      return field["label"];
    }
    if (
      field["field_type"] == "3" ||
      field["field_type"] == "12" ||
      field["field_type"] == "13"
    ) {
      if (field["option"] == "1") {
        return "x";
      }
    } else if (
      field["field_type"] == "10" ||
      field["field_type"] == "18" ||
      field["field_type"] == "22"
    ) {
      return "QR-" + field["label"];
    } else if (field["field_type"] == "17") {
      // Busca el nombre de la columna
      let position = field["fields"]
        .map(function (e) {
          return e.field;
        })
        .indexOf(field["column_value"]);

      if (position != -1) {
        let option_type = ["3", "12", "13"];
        if (option_type.includes(field["fields"][position]["field_type"])) {
          if (field["option"] == "1") {
            return "x-" + field["row_field"];
          }
        }
        return (
          field["row_field"] +
          "-" +
          field["fields"][position]["label"] +
          "-" +
          field["label"]
        );
      } else {
        return field["label"]
      }
    } else if (field["field_type"] == "4") {
      let name_tag = "";
      switch (field["option"]) {
        case "0":
          name_tag = "C-";
          break;
        case "1":
          name_tag = "D-";
          break;
        case "2":
          name_tag = "M-";
          break;
        case "3":
          name_tag = "A-";
          break;

        default:
          break;
      }
      return name_tag + field["label"];
    }
    return field["label"];
  }

  // Estilos del elemento
  getBold(bold) {
    if (bold) {
      return "font-weight: 700;";
    }
    return "";
  }

  getItalic(italic) {
    if (italic) {
      return "font-style: italic;";
    }
    return "";
  }

  getUnderline(underline) {
    if (underline) {
      return "text-decoration: underline;";
    }
    return "";
  }

  getSizeSign(field_type, x, y) {
    if (!["1", "2", "5", "6", "25"].includes(field_type) && x != 0 && y != 0) {
      return "width: " + x + "px; height: " + y + "px;";
    }
    return "";
  }

  getClass(index) {
    if (index == this.field_index) {
      return "select-box";
    }
    return "";
  }

  getClassAnimate(field) {
    if (field.field_type == '13' && ['1','2'].includes(field.option+'') && field.answer.length == 0) return "animated";
    if (field.answer) return '';
    return "animated";
  }

  getSizeLine(x, line_height) {
    if (x != 0 && line_height != 0) {
      return "width: " + x + "px; line-height: " + line_height + "px;";
    }
    return "";
  }

  getLine(x) {
    let divide_line = Math.round(x / 2.05);
    let array_line = Array(divide_line).fill(1);
    let line = "";
    array_line.forEach((el) => {
      line += "_";
    });
    return line;
  }

  setTopLeft(field) {
    if(['3','12','13'].includes(field.field_type+'')){
      return '';
    }
    return `left: ${field.left}px; top: ${field.top}px;`;
  }

  typeField(type:number, validate=undefined) {
    if (type == 2 || type == 11) {
      return 'number';
    } else if (type == 4) {
      return 'date';
    } else if (type == 8) {
      return 'file';
    } else if (type == 16) {
      return 'currency';
    } else if (type == 19) {
      return 'time';
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

  nameTypeField(type) {
    let position = types.map(function(e) { return e.field_type; }).indexOf(type+"");
    if (position != -1){
      return types[position].label;
    }
    return '';
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
    } else {
      this.fields[index]['answer'] = event.target.value;
    }
  }

  onFileSelected(event, field, index) {
    const file:File = event.target.files[0];
    this.data_files[field] = file;
    if (this.fields[index]['field_type'] == 9) {
      if(file.type == "image/png" && file.name.split(".")[1].toUpperCase() == "PNG"){
        this.fields[index]['answer'] = file;
        var reader = new FileReader();
        reader.onload = e => this.fields[index]['answer'] = reader.result;
        reader.readAsDataURL(file);
        this.field_index = null;
      } else {
        this.fields[index]['answer'] = '';
        this.toastService.showToast('danger', '¡Error!', 'Las imágenes solo son soportadas en formato PNG.');
        this.field_index = null;
      }
    } else {
      this.fields[index]['answer'] = file;
      var reader = new FileReader();
      reader.onload = e => this.fields[index]['answer'] = reader.result;
      reader.readAsDataURL(file);
      this.field_index = null;
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

  // Answer Methods
  openWithoutBackdropClick(index) {
    this.open(false,index);
  }

  entra(){
    console.log("text")
  }

  protected open(closeOnBackdropClick: boolean,index) {
    if (this.SignatureHand) {
      this.SignatureHand.close();
    }
    this.SignatureHand = this.dialogService.open(HandwrittenComponent, { closeOnBackdropClick,context:{
      indexField:index,
    }});
    setTimeout(()=>{
      this.modalSS.$modalsing.emit(this.SignatureHand);
  }, 200);

  }

  keyDownFunction(event) {
    if (event.keyCode === 13) {
      event.preventDefault();
    }
  }

  onInvalid() {
    const dialogRef = this.dialogService.open(ModalComponent, {context:{data: {type:12}}, closeOnBackdropClick:false, closeOnEsc:false });
    dialogRef.onClose.subscribe(result => {
      if (result == true) {
        var keep_going = true;
        this.fields.forEach((field, index) => {

          if (keep_going && !field.isConfig && field.user.id == this.user && field.required) {
            if (field.answer == '') {

              keep_going = false;
              this.field_index = index;

              if (field.form_id != this.form.id) {
                let position_form = this.envelope.map(function(e) { return e.id; }).indexOf(field.form_id);
                if (position_form != -1) {
                  this.form = this.envelope[position_form];
                  this.index_doc = position_form + 1;
                }
              }

              this.page = field.page;
              setTimeout(() => {
                document.getElementById('field_'+index)?.focus();
              }, 200);

            }
          }
        });

        console.log('Entendido!!!!!');
        console.log('Prueba');
      }
    });
  }

  // Envio de la respuesta
  onSubmit(f) {
    console.log('onSubmit');
    this.loading = true;
    if (f.valid) {
      console.log(f.value);
      const formData = new FormData();
      formData.append('answer_token', this.token_answer);
      formData.append('envelope_token', this.token_link);
      let position = null;
      if (this.geolocationPosition != null){
        position = {lat: this.geolocationPosition.coords.latitude, lon: this.geolocationPosition.coords.longitude}
      }
      formData.append('extencion',JSON.stringify(this.Extensiones));
      if (position != null){
        formData.append('position', JSON.stringify(position));
      }
      formData.append('fields', JSON.stringify(f.value));
      // Lista de archivos
      this.data_files.forEach((value ,key) => {
        formData.append('file_' + key, value);
      });

      this.envelopeService.save_answer(formData).subscribe(
        response => {
          // console.log(response);
          if (response['status']){
            // this.router.navigate(['/pages/answer', {}]);
            this.loading = false;

            const dialogRef = this.dialogService.open(ModalComponent, {context:{data: {type:11}}, closeOnBackdropClick:false, closeOnEsc:false });
            dialogRef.onClose.subscribe(result => {
              if (result == true) {
                this.finish = 3;
              }
            });
          } else {
            this.toastService.showToast('danger', 'Error!', 'Intentalo mas tarde.');
            this.loading = false;
          }
        }
      );
    } else {
      this.toastService.showToast('danger', 'Error!', 'Intentalo mas tarde.');
      this.loading = false;
    }
  }

  // Aprobar respuesta
  onApprove() {
    const dialogRef = this.dialogService.open(ModalComponent, {context:{data: {type:2}}, closeOnBackdropClick:false, closeOnEsc:false });
    dialogRef.onClose.subscribe(result => {
      if (result == true) {
        this.saveApprove(result);
      }
    });
  }

  // Aprobar respuesta
  onDisapprove() {
    const dialogRef = this.dialogService.open(ModalComponent, {context:{data: {type:3}}, closeOnBackdropClick:false, closeOnEsc:false });
    dialogRef.onClose.subscribe(result => {
      if (result != false) {
        this.saveApprove(result);
      }
    });
  }

  saveApprove(result) {
    const formData = new FormData();
    if (result != true) {
      formData.append('approve', '0');
    } else {
      formData.append('approve', '1');
    }
    formData.append('answer_token', this.token_answer);
    formData.append('envelope_token', this.token_link);
    let position = null;
    if (this.geolocationPosition != null){
      position = {lat: this.geolocationPosition.coords.latitude, lon: this.geolocationPosition.coords.longitude}
    }
    if (position != null){
      formData.append('position', JSON.stringify(position));
    }
    if (result != true) {
      formData.append('comment', result);
    }

    this.envelopeService.save_approve(formData).subscribe(
      response => {
        // console.log(response);
        if (response['status']){
          if (result != true) {
            this.finish = 2;
          } else {
            this.finish = 1;
          }
          // this.router.navigate(['/pages/answer', {}]);
        } else {
          this.toastService.showToast('danger', 'Error!', 'Intentalo mas tarde.');
          this.loading = false;
        }
      }
    );
  }

  optionX(idOption, field) {
    if(field.field_type == '12') {
      field.answer = idOption;
    } else if(field.field_type == '13') {
      let answer = field.answer ? field.answer : []
      if (typeof answer === 'string')
        answer = JSON.parse(answer);
      let exist = answer.indexOf(idOption);
      if(exist >= 0) {
        answer.splice(exist, 1)
      } else {
        answer.push(idOption)
      }
      field.answer = answer
    }
  }

  changeOptionMultiple(checked, idOption, field) {
    let answer = field.answer ? field.answer : []
    if (typeof answer === 'string')
        answer = JSON.parse(answer);
    let exist = answer.indexOf(idOption);
    if(exist >= 0) {
      if(!checked) {
        answer.splice(exist, 1)
      }
    } else {
      answer.push(idOption)
    }
    field.answer = answer
  }

  checkked(field, idOption) {
    let check = false
    if(parseInt(field.answer) == idOption) {
      check = true
    }
  }

  colorCssFilter(colorHex) {
    const cssFilter = hexToCSSFilter(colorHex);
    return cssFilter.filter;
  }

  validateAttempts(index) {
    let count = 0
    let attempt = 3
    let close = false
    if(this.attempts.length > 0) {
      let attempts = this.attempts.find(a => a.field_type_id == this.fields[index]['field_type'])
      if (attempts) {
        let key = `${attempts['field_type_id']}-${this.fields[index]['field']}`
        let data = {}
        attempt = attempts['attempts']
        let attempts_current = localStorage.getItem('attempts')
        if(attempts_current) {
          let obj = JSON.parse(attempts_current);
          data = obj
          let current = obj[key]
          if (current) {
            count = current
          }
        }
        count++;
        data[key] = count
        const myJSON = JSON.stringify(data);
        localStorage.setItem('attempts', myJSON)
      }
    }
    if(attempt == count) {
      close = true
      this.toastService.showToast('danger', 'Error', 'Haz alcanzado el número de intentos para firmar');
      var btnFP = document.getElementById('btnFP')
      if(btnFP) {
        this.fields.forEach(field => {
          field['required'] = false
          let type = field['field_type']
          if(type == "10" || type == "18" || type == "22") {
            field['required_sign'] = false
          }
        });
        setTimeout(() => {
          btnFP.click()
        }, 500);
      }
    }
    return close;
  }

}
