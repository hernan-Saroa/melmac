import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginNewComponent } from './login-new.component';
import { CheckEnterpriseGuard } from '../guards/check_login.guard';


const routes: Routes = [
  {
    path: '',
    component: LoginNewComponent,
    children: [

    ],

  },
  { path: ':ent',
        children: [
          {
            path: '',
            redirectTo:'login', pathMatch: 'full',
          },
          {
            path: 'login',
            component: LoginNewComponent,
          },
          // {
          //   path: 'recover-pass',
          //   component: RecoverComponent,
          // }
        ],
        canActivate:[CheckEnterpriseGuard]
      }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoginRoutingModule {
}
