import { ToastService } from '../../usable/toast.service';
import { NgModule } from '@angular/core';
import { NbButtonModule, NbCardModule, NbIconModule, NbInputModule,NbCheckboxModule,NbLayoutModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { FormsModule } from '@angular/forms';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { HomeComponent } from './home.component';
import { HomeRoutingModule } from './home-routing.module';
import { CommonModule } from '@angular/common'
@NgModule({
  declarations: [
    HomeComponent
  ],
  imports:[
    HomeRoutingModule,
    NbCardModule,
    NbLayoutModule,
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
