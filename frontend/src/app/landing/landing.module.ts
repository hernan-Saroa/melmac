import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NbActionsModule, NbAutocompleteModule, NbButtonGroupModule, NbButtonModule, NbCardModule, NbCheckboxModule, NbIconModule, NbInputModule, NbLayoutModule, NbListModule, NbMenuModule, NbPopoverModule, NbRadioModule, NbSelectModule, NbSidebarModule, NbSpinnerModule, NbTabsetModule, NbTagModule, NbTooltipModule, NbFormFieldModule, NbStepperModule, NbAlertModule, NbDialogModule } from '@nebular/theme';
import { ThemeModule } from '../@theme/theme.module';
import { NbThemeModule} from '@nebular/theme';
import { LandingRoutingModule } from './landing-routing.module'
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LandingComponent } from './landing.component';
import { LandingformComponent } from './landingform/landingform.component';

@NgModule({
    imports: [
        LandingRoutingModule,
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
        NbDialogModule.forRoot(),
        FormsModule,
        NbRadioModule
      ],
    declarations: [
        LandingComponent,
        LandingformComponent
    ]
  })
  export class LandingModule {
  }
  