import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FolderComponent } from './folder.component';

const routes: Routes = [
  {
    path: '',
    component: FolderComponent,
    children: [
    ],
  },
  {
    path: ':id/:answer',
    component: FolderComponent,
  },
  {
    path: ':id',
    component: FolderComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FolderRoutingModule {
}
