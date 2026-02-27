import { LocationComponent } from './location/location.component';
import { ProjectComponent } from './project/project.component';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { PermitComponent } from './permit/permit.component';
import { RoleComponent } from './role/role.component';
import { TypeDeviceComponent } from '../device/device.component';
import { ParameterComponent } from './parameter/parameter.component';

const routes: Routes = [{
  path: '',
  children: [
    {
      path: 'permit',
      component: PermitComponent,
    },
    {
      path: 'role',
      component: RoleComponent,
    },
    {
      path: 'device-category',
      component: TypeDeviceComponent,
    },
    {
      path: 'project',
      component: ProjectComponent,
    },
    {
      path: 'location',
      component: LocationComponent,
    },
    {
      path: 'parameter',
      component: ParameterComponent,
    },
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {
}
