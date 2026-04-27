import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NbButtonModule, NbCardModule, NbCheckboxModule, NbFormFieldModule, NbIconModule, NbInputModule, NbTooltipModule, } from '@nebular/theme';

import { InputShareDocumentComponent } from './components/input-share-document/input-share-document.component';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { ThemeModule } from '../@theme/theme.module';
import { DialogMassiveComponent } from './components/dialog-massive/dialog-massive.component';



@NgModule({
  imports: [
    CommonModule,
    ThemeModule,
    FormsModule,
    NbInputModule,
    NbCheckboxModule,
    NbFormFieldModule,
    NbCardModule,
    
    NbIconModule,
    NbEvaIconsModule,
    NbTooltipModule,
    NbButtonModule
  ],
  declarations: [
    InputShareDocumentComponent,
    DialogMassiveComponent
  ],
  exports: [
    InputShareDocumentComponent
  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class SharedModule { }
