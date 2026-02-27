import { ComponentFixture } from '@angular/core/testing';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { SignupComponent } from './signup.component';
import { NotFoundComponent } from '../pages/miscellaneous/not-found/not-found.component';

const routes: Routes = [{
  path: '',
  component: SignupComponent,
  children: [
    {
      path: '',
      component: SignupComponent,
    },
    {
      path: 'set_password',
      component: SignupComponent,
      data: {change_password: true}
    },
    {
      path: '**',
      component: NotFoundComponent,
    },
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SignupRoutingModule {
}
