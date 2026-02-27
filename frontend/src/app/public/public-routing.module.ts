import { ComponentFixture } from '@angular/core/testing';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { PublicComponent } from './public.component';
import { NotFoundComponent } from '../pages/miscellaneous/not-found/not-found.component';
import { FormComponent } from './form/form.component';
import { InfoComponent } from './info/info.component';
import { TraceComponent } from './trace/trace.component';
import { FileComponent } from './file/file.component';
import { EnterpriseComponent } from './enterprise/enterprise.component';
import { EnvelopeComponent } from './envelope/envelope.component';
import { VerifiedComponent } from './verified/verified.component';
import { HistorialComponent } from './historial/historial.component';
import { BioComponent } from './services/sign/bio/bio.component';
import { DocComponent } from './services/sign/doc/doc.component';

const routes: Routes = [{
  path: '',
  component: PublicComponent,
  children: [
    {
      path: '',
      component: NotFoundComponent,
      data: {option: 'public'}
    },
    {
      path: 'envelope/user/:answer/:token',
      component: EnvelopeComponent,
      data: {option: 1}
    },
    {
      path: 'historial/user/:token',
      component: HistorialComponent,
    },
    {
      path: 'approve/user/:answer/:token',
      component: EnvelopeComponent,
      data: {option: 2}
    },
    {
      path: 'verified/user/:answer/:token',
      component: VerifiedComponent,
      data: {option: 3}
    },
    {
      path: 'checker/user/:answer/:token',
      component: VerifiedComponent,
      data: {option: 4}
    },
    {
      path: 'enterprise/:token',
      component: EnterpriseComponent,
    },
    {
      path: 'trace/:token',
      component: TraceComponent,
    },
    {
      path: ':token',
      component: FormComponent,
    },
    {
      path: ':option/:token',
      component: InfoComponent,
    },
    {
      path: 'view/pdf/:token',
      component: FileComponent,
    },
    {
      path: 'view/pdf/:token/:id',
      component: FileComponent,
    },
    {
      path: 'servicies/sign/bio/:token/:hash',
      component: BioComponent,
    },
    {
      path: 'servicies/sign/doc/:token/:hash',
      component: DocComponent,
    },
    {
      path: '**',
      component: NotFoundComponent,
      data: {option: 'public'}
    },
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PublicRoutingModule {
}
