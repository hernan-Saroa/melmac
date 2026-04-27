import { NgModule } from '@angular/core';
import { NbCardModule, NbIconModule, NbInputModule, NbTreeGridModule, NbButtonModule, NbAccordionModule, NbSpinnerModule, NbSelectModule, NbTooltipModule, NbFormFieldModule, NbDatepickerModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';

import { ThemeModule } from '../../@theme/theme.module';
import { CustomInputDateFilterComponentAnswer, TraceabilityComponent } from './traceability.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    NbButtonModule,
    NbCardModule,
    NbIconModule,
    NbInputModule,
    ThemeModule,
    Ng2SmartTableModule,
    FormsModule,
    ReactiveFormsModule,
    NbAccordionModule,
    NbSpinnerModule,
    NbSelectModule,
    NbTooltipModule,
    NbFormFieldModule,
    NbDatepickerModule,
  ],
  declarations: [
    TraceabilityComponent,
    CustomInputDateFilterComponentAnswer
  ],
  providers: [
  ],
  
})

export class TraceabilityModule { }
