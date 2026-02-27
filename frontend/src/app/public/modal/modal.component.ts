import { Component, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

@Component({
  selector: 'ngx-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent implements OnInit {

  size;
  title;
  sub_title;
  public data:{type};

  disapprove = [{
    value: 'Escribe aquí. Ejp.: Le faltan ítems'
  }]

  token_checker = '';

  // Formulario Contacto
  telOptions = { initialCountry: 'co', preferredCountries: ['co']};
  inputObject: any = null;

  contact_name = '';
  contact_email = '';
  contact_phone = {
    phoneInd: '',
    phoneNumber: ''
  };

  constructor(
    public dialogRef: NbDialogRef<ModalComponent>,
  ) { }

  ngOnInit(): void {
    switch (this.data.type) {
      case 1:
        this.title = 'Tu función como APROBADOR es la de revisar este proceso documental y completar con una acción:';
        this.size = '26.875rem';
        break;
      case 2:
        this.title = '¿Estás segur@ de haber revisado completamente para generar APROBADO?';
        this.size = '19rem';
        break;
      case 3:
        this.title = 'Por favor indica las razones por las cuales seleccionaste NO APROBADO:';
        this.size = '25rem';
        break;
      case 4:
        this.title = 'Para realizar la verificación de forma adecuada, solicitaremos información sensible.';
        this.size = '25rem';
        break;
      case 5:
        this.title = "¡Gracias!";
        this.sub_title = "Datos y documentos para VERIFICACIÓN enviados con éxito";
        this.size = '25rem';
        break;
      case 6:
        this.title = "Ingresa el código OTP de 6 dígitos que enviamos a tu correo";
        this.sub_title = "";
        this.size = '17rem';
        break;
      case 7:
        this.title = "Tu función como VERIFICADOR es la de revisar por participante que se cumplan los requisitos de este proceso documental";
        this.size = '29.5rem';
        break;
      case 8:
        this.title = 'Por favor indica las razones por las cuales seleccionaste RECHAZADO:';
        this.size = '25rem';
        break;
      case 9:
        this.title = 'Completaste el proceso de VERIFICACIÓN de forma exitosa por participante. ¿Qué quieres hacer?';
        this.size = '22rem';
        break;
      case 10:
        this.title = 'Dentro de los campos a diligenciar, solicitaremos información sensible.';
        this.size = '22rem';
        break;
      case 11:
        this.title = '¡Felicidades!';
        this.sub_title = "Has finalizado tu diligenciamiento";
        this.size = '22rem';
        break;
      case 12:
        this.title = '¡Houston, tenemos un problema! Aún no has finalizado tu diligenciamiento';
        this.size = '24rem';
        break;
      case 13:
        this.title = 'Datos Personales';
        this.size = '28rem';
        break;
      default:
        break;
    }
  }

  AddDisapprove() {
    this.disapprove.push({
      value: ''
    });
  }

  RemoveDisapprove(i) {
    this.disapprove.splice(i, 1);
  }

  onValidate() {
    let required = false;
    this.disapprove.forEach(reason => {
      if (reason.value.trim() == '') {
        required = true;
      }
    });
    return required;
  }

  onValidateContact() {
    let required = false;
    var REGEX_EMAIL = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    if (this.contact_name.trim() == '') {
      required = true;
    } else if (this.contact_email.trim() == '') {
      required = true;
    } else if (!REGEX_EMAIL.test(this.contact_email.trim())) {
      required = true;
    } else if (this.contact_phone.phoneNumber == '' || this.contact_phone.phoneNumber == null) {
      required = true;
    }

    if (this.contact_phone.phoneInd == '+57-co') {
      if ((this.contact_phone.phoneNumber+'').length != 10) {
        required = true;
      }
    }

    return required;
  }

  onAccept(event){
    switch (this.data.type) {
      case 1:
      case 2:
      case 4:
      case 9:
      case 10:
      case 11:
      case 12:
        this.dialogRef.close(true);
        break;
      case 3:
      case 8:
        let reasons = JSON.stringify(this.disapprove);
        this.dialogRef.close(reasons);
        break;
      case 6:
        this.dialogRef.close(this.token_checker);
        break;
      case 13:
        let data = {
          name: this.contact_name,
          email: this.contact_email,
          contact_phone: this.contact_phone,
        }
        this.dialogRef.close(data);
        break;
      default:
        break;
    }
  }

  onBlur(event) {
    this.contact_phone.phoneInd = this.inputObject ? `+${this.inputObject.s.dialCode}-${this.inputObject.s.iso2}` : null;
  }

  telInputObject(event) {
    this.inputObject = event;
    this.contact_phone.phoneInd = this.inputObject ? `+${this.inputObject.s.dialCode}-${this.inputObject.s.iso2}` : null;
  }

  saveToken(code) {
    this.token_checker = code;
  }

  close(){
    this.dialogRef.close(false);
  }

}
