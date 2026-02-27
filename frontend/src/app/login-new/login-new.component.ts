import { Component, OnInit } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { THEMES } from '../@theme/components';
import { NgIf } from '@angular/common';
import { SiteService } from '../services/site.service';
import { ToastService } from '../usable/toast.service';
import { NbAuthService } from '@nebular/auth';
import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient  } from '@angular/common/http';
import { SignupService } from '../services/signup.service';



@Component({
  selector: 'ngx-login-new',
  templateUrl: './login-new.component.html',
  styleUrls: ['./login-new.component.scss']
})
export class LoginNewComponent implements OnInit {

  hidden_reg=true;
  loading = false;
  acronym = null;
  authsocial = false;
  email = "";
  password = "";
  new_password = "";
  // Register
  change_password = false;
  step = 1;
  login_form = true;

  name = '';
  last_name = '';
  document = '';
  phone = '';

  terms = false;
  ipAddress;
  code_sent = false;
  code_valid = false;
  intents = 0;
  confirmPassword = '';
  temporal_password;

  platform;


  // showMessages : any;
  constructor(
    private service: NbAuthService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private siteService: SiteService,
    private toastService: ToastService,
    private activatedRoute: ActivatedRoute,
    private signupService: SignupService,
    // private _location: Location,
    private themeService: NbThemeService,
    private http:HttpClient,
  ) {
    // super(service, {}, cd, router);
  }

  ngOnInit(): void {

    // this.showMessages = {};
    this.getIPAddress();
    this.acronym = this.activatedRoute.snapshot.paramMap.get('ent');

    const user = JSON.parse(localStorage.getItem('session')) || null;
    if (user) {
      const permits:number[] = user.permission;
      let view:string;
      if(permits.includes(71)){
        view = permits.includes(71) ? '/pages/home' : '/pages/inbox';
      }else{
        view =  permits.includes(62) ? '/pages/dashboard' : '/pages/inbox';
      }
      this.router.navigate([view, {}]);
    }else {
      let env = sessionStorage.getItem('environment');
      if (env){
        env = env.split(';')[0];
        this.loading = true;
        this.router.navigate(['/site/'+env+'/login']);
        this.loading = false;
      }
    }
    this.toastService.duration = 5000;
  };


  login() {
    if (this.email != '' && this.password != ''){
      this.loading = true;
      let data = {
        'email': this.email,
        'password': this.password
      };
      this.onLogin(data);
    }
  }

  onLogin(data) {
    this.siteService.login(data).subscribe(response => {
      // console.log(response['status']);
      if (response['status'] == true) {
        localStorage.setItem('session', JSON.stringify(response['data']['parameters']));
        let redirect_type:any = (sessionStorage.getItem('type')) || null;
        const id_doc = (sessionStorage.getItem('id')) || null;


        if (response['data']['parameters']['change_password'] == true) {
          this.router.navigate(['/signup/set_password/']);
        } else {
          if (redirect_type){
            redirect_type = redirect_type.split(';');
            if (redirect_type[0] == '1' && id_doc){
              sessionStorage.removeItem('id');
              sessionStorage.removeItem('type');
              switch(redirect_type[1]){
                case '1':
                  // console.log('Ind');
                  this.router.navigate(['/pages/form/view/' + id_doc, {}]);
                break;
                case '2':
                  // console.log('Con');
                  this.router.navigate(['/pages/form/view/consecutive/' + id_doc, {}]);
                break;
                case '3':
                  // console.log('Dig');
                  this.router.navigate(['/pages/form/view/digital/' + id_doc, {}]);
                break;
                default:
                break;
              }
            }
          } else {
            const permits:number[] = response['data']['parameters']['permission'];
            let view:string;
            if(permits.includes(71)){
              view = permits.includes(71) ? '/pages/home' : '/pages/inbox';
            }else{
              view =  permits.includes(62) ? '/pages/dashboard' : '/pages/inbox';
            }
            this.router.navigate([ view, {}]);
          }
        }


      } else {
        this.toastService.showToast('warning', 'Error', response['message']);
        this.loading = false;
      }
    }, error => {
      this.toastService.showToast('danger', 'Error', '¡Intenta más tarde!');
      this.loading = false;
    });
  }

  showPassword = false;

  getInputType() {
    if (this.showPassword) {
      return 'text';
    }
    return 'password';
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  exitAcronym() {
    sessionStorage.removeItem('environment');
    this.router.navigate(['/login']);
  }



  getIPAddress()
  {
    this.http.get("https://api.ipify.org/?format=json").subscribe((res:any)=>{
      this.ipAddress = res.ip;
      // console.log(this.ipAddress);
    });
  }

  toggleTerms(checked: boolean) {
    this.terms = checked;
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

  pulsar(e) {
      if (e.keyCode === 13 && !e.shiftKey) {
          e.preventDefault();
          this.login()
      }
  }

  // Registro Normal
  onSunmit(email_inv, name_inv, last_name_inv, document_inv, phone_inv) {
    // this.loading = true;
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

  onRegister(){
    this.login_form = !this.login_form
  }

  changePassword(password_inv){
    if (password_inv || this.new_password.replace(/\s/g, "") == '') {
      this.toastService.showToast('warning', 'Contraseña', 'La contraseña debe ser de 8 a 20 caracteres');
    } else {
      if (this.new_password == this.confirmPassword) {
        this.loading = true;
        this.signupService.setNewPassword(this.email, this.new_password, this.temporal_password).subscribe(request=> {
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
              let data = {
                'email': this.email,
                'password': this.confirmPassword
              };
              this.onLogin(data);
            }
            //setTimeout(() => this.router.navigate(['/login', {}]), 2000);

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
