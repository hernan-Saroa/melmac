import { Component, OnInit } from '@angular/core';
import { SwitchService } from './../../../services/switch.service';
import { blobToURL, fromBlob } from 'image-resize-compress';
import { ToastService } from '../../../usable/toast.service';
import { FormService } from '../../../services/form.service';
import { NbThemeService } from '@nebular/theme';
import { SharedService } from '../../shared.service';
import { THEMES } from '../../../@theme/components';
import { SiteService } from '../../../services/site.service';
import { FormComponent } from '../form.component';
import { timer } from 'rxjs';


@Component({
    selector: 'ngx-handwritten',
    templateUrl: './handwritten.component.html',
    styleUrls: ['./handwritten.component.scss'],
    standalone: false
})
export class HandwrittenComponent implements OnInit {

  public signaturePadOptions1: Object = { // passed through to szimek/signature_pad constructor
    'minWidth': 2.5,
    'Width': 0.5,
    'canvasWidth': 845,
    'canvasHeight': 152
  };

  constructor(private singSS: SwitchService,
              private modalSS:SwitchService,
              private toastService:ToastService,
              private formService:FormService,
              private themeService: NbThemeService,
              private _sharedService: SharedService,
              private siteService: SiteService) {
    this.base64A = '/assets/images/cargar_firma_man.png'
    let contet_layput = document.getElementsByClassName('scrollable-container');
    if (contet_layput[0].parentElement.offsetWidth <= 540) {
      this.signaturePadOptions1['canvasWidth'] = 260;
      this.signaturePadOptions1['canvasHeight'] = 140;
    }
  }
  indexField;
  parent: FormComponent;
  link;
  data_response;
  data;
  valor1;
  base64I;
  base64A;
  file_sign;
  check_id:boolean;
  phone: string;
  email: string;
  number_id: string;
  typebase64;
  type_sign;
  nameFile;
  name_text:string;
  tab:string = 'Dibujar';
  base64Output : string;
  authorization:boolean=false;
  value;
  termSign:boolean=true;
  inputItemNgModelEmail='';
  loading = false;

  // Steppers
  inscription = false;
  step_now = 1;

  // Token para a trazabilidad.
  trace_token = '';
  // Reference to field index
  field;

  verify_token = false;
  phone_ind: string = '+0';
  phoneObject: any = null;
  opt_process;
  validate_process = false;
  code_valid = false;

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

  ngOnInit(): void {
    this.modalSS.$modalsing.subscribe((valor)=>{
      this.valor1=valor
    })
    this.email = '';
    this.getDataEnterprise('Cargando...', this.link);
  }

  getDataEnterprise(name_form, link) {
    this.formService.get_enterprise_token(link).subscribe(
      response => {
        if (response['status']){
          this.data = response['data']['id'];
          response['data']['envelope'] = name_form;

          if (response['data']['theme']){
            this.themeService.changeTheme(THEMES.filter((val) => response['data']['theme'] == val.value).map((val) => val.value === 1 ? 'default' : val.name )[0].toLowerCase());
          }

          setTimeout(() => {

            // Button Color
            const buttonsPre = document.getElementsByClassName('upload-btn-file') as HTMLCollectionOf<HTMLElement>;

            if (true) {
              for (let i = 0; i < buttonsPre.length; i++) {
                const buttonPre = buttonsPre[i];
                const spanElement = buttonPre.querySelector('span#colorButtonText') as HTMLElement;

                // Agregar la clase 'appearance-filled' a buttonPre en todos los casos
                if (response['data']['colorBPB'] && response['data']['colorBPB'] !== 'None') {
                  buttonPre.classList.add('appearance-filled');
                  buttonPre.style.setProperty("--my-var", response['data']['colorBPB']);
                }else{
                  buttonPre.classList.add('appearance-filledN');
                  buttonPre.style.setProperty("--my-var", response['data']['colorBPB']);
                }
                // Si existe buttonPres, aplicar clases y estilos
                if (spanElement) {  // Verifica si existe un span con id="colorButtonText"
                  if (response['data']['colorBPT'] && response['data']['colorBPT'] !== 'None') {
                    spanElement.classList.add('buttonText');
                    spanElement.style.setProperty("--my-var", response['data']['colorBPT']);
                  } else {
                    spanElement.classList.add('buttonTextN');
                    spanElement.style.setProperty("--my-var", response['data']['colorBPT']);
                  }
                }
              }
            }

            const buttonsDisable = document.getElementsByClassName('upload-btna') as HTMLCollectionOf<HTMLElement>;

            if (true) {
              for (let i = 0; i < buttonsDisable.length; i++) {
                const buttonPre = buttonsDisable[i];
                const spanElement = buttonPre.querySelector('span#colorButtonText') as HTMLElement;

                // Agregar la clase 'appearance-filled' a buttonPre en todos los casos
                if (response['data']['colorBPB'] && response['data']['colorBPB'] !== 'None') {
                  buttonPre.classList.add('appearance-filled-disable');
                  buttonPre.style.setProperty("--my-var", '#3366ff');
                }else{
                  buttonPre.classList.add('appearance-filled-disableN');
                  buttonPre.style.setProperty("--my-var", '#3366ff');
                }
                // Si existe buttonPres, aplicar clases y estilos
                if (spanElement) {  // Verifica si existe un span con id="colorButtonText"
                  if (response['data']['colorBPT'] && response['data']['colorBPT'] !== 'None') {
                    spanElement.classList.add('buttonText');
                    spanElement.style.setProperty("--my-var", response['data']['colorBPT']);
                  } else {
                    spanElement.classList.add('buttonTextN');
                    spanElement.style.setProperty("--my-var", "#8f9bb37a");
                  }
                }
              }
            }

            const tabLink = document.getElementsByClassName('tab-link') as HTMLCollectionOf<HTMLElement>;

            if (true) {
              for (let i = 0; i < tabLink.length; i++) {
                const buttonPre = tabLink[i];

                // Agregar la clase 'abLink' a buttonPre en todos los casos
                if (response['data']['colorBPB'] && response['data']['colorBPB'] !== 'None') {
                  buttonPre.classList.add('tabLink');
                  buttonPre.style.setProperty("--my-var", response['data']['colorBPB']);
                }else{
                  buttonPre.classList.add('tabLinkN');
                  buttonPre.style.setProperty("--my-var", '#3366ff');
                }

              }
            }

            const textName = document.getElementsByClassName('tab-text') as HTMLCollectionOf<HTMLElement>;

            if (true) {
              for (let i = 0; i < textName.length; i++) {
                const buttonPre = textName[i];

                buttonPre.classList.add('text');
                buttonPre.style.setProperty("--my-var13", '#8f9bb3');
              }
            }
          },200);


          this.data_response = response['data'];
          this._sharedService.emitChange(response['data']);
        }
      }
    );
  }


  onSingHand(index){
    if(this.tab=="Escribir"){
      const { createCanvas, loadImage } = require('canvas')
      const canvas = createCanvas(480, 90)
      const ctx = canvas.getContext('2d')

      // Write "Awesome!"
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 480, 90);
      ctx.font = '35px serif';
      ctx.textAlign = "center";
      ctx.fillStyle = "#000";
      ctx.fillText(capitalize(this.name_text.toLowerCase()), 240, 50);
      this.singSS.$sing.emit(canvas.toDataURL()+"°"+index+"°"+this.email)
      this.valor1.close()
    }else{
      if (this.base64I != undefined){
        this.singSS.$sing.emit(this.base64I+"°"+index+"°"+this.email+"°"+this.typebase64)
        this.valor1.close()
      }
    }
  }

  onChangeTab(event, sign){
    this.base64I = undefined;
    this.tab=event.tabTitle;
    this.base64A = '/assets/images/cargar_firma_man.png';
    this.file_sign = undefined;
    sign.clear()
  }

  closeSingHand(){
    this.valor1.close()
  }

  drawClear(sign) {
    this.base64I = undefined;
    sign.clear()
  }

  drawComplete(sign) {
    // will be notified of szimek/signature_pad's onEnd event
    this.base64I=sign.toDataURL();
  }

  async onFileSelected(event) {
    const file = event.target.files[0];
    const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];

    // Validar si el archivo es de un tipo de imagen soportado
    if (!validImageTypes.includes(file.type)) {
        this.toastService.showToast('danger', 'Error', 'Solo se admiten archivos de imagen.');
        return;
    }

    // Si el archivo ya es PNG
    if (file.type === "image/png") {
        this.processImage(file);
    } else {
        // Convertir a PNG si no es PNG
        try {
            const pngFile = await this.convertImageFileToPNG(file);
            this.processImage(pngFile);
        } catch (error) {
            this.toastService.showToast('danger', 'Error', 'Hubo un problema al convertir la imagen a PNG.');
            console.error("Error al convertir la imagen:", error);
        }
    }
}

// Función para convertir el archivo de imagen a PNG y devolver un `File`
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

                // Convertir el canvas a PNG
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

// Función para procesar la imagen una vez esté en formato PNG
private processImage(file: File) {
    const reader = new FileReader();

    reader.readAsDataURL(file);
    reader.onload = () => {
        this.typebase64 = file.type.split("/")[1];

        // Lógica de procesamiento usando `fromBlob` y `blobToURL`
        fromBlob(file, 80, 250, 250, this.typebase64).then((blob) => {
            // Generar la URL de la imagen en base64
            blobToURL(blob).then((url) => this.base64A = url);
            blobToURL(blob).then((url) => this.base64I = url);
        });
    };
}

  toggle(checked: boolean){
    this.check_id=checked

    if(checked && this.email != '' && this.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+[.][a-zA-Z0-9.]{2,}$/)){
      this.termSign=false
    }
    else{
      this.termSign=true
    }
  }

  checkValue(field) {
    switch (field) {
      case 1:
        if (this.number_id == '')
          return 'basic';
        return (this.number_id && this.number_id.toString().length > 4) ? 'success' : 'danger';
      case 2:
        if (this.inputItemNgModelEmail == '') {
          this.authorization=true;
          this.termSign=true;
          return 'basic';
        }
        else{
          if(this.inputItemNgModelEmail && this.inputItemNgModelEmail.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-.]+[.][a-zA-Z0-9.-]{2,}$/)){
            this.authorization=false;
            this.value= 'success';
            if(this.value=='success' && this.check_id==true){
              this.termSign=false;
            }
            this.email = this.inputItemNgModelEmail
            return 'success';
          }else{
            this.authorization=true;
            this.termSign=true;
            return  'danger';
          }

          //return (this.email && this.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+[.][a-zA-Z0-9.]{2,}$/)) ? 'success' : 'danger';
        }
      case 3:
        if (this.phone == '')
          return 'basic';
        return (this.phone && this.phone.toString().match(/^3[0-9]{9}$/)) ? 'success' : 'danger';
    }
  }

  checkSign() {
    if(this.tab=="Escribir") {
      if (this.name_text != undefined && this.name_text.trim() != '') {
        return false;
      }
    } else {
      if (this.base64I) {
        return false;
      }
    }
    return true;
  }

  checkOTP() {
    // Validación OTP
    if (this.opt_process && !this.code_valid) {
      return true;
    }
    return false;
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

  sendOTP() {
    this.phone_ind = this.phoneObject ? `+${this.phoneObject.s.dialCode}` : '+0'
    this.siteService.requestTokenByPhone(this.phone.toString(), this.phone_ind, this.parent.trace_token).subscribe(request => {
      if (request['status']) {
        this.trace_token = request['trace_token'];
        this.parent.trace_token = this.trace_token;

        let subtitle = 'Te hemos enviado un token al número de telefono indicado.';
        this.toastService.showToast('success', 'Revisa tu Teléfono', subtitle);
        this.validate_process = true;

        this.loading = false;
        // this.step_now += 1;

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
              this.validate_process = false;
              this.step_now = 1;
              this.clock.unsubscribe();
            } else {
              this.showDate();
            }
          }
        });
      } else {
        // this.code_sent = true;
        this.validate_process = false;
        this.toastService.showToast('danger', 'Error', request['message']);
      }
    }, (error) => {
      // this.code_sent = false;
      this.validate_process = false;
    });
  }

  showDate(){
    let distance = this.end - this.now;
    this.day = Math.floor(distance / this._day);
    this.hours = Math.floor((distance % this._day) / this._hour);
    this.minutes = Math.floor((distance % this._hour) / this._minute);
    this.seconds = Math.floor((distance % this._minute) / this._second);
  }

  verifyToken(code) {
    this.siteService.validateTokenByPhoneMail(this.phone.toString(), code, this.trace_token).subscribe(response => {
      if (response['status'] && response['message'] == "Token valido!") {
        this.code_valid = true;
        this.toastService.showToast('success', this.phone.toString() ,'Confirmado');
      } else {
        this.validate_process = false;
      }
    }, (error) => {
      this.validate_process = false;
    });
  }
}

function capitalize(word) {
  return word.replace(/(^\w{1})|(\s+\w{1})/g, letra => letra.toUpperCase());
}
