import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlanUserComponent } from './plan-user.component';
const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: PlanUserComponent,
      },
    ],
  },
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlanUserRoutingModule {
}
