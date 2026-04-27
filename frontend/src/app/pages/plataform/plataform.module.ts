import { ToastService } from '../../usable/toast.service';
import { NgModule } from '@angular/core';
import { NbButtonModule, NbCardModule, NbIconModule, NbInputModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { PlataformComponent } from './plataform.component';
import { PlataformRoutingModule } from './plataform-routing.module';

@NgModule({
  declarations: [
    PlataformComponent,
  ],
  imports:[
    PlataformRoutingModule,
    NbCardModule,
    NbIconModule,
    NbInputModule,
    NbButtonModule,
    Angular2SmartTableModule,
    LeafletModule
  ],
  providers:[
    
  ]
})
export class PlataformModule { }
