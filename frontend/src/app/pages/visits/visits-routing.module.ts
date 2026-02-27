import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { ProyectComponent } from './proyect/proyect.component';
import { SubproyectComponent } from './subproyect/subproyect.component';
import { TaskComponent } from './task/task.component';
//import { GeneralComponent } from './programming/general/general.component';
import { TableComponent } from './table/table.component';
import { ListComponent } from './programming/list/list.component';
import { CreateComponent } from './programming/create/create.component';
import { TicketComponent } from './ticket/ticket.component';
import { DetailVisitComponent } from './detail-visit/detail-visit.component';

const routes: Routes = [{
  path: '',
  children: [
    {
      path: 'proyect',
      component: ProyectComponent,
    },
    {
      path: 'subproyect/:id',
      component: SubproyectComponent,
    },
    {
      path: 'task/:id/:mainF',
      component: TaskComponent,
    },
    {
      path: 'programming/general',
      component: TableComponent,
    },
    {
      path: 'programming/list/:id',
      component: ListComponent,
    },
    {
      path: 'ticket/detail/:id',
      component: DetailVisitComponent,
    },
    {
      path: 'programming/create/:id/:option',
      component: CreateComponent,
    },
    {
      path: 'ticket/:id/:mainF',
      component: TicketComponent,
    }
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VisitsRoutingModule {
}
