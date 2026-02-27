import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomInputTextFilterComponentAnswer, CustomRenderComponent, SystemComponent } from './system.component';
import { SystemService } from '../../services/system.service';
import { SystemRoutingModule } from './system-routing.module';
import { NbAlertModule, NbBadgeModule, NbButtonModule, NbCardModule, NbDatepickerModule, NbFormFieldModule, NbIconModule, NbInputModule, NbListModule, NbSpinnerModule,NbSelectModule } from '@nebular/theme';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Ng2SmartTableModule } from 'ng2-smart-table';

@NgModule({
  declarations: [
    SystemComponent,
    CustomInputTextFilterComponentAnswer,
    CustomRenderComponent,
  ],
  imports: [
    CommonModule,
    SystemRoutingModule,
    NbCardModule,
    NbListModule,
    NbAlertModule,
    NbIconModule,
    NbBadgeModule,
    NbDatepickerModule,
    FormsModule,
    NbInputModule,
    NbButtonModule,
    Ng2SmartTableModule,
    NbSpinnerModule,
    NbFormFieldModule,
    ReactiveFormsModule,
    NbSelectModule
  ],
  providers:[
    SystemService
  ]
})
export class SystemModule { }
