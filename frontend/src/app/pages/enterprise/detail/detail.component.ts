import { NbDialogService, NbDialogRef, NbComponentStatus } from '@nebular/theme';
import { EnterpriseService } from './../../../services/enterprise.service';
import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../../usable/toast.service';
import { Clipboard } from '@angular/cdk/clipboard';
import { EmailComponent } from '../email/email.component';


@Component({
    selector: 'ngx-detail',
    templateUrl: './detail.component.html',
    styleUrls: ['./detail.component.scss'],
    standalone: false
})
export class DetailComponent implements OnInit {

  emailComponent:NbDialogRef<EmailComponent>;

  title = 'Tu Empresa'
  acronym = ''
  fileName;
  fileNameWh;
  fileName2;
  fileName3;
  image = '';
  image_wh = '';
  imagebtn = false
  imagebtn_wh = false
  name;
  main_name;
  colorB = '';
  colorBT = '';
  colorBF = '';
  colorBFT = ''; // BUTTON FORM TITLE
  colorBFD = ''; // BUTTON FORM DESCRIPTION
  colorBFF = ''; // BUTTON FORM FOOTER
  colorBPB = ''; // BUTTON PREVISUALIZATION BUTTON
  colorBPT = ''; // BUTTON PREVISUALIZATION TEXT
  colorBTP = '';
  colorBTPH = '';
  nit;
  website;
  formData;
  checked = false;
  toggleNgModel = false;
  toggleNgModel2 = false;
  toggleNgModel3 = false;
  toggleNgModel4 = false;
  toggleNgModel5 = false;
  toggleNgModel6 = false;
  toggleNgModel7 = true;  
  toggleNgModel8 = false; // BUTTON FORM DESCRIPTION
  toggleNgModel9 = false; // BUTTON FORM FOOTER
  toggleNgModel10 = false; // BUTTON PREVISUALIZATION BUTTON
  toggleNgModel11 = false; // BUTTON PREVISUALIZATION TEXT
  inputCB='';
  inputBTPH='';
  inputBFT='';
  inputBFD = ''; // BUTTON FORM DESCRIPTION
  inputBFF = ''; // BUTTON FORM FOOTER
  inputBPB = ''; // BUTTON PREVISUALIZATION BUTTON
  inputBPT = ''; // BUTTON PREVISUALIZATION TEXT
  inputBTP='';
  nameFooter='Si';
  footer_view=true;

  nameEnt=''
  remEnt=''
  respEnt=''
  colorbtnV=''
  colorbtnV2=''
  colorbtnV3=''


  constructor(private service: EnterpriseService, private toast:ToastService,private clipboard: Clipboard,private dialogService: NbDialogService,) { }

  ngOnInit(): void {
    this.service.getDetails().subscribe(
      (response) => {
        if(response['status']){
          console.log(response['data'])
          this.name = response['data']['name'];
          this.main_name = response['data']['main_name'];
          this.nit = response['data']['nit'];
          this.website = response['data']['website'];
          this.acronym = response['data']['acronym'];
          this.nameEnt = response['data']['email_title'];
          this.remEnt = response['data']['answer_to'];
          this.colorB = response['data']['colorB'];
          this.colorBT = response['data']['colorBT'];
          this.colorBF = response['data']['colorB'];
          this.colorBTPH = response['data']['colorBTPH'];
          this.colorBFT = response['data']['colorBFT'];
          this.colorBFD = response['data']['colorBFD'];
          this.colorBFF = response['data']['colorBFF'];
          this.colorBPB = response['data']['colorBPB'];
          this.colorBPT = response['data']['colorBPT'];
          this.footer_view = response['data']['footer_view'];
          this.colorbtnV = response['data']['emailEnterprise'].toString();
          this.colorbtnV3 = response['data']['brandEnterprise'].toString();
          this.colorbtnV2 = response['data']['senderEnterprise'].toString();
          localStorage.setItem('colorbtnV', this.colorbtnV);
          localStorage.setItem('colorbtnV2',this.colorbtnV2);


          if(this.colorbtnV != ''){
            const boxText1 = document.getElementById('btnV1');
            const boxText2 = document.getElementById('btnV2');
            const boxText3 = document.getElementById('btnV3');
            if(this.colorbtnV == '0'){
              boxText1.classList.add('color-titlePre');
              boxText1.style.setProperty("--my-var", '#FF5A66');
              boxText2.classList.add('color-titlePre');
              boxText2.style.setProperty("--my-var", '#FF5A66');
              boxText3.classList.add('color-titlePre');
              boxText3.style.setProperty("--my-var", '#FF5A66');
            }else if(this.colorbtnV == '1'){
              boxText1.classList.add('color-titlePre');
              boxText1.style.setProperty("--my-var", '#412378');
              boxText2.classList.add('color-titlePre');
              boxText2.style.setProperty("--my-var", '#412378');
              boxText3.classList.add('color-titlePre');
              boxText3.style.setProperty("--my-var", '#412378');
            }else{
              boxText1.classList.add('color-titlePre');
              boxText1.style.setProperty("--my-var", '#2196F2');
              boxText3.classList.add('color-titlePre');
              boxText3.style.setProperty("--my-var", '#FF5A66');
              if(this.colorbtnV2 == '0'){
                boxText2.classList.add('color-titlePre');
                boxText2.style.setProperty("--my-var", '#FF5A66');
              }else if(this.colorbtnV2 == '2'){
                boxText2.classList.add('color-titlePre');
                boxText2.style.setProperty("--my-var", '#2196F2');
              }
            }
          }


          if(this.colorB !='' && this.colorB !=null){
            this.toggleNgModel=true
            this.inputCB=this.colorB
            this.colorBF=this.colorB
            const boxText1 = document.getElementById('titlePre');
            boxText1.classList.add('color-titlePre');
            boxText1.style.setProperty("--my-var", this.colorB);

            const boxText2 = document.getElementById('titlePre4');
            boxText2.classList.add('color-titlePre');
            boxText2.style.setProperty("--my-var", this.colorB);
          }else{
            this.colorB = '#412378'
            this.inputCB = '#412378'
            this.colorBF = '#412378'
          }
          if(this.colorBT !='' && this.colorBT !=null){
            this.toggleNgModel2=true
          }
          if(this.footer_view){
            this.toggleNgModel7=true
            this.nameFooter='Si'
          }else{
            this.toggleNgModel7=false
            this.nameFooter='No'
          }

          if(this.colorBTPH !='' && this.colorBTPH !=null){
            this.toggleNgModel6=true
            this.inputBTPH=this.colorBTPH
            const boxText2 = document.getElementById('titleBackPre');
            boxText2.classList.add('color-titlePre');
            boxText2.style.setProperty("--my-var", this.colorBTPH);
          }else{
            this.inputBTPH='#ffffff'
            this.colorBTPH='#ffffff'
          }  
          if(this.colorBFT !='' && this.colorBFT !=null){
            this.toggleNgModel5=true
            this.inputBFT=this.colorBFT
            const boxText1 = document.getElementById('titlePre2');
            boxText1.classList.add('color-titlePre2');
            boxText1.style.setProperty("--my-var", this.colorBFT);

          }else{
            this.inputBFT='#000000'            
            this.colorBFT='#000000'
          }

          if(this.colorBFD !='' && this.colorBFD != null){
            this.toggleNgModel8=true
            this.inputBFD=this.colorBFD
            const boxText1 = document.getElementById('titleDesc');
            boxText1.classList.add('color-titleDesc');
            boxText1.style.setProperty("--my-var", this.colorBFD);
          }else{
            this.inputBFD='#000000'
            this.colorBFD='#000000'
          }

          if(this.colorBFF !='' && this.colorBFF != null){
            this.toggleNgModel9=true
            this.inputBFF=this.colorBFF
            const boxText1 = document.getElementById('titleFooter');
            boxText1.classList.add('color-titleFooter');
            boxText1.style.setProperty("--my-var", this.colorBFF);
          }else{
            this.inputBFF='#ffffff'
            this.colorBFF='#ffffff'
          }

          if(this.colorBPB !='' && this.colorBPB != null){
            this.toggleNgModel10=true
            this.inputBPB=this.colorBPB
            const boxText1 = document.getElementById('buttonPre');
            boxText1.classList.add('color-buttonPre');
            boxText1.style.setProperty("--my-var", this.colorBPB);
          }else{
            this.inputBPB='#3366ff'
            this.colorBPB='#3366ff'
          }

          if(this.colorBPT !='' && this.colorBPT != null){
            this.toggleNgModel11=true
            this.inputBPT=this.colorBPT
            const boxText1 = document.getElementById('textButton');
            boxText1.classList.add('color-textButton');
            boxText1.style.setProperty("--my-var", this.colorBPT);
          }else{
            this.inputBPT='#ffffff'
            this.colorBPT='#ffffff'
          }

          if (response['data']['image'][1] != '') {
            this.image = response['data']['image'][0] + response['data']['image'][1];
            this.imagebtn = true
          }

          if (response['data']['image_wh'][1] != '') {
            this.image_wh = response['data']['image_wh'][0] + response['data']['image_wh'][1];
            this.imagebtn_wh = true
          }

          if (response['data']['image_login'][1] != '') {
            this.fileName3 = 'Img Subida'
            this.fileName2 = response['data']['image_login'][0] + response['data']['image_login'][1];
          }
        }
      }, (error) => {
        this.toast.showToast('danger', 'No tienes acceso', error.error.detail);
        setTimeout(()=>window.location.href = '/pages/statistics', 500);
      }
    )
  }

  onAccept(event){
    this.formData = new FormData();

    if (this.name != ''){
      this.formData.append("name", this.name);
      this.formData.append("footer_view", this.toggleNgModel7);
      if (this.fileName2 != '')
        this.formData.append("image_login", this.fileName2);
      if (this.main_name != '')
        this.formData.append("main_name", this.main_name);
      if (this.nameEnt != '')
        this.formData.append("email_title", this.nameEnt);
      if (this.remEnt != '')
        this.formData.append("answer_to", this.remEnt);
      if (this.nit != '')
        this.formData.append("nit", this.nit);
      if (this.website != '')
        this.formData.append("website", this.website);
      if (this.acronym != '')
        this.formData.append("acronym", this.acronym);
        console.log(this.acronym)
      if (this.colorB != ''){
        this.formData.append("colorB", this.colorB);
      }else{
        this.formData.append("colorB", '#412378');
      }
      console.log(this.colorBF)
      if (this.colorBF != ''){
        this.formData.append("colorBF", this.colorB);
      }else{
        this.formData.append("colorBF", '#412378');
      }
      if (this.colorBT != ''){
        this.formData.append("colorBT", this.colorBT);
      }else{
        this.formData.append("colorBT", '');
      }
      if (this.colorBTPH != ''){
        this.formData.append("colorBTPH", this.colorBTPH);
      }else{
        this.formData.append("colorBTPH", '');
      }
      if (this.colorBFT != ''){
        this.formData.append("colorBFT", this.colorBFT);
      }else{
        this.formData.append("colorBFT", '#000000');
      }
      if (this.colorBFD != ''){
        this.formData.append("colorBFD", this.colorBFD);
      }else{
        this.formData.append("colorBFD", '#000000');
      }
      if (this.colorBFF != ''){
        this.formData.append("colorBFF", this.colorBFF);
      }else{
        this.formData.append("colorBFF", '#ffffff');
      }
      if (this.colorBPB != ''){
        this.formData.append("colorBPB", this.colorBPB);
      }else{
        this.formData.append("colorBPB", '#3366ff');
      }
      if (this.colorBPT != ''){
        this.formData.append("colorBPT", this.colorBPT);
      }else{
        this.formData.append("colorBPT", '#ffffff');
      }
      
      if(!this.toggleNgModel){
        this.formData.append("colorB", '');
        this.formData.append("colorBF", '');
      }
      if(!this.toggleNgModel5){
        // console.log('BFT5');
        // console.log(this.colorBFT);
        this.formData.append("colorBFT", '');
        this.formData.append("colorBTP", '');
      }
      if(!this.toggleNgModel6){
        this.formData.append("colorBTPH", '');
      }
      if(!this.toggleNgModel8){
        this.formData.append("colorBFD", '');
      }
      if(!this.toggleNgModel9){
        this.formData.append("colorBFF", '');
      }
      if(!this.toggleNgModel10){
        this.formData.append("colorBPB", '');
      }
      if(!this.toggleNgModel11){
        this.formData.append("colorBPT", '');
      }
      this.service.updateDetails(this.formData).subscribe(
        (response) => {
          if (response['status']){
            this.toast.showToast('success', 'Cambios Realizados', 'Tus cambios se han guardado.');
          } else {
            if (response['detail']){
              this.toast.showToast('warning', 'Oops!', response['detail']);
            } else {
              this.toast.showToast('warning', 'Oops!', 'Algo Inesperado ha sucedido, intenta de nuevo mas tarde.');
            }
          }
        }, (error) => {
          if (error.error.detail){
            this.toast.showToast('warning', 'Oops!', error.error.detail);
          } else {
            this.toast.showToast('warning', 'Oops!', 'Algo Inesperado ha sucedido, intenta de nuevo mas tarde.');
          }
        }
        );
    }
  }

  changeValue(input, event){

    switch (input){
      case 0:
        this.name = (""+event.target.value).trim();
      break;
      case 1:
        if ((""+event.target.value).match(event.target.pattern))
        this.nit = (""+event.target.value).trim();
      break;
      case 2:
        this.website = (""+event.target.value).trim();
      break;
      case 3:
        this.acronym = (""+event.target.value).trim();
        event.target.value = this.acronym;
      break;
      case 4:
        console.log("caso 4")
        this.colorB = (""+event.target.value).trim();
        this.inputCB = this.colorB
        this.colorBF = this.colorB
        this.toggleNgModel=true
        const boxText1 = document.getElementById('titlePre');
        boxText1.classList.add('color-titlePre');
        boxText1.style.setProperty("--my-var", this.colorB);

        const boxText5 = document.getElementById('titlePre4');
        boxText5.classList.add('color-titlePre');
        boxText5.style.setProperty("--my-var", this.colorB);

      break;
      case 5:
        this.colorBT = (""+event.target.value).trim();
        this.toggleNgModel2=true
      break;
      // title 
      case 8:
        this.colorBFT = (""+event.target.value).trim();
        this.toggleNgModel5=true
        this.inputBFT = this.colorBFT
        const boxText4 = document.getElementById('titlePre2');
        boxText4.classList.add('color-titlePre2');
        boxText4.style.setProperty("--my-var", this.colorBFT);
      break;
      case 9:
        this.colorBTPH = (""+event.target.value).trim();
        this.toggleNgModel6=true
        this.inputBTPH = this.colorBTPH
        const boxText3 = document.getElementById('titleBackPre');
        boxText3.classList.add('color-titlePre');
        boxText3.style.setProperty("--my-var", this.colorBTPH);
      break;
      // title button description
      case 11:
        this.colorBFD = (""+event.target.value).trim();
        this.toggleNgModel8=true
        this.inputBFD = this.colorBFD
        const boxText2 = document.getElementById('titleDesc');
        boxText2.classList.add('color-titleDesc');
        boxText2.style.setProperty("--my-var", this.colorBFD);
      break;
      // title button footer
      case 12:
        this.colorBFF = (""+event.target.value).trim();
        this.toggleNgModel9=true
        this.inputBFF = this.colorBFF
        const boxText6 = document.getElementById('titleFooter');
        boxText6.classList.add('color-titleFooter');
        boxText6.style.setProperty("--my-var", this.colorBFF);
      break;
      // button color
      case 13:
        this.colorBPB = (""+event.target.value).trim();
        this.toggleNgModel10=true
        this.inputBPB = this.colorBPB
        const boxText7 = document.getElementById('buttonPre');
        boxText7.classList.add('color-buttonPre');
        boxText7.style.setProperty("--my-var", this.colorBPB);
      break;
      // button text color
      case 14:
        this.colorBPT = (""+event.target.value).trim();
        this.toggleNgModel11=true
        this.inputBPT = this.colorBPT
        const boxText8 = document.getElementById('textButton');
        boxText8.classList.add('color-textButton');
        boxText8.style.setProperty("--my-var", this.colorBPT);
      break;
      case 10:
        this.main_name = (""+event.target.value).trim();
      break;
    }
  }

  checkForm(){
    return !(this.name != '' &&
    (this.nit ? this.nit.match("^[0-9]{9}[\-]?[0-9]?$") : true) &&
    (this.acronym ? this.acronym.match('^[^ !@#$%^&*(),.?"\':{}|<>]*$') && this.acronym.length > 2 : true))

  }

  onKeyDownEvent(input, event: any){
    switch(input){
      case 0:
        if (event.key != 'Backspace' && event.key.match('^[^0-9-]$')){
          event.preventDefault();
        }
      break;
      case 1:
        if (event.key != 'Backspace' && !event.key.match('^[a-z0-9_]$')){
          event.preventDefault();
        }
      break;
    }
  }

  onFileSelected(event,opt){
    const file:File = event.target.files[0];
    let type_file = event.target.files[0].type;
    let name = type_file.toString()
    if(name.includes('image')){
      if (opt == 1) {
        if (file) {
          const formData = new FormData();

          formData.append("image", file);

          this.service.updateDetails(formData).subscribe(response => {
            let title = "Proceso de Carga Masiva Iniciado";
            let message = "El archivo fue cargado exitosamente";
            let toast_type:NbComponentStatus = "success";
            if (response['status']){
              toast_type = "success";
              title = "Imagen Cargada";
              message = "Se ha modificado la imagen de tu empresa.";
              this.image = response['image'];
            } else {
              toast_type = "danger";
              title = "Error";
              message = "No se logró cargar el archivo, intentalo de nuevo mas tarde";
            }
            this.toast.showToast(toast_type, title, message);
          }, error => {
            let toast_type:NbComponentStatus = "danger";

            this.toast.showToast(toast_type, "Error", error.message);
          });
        }
      }else if (opt == 3) {
        if (file) {
          const formData = new FormData();

          formData.append("image_wh", file);

          this.service.updateDetails(formData).subscribe(response => {
            let title = "Proceso de Carga Masiva Iniciado";
            let message = "El archivo fue cargado exitosamente";
            let toast_type:NbComponentStatus = "success";
            if (response['status']){
              toast_type = "success";
              title = "Imagen Cargada";
              message = "Se ha modificado la imagen de Whatsapp de tu empresa.";
              this.image_wh = response['image_wh'];
            } else {
              toast_type = "danger";
              title = "Error";
              message = "No se logró cargar el archivo, intentalo de nuevo mas tarde";
            }
            this.toast.showToast(toast_type, title, message);
          }, error => {
            let toast_type:NbComponentStatus = "danger";

            this.toast.showToast(toast_type, "Error", error.message);
          });
        }
      }else{
        if (file) {
          this.fileName2=file
          this.fileName3='Img Subida'
        }
      }
    }else{
      this.toast.showToast('danger', "Error", "Tipo de Archivo Incorrecto, solo son permitidos formatos de imagenes (png, jpeg, jpg)");
    }
  }

  toggleClick(event:boolean,ind){
    switch (ind){
      case 0:
        if(!event){
          this.colorB='#412378'
          this.inputCB = '#412378'
          this.colorBF = this.colorB
          this.toggleNgModel=false
          const boxText1 = document.getElementById('titlePre');
          boxText1.classList.add('color-titlePre');
          boxText1.style.setProperty("--my-var", "#412378");
          const boxText2 = document.getElementById('titlePre4');
          boxText2.classList.add('color-titlePre');
          boxText2.style.setProperty("--my-var", "#412378");

        }else{
          this.colorB='#000000'
          this.inputCB = '#000000'
          this.colorBF = '#000000'
          const boxText1 = document.getElementById('titlePre');
          boxText1.classList.add('color-titlePre');
          boxText1.style.setProperty("--my-var", this.colorB);
          const boxText2 = document.getElementById('titlePre4');
          boxText2.classList.add('color-titlePre');
          boxText2.style.setProperty("--my-var", this.colorB);
        }
      break;
      case 1:
        if(!event){
          this.colorBT=''
          this.toggleNgModel2=false
        }else{
          this.colorBT='#000000'
        }
      break;
      // Toogle title
      case 4:
        if(!event){
          this.colorBFT='#000000'
          this.inputBFT='#000000'
          this.toggleNgModel5=false
          const boxText2 = document.getElementById('titlePre2');
          boxText2.classList.add('color-titlePre2');
          boxText2.style.setProperty("--my-var", "#000000");
        }else{
          this.colorBFT='#000000'
          this.inputBFT='#000000'
          const boxText2 = document.getElementById('titlePre2');
          boxText2.classList.add('color-titlePre2');
          boxText2.style.setProperty("--my-var", this.colorBFT);
        }
      break;
      case 5:
        if(!event){
          this.colorBTPH='#ffffff'
          this.inputBTPH='#ffffff'
          this.toggleNgModel6=false
          const boxText2 = document.getElementById('titleBackPre');
          boxText2.classList.add('color-titlePre');
          boxText2.style.setProperty("--my-var", "#ffffff");
        }else{
          this.colorBTPH='#000000'
          this.inputBTPH='#000000'
          const boxText2 = document.getElementById('titleBackPre');
          boxText2.classList.add('color-titlePre');
          boxText2.style.setProperty("--my-var", this.colorBTPH);
        }
      break;
      // Toogle description
      case 7:
        if(!event){
          this.colorBFD='#000000'
          this.inputBFD='#000000'
          this.toggleNgModel8=false
          const boxText1 = document.getElementById('titleDesc');
          boxText1.classList.add('color-titleDesc');
          boxText1.style.setProperty("--my-var", "#000000");
        }else{ 
          this.colorBFD='#000000'
          this.inputBFD='#000000'
          const boxText1 = document.getElementById('titleDesc');
          boxText1.classList.add('color-titleDesc');
          boxText1.style.setProperty("--my-var", this.colorBFD);
        }
      break;
      // Toogle footer
      case 8:
        if(!event){
          this.colorBFF='#ffffff'
          this.inputBFF='#ffffff'
          this.toggleNgModel9=false
          const boxText1 = document.getElementById('titleFooter');
          boxText1.classList.add('color-titleFooter');
          boxText1.style.setProperty("--my-var", "#ffffff");
        }else{ 
          this.colorBFF='#ffffff'
          this.inputBFF='#ffffff'
          const boxText1 = document.getElementById('titleFooter');
          boxText1.classList.add('color-titleFooter');
          boxText1.style.setProperty("--my-var", this.colorBFF);
        }
      break;
      // Toogle button color
      case 9:
        if(!event){
          this.inputBPB='#3366ff'
          this.colorBPB='#3366ff'
          this.toggleNgModel10=false
          const boxText1 = document.getElementById('buttonPre');
          boxText1.classList.add('color-buttonPre');
          boxText1.style.setProperty("--my-var", "#3366ff");
        }else{ 
          this.inputBPB='#3366ff'
          this.colorBPB='#3366ff'
          const boxText1 = document.getElementById('buttonPre');
          boxText1.classList.add('color-titleFooter');
          boxText1.style.setProperty("--my-var", this.colorBPB);
        }
      break;
      // Toogle button text color
      case 10:
        if(!event){
          this.colorBPT='#ffffff'
          this.inputBPT='#ffffff'
          this.toggleNgModel11=false
          const boxText1 = document.getElementById('textButton');
          boxText1.classList.add('color-textButton');
          boxText1.style.setProperty("--my-var", "#ffffff");
        }else{ 
          this.colorBPT='#ffffff'
          this.inputBPT='#ffffff'
          const boxText1 = document.getElementById('textButton');
          boxText1.classList.add('color-textButton');
          boxText1.style.setProperty("--my-var", this.colorBPT);
        }
      break;
      case 6:
        if(event){
          this.nameFooter='Si'
          this.toggleNgModel7=true
        }else{
          this.nameFooter='No'
          this.toggleNgModel7=false
        }
      break;
    }
  }

  getUrl(value){
    switch (value) {
      case '1':
        return 'https://'+ window.location.host + '/site/' + (this.acronym.trim() != '' ? this.acronym + '/login' : 'site') ;
      case '2':
        return 'https://'+ window.location.host + '/site/';
      case '3':
        this.toast.showToast("success", "Dirección web", "Se ha copiado la dirección web en el portapapeles.");
        let content = 'https://'+ window.location.host + '/site/' + (this.acronym.trim() != '' ? this.acronym + '/login' : 'site') ;
        this.clipboard.copy(content)
        break;
      default:
        break;
    }
  }

  openAddress(option){
    console.log(option)
    let state=''

    this.colorbtnV=localStorage.getItem('colorbtnV')
    this.colorbtnV2=localStorage.getItem('colorbtnV2')

    console.log(this.colorbtnV)
    console.log(this.colorbtnV2)
    if (option == 1){
      if(option == 1 && this.colorbtnV == '0'){
        state = '0'
      }else if(option == 1 && this.colorbtnV == '2'){
        state = '2'
      }else if(option == 1 && this.colorbtnV == '1'){
        state = '1'
      }
    }else{
      if(this.colorbtnV != '0'){
        if(option == 2 && this.colorbtnV2 == '0'){
          state = '3'
        }else if(option == 2 && this.colorbtnV2 == '2'){
          state = '4'
        }else if(option == 2 && this.colorbtnV2 == '1'){
          state = '5'
        }
      }else{
        state = '6'
      }
    }
    const address = this.dialogService.open(EmailComponent, {context:{data: {state:state,option:option}}, closeOnBackdropClick:false, closeOnEsc:false });
  }
}
