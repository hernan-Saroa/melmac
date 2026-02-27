import { ToastService } from '../../usable/toast.service';
import { NgModule } from '@angular/core';
import { NbButtonModule, NbCardModule, NbIconModule, NbInputModule,NbCheckboxModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { FormsModule } from '@angular/forms';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { PlansComponent } from './plans.component';
import { PlansRoutingModule } from './plans-routing.module';
import { PlansModalComponent } from './plans-modal/plans-modal.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    PlansComponent,PlansModalComponent
  ],
  imports:[
    PlansRoutingModule,
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
export class PlansModule { }
