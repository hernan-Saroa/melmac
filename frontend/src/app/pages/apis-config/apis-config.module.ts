import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApisConfigRoutingModule } from './apis-config-routing.module';
import { NbActionsModule, NbAutocompleteModule, NbCardModule, NbInputModule, NbSpinnerModule, NbTooltipModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { FormsModule } from '@angular/forms';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { ApisConfigComponent } from './apis-config/apis-config.component';
import { ApisConfigDetailComponent } from './apis-config-detail/apis-config-detail.component';


@NgModule({
  declarations: [
    ApisConfigComponent,
    ApisConfigDetailComponent
  ],
  imports: [
    CommonModule,
    NbCardModule,
    Angular2SmartTableModule,
    NbActionsModule,
    NbTooltipModule,
    ApisConfigRoutingModule,
    NbAutocompleteModule,
    NbInputModule,
    NbSpinnerModule,
    FormsModule,
    ClipboardModule
  ]
})
export class ApisConfigModule { }
