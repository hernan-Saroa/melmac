import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GeoportalComponent } from './geoportal.component';
import { PointComponent } from './point/point.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: GeoportalComponent,
      },
      {
        path: 'answer',
        component: GeoportalComponent,
        data: {option: 1}
      },
      {
        path: 'point',
        component: PointComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class GeoportalRoutingModule {
}
