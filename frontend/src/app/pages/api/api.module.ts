import { ApiRoutingModule } from './api-routing,module';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { NbCardModule, NbIconModule, NbInputModule, NbButtonModule, NbCheckboxModule, NbSpinnerModule, NbSelectModule, NbAccordionModule } from '@nebular/theme';
import { CommonModule } from '@angular/common';
import { ApiComponent } from './api.component';
import { NgModule } from '@angular/core';
import { EnterpriseService } from '../../services/enterprise.service';


@NgModule({
  declarations: [
    ApiComponent,
  ],
  imports:[
    ApiRoutingModule,
    CommonModule,
    NbCardModule,
    NbIconModule,
    NbInputModule,
    NbButtonModule,
    Angular2SmartTableModule,
    NbCheckboxModule,
    NbSpinnerModule,
    NbSelectModule,
    NbAccordionModule
  ],
  providers:[
    EnterpriseService
  ]
})
export class ApiModule { }
