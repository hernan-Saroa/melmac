import { ActivatedRouteSnapshot, ExtraOptions, RouterModule, RouterStateSnapshot, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import {
  NbAuthComponent,
  NbLoginComponent,
  NbLogoutComponent,
  NbRegisterComponent,
  NbRequestPasswordComponent,
  NbResetPasswordComponent,
} from '@nebular/auth';
import { CheckEnterpriseGuard, CheckLoginGuard } from './guards/check_login.guard';


export const routes: Routes = [
  {
    path: 'landing',
    loadChildren: () => import('./landing/landing.module')
      .then(m => m.LandingModule),
  },
  {
    path: 'login',
    loadChildren: () => import('./login-new/login-new.module')
      .then(m => m.LoginNewModule),
  },
  {
    path: 'signup',
    loadChildren: () => import('./signup/signup.module')
      .then(m => m.SignupModule),
  },
  {
    path: 'legal',
    loadChildren: () => import('./legal/legal.module')
      .then(m => m.SignupModule),
  },
  {
    path: 'authorization',
    loadChildren: () => import('./legal/legal.module')
      .then(m => m.SignupModule),
  },
  {
    path: 'detail/:id',
    loadChildren: () => import('./legal/legal.module')
      .then(m => m.SignupModule),
  },
  {
    path: 'site',
    loadChildren: () => import('./site/site.module')
      .then(m => m.SiteModule),
  },
  {
    path: 'pages',
    loadChildren: () => import('./pages/pages.module')
      .then(m => m.PagesModule),
      canActivate:[CheckLoginGuard]
  },
  {
    path: 'public',
    loadChildren: () => import('./public/public.module')
      .then(m => m.PublicModule),
  },
  // {
  //   path: ':ent',
  //   loadChildren: () => import('./pages/pages.module')
  //     .then(m => m.PagesModule),
  //     canActivate:[CheckLoginGuard, CheckEnterpriseGuard]
  // },
  { path: '**', redirectTo: 'landing'},
];

const config: ExtraOptions = {
  useHash: false,
};

@NgModule({
  imports: [RouterModule.forRoot(routes, config)],
  exports: [RouterModule],
  providers: [
    {
        provide: 'externalUrlRedirectResolver',
        useValue: (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
        {
            window.location.href = (route.data as any).externalUrl;
        }
    }
]
})
export class AppRoutingModule {
}
