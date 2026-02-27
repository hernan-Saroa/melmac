import { ViewComponent } from './view/view.component';
import { PointsService } from './../../services/points.service';
import { RoutingService } from './../../services/routing.service';
import { ToastService } from './../../usable/toast.service';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { LoadComponent } from './load/load.component';
import { MonitorListComponent } from './monitor/list/list.component';
import { MonitorComponent } from './monitor/monitor.component';

const routes: Routes = [{
  path: '',
  children: [
    {
      path: '',
      redirectTo: 'view',
      pathMatch: 'full'
    },
    {
      path: 'load',
      component: LoadComponent,
    },
    {
      path: 'view',
      component: ViewComponent,
    },
    {
      path: 'monitor',
      children: [
        {
          path: '',
          component: MonitorListComponent,
        },
        {
          path: ':route',
          component: MonitorComponent,
        }
      ]
    }
  ],
},
{
  path: '',
  redirectTo: 'route/view',
  pathMatch: 'full'
},
{
  path: '**',
  redirectTo: 'route/view'
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers:[
    ToastService,
    RoutingService,
    PointsService,
  ],
})
export class RouteRoutingModule {
}
