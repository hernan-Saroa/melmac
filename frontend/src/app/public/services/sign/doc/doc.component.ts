import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NbDialogService } from '@nebular/theme';
import { ToastService } from '../../../../usable/toast.service';
import { SiteService } from '../../../../services/site.service';
import { AnswerService } from '../../../../services/answer.service';
import { CodeInputComponent } from 'angular-code-input';
import { ConfirmDialog } from '../../../../pages/form/view/view.component';
import { timer } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ServicesService } from '../../services.service';

declare var MediaRecorder: any;

@Component({
  selector: 'ngx-doc',
  templateUrl: './doc.component.html',
  styleUrls: ['./doc.component.scss']
})
export class DocComponent implements OnInit {

  @ViewChild("canvas") public canvas: ElementRef;
  @ViewChild('codeInput') codeInput !: CodeInputComponent;
  @ViewChild('fileUpload') myInputVariable: ElementRef;
  @ViewChild('backUpload') myInputVariable2: ElementRef;
  @ViewChild("video") public video: ElementRef;

  // Tamañao del video
  WIDTH = 533;
  HEIGHT = 400;

  loading = false;

  // Ubicación paso a paso
  step_now = -1;

  // Data paso 1
  name;
  phone: string;
  email: string;
  number_id: string;
  check_id: boolean;
  phoneObject: any = null;
  phone_ind: string = '+0';
  token_service_score = '';

  // Trazabilidad
  trace_token;
  navigator: string;
  ipAddress: string;
  sign_name = 'CEDULA';
  token;
  enterprise_id;
  user_id;
  cont_reg_video_docu;
  cont_reg_video_docu_back;
  interval;
  interval2;
  hash;

  authorization: boolean = false;
  code_sent = false;
  code_valid = false;
  visible = true;
  code_input_visible = true;
  image64;
  imagePreview;

  // Camara
  captures: string[] = [];
  error: any;
  isCaptured: boolean = false;
  isCapturedb: boolean = false;
  photo = '';
  photo_back = '';
  video_recording_visible_docu = false;
  video_recording_visible_docu_back = false;

  // Contador de Tiempo
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

  ContPrinc1 = false
  ContPrinc3 = false
  countImage1 = true
  countTextImage1 = true
  textImage1 = false
  btnImage2End = true
  btnImage1End = true
  imagePrincVideo1 = "./assets/images/biofacial/documento_frontal.png";
  imagePrincVideo2 = "./assets/images/biofacial/CEDULA_TRASERA.png";
  elimination1 = true
  elimination2 = true
  myInterval;

  //Gifs
  imageGeneral = ''
  textGeneral = ''
  localstream = null;
  loadingGif = ''
  pathGif = './assets/images/gifs/validate'
  itemsErrors: string[] = []
  valueProgress = 0
  style_modal = "height: 35rem; max-width: 850px;";
  isVoiceCaptureActive: boolean = false;
  videoStream: any;
  currentDeviceId: string = ''; // Guardar el ID del dispositivo (cámara) actual
  isFrontCamera: boolean = false; // Indica si se está usando la cámara frontal
  hasMultipleCameras: boolean = false; // Indica si hay más de una cámara
  recognizing: boolean = false;

  capturedImageBase64: string | null = null;
  interval_process = true;
  interval_func = null;
  interval_cam = true;
  capture_option_list = [];

  suscribe_process = true;
  show_message = false;
  type_message = 0;
  message_not_auth = '';

  constructor(
    private toastService: ToastService,
    private siteService: SiteService,
    private answerService: AnswerService,
    private http: HttpClient,
    public dialogService: NbDialogService,
    private activatedRoute: ActivatedRoute,
    private s_service: ServicesService,
  ) {
  }

  ngOnInit(): void {
    console.log("DocComponent on init ")
    this.getToken()
  }

  getToken() {
    this.loading = true
    let token_link = this.activatedRoute.snapshot.paramMap.get('token');
    this.hash = this.activatedRoute.snapshot.paramMap.get('hash');
    this.s_service.get_auth_data(token_link, this.hash).subscribe(response => {
      this.getIPAddress()
      this.navigator = this.getBrowser()
      this.loading = false
      if (response['status']) {
        if (response.hasOwnProperty('data')) {
          this.step_now = 1
          this.enterprise_id = response['data']['ent']
          this.user_id = response['data']['id']
          if (response['data'].hasOwnProperty('token_service_score')) {
            this.token_service_score = response['data']['token_service_score']
          }
        } else if (response.hasOwnProperty('sign')) {
          this.loading = false
          this.step_now = 0
          this.message_not_auth = 'URL no válida, contactar al adminstrador'
        }
      }
    }, (error) => {
      this.loading = false
      this.step_now = 0
      this.message_not_auth = 'Servicio no autorizado, contactar al adminstrador'
      console.error(error)
    })
  }

  capture() {
    this.drawImageToCanvas(this.video.nativeElement);
    this.captures.push(this.canvas.nativeElement.toDataURL("image/png"));
    this.isCaptured = true;
    if (this.textGeneral == "FRONTAL") {
      this.photo = this.canvas.nativeElement.toDataURL("image/png")
    } else {
      this.photo_back = this.canvas.nativeElement.toDataURL("image/png")
      this.isCapturedb = true;
    }

    this.stopInterval();
    this.interval_cam = false;
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

  onKeyNumberDoc(event) {
    let key = event.keyCode;
    if (key != 8 && this.number_id && this.number_id.toString().length >= 11) {
      event.preventDefault();
    }
  }

  drawImageToCanvas(image: any) {
    this.canvas.nativeElement.width = image.videoWidth;
    this.canvas.nativeElement.height = image.videoHeight;
    this.canvas.nativeElement
      .getContext("2d")
      .drawImage(image, 0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
  }

  deleteImage(image) {
    this.countTextImage1 = false
    this.textImage1 = true
    this.countImage1 = true;
    if (image == 1) {
      this.imagePrincVideo1 = "./assets/images/biofacial/documento_frontal.png";
      this.elimination1 = true
      this.photo = ''
      this.myInputVariable.nativeElement.value = '';
      this.video_recording_visible_docu = false;
      this.btnImage2End = false;
      this.isCaptured = false;

    } else {
      this.imagePrincVideo2 = "./assets/images/biofacial/CEDULA_TRASERA.png";
      this.elimination2 = true
      this.photo_back = ''
      this.myInputVariable2.nativeElement.value = '';
      this.video_recording_visible_docu_back = false
      this.btnImage1End = false;
      this.isCapturedb = false;
    }
  }

  getIPAddress() {
    this.http.get("https://api.ipify.org/?format=json").subscribe((res: any) => {
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

  getTokenByPhone(step) {
    this.phone_ind = this.phoneObject ? `+${this.phoneObject.s.dialCode}` : '+0'
    this.siteService.requestTokenByPhone(this.phone.toString(), this.phone_ind, this.trace_token).subscribe(request => {
      this.loading = false;
      if (request['status']) {
        this.resetErrors()
        this.code_input_visible = true;
        this.step_now += step;
        let now_second_validate = new Date();
        let second_validate = now_second_validate.getTime() + 90000;
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
      this.loading = false;
      this.loadingGif = `${this.pathGif}-error.png`;
      this.code_sent = false;
    });
  }

  onBackFirstStep() {
    this.step_now = 3;
    this.authorization = false;
    this.code_sent = false;
    this.clock.unsubscribe();
  }

  onFirstSubmit() {
    this.loading = true;
    this.siteService.requestAuthorization(this.email, this.trace_token, this.sign_name).subscribe(response => {
      this.trace_token = response['trace_token'];
      this.trace_token = this.trace_token;
      this.loading = false;
      this.step_now += 1;
    }, (error) => {
      console.error(error);
    });
  }

  onFileSelected(event, back = 0) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        this.imagePreview = reader.result;
        var val = reader.result + ''
        val = val.split("base64,")[1]
        if (back) {
          //carga parte posterior
          this.photo_back = val;
          this.imagePrincVideo2 = "data:image/png;base64," + val;
          this.elimination2 = false
          this.video_recording_visible_docu_back = false
        } else {
          //carga parte frontal
          this.photo = val;
          this.imagePrincVideo1 = "data:image/png;base64," + val;
          this.elimination1 = false
          this.video_recording_visible_docu = false
        }
      };
    } else {
      if (back) {
        this.photo_back = '';
      } else {
        this.photo = '';
      }
    }
  }

  onSubmitOCR() {
    this.loading = true;
    this.loadingGif = `${this.pathGif}-information.gif`;
    let data = {
      type: "2"
    }
    this.answerService.getBiometricToken(data).subscribe((response) => {
      if (response) {
        let answer_data = {
          source: 1
        }

        let photo_split = this.photo;
        let photo_back_split = this.photo_back;

        let data = {
          id_api: response['id'],
          token_api: response['token'],
          image: photo_split,
          image_back: photo_back_split,
          user_id: this.user_id,
          document: this.number_id,
          enterprise: this.enterprise_id,
          answer_data: answer_data,
        }
        if (this.trace_token) {
          data['trace_token'] = this.trace_token;
        }
        if (this.token_service_score) {
          data['token_service_score'] = this.token_service_score
        }
        this.answerService.getOCR(data).subscribe((response) => {
          if (response) {
            if (response.hasOwnProperty('token_service_score')) {
              this.token_service_score = response['token_service_score']
            }
            if (response['status'] == true) {
              if (this.trace_token == '') {
                this.trace_token = response['data']['trace_token'];
                this.trace_token = this.trace_token;
              } else {
                this.trace_token = this.trace_token;
              }
              let data = {
                user_id: this.user_id,
                identification: this.number_id,
                trace_token: this.trace_token,
                exp_date: response['data']['parameters']['extra']['fech_exp'],
                nac_date: response['data']['parameters']['extra']['fech_nac'],
                answer_data: answer_data,
                enterprise_id: this.enterprise_id,
              }
              if (this.token_service_score) {
                data['token_service_score'] = this.token_service_score
              }
              this.answerService.getDocumentInfoANI(data).subscribe((response) => {
                if (response.hasOwnProperty('token_service_score')) {
                  this.token_service_score = response['token_service_score']
                }
                if (response['status']) {
                  if (response['data']['alive']) {
                    this.name = response['data']['name'];
                    this.code_sent = true;
                    this.visible = true;
                    this.getTokenByPhone(2)
                  } else {
                    this.loadingGif = `${this.pathGif}-error.png`;
                    this.loading = false;
                    this.toastService.showToast('danger', 'Error', 'Problema con la validación de datos de la persona.');
                  }
                } else {
                  this.loadingGif = `${this.pathGif}-error.png`;
                  if (response['message'] == 'No tiene creditos') {
                    this.loading = false;
                    let msj = 'No se puede realizar el proceso con la registraduría, comuniquese con su administrador.'
                    this.itemsErrors.push(msj)
                  } else {
                    this.loading = false;
                    this.itemsErrors.push(response['message'])
                  }
                }
              });
            } else {
              this.loadingGif = `${this.pathGif}-error.png`;
              this.itemsErrors.push(response['message'])
              this.loading = false;
            }
          } else {
            this.loadingGif = `${this.pathGif}-error.png`;
            this.itemsErrors.push(response['message'])
            this.loading = false;
          }
        }, error => {
          this.loadingGif = `${this.pathGif}-error.png`;
          this.itemsErrors.push(response['message'])
          this.loading = false;
        });
      }
    }, error => {
      this.loadingGif = `${this.pathGif}-error.png`;
      this.loading = false;
      this.toastService.showToast('danger', 'Error', 'Problema en los servicios, intentalo mas tarde.');
    });
  }

  onSubmitOTP() {
    this.loading = true;
    let data = {
      name: this.name,
      phone: this.phone.toString(),
      email: this.email,
      identification: this.number_id,
      token: this.token,
      enterprise_id: this.enterprise_id,
      user_id: this.user_id,
      trace_token: this.trace_token
    }
    this.answerService.registerElectronicSignature(data).subscribe((response) => {
      if (response['status']) {
        this.loadingGif = `${this.pathGif}-success.png`;
        let result_bio = `FIRMADO CON EXITO-${response['data']}-${this.token_service_score.split("-").join("_")}`;
        this.loading = false;
        this.itemsErrors = [];
      } else {
        this.loading = false;
        this.loadingGif = `${this.pathGif}-error.png`;
        this.itemsErrors.push(response['message'])
      }
    });
  }

  pulsar(event) {
    var invalidChars = [69, 187, 189, 190]; //["-", "e", "+", "."]
    if (invalidChars.includes(event.keyCode)) {
      event.preventDefault();
    }

    let key = event.keyCode;
    if (key != 8 && this.phoneObject && this.phoneObject.s.dialCode == 57 && this.phone && this.phone.toString().length >= 10) {
      event.preventDefault();
    }
  }

  requestToken() {
    if (this.validateForm(true)) {
      this.visible = false;
      const dialogRefBio = this.dialogService.open(ConfirmDialog, {
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
          this.getTokenByPhone(1);
        }
        this.visible = true;
      });
    }
  }

  repetCapture() {
    this.isCaptured = false;
    this.isCapturedb = false;

    this.stopInterval();
    setTimeout(() => {
      this.startInterval();
    }, 1000);
  }

  resetErrors(backStep = false) {
    this.loadingGif = '';
    this.itemsErrors = [];
    if (backStep) {
      this.step_now = 2; // volver a subir las imagenes de la cedula
    }
  }

  setMessageInfo() {
    if (this.loadingGif) {
      return this.loadingGif.includes('success') ?
        '¡VALIDACIÓN REALIZADA CON INTELIGENCIA ARTIFICIAL, EXITOSA!' :
        '¡UPS! HEMOS ENCONTRADO LAS SIGUIENTES FALLAS EN ESTA VALIDACIÓN:';
    }
    return ''
  }

  showDate() {
    let distance = this.end - this.now;
    this.day = Math.floor(distance / this._day);
    this.hours = Math.floor((distance % this._day) / this._hour);
    this.minutes = Math.floor((distance % this._hour) / this._minute);
    this.seconds = Math.floor((distance % this._minute) / this._second);
  }

  async restartCamara() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Verifica si el dispositivo es un móvil
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // Configura las opciones para acceder a la cámara
      const constraints = {
        video: {
          facingMode: isMobile ? { exact: 'environment' } : 'user' // Cámara trasera en móviles, cámara frontal en PC
        }
      };
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream) {
          this.video.nativeElement.srcObject = stream;
          this.video.nativeElement.play();
          this.error = null;
        } else {
          this.error = "You have no output video device";
        }
      } catch (e) {
        this.error = e;
      }
    }
  }

  async startCamera() {
    try {
      // Obtener todas las cámaras disponibles
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      // Comprobar si hay más de una cámara
      this.hasMultipleCameras = videoDevices.length > 1;

      if (videoDevices.length === 0) {
        console.error("No se encontraron cámaras disponibles.");
        return;
      }

      // Determinar si usar la cámara frontal o trasera
      let selectedDevice;
      if (this.isFrontCamera) {
        selectedDevice = videoDevices.find(device => device.label.toLowerCase().includes('front')) || videoDevices[0];
      } else {
        selectedDevice = videoDevices.find(device => !device.label.toLowerCase().includes('front')) || videoDevices[0];
      }

      if (!selectedDevice || !selectedDevice.deviceId) {
        console.error("No se pudo obtener el deviceId de la cámara.");
        this.startCamera2()
        return;
      }

      this.currentDeviceId = selectedDevice.deviceId;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: this.currentDeviceId } }
      });

      // Asignar el stream de video al elemento de video en el DOM
      this.video.nativeElement.srcObject = stream;
      this.videoStream = stream;

      this.stopInterval();
      setTimeout(() => {
        this.startInterval();
      }, 1000);

    } catch (err) {
      console.error("Error al acceder a la cámara: ", err);
    }
  }

  async startCamera2() {
    navigator.permissions.query({ name: 'camera' }).then((permissionStatus) => {
      if (permissionStatus.state === 'denied') {
        // Mostrar un mensaje al usuario sobre cómo habilitar manualmente el permiso
        alert(`Parece que el acceso a la cámara ha sido bloqueado.
          Para habilitarlo:
          - En Google Chrome: ve a Configuración > Privacidad y seguridad > Configuración de sitio > Cámara.
          - En Safari: ve a Configuración > Safari > Cámara.`+ permissionStatus.state);
      } else if (permissionStatus.state === 'prompt') {
        // Solicitar el permiso si aún no ha sido otorgado o denegado
        this.restartCamara()
      }
    });
  }

  // Cambiar entre la cámara frontal y trasera
  async toggleCamera() {
    // Parar el stream actual
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
    }

    // Alternar entre frontal y trasera
    this.isFrontCamera = !this.isFrontCamera;

    // Reiniciar la cámara con el dispositivo alternativo
    await this.startCamera();
  }

  startInterval() {
    this.capture_option_list = [];
    this.interval_process = true;
    this.interval_cam = true;
    this.interval_func = setInterval(() => {
      if (this.interval_process) {
        this.captureImage()
      }
    }, 500);
  }

  stopInterval() {
    this.interval_process = false;
    if (this.interval_func) {
      clearInterval(this.interval_func);
      this.interval_func = null;
    }
  }

  captureImage() {
    const video = this.video.nativeElement;
    const canvas = this.canvas.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    let object_model = 1;
    if (this.textGeneral != "FRONTAL") {
      object_model = 2;
    }

    let img_data = {
      'img_base64': canvas.toDataURL('image/png'),
      'object': object_model
    }

    if (this.interval_process && this.suscribe_process) {
      this.suscribe_process = false;
      this.answerService.camDetect(img_data).subscribe(
        response => {
          this.suscribe_process = true;
          this.loading = false;
          let timer_interval = false;
          let back_doc = false;
          let back_fingerprint = false;
          let back_code = false;
          let back_capture_elements = [];

          if (response['data'].length > 0) {
            let conditional_size = false;
            response['data'].forEach(element => {
              if (element['class_name'] == "Documento" && element['percentage_size_w'] >= 82) {
                conditional_size = true;
                if (object_model == 1) {
                  this.capture_option_list.push(element)
                } else if (object_model == 2) {
                  back_capture_elements.push(element)
                }
              }
              if (object_model == 2) {
                if (element['class_name'] == "Documento" && element['percentage'] >= 0.60) {
                  back_doc = true;
                } else if (element['class_name'] == "Huella" && element['percentage'] >= 0.60) {
                  back_fingerprint = true;
                } else if (element['class_name'] == "Código de barras" && element['percentage'] >= 0.60) {
                  back_code = true;
                }
              }
            });

            this.type_message = 0;
            if (conditional_size && object_model == 2) {
              if (!back_doc || !back_fingerprint || !back_code) {
                conditional_size = false;
                this.type_message = 1;
              } else {
                this.capture_option_list = back_capture_elements;
              }
            }

            if (!conditional_size) {
              this.show_message = true;
              setTimeout(() => {
                this.show_message = false;
              }, 1000);
            } else {
              if (this.interval_cam) {
                this.stopInterval();
                this.interval_cam = false;
                this.bestCapture();
              }
            }

          }

        }, error => {
          console.error(error);
        }
      );
    }
  }

  bestCapture() {
    let img = "";
    let per = 0;

    setTimeout(() => {
      this.capture_option_list.forEach(element => {
        if (element['percentage'] > per) {
          per = element['percentage'];
          img = element['img'];
        }
      });
      this.capturedImageBase64 = 'data:image/png;base64,' + img;
      this.drawImageToCanvas(this.video.nativeElement);

      this.captures.push(img);

      this.isCaptured = true;
      if (this.textGeneral == "FRONTAL") {
        this.photo = 'data:image/png;base64,' + img
      } else {
        this.photo_back = 'data:image/png;base64,' + img
        this.isCapturedb = true;
      }

      this.startCaptureDocument(0);
      // -------------------------------------------
    }, 1000);
    // this.stopCamera();
  }

  startCaptureDocument(option) {
    let navegador = navigator.userAgent;
    if (navegador.match(/iPhone/i)) {
      window.clearInterval(this.interval2);
    } else {
      (navegador.match(/X11/i) || navegador.match(/Android/i) || navegador.match(/Windows/i) || navegador.match(/iPad/i) || navegador.match(/iPod/i) || navegador.match(/BlackBerry/i) || navegador.match(/Windows Phone/i) || navegador.match(/webOS/i) || navegador.match(/Mac OS/i))
    }
    if (option == 1 || option == 2) {
      this.ContPrinc1 = true
      if (option == 1) {
        this.countTextImage1 = true
        this.textImage1 = false
        this.countImage1 = false;
        this.video_recording_visible_docu = true
        this.video_recording_visible_docu_back = false
        this.imageGeneral = "./assets/images/biofacial/documento_frontal.png";
        this.textGeneral = "FRONTAL"
        this.btnImage2End = true;
        this.startCamera();
      } else {
        this.countTextImage1 = true
        this.textImage1 = false
        this.countImage1 = false;
        this.video_recording_visible_docu = false
        this.video_recording_visible_docu_back = true
        this.imageGeneral = "./assets/images/biofacial/CEDULA_TRASERA.png";
        this.textGeneral = "TRASERA"
        this.btnImage1End = true;
        this.startCamera();
      }
    } else {
      if (this.textGeneral == "FRONTAL") {
        option = 3
      } else {
        option = 4
      }
      this.textImage1 = false
      this.countTextImage1 = true
      this.countImage1 = false;
      this.ContPrinc1 = false
      if (option == 3) {
        this.imagePrincVideo1 = this.photo

        let val = this.imagePrincVideo1.split("base64,")[1];
        this.photo = val;

        this.cont_reg_video_docu = 1
        this.elimination1 = false
        this.btnImage1End = true
        this.isCaptured = false
        this.stopCamera();
      } else {
        this.imagePrincVideo2 = this.photo_back

        let val = this.imagePrincVideo2.split("base64,")[1];
        this.photo_back = val;

        this.cont_reg_video_docu = 1
        this.elimination2 = false
        this.btnImage2End = true
        this.isCapturedb = false
        this.isCaptured = false
        this.stopCamera();
      }
    }
  }

  async stopCamera() {
    if (this.video.nativeElement && this.video.nativeElement.srcObject) {
      const stream = this.video.nativeElement.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      this.video.nativeElement.srcObject = null;
    }
  }

  telInputObject(e) {
    this.phoneObject = e
  }

  toggle(checked: boolean) {
    this.check_id = checked
  }

  validateFirstStep() {
    let validatePhone = false
    if (this.phoneObject && this.phone) {
      validatePhone = this.phoneObject.s.dialCode == 57 ? (this.phone.toString().match(/^3[0-9]{9}$/) ? true : false) : (this.phone.toString().length > 4 ? true : false);
    }
    return (this.number_id && this.number_id.toString().length > 4) &&
      (this.email && this.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-.]+[.][a-zA-Z0-9.-]{2,}$/)) && (this.check_id) &&
      validatePhone;
  }

  validateForm(onlyPhone = false) {
    if (onlyPhone) {
      let validatePhone = false
      if (this.phoneObject && this.phone) {
        validatePhone = this.phoneObject.s.dialCode == 57 ? (this.phone.toString().match(/^3[0-9]{9}$/) ? true : false) : (this.phone.toString().length > 4 ? true : false);
      }
      return validatePhone;
    }
    return (this.number_id && this.number_id.toString().length > 4) &&
      (this.email && this.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-.]+[.][a-zA-Z0-9.-]{2,}$/)) &&
      (this.phone && this.phone.toString().match(/^3[0-9]{9}$/));
  }

  validateSecondStep() {
    return (this.photo != '') && (this.photo_back != '');
  }

  verifyToken(code) {
    this.token = code;
    let answer_data = {
      user_id: this.user_id,
      source: 1
    }
    this.siteService.requestBrowser(this.navigator, this.trace_token, this.ipAddress, this.sign_name).subscribe(data => {
      ////console.log(data);
    })
    if (this.token_service_score) {
      answer_data['token_service_score'] = this.token_service_score;
    }
    if (this.enterprise_id) {
      answer_data['enterprise_id'] = this.enterprise_id
    }
    this.siteService.validateTokenByPhone(this.phone.toString(), this.token, this.trace_token, answer_data).subscribe(response => {
      if (response.hasOwnProperty('token_service_score')) {
        this.token_service_score = response['token_service_score']
      }
      if (response['status'] && response['message'] == "Token valido!") {
        this.code_valid = true;
        this.toastService.showToast('success', 'Token Valido', 'Se ha confirmado tu token correctamente.');
        this.code_input_visible = true;
        this.code_sent = true
        this.onSubmitOTP()
      } else {
        this.toastService.showToast('danger', 'Error', 'Token Invalido, vuelva a intentarlo');
        this.token = '';
        this.codeInput.reset();
      }
    });
  }

  viewValidateError(btn = false) {
    if (this.loadingGif) {
      if (btn) {
        return this.loadingGif.includes('error');
      }
      return !this.loadingGif.includes('.gif');
    }
    return false
  }
}
