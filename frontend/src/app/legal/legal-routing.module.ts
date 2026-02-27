import { ComponentFixture } from '@angular/core/testing';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { LegalComponent } from './legal.component';
import { NotFoundComponent } from '../pages/miscellaneous/not-found/not-found.component';

const routes: Routes = [{
  path: '',
  component: LegalComponent,
  children: [
    {
      path: '',
      component: LegalComponent,
    },
    {
      path: 'set_password',
      component: LegalComponent,
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
