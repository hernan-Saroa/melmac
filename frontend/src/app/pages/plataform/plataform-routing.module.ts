import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlataformComponent } from './plataform.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: PlataformComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlataformRoutingModule {
}
