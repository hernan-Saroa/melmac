import { ConfirmDialog } from '../../../pages/form/view/view.component';
import { SiteService } from '../../../services/site.service';
import { Component, OnInit, ViewChild,ElementRef } from '@angular/core';
import { ToastService } from '../../../usable/toast.service';
import { CodeInputComponent } from 'angular-code-input';
import { HttpClient  } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { stat } from 'fs';
import { timer } from 'rxjs';

declare var MediaRecorder: any;

@Component({
    selector: 'ngx-biometric',
    templateUrl: './biometric.component.html',
    styleUrls: ['./biometric.component.scss'],
    standalone: false
})
export class BiometricComponent implements OnInit {

  constructor(
    private siteService: SiteService,
    private toastService: ToastService,
    private http:HttpClient,
  ) { }

  // Token para a trazabilidad.
  trace_token = '';
  // Reference to field index
  field;

  // Reference to parent
  parent;

  name: string;
  phone: string;
  email: string;
  number_id: string;
  check_id:boolean;
  ipAddress: string;
  token;
  enterprise_id;
  user_id;
  rndInt;
  type_sign;
  cont_video;
  cont_video_docu;
  cont_video_docu_back;
  cont_reg_video;
  cont_reg_video_docu;
  cont_reg_video_docu_back;
  reg_video = 3;
  interval;
  interval2;
  redBtn=1;
  btn_video=true;
  text_validation=true;
  vid_file=1;
  tamanoVideoIos;
  btn_video_2=true;
  authorization:boolean=false;
  @ViewChild('videoFacial') videoFacial;
  @ViewChild('recording') recording;
  @ViewChild("fileUploadVideo", {static: false})
  InputVar: ElementRef;

  verified = false;
  code_sent = false;
  code_valid = false;
  //initError: EventEmitter<WebcamInitError>;
  visible = true;
  code_input_visible = true;
  recordingTimeMS = 4000;
  recordingTimeMSD = 6000;
  recordingTimeMSDB = 6000;
  video_facial_visible = false;
  video_recording_visible = true;
  video_recording_visible_docu = true;
  video_recording_visible_docu_back = true;
  file_visible = false;
  validate_visible = false;
  doc_file = '';
  doc_file_back = '';
  // doc_file_document = '';
  // doc_file_back_document = '';
  exist_user = false;
  type_video = 0;

  // Steppers
  inscription = false;
  step_now = 1;

  Videobase64 = '';
  VideoDocumentbase64 = '';
  tokenBio;
  tokenId;
  action;
  confidence;
  image64;
  imagePreview;
  document_ocr;
  name_ocr;
  status_ocr;
  isHidden = true;
  loading = false;

  // Contador OTP
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

  ContPrinc1=false
  ContVideo1=true
  countImage1=false
  countTextImage1=true
  textCountImage1=0
  textImage1=false
  btnImage1End=true
  spanImage1=false
  imageVideo1="./assets/images/biofacial/documento_frontal.png";
  imagePrincVideo1="./assets/images/biofacial/documento_frontal.png";
  elimination1=true

  imagePrincVideo2="./assets/images/biofacial/CEDULA_TRASERA.png";
  elimination2=true
  btnImage2End=true
  imageGeneral=''
  textGeneral=''
  idForm;
  // identification = '';
  // // Tipos de Documento
  // type_identification = [
  //   {'id': 1, 'name': 'Cédula de ciudadanía'},
  //   {'id': 2, 'name': 'Tarjeta de identidad'},
  //   {'id': 3, 'name': 'Cédula de extranjería'},
  //   {'id': 4, 'name': 'Pasaporte'},
  //   {'id': 5, 'name': 'Permiso de permanencia'},
  //   {'id': 6, 'name': 'Permiso por protección temporal'},
  // ];

  @ViewChild('codeInput') codeInput !: CodeInputComponent;
  @ViewChild('fileUpload') myInputVariable: ElementRef;
  @ViewChild('backUpload') myInputVariable2: ElementRef;


  ngOnInit(): void {
    this.phone = '';
    this.email = '';
    this.number_id = '';
    this.idForm = window.location.pathname.split("/")
    this.idForm=this.idForm[this.idForm.length-1]
    this.getIPAddress();
  }

  showDate(){
    let distance = this.end - this.now;
    this.day = Math.floor(distance / this._day);
    this.hours = Math.floor((distance % this._day) / this._hour);
    this.minutes = Math.floor((distance % this._hour) / this._minute);
    this.seconds = Math.floor((distance % this._minute) / this._second);
  }

  getIPAddress()
  {
    this.http.get("https://api.ipify.org/?format=json").subscribe((res:any)=>{
      this.ipAddress = res.ip;
    });
  }

  requestToken() {
    if (this.validForm(true)) {
      this.visible = false;
      const dialogRefBio = this.parent.dialogService.open(ConfirmDialog, {
        context: {
          data: {
            title: 'Confirmación de Número',
            content: 'El número \n' + this.phone + '\n es al cuál se enviara el token de confirmación?',
            option: 'confirm'
          }
        }
      });
      dialogRefBio.onClose.subscribe(result => {
        if (result == true) {
          this.code_sent = true;
          // this.code_input_visible = true;
          this.siteService.requestTokenByPhone(this.phone.toString(), this.trace_token).subscribe(request => {
            if (request['status']) {
              let subtitle = 'Te hemos enviado un token al número de télefono que ingresaste.';
              this.toastService.showToast('success', 'Revisa tu teléfono', subtitle);
              this.toastService.showToast('info', 'Solicitar', "Puedes solicitarlo nuevamente en un minuto");
              this.code_input_visible = true;
              this.step_now += 1;
              console.log("a1",this.step_now)
              const contPrincnbCard = document.getElementById('contPrincnbCard');
              contPrincnbCard.style.setProperty("--my-tam", "50%");

              setTimeout(() => {
                this.code_sent = false;
                }, 60000
              );
            } else {
              this.code_sent = true;
              this.toastService.showToast('danger', 'Error', request['message']);
            }
          }, (error) => {
            this.code_sent = false;
          });
        }
        this.visible = true;
      });
    }
    //this.step_now = 1;

  }

  verifyToken(code,next) {
    // console.log(parent);
    this.token = code;
    if (this.type_sign == '3'){
      this.siteService.validateTokenByMail(this.email, this.phone.toString(), this.token, this.trace_token).subscribe(response => {
        if (response['status'] && response['message'] == "Token valido!") {
          this.code_valid = true;
          this.toastService.showToast('success', this.email,'Confirmado');
          this.code_input_visible = true;
          //this.onSubmitOTP(next)
          this.parent.fields[this.field]['answer'] = 'VALIDADO CON EXITO-'+response['data']+'-'+this.email;
          //this.toastService.showToast('success', 'OTP', 'Se ha registrado la validación con exito.');
          this.close();
        } else {
          this.toastService.showToast('danger', 'Error', 'Token Invalido, vuelva a intentarlo');
          this.token = '';
          this.codeInput.reset();
        }
      });
    } else if (this.type_sign == '4'){
      this.siteService.validateTokenByPhoneMail(this.phone.toString(), this.token, this.trace_token).subscribe(response => {
        if (response['status'] && response['message'] == "Token valido!") {
          this.code_valid = true;
          this.toastService.showToast('success', this.phone,'Confirmado');
          this.code_input_visible = false;
          this.parent.fields[this.field]['answer'] = 'VALIDADO CON EXITO-'+response['data']+'-'+this.phone;
          this.close();
        } else {
          this.toastService.showToast('danger', 'Error', 'Token Invalido, vuelva a intentarlo');
          this.token = '';
          this.codeInput.reset();
        }
      });
    } else if (this.type_sign == '2') {
      this.siteService.validateTokenByPhone(this.phone.toString(), this.token, this.trace_token).subscribe(response => {
        if (response['status'] && response['message'] == "Token valido!") {
          this.code_valid = true;
          this.toastService.showToast('success', 'Token Valido', 'Se ha confirmado tu token correctamente.');
          this.code_input_visible = true;
          this.code_sent=true
          this.step_now += 1
          console.log("a2",this.step_now)
          const contPrincnbCard = document.getElementById('contPrincnbCard');
          contPrincnbCard.style.setProperty("--my-tam", "95%");
        } else {
          this.toastService.showToast('danger', 'Error', 'Token Invalido, vuelva a intentarlo');
          this.token = '';
          this.codeInput.reset();
        }
      });
    }else {
      this.siteService.validateTokenByPhone(this.phone.toString(), this.token, this.trace_token).subscribe(response => {
        if (response['status'] && response['message'] == "Token valido!") {
          this.code_valid = true;
          this.toastService.showToast('success', 'Token Valido', 'Se ha confirmado tu token correctamente.');
          this.code_input_visible = true;
          this.code_sent=true
          this.onSubmitOTP(next)
        } else {
          this.toastService.showToast('danger', 'Error', 'Token Invalido, vuelva a intentarlo');
          this.token = '';
          this.codeInput.reset();
        }
      });
    }
  }

  validFirstForm() {
    if (this.type_sign != '3' && this.type_sign != '4'){
      return (this.number_id && this.number_id.toString().length > 6) &&
        (this.email && this.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-.]+[.][a-zA-Z0-9.-]{2,}$/)) && (this.check_id);
    } else {
      if (this.type_sign == '3') {
        return this.email && this.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-.]+[.][a-zA-Z0-9.-]{2,}$/) && (this.check_id) ;
      } else {
        return this.phone && this.phone.toString().match(/^3[0-9]{9}$/) && (this.check_id);
      }
    }
  }

  onSubmit(next, prev, stepper) {
    this.authorization=true;
    this.loading = true;
    let next_click = true;

    let value = this.email;
    if (this.type_sign == '4'){
      value = '';
    }

    this.siteService.requestAuthorization(value,this.parent.trace_token).subscribe(response => {
        this.trace_token = response['trace_token'];
        this.parent.trace_token = this.trace_token;

        if (this.type_sign == '3' || this.type_sign == '4'){
          this.code_sent = true;

          if (this.type_sign == '3') {
            this.phone = Math.floor((Math.random() * (999999 - 100000 + 1)) + 100000) + "";

            this.siteService.requestTokenByEmail(this.email, this.phone.toString(), this.trace_token).subscribe(response => {
              if (response['status']) {
                let subtitle = 'Te hemos enviado un token al correo electrónico que ingresaste.';
                this.toastService.showToast('success', 'Revisa tu correo', subtitle);
                this.code_input_visible = true;

                // if (this.parent.trace_token == '') {
                //   this.trace_token = response['trace_token'];
                //   this.parent.trace_token = this.trace_token;
                // } else {
                //   this.trace_token = this.parent.trace_token;
                // }

                this.loading = false;
                this.step_now += 3;
                console.log("a3",this.step_now)
                const contPrincnbCard = document.getElementById('contPrincnbCard');
                contPrincnbCard.style.setProperty("--my-tam", "50%");

                let now_second_validate = new Date();
                let second_validate = now_second_validate.getTime() + 90000;
                let validate_time = true;
                this.minutes = 1;

                this.clock = this.source.subscribe(t => {
                  this.now = new Date();
                  this.end = new Date(second_validate);
                  if (validate_time) {
                    if (this.minutes <= 0 && this.seconds <= 0){
                      next_click = false;
                      validate_time = false;
                      this.authorization = false;
                      this.code_sent = false;
                      this.step_now = 1;
                      console.log("a4",this.step_now)
                      this.clock.unsubscribe();
                      prev.hostElement.nativeElement.click();
                      stepper.reset();
                    } else {
                      this.showDate();
                    }
                  }
                });
              } else {
                this.code_sent = true;
                this.toastService.showToast('danger', 'Error', 'Intentalo mas tarde');
              }
            }, (error) => {
              this.code_sent = false;
            });
          } else {
            this.siteService.requestTokenByPhone(this.phone.toString(), this.trace_token).subscribe(request => {
              if (request['status']) {
                let subtitle = 'Te hemos enviado un token al número de telefono indicado.';
                this.toastService.showToast('success', 'Revisa tu Teléfono', subtitle);
                this.code_input_visible = true;

                this.loading = false;
                this.step_now += 3;
                console.log("a5",this.step_now)
                const contPrincnbCard = document.getElementById('contPrincnbCard');
                contPrincnbCard.style.setProperty("--my-tam", "50%");

                let now_second_validate = new Date();
                let second_validate = now_second_validate.getTime() + 180000;
                let validate_time = true;
                this.minutes = 1;

                this.clock = this.source.subscribe(t => {
                  this.now = new Date();
                  this.end = new Date(second_validate);
                  if (validate_time) {
                    if (this.minutes <= 0 && this.seconds <= 0){
                      next_click = false;
                      validate_time = false;
                      this.authorization = false;
                      this.code_sent = false;
                      this.step_now = 1;
                      console.log("a6",this.step_now)
                      this.clock.unsubscribe();
                      prev.hostElement.nativeElement.click();
                      stepper.reset();
                    } else {
                      this.showDate();
                    }
                  }
                });
              } else {
                this.code_sent = true;
                this.toastService.showToast('danger', 'Error', request['message']);
              }
            }, (error) => {
              this.code_sent = false;
            });
          }
        } else if (this.type_sign == '2'){
          let data = {
            identification: this.number_id,
            enterprise_id: this.enterprise_id,
          }
          this.parent.answerService.getBiometricSignature(data).subscribe((response) => {
            if (!response['status']) {
              if (this.parent.trace_token == '') {
                this.trace_token = response['trace_token'];
                this.parent.trace_token = this.trace_token;
              } else {
                this.trace_token = this.parent.trace_token;
              }
              this.exist_user = true;
              let data = { type: "1" };
              this.parent.answerService.getBiometricToken(data).subscribe((token_response) => {
                this.rndInt = Math.floor(Math.random() * 4) + 1;
                this.action = this.radomAction(this.rndInt);
                //console.log("ingresa 3")
                let now_second_validate = new Date();
                let second_validate = now_second_validate.getTime() + 90000;
                let validate_time = true;
                this.minutes = 1;

                this.clock = this.source.subscribe(t => {
                  this.now = new Date();
                  this.end = new Date(second_validate);
                  if (validate_time) {
                    if (this.minutes <= 0 && this.seconds <= 0){
                      next_click = false;
                      validate_time = false;
                      this.authorization = false;
                      this.code_sent = false;
                      this.step_now = 1;
                      console.log("a7",this.step_now)
                      this.clock.unsubscribe();
                      prev.hostElement.nativeElement.click();
                      stepper.reset();
                    } else {
                      this.showDate();
                    }
                  }
                });
                if (response) {
                  this.tokenBio = token_response.token
                  this.tokenId = token_response.id
                  this.video_facial_visible = true;
                  if (!response['status']) {
                    this.exist_user = true;
                  }
                }
                this.loading = false;
                this.step_now += 2;
                console.log("a8",this.step_now)
                const contPrincnbCard = document.getElementById('contPrincnbCard');
                contPrincnbCard.style.setProperty("--my-tam", "100%");

              });
            }else{
              //console.log("ingresa 4")
              this.loading = false;
              this.step_now += 1;
              console.log("a9",this.step_now)
            }
          });
        }else{
          this.loading = false;
          this.step_now += 1;
          console.log("a10",this.step_now)
        }
        if (next_click) {
          next.hostElement.nativeElement.click();
        }

    }, (error) => {
      this.code_sent = false;
    });

  }

  onBackFirstStep(prev, stepper) {
    console.log(this.step_now)
    console.log(this.type_sign)
    this.authorization = false;
    this.code_sent = false;
    if (this.type_sign == 3 || this.type_sign == 4){
      this.step_now = 1;
    }
    if (this.type_sign == 1){
      this.step_now = 3;
    }
    console.log("a11",this.step_now)
    const contPrincnbCard = document.getElementById('contPrincnbCard');
    contPrincnbCard.style.setProperty("--my-tam", "95%");
    this.clock.unsubscribe();
    prev.hostElement.nativeElement.click();
    stepper.reset();
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
        return (this.email && this.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-.]+[.][a-zA-Z0-9.-]{2,}$/)) ? 'success' : 'danger';
      case 3:
        if (this.phone == '')
          return 'basic';
        return (this.phone && this.phone.toString().match(/^3[0-9]{9}$/)) ? 'success' : 'danger';
    }
  }

  pulsar(e) {
    if(this.phone != null){
      if(this.phone.toString().length<10){
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

  validForm(onlyPhone = false) {
    if (onlyPhone) {
      return (this.phone && this.phone.toString().match(/^3[0-9]{9}$/));
    }
    return (this.number_id && this.number_id.toString().length > 4) &&
      (this.email && this.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-.]+[.][a-zA-Z0-9.-]{2,}$/)) &&
      (this.phone && this.phone.toString().match(/^3[0-9]{9}$/));
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  startRecording(stream, lengthInMS) {
    let recorder = new MediaRecorder(stream);
    let data = [];

    recorder.ondataavailable = (event) => data.push(event.data);
    recorder.start();

    let stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = (event) => reject(event.name);
    });

    let recorded = new Promise(f => setTimeout(f, lengthInMS)).then(
      () => {
        if (recorder.state === "recording") {
          this.video_recording_visible = false;
          recorder.stop();
        }
      },
    );

    return Promise.all([
      stopped,
      recorded
    ])
      .then(() => data);
  }

  // Proceso para grabacion del video para chrome y android
  time_view(val,next){
    val = val -1
    this.reg_video = val
    if(this.reg_video == 0){
      window.clearInterval(this.interval);
      this.cont_reg_video=2
      let navegador = navigator.userAgent;
      let aux;
      if(navegador.match(/X11/i) || navegador.match(/Windows/i) ){
        aux=true
      }
      if(navegador.match(/Android/i) || navegador.match(/iPad/i) || navegador.match(/iPod/i) || navegador.match(/BlackBerry/i) || navegador.match(/Windows Phone/i) || navegador.match(/webOS/i) ){
        if(this.step_now != 6){
          aux={ facingMode: { exact: "environment" } }
        }else{
          aux={ facingMode: { exact: "user" } }
        }
      }
      this.video_recording_visible = true;
        navigator.mediaDevices.getUserMedia({
          video: aux
        }).then((stream) => {
          this.videoFacial.nativeElement.srcObject = stream;
          this.videoFacial.nativeElement.captureStream = this.videoFacial.nativeElement.captureStream || this.videoFacial.nativeElement.mozCaptureStream;
          return new Promise((resolve) => this.videoFacial.nativeElement.onplaying = resolve);

        }).then(() => this.startRecording(this.videoFacial.nativeElement.captureStream(), this.recordingTimeMS))
          .then((recordedChunks) => {
            let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
            this.recording.nativeElement.src = URL.createObjectURL(recordedBlob);
            this.blobToBase64(recordedBlob).then(
              (val: string) => {
                val = val.split("base64,")[1]
                this.Videobase64 = val;
                this.redBtn =0
                this.onSubmitBio(next)
                this.text_validation = false
              }
            )
          })
          .catch((error) => {
            if (error.name === "NotFoundError") {
              alert("No se encuentra camara ni microfono.");
            } else {
              alert(error);
            }
          });
    }
  }

  startRecord(next) {
    let navegador = navigator.userAgent;
    if(navegador.match(/iPhone/i)){
      //console.log(navegador.match(/iPhone/i))
      this.cont_video=2;
      window.clearInterval(this.interval2);
    }else if(navegador.match(/X11/i) || navegador.match(/Android/i) || navegador.match(/Windows/i) || navegador.match(/iPad/i) || navegador.match(/iPod/i) || navegador.match(/BlackBerry/i) || navegador.match(/Windows Phone/i) || navegador.match(/webOS/i) ){
      window.clearInterval(this.interval2);
      if(this.reg_video == 0){
        this.reg_video=3
        this.redBtn =1
        this.btn_video=true;
      }
      this.cont_video=1;
      this.cont_reg_video=1
      this.interval=setInterval(() => {
        this.time_view(this.reg_video,next);
      }, 500);
    }else{

    }
  }

  onFileSelectedVideo(event, next) {
    this.btn_video_2=true;
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        var val = reader.result + ''
        val = val.split("base64,")[1]
        if (file.size > 5000000){
          let tamano = file.size/1000000;
          this.tamanoVideoIos=tamano.toFixed(1);
          this.btn_video_2=false;
        }else{
          this.vid_file=2;
          this.Videobase64 = val;
          this.onSubmitBio(next);
          this.text_validation = false
        }

      };
    }
  }

  radomAction(rndInt) {
    let action;
    switch (rndInt) {
      case 1:
        action = "Gira la cabeza hacia la derecha";
        break;
      case 2:
        action = "Gira tu cabeza hacia la izquierda";
        break;
      case 3:
        action = "Mueve la cabeza hacia arriba y abajo";
        break;
      case 4:
        action = "Mueva la boca";
        break;

      default:
        action = 'No hay accion.';
    }
    return (action)
  }

  blobToBase64(blob) {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  validSecondForm() {
    return (this.doc_file != '') && (this.doc_file_back != '');
  }

  onSubmitOCR(next) {
    this.loading = true;
    let data = {
      type: "2"
    }
    this.toastService.showToast('info', 'Cargando', 'Generando Acceso');
    this.parent.answerService.getBiometricToken(data).subscribe((response) => {

      if (response) {
        let data = {
          id_api: response.id,
          token_api: response.token,
          image: this.doc_file,
          image_back: this.doc_file_back,
          user_id: this.user_id,
          document: this.number_id,
        }
        if (this.parent.trace_token){
          data['trace_token'] = this.parent.trace_token;
        }
        this.toastService.showToast('info', 'Cargando', 'Validando Documento');
        this.parent.answerService.getOCR(data).subscribe((response) => {
          if (response) {
            // this.document_ocr = response['document']
            // this.name_ocr = response['names'] + " " + response['lastnames']
            if (response['status'] == true) {
                if (this.parent.trace_token == '') {
                  this.trace_token = response['data']['trace_token'];
                  this.parent.trace_token = this.trace_token;
                } else {
                  this.trace_token = this.parent.trace_token;
                }

                // console.log('trace_token');
                // console.log(this.trace_token);
                this.toastService.showToast('info', 'Cargando', 'Verificando Estado de la Persona');
                let data = {
                  user_id: this.user_id,
                  identification: this.number_id,
                  trace_token: this.trace_token,
                  idForm:this.idForm,
                  exp_date: response['data']['parameters']['extra']['fech_exp'],
                }

                this.parent.answerService.getDocumentInfoANI(data).subscribe((response) => {
                  console.log("Validacion con ANI")
                  console.log(response)
                  if (response['status']) {
                    if (response['data']['alive']) {
                      this.step_now += 1;
                      const contPrincnbCard = document.getElementById('contPrincnbCard');
                      contPrincnbCard.style.setProperty("--my-tam", "100%");
                      console.log("a12",this.step_now)
                      this.name = response['data']['name'];
                      next.hostElement.nativeElement.click();
                      this.loading = false;
                    } else {
                      this.loading = false;
                      this.parent.dialogRefBio.close();
                      this.toastService.showToast('danger', 'Error', 'Problema con la validación de datos de la persona.');
                    }
                  }else{
                    if (response['message']=='No tiene creditos'){
                      this.loading = false;
                      this.toastService.showToast('danger', 'COD:AP501', 'No se puede realizar el proceso con la registraduría, comuniquese con su administrador.');
                    }else{
                      this.loading = false;
                      this.toastService.showToast('danger', 'COD:AP502',response['message'] );
                    }
                  }
                });
            } else {
              this.toastService.showToast('danger', 'Error', response['message']);
              this.loading = false;
            }
          } else {
            this.toastService.showToast('danger', 'Error', response['message']);
            this.loading = false;
          }
        }, error => {
          this.toastService.showToast('danger', 'Error', response['message']);
          this.loading = false;
        });
      }
    }, error => {
      this.loading = false;
      this.parent.dialogRefBio.close();
      this.toastService.showToast('danger', 'Error', 'Problema en los servicios, intentalo mas tarde.');
    });
  }

  onFileSelected(event, back=0 ) {
    const file: File = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.imagePreview = reader.result;
        var val = reader.result + ''
        val = val.split("base64,")[1]
        // console.log("Carga imagen")
        // console.log(back)
        // console.log(val)
        if (back){
          //carga parte posterior
          this.doc_file_back = val;
          this.imagePrincVideo2="data:image/png;base64," + val;
          this.elimination2=false
          this.video_recording_visible_docu_back=false
        } else {
          //carga parte frontal
          this.doc_file = val;
          this.imagePrincVideo1="data:image/png;base64," + val;
          this.elimination1=false
          this.video_recording_visible_docu=false
        }
        this.validate_visible = true;
      };
    } else {
      if (back){
        this.doc_file_back = '';
      } else {
        this.doc_file = '';
      }

    }
  }

  validFourthForm () {
    return (this.Videobase64 != '')
  }

  onSubmitBio(next) {
    this.loading = true;
    let data = {
      id_api: this.tokenId,
      token_api: this.tokenBio,
      action: this.rndInt,
      video: this.Videobase64,
      user_id: this.user_id,
      document_id: this.number_id,
      trace_token: this.trace_token
    }
    this.parent.answerService.getBiometricMatch(data).subscribe((response) => {
      this.video_facial_visible = false;
      if (response['video-result']['alive'] == true) {
        if (!this.exist_user) {
          this.file_visible = true;
          // this.toastService.showToast('success', 'Documento', 'Porfavor ingresa una imagen de tu cedula por el lado frontal');
          this.image64 = response['video-result']['picture']
        } else {
          this.validate_visible = true;
          this.image64 = response['video-result']['picture']
        }
        // Finalización del proceso validando y guardando todo los datos.
        this.imageMatch(next);
      } else {
        this.Videobase64 = '';
        this.toastService.showToast('warning', 'BioFacial', 'Por favor vuelve a realizar la grabación e inténtalo de nuevo');
        this.loading = false;

        if(this.cont_video==1){
          this.btn_video=false;
          this.text_validation = true
        }else if(this.cont_video==2){
          this.text_validation = true
          this.vid_file=1
          this.InputVar.nativeElement.value = "";
        }

      }
    });
  }

  imageMatch(next) {
    let data = {
      id_api: this.tokenId,
      token_api: this.tokenBio,
      image1: this.image64,
      image2: this.doc_file,
      user_id: this.user_id,
      document_id: this.number_id,
      trace_token: this.trace_token
    }
    if (!this.exist_user) {
      this.toastService.showToast('info', 'Biometría', 'Verificando similitud.');
      this.parent.answerService.getImageMatch(data).subscribe((response) => {
        if (response['similarity'] > 0.7) {
          this.OCR(next);
        } else {
          this.toastService.showToast('danger', 'Error', "Intente nuevamente");
          this.loading = false;
          if(this.cont_video==1){
            this.btn_video=false;
            this.text_validation = true
          }else if(this.cont_video==2){
            this.text_validation = true
            this.vid_file=1
            this.InputVar.nativeElement.value = "";
          }
        }
      });
    } else {
      let data = {
        name: this.name,
        id_api: this.tokenId,
        enterprise: this.enterprise_id,
        token_api: this.tokenBio,
        image1: this.image64,
        user_id: this.user_id,
        document_id: this.number_id,
        ip_address: this.ipAddress,
        trace_token: this.trace_token
      }
      let close;
      this.toastService.showToast('info', 'Biometría', 'Verificando similitud y validando el proceso.');
      this.parent.answerService.getImageMatchForm(data).subscribe((response) => {
        if (response['similarity'] > 0.7) {
          this.parent.fields[this.field]['answer'] = 'FIRMADO CON EXITO-' + response['data'];
          //this.toastService.showToast('success', 'Firma Registrada', 'Se ha registrado la firma Biometrica con exito.');
          this.step_now += 1;
          console.log("a14",this.step_now)
          const contPrincnbCard = document.getElementById('contPrincnbCard');
          contPrincnbCard.style.setProperty("--my-tam", "100%");
          this.loading = false;
          this.validateFinally();
        } else {
          this.loading = false;
          this.toastService.showToast('danger', 'Error', 'Intentelo de nuevo');
        }
      }, null, ()=>{
        if (close) {
          // this.parent.dialogRefBio.close();
          next.hostElement.nativeElement.click();
          this.step_now += 1;
          console.log("a15",this.step_now)
          this.loading = false;
        }
      });
    }
  }

  validateFinally(){
    setTimeout(() => {
      this.loading = false;
      this.toastService.showToast('success', 'Firma Registrada', 'Se ha registrado la firma Biometrica con exito.');
      //close = true;
      this.close();
    }, 7000);
  }

  OCR(next){
    let data = {
      name: this.name,
      identification: this.number_id,
      enterprise_id: this.enterprise_id,
      user_id: this.user_id,
      image_enrolment: this.image64,
      image_document: this.doc_file,
      image_back: this.doc_file_back,
      // photo_document: this.doc_file_document,
      // photo_back: this.doc_file_back_document,
      email: this.email,
      phone: this.phone.toString(),
      token: this.token,
      ip_address: this.ipAddress,
      trace_token: this.trace_token
    }

    this.toastService.showToast('info', 'Biometría', 'Validando todo el proceso.');
    this.parent.answerService.enrolmentUser(data).subscribe((response) => {
      if (response['status']) {
        this.parent.fields[this.field]['answer'] = 'FIRMADO CON EXITO-' + response['data'];
        this.toastService.showToast('success', 'Firma Registrada', 'Se ha registrado la firma biometrica con exito.');
        // this.parent.dialogRefBio.close();
        next.hostElement.nativeElement.click();
        this.step_now += 1;
        console.log("a16",this.step_now)
        this.loading = false;
      } else {
        this.toastService.showToast('danger', 'Error', response['message']);
        this.loading = false;
      }
    });
  }

  onSubmitOTP(next) {
    this.loading = true;
    next.hostElement.nativeElement.click();

    if (this.type_sign == '1') {
      let data = {
        name: this.name,
        phone: this.phone.toString(),
        email: this.email,
        identification: this.number_id,
        token: this.token,
        enterprise_id: this.enterprise_id,
        user_id: this.user_id,
        ip_address: this.ipAddress,
        trace_token: this.trace_token
      }
      this.parent.answerService.registerElectronicSignature(data).subscribe((response) => {
        if (response['status']){
          this.parent.fields[this.field]['answer'] = 'FIRMADO CON EXITO-'+response['data'];
          this.toastService.showToast('success', 'Firma Registrada', 'Se ha registrado la firma electrónica con exito.');
          this.step_now = 3;
          console.log("a17",this.step_now)
          next.hostElement.nativeElement.click();
          this.loading = false;
          this.close();
        } else {
          this.toastService.showToast('danger', 'Error', response['message']);
        }
      });
    }else if (this.type_sign == '2') {
      let data = {
        phone: this.phone.toString(),
        email: this.email,
        identification: this.number_id,
        token: this.token,
        enterprise_id: this.enterprise_id,
        user_id: this.user_id,
      }
      this.parent.answerService.getBiometricSignature(data).subscribe((response) => {
        let data = { type: "1" };
        this.parent.answerService.getBiometricToken(data).subscribe((token_response) => {
          this.rndInt = Math.floor(Math.random() * 4) + 1;
          this.action = this.radomAction(this.rndInt);
          if (response) {
            this.tokenBio = token_response.token
            this.tokenId = token_response.id
            this.video_facial_visible = true;
            if (!response['status']) {
              this.exist_user = true;
            }
          }
          this.loading = false;
          this.step_now += 1;
          console.log("a18",this.step_now)
          const contPrincnbCard = document.getElementById('contPrincnbCard');
          contPrincnbCard.style.setProperty("--my-tam", "100%");
          this.interval2 = setInterval(() => {
            let content2:HTMLElement= document.getElementById('btnBio') as HTMLElement;
            content2.click();
          }, 1000);

        });
      });
    } else {
      this.parent.dialogRefBio.close();
    }

  }

  close() {
    this.parent.dialogRefBio.close();
  }

  toggle(checked: boolean){
    this.check_id=checked
  }

startRecordingDocument(stream, lengthInMS) {
  let recorder = new MediaRecorder(stream);
  let data = [];

  setTimeout(() => {
    recorder.ondataavailable = (event) => data.push(event.data);
    recorder.start();
  }, 3000)

  let stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = (event) => reject(event.name);
  });


  let recorded = new Promise(f => setTimeout(f, lengthInMS)).then(
    () => {
      if (recorder.state === "recording") {
        this.video_recording_visible_docu = false;
        recorder.stop();
      }
    },
  );

  return Promise.all([
    stopped,
    recorded
  ])
    .then(() => data);
}

time_view_document(val,next, backDocument=0){
  val = val -1
  this.reg_video = val
  this.video_recording_visible_docu = true;
  if(this.reg_video == 0){
    window.clearInterval(this.interval);
    this.cont_reg_video_docu=2
    let navegador = navigator.userAgent;
    let aux;
    if(navegador.match(/X11/i) || navegador.match(/Windows/i) ){
      aux=true
    }
    if(navegador.match(/Android/i) || navegador.match(/iPad/i) || navegador.match(/iPod/i) || navegador.match(/BlackBerry/i) || navegador.match(/Windows Phone/i) || navegador.match(/webOS/i) ){
      if(this.step_now != 6){
        aux={ facingMode: { exact: "environment" } }
      }else{
        aux={ facingMode: { exact: "user" } }
      }
    }
    this.video_recording_visible_docu = true;
      navigator.mediaDevices.getUserMedia({
        video: aux
      }).then((stream) => {
        this.videoFacial.nativeElement.srcObject = stream;
        this.videoFacial.nativeElement.captureStream = this.videoFacial.nativeElement.captureStream || this.videoFacial.nativeElement.mozCaptureStream;
        return new Promise((resolve) => this.videoFacial.nativeElement.onplaying = resolve);

      }).then(() => this.startRecordingDocument(this.videoFacial.nativeElement.captureStream(), this.recordingTimeMSD))
        .then((recordedChunks) => {
          let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
          this.recording.nativeElement.src = URL.createObjectURL(recordedBlob);
          this.blobToBase64(recordedBlob).then(
            (val: string) => {
              // console.log(val)
              let videoP;
              videoP=val
              val = val.split("base64,")[1]
              this.VideoDocumentbase64 = val;
              if (backDocument == 0){
                // console.log("parte trasera")
                this.siteService.postFrameVideo(videoP,this.number_id.toString()).subscribe(
                    response => {
                    // console.log("IMAGEN2")
                    this.imageVideo1=response['image']
                    // console.log(this.imageVideo1)
                    this.doc_file_back = this.imageVideo1;
                    this.imageVideo1="data:image/png;base64," + this.imageVideo1;
                });
              } else {
                // console.log("parte frontal")
                this.siteService.postFrameVideo(videoP,this.number_id.toString()).subscribe(
                    response => {
                    // console.log("IMAGEN")
                    this.imageVideo1=response['image']
                    // console.log(this.imageVideo1)
                    this.doc_file = this.imageVideo1;
                    this.imageVideo1="data:image/png;base64," + this.imageVideo1;
                });
              }
              this.validate_visible = true;
              //this.redBtn =0
              //this.onSubmitOCR(next)
              //this.onSubmitBio(next)
              this.text_validation = false
            }
          )
        })
        .catch((error) => {
          if (error.name === "NotFoundError") {
            alert("No se encuentra camara ni microfono.");
          } else {
            alert(error);
          }
        });
  }
}

repetitionStardCaptureDocument(option,next, number){
  // console.log("Repet")
  // console.log(option,next, number)
  const idContVideo1 = document.getElementById('idContVideo1');
  idContVideo1.style.setProperty("--my-var2", "#000000c4");
  const divdivContImage1 = document.getElementById('divContImage1');
  divdivContImage1.style.setProperty("--my-var", "#412378");
  this.countImage1=false
  this.textImage1=false
  this.countTextImage1=true
  this.btnImage1End=true
  this.btnImage2End=true
  this.spanImage1=false
  this.reg_video=3
  this.imageVideo1="./assets/images/biofacial/documento_frontal.png"
  if (option != 0)
    this.stardCaptureDocument(option,next, number)
}

stardCaptureDocument(option,next, number){

  if (option == 1 || option == 2) {
    // console.log("1")
    // console.log(option,next, number)
    // console.log(this.reg_video)
    this.ContPrinc1=true
    this.ContVideo1=false
    if (option == 1) {
      this.imageGeneral="./assets/images/biofacial/documento_frontal.png";
      this.textGeneral="FRONTAL"
    }else{
      this.imageGeneral="./assets/images/biofacial/CEDULA_TRASERA.png";
      this.textGeneral="TRASERA"
    }
    let navegador = navigator.userAgent;
      if(navegador.match(/iPhone/i)){
        //console.log(navegador.match(/iPhone/i))
        window.clearInterval(this.interval2);
      }else if(navegador.match(/X11/i) || navegador.match(/Android/i) || navegador.match(/Windows/i) || navegador.match(/iPad/i) || navegador.match(/iPod/i) || navegador.match(/BlackBerry/i) || navegador.match(/Windows Phone/i) || navegador.match(/webOS/i) ){
        this.cont_reg_video_docu=1
        this.interval=setInterval(() => {
          this.time_view_document(this.reg_video,next, number);
        }, 100);
      }else{

      }

    setTimeout(() => {
      const divdivContImage1 = document.getElementById('divContImage1');
      divdivContImage1.style.setProperty("--my-var", "#2eff00cc");
      this.countImage1=true
      this.textImage1=true
      this.countTextImage1=false
      this.textCountImage1=3
    }, 3500);
    setTimeout(() => {
      this.textCountImage1=2
    }, 5000);
    setTimeout(() => {
      this.textCountImage1=1
    }, 6000);
    setTimeout(() => {
      this.textCountImage1=0
      if(option==1){
        this.btnImage1End=false
      }else{
        this.btnImage2End=false
      }
      this.spanImage1=true
      const idContVideo1 = document.getElementById('idContVideo1');
      idContVideo1.style.setProperty("--my-var2", "#412378");
      const divdivContImage1 = document.getElementById('divContImage1');
      divdivContImage1.style.setProperty("--my-var", "#EDF1F7");
    }, 6500);

  }else if (option == 3){
    // console.log("3")
    this.imagePrincVideo1=this.imageVideo1
    this.ContPrinc1=false
    this.ContVideo1=true
    this.cont_reg_video_docu=1
    this.elimination1=false
    this.repetitionStardCaptureDocument(0,0,0)
  }else{
    // console.log("4")
    this.imagePrincVideo2=this.imageVideo1
    this.ContPrinc1=false
    this.ContVideo1=true
    this.cont_reg_video_docu=1
    this.elimination2=false
    if(this.doc_file == '')
      this.video_recording_visible_docu=true
    this.video_recording_visible_docu_back=false
    this.repetitionStardCaptureDocument(0,0,0)
  }

}

startRecordDocument(next, number) {
  let navegador = navigator.userAgent;
  if(navegador.match(/iPhone/i)){
    //console.log(navegador.match(/iPhone/i))
    this.cont_video_docu=2;
    window.clearInterval(this.interval2);
  }else if(navegador.match(/X11/i) || navegador.match(/Android/i) || navegador.match(/Windows/i) || navegador.match(/iPad/i) || navegador.match(/iPod/i) || navegador.match(/BlackBerry/i) || navegador.match(/Windows Phone/i) || navegador.match(/webOS/i) ){
    window.clearInterval(this.interval2);
    if(this.reg_video == 0){
      this.reg_video=3
      this.redBtn =1
      this.btn_video=true;
    }
    this.cont_video_docu=1;
    this.cont_reg_video_docu=1
    this.interval=setInterval(() => {
      this.time_view_document(this.reg_video,next, number);
    }, 500);
  }else{

  }
}
startRecordingDocumentBack(stream, lengthInMS) {
  let recorder = new MediaRecorder(stream);
  let data = [];

  setTimeout(() => {
    recorder.ondataavailable = (event) => data.push(event.data);
    recorder.start();
  }, 3000);

  let stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = (event) => reject(event.name);
  });

  let recorded = new Promise(f => setTimeout(f, lengthInMS)).then(
    () => {
      if (recorder.state === "recording") {
        this.video_recording_visible_docu_back = false;
        recorder.stop();
      }
    },
  );

  return Promise.all([
    stopped,
    recorded
  ])
    .then(() => data);
}

time_view_document_back(val,next, backDocument=0){
  val = val -1
  this.reg_video = val
  if(this.reg_video == 0){
    window.clearInterval(this.interval);
    this.cont_reg_video_docu_back=2
    let navegador = navigator.userAgent;
    let aux;
    if(navegador.match(/X11/i) || navegador.match(/Windows/i) ){
      aux=true
    }
    if(navegador.match(/Android/i) || navegador.match(/iPad/i) || navegador.match(/iPod/i) || navegador.match(/BlackBerry/i) || navegador.match(/Windows Phone/i) || navegador.match(/webOS/i) ){
      if(this.step_now != 6){
        aux={ facingMode: { exact: "environment" } }
      }else{
        aux={ facingMode: { exact: "user" } }
      }
    }
    this.video_recording_visible_docu_back = true;
      navigator.mediaDevices.getUserMedia({
        video: aux
      }).then((stream) => {
        this.videoFacial.nativeElement.srcObject = stream;
        this.videoFacial.nativeElement.captureStream = this.videoFacial.nativeElement.captureStream || this.videoFacial.nativeElement.mozCaptureStream;
        return new Promise((resolve) => this.videoFacial.nativeElement.onplaying = resolve);

      }).then(() => this.startRecordingDocumentBack(this.videoFacial.nativeElement.captureStream(), this.recordingTimeMSDB))
        .then((recordedChunks) => {
          let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
          this.recording.nativeElement.src = URL.createObjectURL(recordedBlob);
          this.blobToBase64(recordedBlob).then(
            (val: string) => {
              val = val.split("base64,")[1]
              // console.log("val::::::.");
              // console.log(val);
              this.VideoDocumentbase64 = val;
              if (backDocument == 0){
                this.doc_file_back = val;
                // console.log("parte trasera")
              } else {
                this.doc_file = val;
                // console.log("parte frontal")
              }
              this.validate_visible = true;
              //this.redBtn =0
              //this.onSubmitOCR(next)
              //this.onSubmitBio(next)
              this.text_validation = false
            }
          )
        })
        .catch((error) => {
          if (error.name === "NotFoundError") {
            alert("No se encuentra camara ni microfono.");
          } else {
            alert(error);
          }
        });

  }
}

startRecordDocumentBack(next, number) {
  let navegador = navigator.userAgent;
  if(navegador.match(/iPhone/i)){
    //console.log(navegador.match(/iPhone/i))
    this.cont_video_docu_back=2;
    window.clearInterval(this.interval2);
  }else if(navegador.match(/X11/i) || navegador.match(/Android/i) || navegador.match(/Windows/i) || navegador.match(/iPad/i) || navegador.match(/iPod/i) || navegador.match(/BlackBerry/i) || navegador.match(/Windows Phone/i) || navegador.match(/webOS/i) ){
    window.clearInterval(this.interval2);
    if(this.reg_video == 0){
      this.reg_video=3
      this.redBtn =1
      this.btn_video=true;
    }
    this.cont_video_docu_back=1;
    this.cont_reg_video_docu_back=1
    this.interval=setInterval(() => {
      this.time_view_document_back(this.reg_video,next, number);
    }, 500);
  }else{

  }
}
EliminarImagen(image){
  if (image==1) {
    this.imageVideo1=''
    this.imagePrincVideo1="./assets/images/biofacial/documento_frontal.png";
    this.elimination1=true
    this.video_recording_visible_docu=true
    this.doc_file = ''
    this.myInputVariable.nativeElement.value = '';
    this.repetitionStardCaptureDocument(0,0,0)
  }else{
    this.imagePrincVideo2="./assets/images/biofacial/CEDULA_TRASERA.png";
    this.elimination2=true
    this.doc_file_back=''
    this.myInputVariable2.nativeElement.value = '';
    this.video_recording_visible_docu_back=true
    this.repetitionStardCaptureDocument(0,0,0)
  }
}

}
