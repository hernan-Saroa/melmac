import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FormComponent } from './form.component';

import { ViewComponent } from './view/view.component';
import { SendComponent } from './send/send.component';
import { AnswerComponent } from './answer/answer.component';
import { DetailComponent } from './view/detail/detail.component';
import { AssociateComponent } from './associate/associate.component';
import { CreateComponent } from './create/create.component';
import { ReportComponent } from '../answer/report/report.component';
import { CamDetectComponent } from './cam-detect/cam-detect.component';

const routes: Routes = [
  {
    path: '',
    component: FormComponent,
    children: [
      {
        path: 'create',
        component: CreateComponent,
        data: {consecutive: false}
      },
      {
        path: 'update/:id',
        component: CreateComponent,
        data: {consecutive: false}
      },
      {
        path: 'consecutive/create',
        component: CreateComponent,
        data: {consecutive: true}
      },
      {
        path: 'consecutive/update/:id',
        component: CreateComponent,
        data: {consecutive: true}
      },
      {
        path: 'view',
        component: ViewComponent,
      },
      {
        path: 'inactive',
        component: ViewComponent,
        data: {inactive: true}
      },
      {
        path: 'send',
        component: SendComponent,
      },
      {
        path: 'view/:id',
        component: DetailComponent,
        data: {form: 0}
      },
      {
        path: 'view/consecutive/:id',
        component: DetailComponent,
        data: {form: 1}
      },
      {
        path: 'view/digital/:id',
        component: DetailComponent,
        data: {form: 2}
      },
      {
        path: 'answer/:id',
        component: AnswerComponent,
      },
      {
        path: 'consecutive/answer/:consecutive',
        component: AnswerComponent,
      },
      {
        path: 'digital/answer/:digital',
        component: AnswerComponent,
        data: {digital: 1}
      },
      {
        path: 'answer/update/:form/:answer',
        component: AnswerComponent,
      },
      {
        path: 'answer/update/consecutive/:form/:answer_consecutive',
        component: AnswerComponent,
      },
      {
        path: 'answer/update/digital/:form/:answer_digital',
        component: AnswerComponent,
        data: {digital: 1}
      },
      {
        path: 'associate/:id',
        component: AssociateComponent,
      },
      {
        path: 'associate/:id/:option',
        component: AssociateComponent,
      },
      {
        path: 'cam_detect',
        component: CamDetectComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FormRoutingModule {
}
