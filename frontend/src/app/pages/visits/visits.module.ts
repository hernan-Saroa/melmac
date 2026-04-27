import { NgModule } from '@angular/core';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { VisitsRoutingModule } from './visits-routing.module';
import { ThemeModule } from '../../@theme/theme.module';
import { NbIconModule, NbInputModule, NbCardModule, NbAccordionModule, NbCheckboxModule, NbDialogModule, NbButtonModule, NbSelectModule, NbToggleModule, NbLayoutModule, NbSpinnerModule, NbFormFieldModule, NbTooltipModule, NbTimepickerModule, NbDatepickerModule,NbCalendarModule,NbRadioModule,NbBadgeModule,NbAlertModule,NbListModule,NbAutocompleteModule,NbActionsModule,NbTabsetModule,NbSidebarModule,NbMenuModule } from '@nebular/theme';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProyectComponent } from './proyect/proyect.component';
import { SubproyectComponent } from './subproyect/subproyect.component';
import { TaskComponent } from './task/task.component';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { ListComponent } from './programming/list/list.component';
import { CreateComponent } from './programming/create/create.component';
import { ModalsComponent } from './programming/list/modals/modals.component';
import { ModalsSubComponent } from './subproyect/modals-sub/modals-sub.component';
import { ModalsProyectComponent } from './proyect/modals-proyect/modals-proyect.component';
import { ModalsTaskComponent } from './task/modals-task/modals-task.component';
import { TicketComponent } from './ticket/ticket.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ConfirmDialog } from './ticket/ticket.component';
import { ConfirmDialogC } from './programming/create/create.component';
import { CustomActionRenderComponent, TableComponent } from './table/table.component';


import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { NbTreeGridModule, NbContextMenuModule,NbTagModule } from '@nebular/theme';

import { NbEvaIconsModule } from '@nebular/eva-icons';
import { DetailVisitComponent } from './detail-visit/detail-visit.component';



@NgModule({
  declarations: [
    ProyectComponent,
    SubproyectComponent,
    TaskComponent,
    ModalsComponent,
    ListComponent,
    CreateComponent,
    ModalsSubComponent,
    ModalsProyectComponent,
    ModalsTaskComponent,
    TicketComponent,
    ConfirmDialog,
    ConfirmDialogC,
    TableComponent,
    CustomActionRenderComponent,
    DetailVisitComponent
  ],
  imports: [
    NbTreeGridModule,
    LeafletModule,
    NbEvaIconsModule,
    NbContextMenuModule,
    NbTagModule,
    NbCardModule,
    NbIconModule,
    NbInputModule,
    NbButtonModule,
    NbSelectModule,
    NbLayoutModule,
    NbToggleModule,
    ThemeModule,
    Angular2SmartTableModule,
    VisitsRoutingModule,
    MatDialogModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    NbAccordionModule,
    NbCheckboxModule,
    NbSpinnerModule,
    NbDialogModule.forChild(),
    NbFormFieldModule,
    NbTooltipModule,
    NbTimepickerModule.forRoot(),
    NbMenuModule.forRoot(),
    NbDatepickerModule,
    MatTableModule,
    MatInputModule,
    NbCalendarModule,
    NbRadioModule,
    NbBadgeModule,
    DragDropModule,
    NbAlertModule,
    NbListModule,
    NbAutocompleteModule,
    NbActionsModule,
    NbTabsetModule,
    NbSidebarModule
    ],
  providers:[
  ],
})
export class VisitsModule { }
