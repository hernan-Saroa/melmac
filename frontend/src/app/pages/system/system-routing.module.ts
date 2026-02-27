import { ToastService } from './../../usable/toast.service';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { SystemComponent } from './system.component';
import { SystemService } from '../../services/system.service';

const routes: Routes = [{
  path: 'logs',
  component: SystemComponent,
},
{
  path: '',
  redirectTo: 'logs',
  pathMatch: 'full'
},
{
  path: '**',
  redirectTo: 'logs'
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers:[
    ToastService,
    SystemService
  ],
})
export class SystemRoutingModule {
}
