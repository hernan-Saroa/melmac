import { ToastService } from '../../usable/toast.service';
import { NgModule } from '@angular/core';
import { NbButtonModule, NbCardModule, NbIconModule, NbInputModule,NbCheckboxModule,NbLayoutModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { FormsModule } from '@angular/forms';
import { LeafletModule } from '@bluehalo/ngx-leaflet';
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
    Angular2SmartTableModule,
    LeafletModule,
    CommonModule
  ],
  providers:[

  ]
})
export class PlansModule { }
