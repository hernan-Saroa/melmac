import { NgModule } from '@angular/core';
import { NbButtonModule, NbCardModule, NbIconModule, NbInputModule,NbCheckboxModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { FormsModule } from '@angular/forms';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { PlanUserComponent } from './plan-user.component';
import { PlanUserRoutingModule } from './planUser-routing.module';
import { CommonModule } from '@angular/common'
@NgModule({
  declarations: [
    PlanUserComponent
  ],
  imports:[
    PlanUserRoutingModule,
    NbCardModule,
    NbIconModule,
    NbInputModule,
    FormsModule,
    NbButtonModule,
    NbCheckboxModule,
    Ng2SmartTableModule,
    LeafletModule,
    CommonModule
  ],
  providers:[

  ]
})
export class PlanUserModule { }
