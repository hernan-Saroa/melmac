import { Component, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { ToastService } from '../../../usable/toast.service';
import { EnterpriseService } from './../../../services/enterprise.service';

@Component({
  selector: 'ngx-email',
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.scss']
})
export class EmailComponent implements OnInit {

  selectedItem;
  textInfo;
  dominio='';
  emailNext='';
  formData;
  data;
  state;
  textoEnviado;
  title;
  optionBtn;
  name1='';
  emailR='';
  emailR2='';
  address='';
  address2='';
  alias='';
  loading=false;

  constructor(public dialogRef: NbDialogRef<EmailComponent>, private toast:ToastService,private service: EnterpriseService) {}

  ngOnInit(): void {

    this.state=this.data.state
    this.optionBtn=this.data.option

    if(this.optionBtn == '1')
      this.title='AUTENTICACIÓN DEL DOMINIO'
    if(this.optionBtn == '2')
      this.title='VERIFICACIÓN DEL REMITENTE'

    if(this.state == '1')
      this.textoEnviado="La autenticación del dominio ya fue realizada."
    if(this.state == '2')
      this.textoEnviado="La autenticación del dominio se encuentra en proceso de validación."
    if(this.state == '4')
      this.textoEnviado="La verificación del remitente se encuentra en proceso de validación."
    if(this.state == '5')
      this.textoEnviado="La verificación del remitente ya fue realizada."
    if(this.state == '6')
      this.textoEnviado="Para realizar la verificación del remitente debe primero realizar la autenticación del dominio."
  }

  close(){
    this.dialogRef.close(false);
  }

  onAccept(optionSubmit){
    this.loading = true;
    let enterprise = ''
    if (localStorage.getItem('session')){
      let user = JSON.parse(localStorage.getItem('session'))
      enterprise = user.enterprise
    }

    this.formData = { "dominio": this.dominio,
                      "enterprise": enterprise,"dns": this.selectedItem,
                      "email":this.emailNext, "bodyEmail":this.textInfo,
                      "optionSubmit":optionSubmit,"name1":this.name1,"emailR":this.emailR,
                      "emailR2":this.emailR2,"address":this.address,"address2":this.address2,"alias": this.alias
                      }

    this.service.emailEnterprise(this.formData).subscribe(
      (response) => {
        if(response['optionRest']=='1'){
          this.toast.showToast('success', 'Autenticación enviada', 'Tus datos se han enviado.');
          localStorage.setItem('colorbtnV', JSON.stringify(2));
          localStorage.setItem('colorbtnV2', JSON.stringify(0));
          setTimeout(() => {
            const boxText2 = document.getElementById('btnV1');
            boxText2.classList.add('color-titlePre');
            boxText2.style.setProperty("--my-var", '#2196F2');
            this.title='VERIFICACIÓN DEL REMITENTE'
            this.state='3'
            this.loading = false
          }, 1000
          );
        }else{
          this.toast.showToast('success', 'Verificación enviada', 'Tus datos se han enviado.');
          localStorage.setItem('colorbtnV2', JSON.stringify(2));
          setTimeout(() => {
            const boxText2 = document.getElementById('btnV2');
            boxText2.classList.add('color-titlePre');
            boxText2.style.setProperty("--my-var", '#2196F2');
            this.close()
          }, 1000
          );
        }
      }, (error) => {
          this.toast.showToast('warning', 'Oops!', 'Algo Inesperado ha sucedido, intenta de nuevo mas tarde.');
      }
      );
  }

  checkForm(opt){
    if(opt == '1')
      return !(this.dominio != '' && this.selectedItem != undefined && this.emailNext != '' && this.selectedItem != '' && (this.emailNext && this.emailNext.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+[.][a-zA-Z0-9.]{2,}$/)))
    if(opt == '2')
      return !(this.name1 != '' && this.emailR != '' && this.emailR2 != '' && this.address != '' && this.address2 != '' && this.alias != '')
  }

}
