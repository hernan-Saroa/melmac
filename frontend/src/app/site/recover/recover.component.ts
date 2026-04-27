import { ToastService } from './../../usable/toast.service';
import { SiteService } from './../../services/site.service';
import { Router } from '@angular/router';
import { Component,ChangeDetectorRef } from '@angular/core';
import { NbResetPasswordComponent, NbAuthService } from '@nebular/auth';

@Component({
    selector: 'ngx-recover',
    templateUrl: './recover.component.html',
    styleUrls: ['./recover.component.scss'],
    standalone: false
})
export class RecoverComponent extends NbResetPasswordComponent {
  confirmPassword = '';
  showPassword = false;
  code_sent = false;
  code_valid = false;
  subtitle = "Por favor, escribe tu correo electrónico."
  intents = 0;
  temporal_password;

  constructor(private siteService:SiteService, private toastService:ToastService, service: NbAuthService, cd: ChangeDetectorRef, router: Router)
  { super(service, {}, cd, router); }

  onCodeCompleted(code){
    this.siteService.validateToken(this.user.email, code).subscribe(response => {
      if (response['status'] && response['message'] == "Token valido!"){
        this.temporal_password = response['temporal_pass']
        this.code_valid = true;
        this.subtitle = "Ingresa tu nueva contraseña.";
      } else {
        this.intents++;
        if (this.intents > 2) {
          this.user = {};
          this.code_sent = false;
          this.code_valid = false;
          this.subtitle = "Por favor, escribe tu correo electrónico.";
          this.toastService.showToast('warning', 'Token no coincide', 'Agotaste los intentos de ingresar el token, debes solicitar uno nuevo.');
        } else if (this.intents > 0) {
          this.toastService.showToast('warning', 'Token no coincide', 'Revisa tu token y vuelve a ingresarlo. Te quedan ' + (3-this.intents) + ' intentos.');
        }
      }
    });
  }

  getInputType() {
    if (this.showPassword) {
      return 'text';
    }
    return 'password';
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  sendToken(){
    if (this.user.email && (<string>this.user.email).match("[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+")){
      this.siteService.requestToken(this.user.email).subscribe(request => {
        if (request['status']) {
          this.subtitle = 'Te hemos enviado un token al número de telefono que tienes registrado';
          this.code_sent = true;
        } else {
          this.toastService.showToast('danger', 'Error', request['message']);
        }
      })
    }
  }

  changePassword(){
    if (this.code_valid){
      this.siteService.setNewPassword(this.user.email, this.user.password, this.temporal_password).subscribe(request=> {
        if (request['status']) {
          this.toastService.showToast('success', 'Contraseña Cambiada', 'Tu contraseña se ha cambiado con exito, en breve te enviaremos a la vista de Acceso.')
          setTimeout(() => this.router.navigate(['/login', {}]), 3000);
        } else {
          this.toastService.showToast('danger', 'Ocurrio un problema', request['message']);
          setTimeout(() => window.location.reload(), 3000);
        }
      });
    }
  }
}
