import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ApisConfigComponent } from './apis-config/apis-config.component';

const routes: Routes = [
  {
    path: '',
    component: ApisConfigComponent,
  }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ApisConfigRoutingModule { }
