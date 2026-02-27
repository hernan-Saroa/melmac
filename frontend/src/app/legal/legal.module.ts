import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NbActionsModule, NbButtonModule, NbCardModule, NbCheckboxModule, NbIconModule, NbInputModule, NbLayoutModule, NbMenuModule, NbSidebarModule, NbSpinnerModule, NbTooltipModule } from '@nebular/theme';

import { ThemeModule } from '../@theme/theme.module';
import { FormsModule } from '@angular/forms';
import { LegalComponent } from './legal.component';
import { SignupRoutingModule } from './legal-routing.module';
import { CodeInputModule } from 'angular-code-input';

@NgModule({
  imports: [
    SignupRoutingModule,
    NbInputModule,
    ThemeModule,
    NbMenuModule,
    RouterModule,
    NbLayoutModule,
    NbSidebarModule, // NbSidebarModule.forRoot(), //if this is your app.module
    FormsModule,
    NbButtonModule,
    NbCardModule,
    NbIconModule,
    NbSpinnerModule,
    NbActionsModule,
    NbCheckboxModule,
    NbTooltipModule,
    CodeInputModule,
  ],
  declarations: [
    LegalComponent
  ],
  providers: [
  ]
})
export class SignupModule {
}
