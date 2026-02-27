import { ToastService } from '../../usable/toast.service';
import { NgModule } from '@angular/core';
import { NbAccordionModule, NbActionsModule, NbAutocompleteModule, NbButtonModule, NbCardModule, NbCheckboxModule, NbContextMenuModule, NbIconModule, NbInfiniteListDirective, NbInputModule, NbLayoutModule, NbListModule, NbMenuModule, NbSelectModule, NbSidebarModule, NbSpinnerModule, NbStepperModule, NbToggleModule, NbTooltipModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { GeoportalComponent } from './geoportal.component';
import { GeoportalRoutingModule } from './geoportal-routing.module';
import { CommonModule } from '@angular/common';
import { AddressInfoDialogComponent, PointComponent } from './point/point.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GeoportalService } from '../../services/geoportal.service';
import { LeafletMarkerClusterModule } from "@asymmetrik/ngx-leaflet-markercluster";
import { FormService } from '../../services/form.service';

@NgModule({
  declarations: [
    GeoportalComponent,
    PointComponent,
    AddressInfoDialogComponent,
  ],
  imports:[
    GeoportalRoutingModule,
    CommonModule,
    NbCardModule,
    NbIconModule,
    NbInputModule,
    NbButtonModule,
    Ng2SmartTableModule,
    LeafletModule,
    NbLayoutModule,
    NbSidebarModule,
    NbActionsModule,
    NbMenuModule,
    NbCheckboxModule,
    NbAccordionModule,
    NbStepperModule,
    NbSpinnerModule,
    FormsModule,
    ReactiveFormsModule,
    NbContextMenuModule,
    NbListModule,
    NbTooltipModule,
    NbSelectModule,
    LeafletMarkerClusterModule,
    NbToggleModule,
    NbAutocompleteModule,
  ],
  providers:[
    GeoportalService,
    FormService
  ]
})
export class GeoportalModule { }
