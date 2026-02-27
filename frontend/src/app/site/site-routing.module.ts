import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import {
  NbAuthComponent,
  NbLoginComponent,
  NbLogoutComponent,
  NbRegisterComponent,
  NbRequestPasswordComponent,
  NbResetPasswordComponent,
} from '@nebular/auth';
import { LoginComponent } from './login/login.component';
import { RecoverComponent } from './recover/recover.component';
import { CheckEnterpriseGuard } from '../guards/check_login.guard';

export const routes: Routes = [
  {
    path: '',
    component: NbAuthComponent,
    children: [
      { path: '', redirectTo: 'site', pathMatch: 'full' },
      {
        path: 'site',
        component: LoginComponent,
      },
      {
        path: 'recover-pass',
        component: RecoverComponent,
      },
      { path: ':ent',
        children: [
          {
            path: '',
            redirectTo:'login', pathMatch: 'full',
          },
          {
            path: 'login',
            component: LoginComponent,
          },
          {
            path: 'recover-pass',
            component: RecoverComponent,
          }
        ],
        canActivate:[CheckEnterpriseGuard]
      }
    ],
  },
  { path: '', redirectTo: 'site', pathMatch: 'full' },
  { path: '**', redirectTo: 'site/site' },
];

const config: ExtraOptions = {
  useHash: false,
};

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SiteRoutingModule {
}
