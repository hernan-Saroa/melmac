import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { FormComponent } from '../../form.component';
import { CodeInputComponent } from 'angular-code-input';
import { timer } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../usable/toast.service';
import { SiteService } from '../../../../services/site.service';
import { AnswerService } from '../../../../services/answer.service';
import { ConfirmDialog } from '../../../../pages/form/view/view.component';

declare var MediaRecorder: any;

@Component({
    selector: 'ngx-bio',
    templateUrl: './bio.component.html',
    styleUrls: ['./bio.component.scss'],
    standalone: false
})
export class BioComponent implements OnInit {

  loading = false;

  // Refencia de datos Requeridos
  field; // index del campo
  parent: FormComponent;
  type_user;
  user;

  // Ubicación paso a paso
  step_now = 1;

  // Data paso 1
  name;
  phone: string;
  email: string;
  number_id: string;
  check_id:boolean;
  phoneObject: any = null;
  phone_ind: string = '+0';
  token_service_score = '';

  // Trazabilidad
  trace_token;

  exist_user = false;
  envelope = false
  navigator: string;
  ipAddress: string;
  sign_name = 'reconocimiento facial';
  token;
  enterprise_id;
  user_id;
  rndInt;

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
  type_video = 0;
  time_stamp;
  list_time_stamp = [];

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
  localstream=null
  loadingGif=''
  pathGif='./assets/images/gifs/validate'
  itemsErrors: string[] = []
  valueProgress = 0

  @ViewChild('codeInput') codeInput !: CodeInputComponent;
  @ViewChild('fileUpload') myInputVariable: ElementRef;
  @ViewChild('backUpload') myInputVariable2: ElementRef;

  style_modal = "height: 35rem; max-width: 850px;";

  constructor(
    public dialogRef: NbDialogRef<BioComponent>,
    private toastService: ToastService,
    private siteService: SiteService,
    private answerService:AnswerService,
    private http:HttpClient,
  ) {

  }

  ngOnInit(): void {
    this.getIPAddress();
    this.navigator = this.getBrowser()
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

  getStyleModal() {
    let style_modal = "height: 26rem; max-width: 650px;";
    switch (this.step_now) {
      case 1:
        style_modal = "height: 26rem; max-width: 650px;";
        break;
      case 2:
        if(this.itemsErrors.length > 0) {
          style_modal = "height: 26rem; max-width: 650px;";
        } else {
          style_modal = "height: 35rem; max-width: 850px;";
        }
        break;
      case 3:
        style_modal = "height: 21rem; max-width: 850px;";
        break;
      case 4:
        style_modal = "height: 22rem; max-width: 650px;";
        break;
      case 5:
        style_modal = "height: 30rem; max-width: 850px;";
        break;
      case 6:
        style_modal = "height: 44rem; max-width: 850px;";
        break;
      case 7:
        if(this.loadingGif != '' && this.loadingGif.includes('success')) {
          style_modal = "height: 26rem; max-width: 650px;";
        } else {
          style_modal = "height: 32rem; max-width: 850px;";
        }
        break;

      default:
        break;
    }
    if(this.loadingGif != '' && this.loadingGif.includes('.gif')) {
      style_modal += ' border: none; background: transparent;'
    }
    return style_modal;
  }

  validFirstStep() {
    let validatePhone = false
    if(this.phoneObject && this.phone) {
      validatePhone = this.phoneObject.s.dialCode == 57 ? (this.phone.toString().match(/^3[0-9]{9}$/) ? true : false) : (this.phone.toString().length > 4 ? true : false);
    }
    return (this.number_id && this.number_id.toString().length > 4) &&
      (this.email && this.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-.]+[.][a-zA-Z0-9.-]{2,}$/)) && (this.check_id) &&
      validatePhone;
  }

  validSecondForm() {
    return (this.doc_file != '') && (this.doc_file_back != '');
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

  resetErrors(backStep = false) {
    this.loadingGif = '';
    this.itemsErrors = [];
    if(backStep) {
      if (this.step_now == 6) {
        this.video_recording_visible = true;
        this.startRecord(); // volver a grabar video
      } else {
        this.close() // cerrar el Modal
        //this.step_now = 2; // volver a subir las imagenes de la cedula
      }
    }
  }

  viewValidteError(btn = false){
    if(this.loadingGif) {
      if(btn) {
        return this.loadingGif.includes('error');
      }
      return !this.loadingGif.includes('.gif');
    }
    return false
  }

  setMessageInfo() {
    if(this.loadingGif) {
      return this.loadingGif.includes('success') ?
        '¡VALIDACIÓN REALIZADA CON INTELIGENCIA ARTIFICIAL, EXITOSA!' :
        '¡UPS! HEMOS ENCONTRADO LAS SIGUIENTES FALLAS EN ESTA VALIDACIÓN:';
    }
    return ''
  }

  toggle(checked: boolean){
    this.check_id=checked
  }

  onFirstSubmit() {
    this.loading = true;

    this.siteService.requestAuthorization(this.email, this.parent.trace_token, this.sign_name, this.parent.fields[this.field]['field']).subscribe(response => {
      this.trace_token = response['trace_token'];
      this.parent.trace_token = this.trace_token;

      let data = {
        identification: this.number_id,
        enterprise_id: this.enterprise_id,
        form_id: this.parent.id,
        field_type: this.parent.fields[this.field]['field_type'],
        validateProfile: true
      }
      if (this.token_service_score){
        data['token_service_score'] = this.token_service_score;
      }

      this.answerService.getBiometricSignature(data).subscribe((response) => {
        if(response.hasOwnProperty('token_service_score')) {
          this.token_service_score = response['token_service_score']
        }
        if (response['status']) {
          // No existe, usuario enrolado (Primera vez)
          this.loading = false;
          this.step_now += 1;
        } else {
          // ya existe (Se salta paso de primera vez)
          if (this.parent.trace_token == '') {
            this.trace_token = response['trace_token'];
            this.parent.trace_token = this.trace_token;
          } else {
            this.trace_token = this.parent.trace_token;
          }
          this.exist_user = true;
          let data = { type: "1" };

          this.answerService.getBiometricToken(data).subscribe((token_response) => {
            this.rndInt = Math.floor(Math.random() * 4) + 1;
            this.action = this.radomAction(this.rndInt);

            if (response) {
              this.tokenBio = token_response['token']
              this.tokenId = token_response['id']
              this.video_facial_visible = true;
            }
            // this.loading = false;
            // this.step_now += 2;
            this.getTokenByPhone(this.step_now + 2)
          });
        }
      });
    }, (error) => {
      // this.code_sent = false;
    });
  }

  onSubmitOCR() {
    this.loading = true;
    this.loadingGif = `${this.pathGif}-information.gif`;
    let data = {
      type: "2"
    }
    // this.toastService.showToast('info', 'Cargando', 'Generando Acceso');

    this.answerService.getBiometricToken(data).subscribe((response) => {
      if (response) {
        let answer_data = {
          form_id: this.parent.id,
          source: 1,
          field_id: this.parent.fields[this.field]['field'],
        }
        if(this.parent.position){
          answer_data['position'] = this.parent.position;
        }
        if(this.parent.answer_id){
          answer_data['answer_id'] = this.parent.answer_id;
        }
        let data = {
          id_api: response['id'],
          token_api: response['token'],
          image: this.doc_file,
          image_back: this.doc_file_back,
          user_id: this.user_id,
          document: this.number_id,
          answer_data: answer_data,
          field_id: answer_data.field_id,
          enterprise: this.enterprise_id
        }
        if (this.parent.trace_token){
          data['trace_token'] = this.parent.trace_token;
        }
        if (this.token_service_score){
          data['token_service_score'] = this.token_service_score;
        }
        // this.toastService.showToast('info', 'Cargando', 'Validando Documento');
        this.answerService.getOCR(data).subscribe((response) => {
          if (response) {
            // this.document_ocr = response['document']
            // this.name_ocr = response['names'] + " " + response['lastnames']
            if(response.hasOwnProperty('token_service_score')) {
              this.token_service_score = response['token_service_score']
            }
            if (response['status'] == true) {
                if (this.parent.trace_token == '') {
                  this.trace_token = response['data']['trace_token'];
                  this.parent.trace_token = this.trace_token;
                } else {
                  this.trace_token = this.parent.trace_token;
                }

                // this.toastService.showToast('info', 'Cargando', 'Verificando Estado de la Persona');
                let data = {
                  user_id: this.user_id,
                  identification: this.number_id,
                  trace_token: this.trace_token,
                  idForm: this.parent.token_link,
                  exp_date: response['data']['parameters']['extra']['fech_exp'],
                  nac_date: response['data']['parameters']['extra']['fech_nac'],
                  field_type: this.parent.fields[this.field]['field_type'],
                  answer_data: answer_data,
                  field_id: this.parent.fields[this.field]['field']
                }
                if(this.token_service_score) {
                  data['token_service_score'] = this.token_service_score
                }
                if(this.type_user) data['type_user'] = this.type_user
                if(this.user) data['user'] = this.user

                this.answerService.getDocumentInfoANI(data).subscribe((response) => {
                  if(response.hasOwnProperty('token_service_score')) {
                    this.token_service_score = response['token_service_score']
                  }
                  if (response['status']) {
                    if (response['data']['alive']) {
                      // this.step_now += 1;
                      this.name = response['data']['name'];
                      // this.loading = false;
                      this.code_sent = true;
                      this.visible = true;
                      // this.toastService.showToast('info', 'Cargando', 'Generando código OTP');
                      this.getTokenByPhone(2)
                    } else {
                      if(response.hasOwnProperty('answer_id')) {
                        this.parent.answer_id = response['answer_id']
                      }
                      let closeDialog = this.parent.validateAttempts(this.field)
                      if(closeDialog) this.close()
                      this.loadingGif = `${this.pathGif}-error.png`;
                      this.loading = false;
                      this.parent.dialogRefBio.close();
                      this.toastService.showToast('danger', 'Error', 'Problema con la validación de datos de la persona.');
                    }
                  }else{
                    if(response.hasOwnProperty('answer_id')) {
                      this.parent.answer_id = response['answer_id']
                    }
                    let closeDialog = this.parent.validateAttempts(this.field)
                    if(closeDialog) this.close()
                    this.loadingGif = `${this.pathGif}-error.png`;
                    if (response['message']=='No tiene creditos'){
                      this.loading = false;
                      let msj = 'No se puede realizar el proceso con la registraduría, comuniquese con su administrador.'
                      this.itemsErrors.push(msj)
                      // this.toastService.showToast('danger', 'COD:AP501', msj);
                    }else{
                      this.loading = false;
                      this.itemsErrors.push(response['message'])
                      // this.toastService.showToast('danger', 'COD:AP502',response['message'] );
                    }
                  }
                });
            } else {
              if(response.hasOwnProperty('answer_id')) {
                this.parent.answer_id = response['answer_id']
              }
              let closeDialog = this.parent.validateAttempts(this.field)
              if(closeDialog) this.close()
              this.loadingGif = `${this.pathGif}-error.png`;
              this.itemsErrors.push(response['message'])
              // this.toastService.showToast('danger', 'Error', response['message']);
              this.loading = false;
            }
          } else {
            this.loadingGif = `${this.pathGif}-error.png`;
            this.itemsErrors.push(response['message'])
            // this.toastService.showToast('danger', 'Error', response['message']);
            this.loading = false;
          }
        }, error => {
          this.loadingGif = `${this.pathGif}-error.png`;
          this.itemsErrors.push(response['message'])
          // this.toastService.showToast('danger', 'Error', response['message']);
          this.loading = false;
        });
      }
    }, error => {
      this.loadingGif = `${this.pathGif}-error.png`;
      this.loading = false;
      this.parent.dialogRefBio.close();
      this.toastService.showToast('danger', 'Error', 'Problema en los servicios, intentalo mas tarde.');
    });
  }

  onSubmitOTP() {
    this.loading = true;

    let data = {
      phone: this.phone.toString(),
      email: this.email,
      identification: this.number_id,
      token: this.token,
      enterprise_id: this.enterprise_id,
      user_id: this.user_id,
    }
    if(this.type_user) data['type_user'] = this.type_user
    if(this.user) data['user'] = this.user
    this.answerService.getBiometricSignature(data).subscribe((response) => {
      let data = { type: "1" };
      this.answerService.getBiometricToken(data).subscribe((token_response) => {
        this.rndInt = Math.floor(Math.random() * 4) + 1;
        this.action = this.radomAction(this.rndInt);
        if (response) {
          this.tokenBio = token_response['token']
          this.tokenId = token_response['id']
          this.video_facial_visible = true;
          if (!response['status']) {
            this.exist_user = true;
          }
        }
        this.loading = false;
        this.step_now += 1;

        this.interval2 = setInterval(() => {
          let content2:HTMLElement= document.getElementById('btnBio') as HTMLElement;
          content2.click();
        }, 1000);

      });
    });
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

  stardCaptureDocument(option, number){

    if (option == 1 || option == 2) {
      this.ContPrinc1=true
      this.ContVideo1=false
      if (option == 1) {
        this.imageGeneral="./assets/images/biofacial/documento_frontal.png";
        this.textGeneral="FRONTAL"
      } else {
        this.imageGeneral="./assets/images/biofacial/CEDULA_TRASERA.png";
        this.textGeneral="TRASERA"
      }
      let navegador = navigator.userAgent;
        if (navegador.match(/iPhone/i)) {
          window.clearInterval(this.interval2);
        } else if (navegador.match(/X11/i) || navegador.match(/Android/i) || navegador.match(/Windows/i) || navegador.match(/iPad/i) || navegador.match(/iPod/i) || navegador.match(/BlackBerry/i) || navegador.match(/Windows Phone/i) || navegador.match(/webOS/i) || navegador.match(/Mac OS/i) ){
          this.cont_reg_video_docu=1
          this.interval=setInterval(() => {
            this.time_view_document(this.reg_video, number);
          }, 100);
        } else {

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
      }, 6500);

    } else if (option == 3) {
      this.imagePrincVideo1=this.imageVideo1
      this.ContPrinc1=false
      this.ContVideo1=true
      this.cont_reg_video_docu=1
      this.elimination1=false
      this.repetitionStardCaptureDocument(0,0)
    } else {
      this.imagePrincVideo2=this.imageVideo1
      this.ContPrinc1=false
      this.ContVideo1=true
      this.cont_reg_video_docu=1
      this.elimination2=false
      if(this.doc_file == '')
        this.video_recording_visible_docu=true
      this.video_recording_visible_docu_back=false
      this.repetitionStardCaptureDocument(0,0)
    }

  }

  repetitionStardCaptureDocument(option, number){
    this.countImage1=false
    this.textImage1=false
    this.countTextImage1=true
    this.btnImage1End=true
    this.btnImage2End=true
    this.spanImage1=false
    this.reg_video=3
    this.imageVideo1="./assets/images/biofacial/documento_frontal.png"
    if (option != 0)
      this.stardCaptureDocument(option, number)
  }
  EliminarImagen(image){
    if (image==1) {
      this.imageVideo1=''
      this.imagePrincVideo1="./assets/images/biofacial/documento_frontal.png";
      this.elimination1=true
      this.video_recording_visible_docu=true
      this.doc_file = ''
      this.myInputVariable.nativeElement.value = '';
      this.repetitionStardCaptureDocument(0,0)
    }else{
      this.imagePrincVideo2="./assets/images/biofacial/CEDULA_TRASERA.png";
      this.elimination2=true
      this.doc_file_back=''
      this.myInputVariable2.nativeElement.value = '';
      this.video_recording_visible_docu_back=true
      this.repetitionStardCaptureDocument(0,0)
    }
  }

  time_view_document(val, backDocument=0){
    val = val -1
    this.reg_video = val
    this.video_recording_visible_docu = true;
    if(this.reg_video == 0){
      window.clearInterval(this.interval);
      this.cont_reg_video_docu=2
      let navegador = navigator.userAgent;
      let aux;
      if(navegador.match(/X11/i) || navegador.match(/Windows/i) || navegador.match(/Mac OS/i)){
        aux=true
      }
      if(navegador.match(/Android/i) || navegador.match(/iPad/i) || navegador.match(/iPod/i) || navegador.match(/BlackBerry/i) || navegador.match(/Windows Phone/i) || navegador.match(/webOS/i)){
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
                let videoP;
                videoP=val
                val = val.split("base64,")[1]
                this.VideoDocumentbase64 = val;
                if (backDocument == 0){
                  this.siteService.postFrameVideo(videoP,this.number_id.toString()).subscribe(
                      response => {
                      this.imageVideo1=response['image']
                      this.doc_file_back = this.imageVideo1;
                      this.imageVideo1="data:image/png;base64," + this.imageVideo1;
                  });
                } else {
                  this.siteService.postFrameVideo(videoP,this.number_id.toString()).subscribe(
                      response => {
                      this.imageVideo1=response['image']
                      this.doc_file = this.imageVideo1;
                      this.imageVideo1="data:image/png;base64," + this.imageVideo1;
                  });
                }
                this.validate_visible = true;
                this.text_validation = false
              }
            )
          })
          .catch((error) => {
            console.error('time_view_document', error)
            if (error.name === "NotFoundError") {
              alert("No se encuentra camara ni microfono.");
            } else {
              alert(error);
            }
          });
    }
  }

  startRecordingDocumentBack(stream, lengthInMS) {
    let recorder = new MediaRecorder(stream);
    this.localstream = stream
    let data = [];

    setTimeout(() => {
      recorder.ondataavailable = (event) => data.push(event.data);
      recorder.start();
    }, 3000);

    let stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = (event) => reject(event['name']);
    });

    let recorded = new Promise(f => setTimeout(f, lengthInMS)).then(
      () => {
        if (recorder.state === "recording") {
          this.video_recording_visible_docu_back = false;
          recorder.stop();
          this.closeCamera();
        }
      },
    );

    return Promise.all([
      stopped,
      recorded
    ])
      .then(() => data);
  }

  startRecordingDocument(stream, lengthInMS) {
    let recorder = new MediaRecorder(stream);
    this.localstream = stream
    let data = [];

    setTimeout(() => {
      recorder.ondataavailable = (event) => data.push(event.data);
      recorder.start();
    }, 3000)

    let stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = (event) => reject(event['name']);
    });


    let recorded = new Promise(f => setTimeout(f, lengthInMS)).then(
      () => {
        if (recorder.state === "recording") {
          this.video_recording_visible_docu = false;
          recorder.stop();
          this.closeCamera();
        }
      },
    );

    return Promise.all([
      stopped,
      recorded
    ])
      .then(() => data);
  }

  startRecord() {
    let navegador = navigator.userAgent;
    if(navegador.match(/iPhone/i)){
      this.cont_video=2;
      window.clearInterval(this.interval2);
    }else if(navegador.match(/X11/i) || navegador.match(/Android/i) || navegador.match(/Windows/i) || navegador.match(/iPad/i) || navegador.match(/iPod/i) || navegador.match(/BlackBerry/i) || navegador.match(/Windows Phone/i) || navegador.match(/webOS/i) || navegador.match(/Mac OS/i) ){
      window.clearInterval(this.interval2);
      if(this.reg_video == 0){
        this.reg_video=3
        this.redBtn =1
        this.btn_video=true;
      }
      this.cont_video=1;
      this.cont_reg_video=1
      this.interval=setInterval(() => {
        this.time_view(this.reg_video);
      }, 1000);
    } else {

    }
  }

  time_view(val){
    val = val -1
    this.reg_video = val
    if(this.reg_video == 0){
      window.clearInterval(this.interval);
      this.cont_reg_video=2
      let navegador = navigator.userAgent;
      let aux;
      if(navegador.match(/X11/i) || navegador.match(/Windows/i) || navegador.match(/Mac OS/i)){
        aux=true
      }
      if(navegador.match(/Android/i) || navegador.match(/iPad/i) || navegador.match(/iPod/i) || navegador.match(/BlackBerry/i) || navegador.match(/Windows Phone/i) || navegador.match(/webOS/i)){
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
                this.onSubmitBio()
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

  startRecording(stream, lengthInMS) {
    let time_record = 0
    let recorder = new MediaRecorder(stream);
    this.localstream = stream
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
          this.closeCamera();
        }
      },
    );

    //verificar el estado de la grabación
    let intervalId = setInterval(() => {
      time_record += 1
      if (time_record == 4) {
        clearInterval(intervalId); // Detiene el setInterval
        recorder.stop();
        this.closeCamera();
      }
    }, 1000);


    return Promise.all([
      stopped,
      recorded
    ])
      .then(() => data);
  }

  closeCamera() {
    try {
      if(this.localstream) {
        this.localstream.getTracks().forEach((track) => {
          track.stop();
        });
        this.localstream = null
      }
    } catch (error) {
      console.error('closeCamera', error)
    }
  }

  blobToBase64(blob) {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  validForm(onlyPhone = false) {
    if (onlyPhone) {
      let validatePhone = false
      if(this.phoneObject && this.phone) {
        validatePhone = this.phoneObject.s.dialCode == 57 ? (this.phone.toString().match(/^3[0-9]{9}$/) ? true : false) : (this.phone.toString().length > 4 ? true : false);
      }
      return validatePhone;
    }
    return (this.number_id && this.number_id.toString().length > 4) &&
      (this.email && this.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-.]+[.][a-zA-Z0-9.-]{2,}$/)) &&
      (this.phone && this.phone.toString().match(/^3[0-9]{9}$/));
  }

  requestToken() {
    if (this.validForm(true)) {
      this.visible = false;
      const dialogRefBio = this.parent.dialogService.open(ConfirmDialog, {
        context: {
          data: {
            title: 'Confirmación de Número',
            content: '¿El número \n' + this.phone + '\n es al cuál se enviará el token de confirmación?',
            option: 'confirm'
          }
        }
      });
      dialogRefBio.onClose.subscribe(result => {
        if (result == true) {
          this.code_sent = true;
          // this.code_input_visible = true;
          this.getTokenByPhone(1);
        }
        this.visible = true;
      });
    }
  }

  getTokenByPhone(step) {
    this.phone_ind = this.phoneObject ? `+${this.phoneObject.s.dialCode}` : '+0'
    this.siteService.requestTokenByPhone(this.phone.toString(), this.phone_ind, this.trace_token).subscribe(request => {
      this.loading = false;
      if (request['status']) {
        this.resetErrors()
        // let subtitle = 'Te hemos enviado un token al número de teléfono que ingresaste.';
        // this.toastService.showToast('success', 'Revisa tu teléfono', subtitle);
        // this.toastService.showToast('info', 'Solicitar', "Puedes solicitarlo nuevamente en un minuto");
        this.code_input_visible = true;
        this.step_now += step;

        // const contPrincnbCard = document.getElementById('contPrincnbCard');
        // contPrincnbCard.style.setProperty("--my-tam", "50%");

        let now_second_validate = new Date();
        let second_validate = now_second_validate.getTime() + 90000;
        let validate_time = true;
        this.minutes = 1;

        this.clock = this.source.subscribe(t => {
          this.now = new Date();
          this.end = new Date(second_validate);
          if (validate_time) {
            if (this.minutes <= 0 && this.seconds <= 0){
              validate_time = false;
              this.authorization = false;
              this.code_sent = false;
              this.step_now = 3;
              this.clock.unsubscribe();
            } else {
              this.showDate();
            }
          }
        });

        setTimeout(() => {
          this.code_sent = false;
          }, 60000
        );
      } else {
        this.loadingGif = `${this.pathGif}-error.png`;
        this.code_sent = true;
        this.toastService.showToast('danger', 'Error', request['message']);
      }
    }, (error) => {
      this.loadingGif = `${this.pathGif}-error.png`;
      this.code_sent = false;
    });
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

  verifyToken(code) {
    this.token = code;
    let answer_data = {
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
    if(this.enterprise_id) {
      answer_data['enterprise_id'] = this.enterprise_id
    }
    this.siteService.validateTokenByPhone(this.phone.toString(), this.token, this.trace_token, answer_data).subscribe(response => {
      if(response.hasOwnProperty('token_service_score')) {
        this.token_service_score = response['token_service_score']
      }
      if (response['status'] && response['message'] == "Token valido!") {
        this.code_valid = true;
        this.toastService.showToast('success', 'Token Valido', 'Se ha confirmado tu token correctamente.');
        this.code_input_visible = true;
        this.code_sent=true
        this.step_now += 1;

        this.clock.unsubscribe();
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
    });
  }

  onBackFirstStep() {
    this.step_now = 3;
    this.authorization = false;
    this.code_sent = false;
    this.clock.unsubscribe();
  }

  onFileSelected(event, back=0) {
    const file: File = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.imagePreview = reader.result;
        var val = reader.result + ''
        val = val.split("base64,")[1]
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

  onFileSelectedVideo(event) {
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
        } else {
          this.vid_file=2;
          this.Videobase64 = val;
          this.onSubmitBio();
          this.text_validation = false
        }

      };
    }
  }

  onSubmitBio() {
    this.loading = true;
    this.time_stamp = new Date().getTime();
    //this.list_time_stamp.push(time_stamp);
    // this.loading = true;
    this.step_now += 1;
    this.loadingGif = `./assets/images/biofacial/VECTOR_DE_VERIFICAR.gif`;
    let data = {
      id_api: this.tokenId,
      token_api: this.tokenBio,
      action: this.rndInt,
      video: this.Videobase64,
      user_id: this.user_id,
      document_id: this.number_id,
      trace_token: this.trace_token,
      time_stamp: this.time_stamp,
      field_type: this.parent.fields[this.field]['field_type'],
      enterprise_id: this.parent.ent_id,
      answer_data: {
        action: this.action,
        form_id: this.parent.id,
        source: 1,
        field_id: this.parent.fields[this.field]['field']
      }
    }
    if(this.token_service_score){
      data['token_service_score'] = this.token_service_score;
    }
    if(this.parent.position){
      data['answer_data']['position'] = this.parent.position;
    }
    if(this.parent.answer_id){
      data['answer_data']['answer_id'] = this.parent.answer_id;
    }
    this.answerService.getBiometricMatch(data).subscribe((response) => {
      this.video_facial_visible = false;
      if(response.hasOwnProperty('token_service_score')) {
        this.token_service_score = response['token_service_score']
      }
      if(response.hasOwnProperty('answer_id')) {
        this.parent.answer_id = response['answer_id']
      }
      if(response.hasOwnProperty('status_invalid') == true){
        let closeDialog = this.parent.validateAttempts(this.field)
        if(closeDialog) this.close()
        this.loadingGif = `${this.pathGif}-error.png`;
        let msj = 'Se presento un error con el servicio, Intente mas tarde'
        this.itemsErrors.push(msj)
        this.btn_video=false;
        this.text_validation = true
        return '';
      }
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
        this.imageMatch();
      } else {
        let closeDialog = this.parent.validateAttempts(this.field)
        if(closeDialog) this.close()
        this.loadingGif = `${this.pathGif}-error.png`;
        let msj = 'Por favor vuelve a realizar la grabación e inténtalo de nuevo'
        this.itemsErrors.push(msj)
        this.step_now -= 1;
        this.Videobase64 = '';
        // this.toastService.showToast('warning', 'BioFacial', msj);
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
    }, (error) => {
      // console.log("error en video match::::::::")
      // console.log(error)
      let closeDialog = this.parent.validateAttempts(this.field)
        if(closeDialog) this.close()
        this.loadingGif = `${this.pathGif}-error.png`;
        let msj = 'Se presento un error con el servicio, Intente mas tarde'
        this.itemsErrors.push(msj)
        this.btn_video=false;
        this.text_validation = true
        return '';
    });
  }

  imageMatch() {
    let answer_data = {
      action: this.action,
      form_id: this.parent.id,
      source: 1,
      field_id: this.parent.fields[this.field]['field']
    }
    if(this.parent.position){
      answer_data['position'] = this.parent.position;
    }
    if(this.parent.answer_id){
      answer_data['answer_id'] = this.parent.answer_id;
    }
    let data = {
      id_api: this.tokenId,
      token_api: this.tokenBio,
      image1: this.image64,
      image2: this.doc_file,
      user_id: this.user_id,
      enterprise: this.enterprise_id,
      document_id: this.number_id,
      trace_token: this.trace_token,
      answer_data: answer_data,
      field_type: this.parent.fields[this.field]['field_type'],
    }
    if(this.token_service_score){
      data['token_service_score'] = this.token_service_score;
    }
    if (!this.exist_user) {
      // this.toastService.showToast('info', 'Biometría', 'Verificando similitud.');
      this.answerService.getImageMatch(data).subscribe((response) => {
        if (response['similarity'] > 0.7) {
          this.OCR();
        } else {
          if(response.hasOwnProperty('answer_id')) {
            this.parent.answer_id = response['answer_id']
          }
          let closeDialog = this.parent.validateAttempts(this.field)
          if(closeDialog) this.close()
          this.loadingGif = `${this.pathGif}-error.png`;
          this.itemsErrors.push("Intente nuevamente")
          // this.toastService.showToast('danger', 'Error', "Intente nuevamente");
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
        //ip_address: this.ipAddress,
        trace_token: this.trace_token,
        answer_data: answer_data,
        field_type: this.parent.fields[this.field]['field_type'],
      }
      if(this.token_service_score){
        data['token_service_score'] = this.token_service_score;
      }
      let close;
      // this.toastService.showToast('info', 'Biometría', 'Verificando similitud y validando el proceso.');
      this.answerService.getImageMatchForm(data).subscribe((response) => {
        if (response['similarity'] > 0.7) {
          this.parent.fields[this.field]['answer'] = `FIRMADO CON EXITO-${response['data']}-${this.token_service_score.split("-").join("_")}`;
          //this.toastService.showToast('success', 'Firma Registrada', 'Se ha registrado la firma Biometrica con exito.');
          // this.step_now += 1;
          this.loading = false;
          this.validateFinally();
        } else {
          if(response.hasOwnProperty('answer_id')) {
            this.parent.answer_id = response['answer_id']
          }
          let closeDialog = this.parent.validateAttempts(this.field)
          if(closeDialog) this.close()
          this.loadingGif = `${this.pathGif}-error.png`;
          // Validate error
          this.itemsErrors.push('Intentelo de nuevo el proceso')
          this.loading = false;
          // this.toastService.showToast('danger', 'Error', 'Intentelo de nuevo');
        }
      }, null, ()=>{
        if (close) {
          this.loadingGif = `${this.pathGif}-error.png`;
          this.step_now += 1;
          this.loading = false;
        }
      });
    }
  }

  validateFinally(){
    this.itemsErrors = []
    this.loadingGif = `${this.pathGif}-success.png`;
    this.loading = false;
    let interval = setInterval(() => {
      if(this.valueProgress == 100) {
        clearInterval(interval);
        this.resetErrors();
        this.close();
      }
      this.valueProgress += 5
    }, 200);
  }

  OCR(){
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
    if(this.type_user) data['type_user'] = this.type_user
    if(this.user) data['user'] = this.user
    if(this.envelope) data['envelope'] = this.envelope
    // this.toastService.showToast('info', 'Biometría', 'Validando todo el proceso.');
    this.answerService.enrolmentUser(data).subscribe((response) => {
      if (response['status']) {
        this.parent.fields[this.field]['answer'] = `FIRMADO CON EXITO-${response['data']}-${this.token_service_score.split("-").join("_")}`;

        // this.toastService.showToast('success', 'Firma Registrada', 'Se ha registrado la firma biometrica con exito.');
        // this.parent.dialogRefBio.close();
        this.validateFinally()
      } else {
        this.loadingGif = `${this.pathGif}-error.png`;
        this.toastService.showToast('danger', 'Error', response['message']);
        this.loading = false;
      }
    });
  }

  close(){
    this.dialogRef.close();
  }

}
