import { DeviceMassiveComponent } from './device/massive.component';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { UserMassiveComponent } from './user/massive.component';
import { FormAnswerComponent } from './form-answer/form-answer.component';

const routes: Routes = [{
  path: '',
  children: [
    {
      path: 'device',
      component: DeviceMassiveComponent,
    },
    {
      path: 'user',
      component: UserMassiveComponent,
    },
    {
      path: 'form_answer',
      component: FormAnswerComponent,
    }
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MassiveRoutingModule {
}
