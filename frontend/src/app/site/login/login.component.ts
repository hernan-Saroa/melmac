import { Component, Injectable, OnInit } from '@angular/core';
import { NbLoginComponent } from '@nebular/auth';
import { ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SiteService } from '../../services/site.service';
import { ToastService } from '../../usable/toast.service';
import { NbAuthService } from '@nebular/auth';

@Component({
    selector: 'ngx-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    standalone: false
})
@Injectable()
export class LoginComponent extends NbLoginComponent implements OnInit {
  loading = false;
  acronym = null;
  authsocial = false;
  img='assets/images/logo_melmac.png'

  constructor(
    service: NbAuthService,
    cd: ChangeDetectorRef,
    router: Router,
    private siteService: SiteService,
    private toastService: ToastService,
    private activatedRoute: ActivatedRoute,
  ) {
    super(service, {}, cd, router);
  }

  ngOnInit(): void {
    this.showMessages = {};
    this.acronym = this.activatedRoute.snapshot.paramMap.get('ent');

    const user = JSON.parse(localStorage.getItem('session')) || null;
    if (user) {
      const permits:number[] = user.permission;
      const view:string =  permits.includes(62) ? '/pages/statistics' : '/pages/inbox';
      this.router.navigate([view, {}]);
    }else {
      let env = sessionStorage.getItem('environment');
      if (env){
        if (env.split(';')[2] != undefined) {
          this.img = env.split(';')[2];
        }
        env = env.split(';')[0];
        this.loading = true;
        this.router.navigate(['/site/'+env+'/login']);
        this.loading = false;
      }
    }
    this.toastService.duration = 5000;
  }
;

  login() {
    this.loading = true;
    let data = {
      'email': this.user.email,
      'password': this.user.password
    };
    this.onLogin(data);
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
            const view:string =  permits.includes(62) ? '/pages/statistics' : '/pages/inbox';
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
}
