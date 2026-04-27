import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NbActionsModule, NbAutocompleteModule, NbButtonGroupModule, NbButtonModule, NbCardModule, NbCheckboxModule, NbIconModule, NbInputModule, NbLayoutModule, NbListModule, NbMenuModule, NbPopoverModule, NbRadioModule, NbSelectModule, NbSidebarModule, NbSpinnerModule, NbTabsetModule, NbTagModule, NbTooltipModule, NbFormFieldModule, NbStepperModule, NbAlertModule, NbDatepickerModule, NbProgressBarModule } from '@nebular/theme';

import { ThemeModule } from '../@theme/theme.module';
import { PublicRoutingModule } from './public-routing.module';
import { PublicComponent } from './public.component';
import { FormComponent } from './form/form.component';
import { SignaturePadComponent } from '@almothafar/angular-signature-pad';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InfoComponent } from './info/info.component';
import { TraceComponent } from './trace/trace.component';
import { CodeInputModule } from 'angular-code-input';
import { BiometricComponent } from './form/biometric/biometric.component';
import { FileComponent } from './file/file.component';
import { HandwrittenComponent } from './form/handwritten/handwritten.component';
import { EnterpriseComponent } from './enterprise/enterprise.component';
import { ModalComponent as FormModalComponent } from './form/modal/modal.component';
import { RadioComponent } from './radio/radio.component';
import { EnvelopeComponent } from './envelope/envelope.component';
import { HandwrittenComponent as EnvelopeHandwrittenComponent } from './envelope/handwritten/handwritten.component';
import { ModalComponent } from './modal/modal.component';
import { VerifiedComponent } from './verified/verified.component';

import { Angular2SmartTableModule } from 'angular2-smart-table';
import { CustomInputDateFilterComponentAnswer, CustomInputTextFilterComponentAnswer, HistorialComponent } from './historial/historial.component';
import { AddressComponent } from './form/address/address.component';
import { BioComponent } from './form/sign/bio/bio.component';
import { DocComponent } from './form/sign/doc/doc.component';
import { OtpComponent } from './form/sign/otp/otp.component';
import { BioComponent as iFrame_BioComponent} from './services/sign/bio/bio.component'
import { DocComponent as iFrame_DocComponent } from './services/sign/doc/doc.component'

@NgModule({
  imports: [
    PublicRoutingModule,
    NbInputModule,
    ThemeModule,
    NbMenuModule,
    RouterModule,
    NbLayoutModule,
    NbSidebarModule, // NbSidebarModule.forRoot(), //if this is your app.module
    FormsModule,
    Angular2SmartTableModule,
    NbDatepickerModule,
    NbButtonModule,
    NbCardModule,
    NbSelectModule,
    NbIconModule,
    NbSpinnerModule,
    NbActionsModule,
    SignaturePadComponent,
    PdfViewerModule,
    NbButtonGroupModule,
    NbRadioModule,
    NbCheckboxModule,
    NbTooltipModule,
    NbTabsetModule,
    NbAutocompleteModule,
    NbPopoverModule,
    NbTagModule,
    ClipboardModule,
    NbListModule,
    CodeInputModule,
    NbFormFieldModule,
    ReactiveFormsModule,
    NbStepperModule,
    NbAlertModule,
    
    NbProgressBarModule
  ],
  declarations: [
    PublicComponent,
    FormComponent,
    InfoComponent,
    TraceComponent,
    BiometricComponent,
    FileComponent,
    HandwrittenComponent,
    EnterpriseComponent,
    FormModalComponent,
    RadioComponent,
    EnvelopeComponent,
    EnvelopeHandwrittenComponent,
    CustomInputTextFilterComponentAnswer,
    CustomInputDateFilterComponentAnswer,
    ModalComponent,
    VerifiedComponent,
    HistorialComponent,
    AddressComponent,
    BioComponent,
    DocComponent,
    OtpComponent,
    iFrame_BioComponent,
    iFrame_DocComponent
  ],
})
export class PublicModule {
}
