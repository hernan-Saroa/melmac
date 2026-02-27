import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NbActionsModule, NbAutocompleteModule, NbButtonGroupModule, NbButtonModule, NbCardModule, NbCheckboxModule, NbIconModule, NbInputModule, NbLayoutModule, NbListModule, NbMenuModule, NbPopoverModule, NbRadioModule, NbSelectModule, NbSidebarModule, NbSpinnerModule, NbTabsetModule, NbTagModule, NbTooltipModule, NbFormFieldModule, NbStepperModule, NbAlertModule } from '@nebular/theme';
import { ThemeModule } from '../@theme/theme.module';
import { NbThemeModule} from '@nebular/theme';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginRoutingModule } from './login-new-routing.module'
import { LoginNewComponent } from './login-new.component';
import { CodeInputModule } from 'angular-code-input';


@NgModule({
    imports: [
        LoginRoutingModule,
        NbInputModule,
        ThemeModule,
        NbMenuModule,
        RouterModule,
        NbLayoutModule,
        NbSidebarModule, // NbSidebarModule.forRoot(), //if this is your app.module
        NbButtonModule,
        NbCardModule,
        NbSelectModule,
        NbIconModule,
        NbSpinnerModule,
        NbActionsModule,
        NbButtonGroupModule,
        NbRadioModule,
        NbCheckboxModule,
        NbTooltipModule,
        NbTabsetModule,
        NbAutocompleteModule,
        NbPopoverModule,
        NbTagModule,
        NbListModule,
        NbFormFieldModule,
        NbStepperModule,
        NbAlertModule,
        FormsModule,
        CodeInputModule,
      ],
    declarations: [
        LoginNewComponent
    ],
  bootstrap: [LoginNewComponent],

  })
  export class LoginNewModule {
  }
