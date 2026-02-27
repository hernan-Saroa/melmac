import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AnswerComponent } from '../../answer.component';
import { NbDialogRef } from '@nebular/theme';
import { ToastService } from '../../../../../usable/toast.service';
import { SiteService } from '../../../../../services/site.service';
import { CodeInputComponent } from 'angular-code-input';
import { timer } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'ngx-otp',
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.scss']
})
export class OtpComponent implements OnInit {
  loading = false;
  user_data;

  // Refencia de datos Requeridos
  field; // index del campo
  parent: AnswerComponent;

  // Ubicación paso a paso
  step_now = 1;
  type_sign;

  // Data paso 1
  name;
  phone: string;
  email: string;
  number_id: string;
  check_id:boolean;
  phoneObject: any = null;
  phone_ind: string = '+0';
  token_service_score = ''

  // Trazabilidad
  trace_token;
  token;

  authorization:boolean=false;
  navigator: string;
  ipAddress: string;
  sign_name = 'OTP';
  code_sent = false;
  code_valid = false;
  code_input_visible = true;

  // Contador
  _second = 1000;
  _minute = this._second * 60;
  _hour = this._minute * 60;
  _day = this._hour * 24;
  end: any;
  now: any;
  day: any;
  hours: any;
  minutes: any;
  seconds: any;
  source = timer(0, 1000);
  clock: any;
  code_email = "0";
  code_cel = "0";
  validate_email = false

  @ViewChild('codeInput') codeInput !: CodeInputComponent;
  @ViewChild('codeInput2') codeInput2 !: CodeInputComponent;
  style_modal = "height: 35rem; max-width: 850px;";

  constructor(
    public dialogRef: NbDialogRef<OtpComponent>,
    private toastService: ToastService,
    private siteService: SiteService,
    private http:HttpClient,
  ) {
      this.user_data = JSON.parse(localStorage.getItem('session'));
  }

  ngOnInit(): void {
    this.getIPAddress();
    this.navigator = this.getBrowser()
  }

  getIPAddress()
  {
    this.http.get("https://api.ipify.org/?format=json").subscribe((res:any)=>{
      this.ipAddress = res.ip;
    });
  }

  getBrowser(): string {
    const test = regexp => {
      return regexp.test(navigator.userAgent);
    };

    if (test(/opr\//i)) {
      return 'Opera';
    } else if (test(/edg/i)) {
      return 'Microsoft Edge';
    } else if (test(/chrome|chromium|crios/i)) {
      return 'Google Chrome';
    } else if (test(/firefox|fxios/i)) {
      return 'Mozilla Firefox';
    } else if (test(/safari/i)) {
      return 'Apple Safari';
    } else if (test(/trident/i)) {
      return 'Microsoft Internet Explorer';
    } else if (test(/ucbrowser/i)) {
      return 'UC Browser';
    } else if (test(/samsungbrowser/i)) {
      return 'Samsung Browser';
    } else {
      return 'Unknown browser';
    }
  }

  showDate(){
    let distance = this.end - this.now;
    this.day = Math.floor(distance / this._day);
    this.hours = Math.floor((distance % this._day) / this._hour);
    this.minutes = Math.floor((distance % this._hour) / this._minute);
    this.seconds = Math.floor((distance % this._minute) / this._second);
  }

  getStyleModal() {
    let style_modal = "height: 21rem; max-width: 650px;";
    switch (this.step_now) {
      case 1:
        style_modal = "height: 21rem; max-width: 650px;";
        break;
      case 2:
        style_modal = "height: 22rem; max-width: 650px;";
        break;
      default:
        break;
    }
    return style_modal;
  }

  validFirstStep() {
    if (this.type_sign == 2) {
      return this.email && this.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-.]+[.][a-zA-Z0-9.-]{2,}$/) && (this.check_id) ;
    } else if(this.type_sign == 4){
      let validatePhone = false
      let validateemail = false
      if(this.phoneObject && this.phone) {
        validatePhone = this.phoneObject.s.dialCode == 57 ? (this.phone.toString().match(/^3[0-9]{9}$/) ? true : false) : (this.phone.toString().length > 4 ? true : false);
      }
      if(this.email && this.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-.]+[.][a-zA-Z0-9.-]{2,}$/)){
        validateemail = true
      }
      return validatePhone && this.check_id && validateemail;
    } else {
      let validatePhone = false
      if(this.phoneObject && this.phone) {
        validatePhone = this.phoneObject.s.dialCode == 57 ? (this.phone.toString().match(/^3[0-9]{9}$/) ? true : false) : (this.phone.toString().length > 4 ? true : false);
      }
      return validatePhone && this.check_id;
    }
  }

  checkValue(field) {
    switch (field) {
      case 1:
        if (this.number_id == '' || this.number_id == undefined)
          return 'basic';
        return (this.number_id && this.number_id.toString().length > 4) ? 'success' : 'danger';
      case 2:
        if (this.email == '' || this.email == undefined)
          return 'basic';
        return (this.email && this.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-.]+[.][a-zA-Z0-9.-]{2,}$/)) ? 'success' : 'danger';
      case 3:
        if (this.phone == '' || this.phone == undefined)
          return 'basic';
        return (this.phoneObject && this.phoneObject.s.dialCode == 57 ? ((this.phone && this.phone.toString().match(/^3[0-9]{9}$/)) ? 'success' : 'danger') : (this.phone.toString().length > 4 ? 'success' : 'danger'));
    }
  }

  toggle(checked: boolean){
    this.check_id=checked
  }

  onFirstSubmit() {
    this.loading = true;

    let value = this.email;
    if (this.type_sign == 3){
      value = '';
    }

    this.siteService.requestAuthorization(value, this.parent.trace_token, this.sign_name, this.parent.fields[this.field]['field']).subscribe(response => {
      this.trace_token = response['trace_token'];
      this.parent.trace_token = this.trace_token;

      if (this.type_sign == 2) {
        this.phone = Math.floor((Math.random() * (999999 - 100000 + 1)) + 100000) + "";
        this.conexion_send_email()
        this.view_send(this.type_sign)
      } else if (this.type_sign == 4){
        console.log("Ingresa a firmar 4")
        this.conexion_send_phone()
        this.conexion_send_email()
        this.view_send(this.type_sign)
      } else {
        this.conexion_send_phone()
        this.view_send(this.type_sign)
      }
    }, (error) => {
      this.code_sent = false;
    });
  }

  conexion_send_email(){
    this.siteService.requestTokenByEmail(this.email, this.phone.toString(), this.trace_token).subscribe(response => {
      if (response['status']) {
        return response
      } else {
        this.code_sent = true;
        this.toastService.showToast('danger', 'Error', 'Intentalo mas tarde');
      }
    }, (error) => {
      this.code_sent = false;
    });
  }

  conexion_send_phone(){
    this.phone_ind = this.phoneObject ? `+${this.phoneObject.s.dialCode}` : '+0'
    this.siteService.requestTokenByPhone(this.phone.toString(), this.phone_ind, this.trace_token).subscribe(request => {
      if (request['status']) {
        return request
      } else {
        this.code_sent = true;
        this.toastService.showToast('danger', 'Error', request['message']);
      }
    }, (error) => {
      this.code_sent = false;
    });
  }

  view_send(type){

    if(type == 2){
      let subtitle = 'Te hemos enviado un token al correo electrónico que ingresaste.';
      this.toastService.showToast('success', 'Revisa tu correo', subtitle);
    }else if(type == 4){
      let subtitle = 'Te hemos enviado un token al número de telefono y correo electrónico que ingresaste.';
      this.toastService.showToast('success', 'Revisa tu correo', subtitle);
    }else{
      let subtitle = 'Te hemos enviado un token al número de telefono indicado.';
      this.toastService.showToast('success', 'Revisa tu Teléfono', subtitle);
    }
    this.code_input_visible = true;

    this.loading = false;
    this.step_now += 1;

    if(type != 4){
      let now_second_validate = new Date();
      let second_validate = now_second_validate.getTime() + 180000;
      let validate_time = true;
      this.minutes = 1;

      this.clock = this.source.subscribe(t => {
        this.now = new Date();
        this.end = new Date(second_validate);
        if (validate_time) {
          if (this.minutes <= 0 && this.seconds <= 0) {
            validate_time = false;
            this.authorization = false;
            this.code_sent = false;
            this.step_now = 1;
            this.clock.unsubscribe();
          } else {
            this.showDate();
          }
        }
      });
    }
  }

  telInputObject(e) {
    this.phoneObject = e
  }

  pulsar(e) {
    var invalidChars = [69, 187, 189, 190]; //["-", "e", "+", "."]
    if(invalidChars.includes(e.keyCode)){
      e.preventDefault();
    }
  }

  verifyToken2(opt, code) {
    if(opt == 1){
      this.code_email = code
    }else if (opt == 2){
      this.code_cel = code
    }
    if(this.code_email !="0" && this.code_cel !="0"){
      this.verifyToken(123456)
    }
  }

  verifyToken(code) {
    this.token = code;
    let answer_data = {
      user_id: this.user_data['id'],
      form_id: this.parent.id,
      source: 1,
      field_id: this.parent.fields[this.field]['field'],
      field_type: this.parent.fields[this.field]['field_type']
    }
    if(this.parent.position){
      answer_data['position'] = this.parent.position;
    }
    if(this.parent.answer_id){
      answer_data['answer_id'] = this.parent.answer_id;
    }
    this.siteService.requestBrowser(this.navigator, this.trace_token, this.ipAddress, this.sign_name, this.parent.fields[this.field]['field']).subscribe(data => {
      console.log("data:::");
      // console.log(data);
    })
    if(this.token_service_score){
      answer_data['token_service_score'] = this.token_service_score;
    }

    if (this.type_sign == 2){
      this.siteService.validateTokenByMail(this.email, this.phone.toString(), this.token, this.trace_token, null, null, null, answer_data).subscribe(response => {
        this.verifyTokenResult(response, this.email, true)
      });
    } else if (this.type_sign == 3){
      this.siteService.validateTokenByPhoneMail(this.phone.toString(), this.token, this.trace_token, null, null, null, answer_data).subscribe(response => {
        this.verifyTokenResult(response, this.phone, false)
      });
    } else if (this.type_sign == 4){
      if(this.validate_email){
        this.siteService.validateTokenByPhoneMail(this.phone.toString(), this.code_cel, this.trace_token, null, null, null, answer_data).subscribe(response => {
          if (response['status'] && response['message'] == "Token valido!") {
            this.verifyTokenResult(response, this.email + ' - ' + this.phone.toString(), false)
          }else{
            if(response.hasOwnProperty('answer_id')) {
              this.parent.answer_id = response['answer_id']
            }
            let closeDialog = this.parent.validateAttempts(this.field)
            if(closeDialog) this.close()
            this.toastService.showToast('danger', 'Error', 'Token de celular Invalido, vuelva a intentarlo');
            this.code_cel = "0";
            this.codeInput2.reset();
          }
        });
      }else{
        this.siteService.validateTokenByMail(this.email, this.phone.toString(), this.code_email, this.trace_token, null, null, null, answer_data).subscribe(response => {
          if (response['status'] && response['message'] == "Token valido!") {
            this.siteService.validateTokenByPhoneMail(this.phone.toString(), this.code_cel, this.trace_token, null, null, null, answer_data).subscribe(response => {
              if (response['status'] && response['message'] == "Token valido!") {
                this.verifyTokenResult(response, this.email + ' - ' + this.phone.toString(), false)
              }else{
                this.validate_email = true
                if(response.hasOwnProperty('answer_id')) {
                  this.parent.answer_id = response['answer_id']
                }
                let closeDialog = this.parent.validateAttempts(this.field)
                if(closeDialog) this.close()
                this.toastService.showToast('danger', 'Error', 'Token de celular Invalido, vuelva a intentarlo');
                this.code_cel = "0";
                this.codeInput2.reset();
              }
            });
          }else{
            if(response.hasOwnProperty('answer_id')) {
              this.parent.answer_id = response['answer_id']
            }
            let closeDialog = this.parent.validateAttempts(this.field)
            if(closeDialog) this.close()
            this.toastService.showToast('danger', 'Error', 'Token de correo electrónico Invalido, vuelva a intentarlo');
            this.code_email = "0";
            this.codeInput.reset();
          }

        });
      }
    }
  }

  verifyTokenResult(response, action, input) {
    if(response.hasOwnProperty('token_service_score')) {
      this.token_service_score = response['token_service_score']
    }
    if (this.type_sign != 4){
      if (response['status'] && response['message'] == "Token valido!") {
        this.code_valid = true;
        this.toastService.showToast('success', action,'Confirmado');
        this.code_input_visible = input;
        this.parent.fields[this.field]['answer'] = 'VALIDADO CON EXITO-'+response['data']+'-'+this.token_service_score.split("-").join("_");
        this.parent.fields[this.field]['sign'] = action
        this.close();
      } else {
        if(response.hasOwnProperty('answer_id')) {
          this.parent.answer_id = response['answer_id']
        }
        let closeDialog = this.parent.validateAttempts(this.field)
        if(closeDialog) this.close()
        this.toastService.showToast('danger', 'Error', 'Token Invalido, vuelva a intentarlo');
        this.token = '';
        this.codeInput.reset();
      }
    }else if (this.type_sign == 4){
      this.code_valid = true;
      this.toastService.showToast('success', action,'Confirmado');
      this.code_input_visible = input;
      this.parent.fields[this.field]['answer'] = 'VALIDADO CON EXITO-'+response['data']+'-'+this.token_service_score.split("-").join("_");
      this.parent.fields[this.field]['sign'] = action
      this.close();
    }
  }

  onBackFirstStep() {
    this.step_now = 1;
    this.authorization = false;
    this.code_sent = false;
    this.clock.unsubscribe();
  }

  close(){
    this.dialogRef.close();
  }

}
