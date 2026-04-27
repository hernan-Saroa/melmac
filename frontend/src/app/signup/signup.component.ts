import { ChangeDetectorRef, Component } from '@angular/core';
import { Location } from '@angular/common';
import { NbThemeService } from '@nebular/theme';
import { ToastService } from '../usable/toast.service';
import { SignupService } from '../services/signup.service';
import { NbAuthService, NbResetPasswordComponent } from '@nebular/auth';
import { Router } from '@angular/router';
import { HttpClient  } from '@angular/common/http';

@Component({
    selector: 'ngx-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss'],
    standalone: false
})
export class SignupComponent extends NbResetPasswordComponent {

  change_password = false;
  step = 1;
  loading = false;

  email = '';
  name = '';
  last_name = '';
  document = '';
  phone = '';

  terms = false;
  ipAddress;
  code_sent = false;
  code_valid = false;
  intents = 0;

  temporal_password;

  authsocial = false;
  platform;

  constructor(
    private _location: Location,
    private themeService: NbThemeService,
    private signupService: SignupService,
    private toastService: ToastService,
    private http:HttpClient,
    service: NbAuthService,
    cd: ChangeDetectorRef,
    router: Router
  ) {
    super(service, {}, cd, router);
    this.themeService.changeTheme('default');

    if (router.url == '/signup/set_password'){
        const user = JSON.parse(localStorage.getItem('session'));
        if (user && user['change_password']) {
            this.loading = true;
            this.change_password = true;
            this.step = 2;
            this.email= user['email'];
            this.sendToken();
        } else {
          this.router.navigate(['/login', {}]);
        }
    }
  }

  ngOnInit(): void {
    this.getIPAddress();
  }

  onBack() {
    this._location.back();
  }

  // Redes Sociales
  signInWithGoogle(): void {
  }

  signInWithFB(): void {
  }

  toggleTerms(checked: boolean) {
    this.terms = checked;
  }

  getIPAddress()
  {
    this.http.get("https://api.ipify.org/?format=json").subscribe((res:any)=>{
      this.ipAddress = res.ip;
      // console.log(this.ipAddress);
    });
  }

  onSocial(data) {
    this.loading = true;
    this.signupService.signup(data).subscribe(request => {
      if (request['status']) {
        this.toastService.showToast('success', 'Registro Completado', 'Tu usuario se ha registrado con exito, en breve te enviaremos a la vista de Acceso.')
        setTimeout(() => this.router.navigate(['/login', {}]), 2000);
      } else {
        this.toastService.showToast('danger', 'Error', request['message']);
        this.loading = false;
      }
    });
  }

  // Registro Normal
  onSunmit(email_inv, name_inv, last_name_inv, document_inv, phone_inv) {
    this.loading = true;
    if (this.email != '' && this.phone != '' && this.name != '' && this.last_name != '' && this.document != '') {
      if (email_inv != true && name_inv != true && last_name_inv != true && document_inv != true && phone_inv != true) {
        if (this.terms) {
          let data = {
            email: this.email,
            phone: this.phone,
            first_name: this.name,
            first_last_name: this.last_name,
            identification: this.document,
            ip_address: this.ipAddress,
          }

          this.signupService.signup(data).subscribe(request => {
            if (request['status']) {
              this.sendToken();
            } else {
              this.toastService.showToast('danger', 'Error', request['message']);
              this.loading = false;
            }
          })
        } else {
          this.loading = false;
          this.toastService.showToast('info', 'Condiciones de servicio!', 'Para continuar debes aceptar condiciones de servicio');
        }
      } else {
        this.loading = false;
        this.toastService.showToast('info', 'Datos!', 'Campos invalidos');
      }
    } else {
      this.loading = false;
      this.toastService.showToast('info', 'Datos!', 'Todos los campos deben estar diligenciados');
    }

  }

  sendToken(){
    if (this.email && (<string>this.email).match("[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+")){
      this.signupService.requestToken(this.email).subscribe(request => {
        if (request['status']) {
          this.loading = false;
          this.toastService.showToast('success', 'Token enviado!', 'Te hemos enviado un token al número de telefono que tienes registrado');
          this.step = 2
          this.code_sent = true;
        } else {
          this.toastService.showToast('danger', 'Error', request['message']);
        }
      })
    }
  }

  onCodeCompleted(code, codeInput){
    this.signupService.validateToken(this.email, code).subscribe(response => {
      if (response['status'] && response['message'] == "Token valido!") {
        this.toastService.showToast('success', 'Token de confirmación', 'Token valido');
        this.temporal_password = response['temporal_pass']
        this.code_valid = true;
      } else {
        this.intents++;
        codeInput.reset();

        if (this.intents > 2) {
          if (this.change_password) {
            this.intents = 0;
            this.loading = true;
            this.toastService.showToast('danger', 'Intentos agotados', 'Por favor reintenta el proceso nuevamente.');
            setTimeout(() => this.router.navigate(['/login', {}]), 2000);
          } else {
            this.code_sent = false;
            this.code_valid = false;
            this.toastService.showToast('warning', 'Token no coincide', 'Agotaste los intentos de ingresar el token, debes volver a realizar el registro.');
            this.step = 1;
            this.intents = 0;
          }
        } else if (this.intents > 0) {
          this.toastService.showToast('warning', 'Token no coincide', 'Revisa tu token y vuelve a ingresarlo. Te quedan ' + (3-this.intents) + ' intentos.');
        }
      }
    });
  }

  changePassword(password_inv){
    if (password_inv || this.user.password.replace(/\s/g, "") == '') {
      this.toastService.showToast('warning', 'Contraseña', 'La contraseña debe ser de 8 a 20 caracteres');
    } else {
      if (this.user.password == this.user.confirmPassword) {
        this.loading = true;
        this.signupService.setNewPassword(this.email, this.user.password, this.temporal_password).subscribe(request=> {
          if (request['status']) {
            if (this.change_password) {
              this.toastService.showToast('success', 'Contraseña asignada', 'Se ha asignado correctamente tu nueva contraseña.');
              let user = JSON.parse(localStorage.getItem('session'));
              if (user){
                user['change_password'] = false;
                localStorage.setItem('session', JSON.stringify(user));
              }
            } else {
              this.toastService.showToast('success', 'Registro Completado', 'Tu usuario se ha registrado con exito, en breve te enviaremos a la vista de Acceso.');
            }
            setTimeout(() => this.router.navigate(['/login', {}]), 2000);
            
          } else {
            this.toastService.showToast('danger', 'Ocurrio un problema', request['message']);
            setTimeout(() => window.location.reload(), 3000);
          }
        });
      } else {
        this.toastService.showToast('warning', 'Confirma la Contraseña', 'La contraseña no coincide');
      }
    }
  }

}
