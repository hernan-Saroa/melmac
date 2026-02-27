import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NbCardModule, NbContextMenuModule, NbIconModule, NbButtonModule, NbSpinnerModule, NbStepperModule, NbAccordionModule, NbSelectModule, NbInputModule, NbListModule, NbProgressBarModule } from '@nebular/theme';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewComponent } from './view/view.component';
import { RouteRoutingModule } from './route-routing.module';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { LoadComponent, AddressInfoDialogComponent, AddressRouteDialogComponent } from './load/load.component';
import { MonitorComponent } from './monitor/monitor.component';
import { MonitorListComponent } from './monitor/list/list.component';



@NgModule({
  declarations: [
    ViewComponent,
    LoadComponent,
    AddressInfoDialogComponent,
    AddressRouteDialogComponent,
    MonitorComponent,
    MonitorListComponent,
  ],
  imports: [
    CommonModule,
    RouteRoutingModule,
    NbCardModule,
    NbIconModule,
    Ng2SmartTableModule,
    NbButtonModule,
    NbSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
    NbStepperModule,
    LeafletModule,
    NbAccordionModule,
    NbSelectModule,
    NbInputModule,
    NbListModule,
    NbContextMenuModule,
    NbProgressBarModule,
  ]
})
export class RouteModule { }
