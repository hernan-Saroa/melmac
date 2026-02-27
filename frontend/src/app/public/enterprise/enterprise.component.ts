import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SharedService } from '../shared.service';
import { ActivatedRoute } from '@angular/router';
import { EnterpriseService } from '../../services/enterprise.service';
import { ToastService } from '../../usable/toast.service';
import { NbTagComponent, NbTagInputAddEvent } from '@nebular/theme';

@Component({
  selector: 'ngx-enterprise',
  templateUrl: './enterprise.component.html',
  styleUrls: ['./enterprise.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnterpriseComponent implements OnInit {

  token_link = '';
  url_token_link = '';
  ent_id;
  loading;
  forms;
  sms: boolean = false;
  whatsapp: boolean = false;
  email: boolean = false;
  selectedItem = '';
  phones= [];
  emails= [];
  numTel;
  emailsID;
  dnumTel: boolean = true;
  demailsID: boolean = true;
  dBtnCompartir: boolean = true;

  constructor(
    private activatedRoute: ActivatedRoute,
    private _sharedService: SharedService,
    private enterpriseService: EnterpriseService,
    private toastService: ToastService,
  ) { }

  ngOnInit(): void {
    this.token_link = this.activatedRoute.snapshot.paramMap.get('token');
    this.loading = true;
    this.getDataToken();
  }

  getDataToken() {
    this.loading = true;
    this.enterpriseService.get_enterprise_token(this.token_link).subscribe(
      response => {
        if (response['status']){

          // Datos de la empresa.
          this.ent_id = response['data']['id'];
          this.forms = response['forms']
          this.selectedItem=this.forms[0].id+'_'+this.forms[0].token
          this.url_token_link=this.forms[0].token
          this._sharedService.emitChange(response['data']);
          this.loading = false;
        } else {
          this.loading = false;
        }
      }, error => {
        console.log(error);
      }
    );
  }

  toggleMsgType(i, value){
    if (i == 0)
      this.whatsapp = value;
    else if(i == 1)
      this.sms = value;
    else
      this.email = value;

    if(this.sms || this.whatsapp){
      this.dnumTel=false
    }else{
      this.dnumTel=true
      this.numTel=''
    }

    if(this.email){
      this.demailsID=false
    }else{
      this.demailsID=true
      this.emailsID=''
    }

    if(this.email || this.sms || this.whatsapp){
      this.dBtnCompartir=false
    }else{
      this.dBtnCompartir=true
    }
  }

  copy_message() {
    this.toastService.showToast('basic', 'Enlace copiado.', '');
  }

  setValueDocument(event){
    let text = event.split("_");
    this.url_token_link=text[1]
  }

  onTagRemove(tagToRemove: NbTagComponent, option: number): void {
    if (option == 1) {
      let position = this.emails.map(function(tag) { return tag; }).indexOf(tagToRemove.text);
      this.emails.splice(position, 1);
      console.log(this.emails);
    } else {
      let position = this.phones.map(function(tag) { return tag; }).indexOf(tagToRemove.text);
      this.phones.splice(position, 1);
    }
  }

  onTagAdd(value, ind){
    if(value != '' && value != undefined)
      if(ind == 1){
        this.emails.push(value)
        console.log(value);
        console.log(this.emails);
        this.emailsID=''
      }else{
        this.phones.push(value)
        this.numTel=''
      }
  }

  btnCompartir(){
    this.dBtnCompartir=true
    this.loading = true;
    let phonesF;
    let emailsF;

    if(this.phones.length == 0){
      phonesF = ['NA']
    }else{
      phonesF = this.phones

    }if(this.emails.length == 0){
      emailsF = ['NA']
    }else{
      emailsF = this.emails
    }
    let text = this.selectedItem.split("_");
    this.enterpriseService.send_public_share(this.token_link,phonesF.toString(),emailsF.toString(),this.email,this.sms,this.whatsapp,text[0]).subscribe(
      response => {
        if (response['status']){
          this.toastService.showToast('success', 'Proceso exitoso','Proceso documental COMPARTIDO exitosamente')
          this.dBtnCompartir=false;
          this.loading = false;
          setTimeout(() => {
            this.refresh();
            }, 5000
          );
        } else {
          this.loading = false;
        }
      }, error => {
        console.log(error);
        this.toastService.showToast('danger', 'Proceso Fallido','Proceso documental NO fue COMPARTIDO');
      }
    );

  }

  refresh(): void {
    window.location.reload();
  }

  onValidate(data, option) {
    if (!this.isValidate(data, option)) {
      return 'danger';
    }
    return '';
  }

  isValidate(data: string, option): boolean{
    switch (option) {
      // Email
      case 1:
        var REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+[.][a-zA-Z0-9.]{2,}$/;
        data = data.trim();
        break;
      // Numero
      case 2:
        var REGEX = /^3[0-9]{9}$/;
        break;
      default:
        return true;
    }

    return REGEX.test(data);
  }

}
