import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import {
  NbActionsModule,
  NbAccordionModule,
  NbButtonGroupModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbInputModule,
  NbSelectModule,
  NbSpinnerModule,
  NbStepperModule,
  NbDialogModule,
  NbRadioModule,
  NbTooltipModule,
  NbPopoverModule,
  NbTabsetModule,
  NbCheckboxModule,
  NbAutocompleteModule,
  NbTagModule,
  NbFormFieldModule,
  NbTimepickerModule,
  NbListModule,
  NbAlertComponent,
  NbAlertModule,
  NbProgressBarModule,
  NbDatepickerModule
} from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ThemeModule } from '../../@theme/theme.module';
import { FormRoutingModule } from './form-routing.module';
import { FormComponent } from './form.component';

import { UserService } from '../../@core/mock/users.service';
import { ConfirmDialog, ViewComponent } from './view/view.component';
import { FormsModule as ngFormsModule } from '@angular/forms';

import { DragDropModule } from '@angular/cdk/drag-drop';
import { AnswerComponent } from './answer/answer.component';
import { DetailComponent } from './view/detail/detail.component';
import { AssociateComponent, AssociateDialogComponent } from './associate/associate.component';

import { CreateComponent as CreateDigitalComponent, FieldDialogComponent, ModalAdditionalComponent } from './create/create.component';

import { SignaturePadComponent } from '@almothafar/angular-signature-pad';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { ConfirmAnswerDialog } from '../answer/answer.component';
//import { CustomButtonFilterComponentAnswer } from '../answer/answer.component';

import { ClipboardModule } from '@angular/cdk/clipboard';
import { CodeInputModule } from 'angular-code-input';
import { BiometricComponent } from './answer/biometric/biometric.component';
import { HandwrittenComponent } from './answer/handwritten/handwritten.component';
import { ModalComponent } from './answer/modal/modal.component';
import { AddressComponent } from './answer/address/address.component';
import { SendComponent, ResendConfirmComponent, CustomInputDateFilterComponentAnswer } from './send/send.component';

import { BioComponent } from './answer/sign/bio/bio.component';
import { DocComponent } from './answer/sign/doc/doc.component';
import { OtpComponent } from './answer/sign/otp/otp.component';
import { NgxEchartsModule } from 'ngx-echarts';
import { MatButtonModule } from '@angular/material/button';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { CamDetectComponent } from './cam-detect/cam-detect.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  imports: [
    ThemeModule,
    NbCardModule,
    NbInputModule,
    NbButtonModule,
    FormRoutingModule,
    ngFormsModule,
    Angular2SmartTableModule,
    NbStepperModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    NbSelectModule,
    NbIconModule,
    NbAccordionModule,
    NbSpinnerModule,
    NbActionsModule,
    NbDialogModule.forChild(),
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
    CodeInputModule,
    NbFormFieldModule,
    NbTimepickerModule.forRoot(),
    
    NbListModule,
    NbAlertModule,
    NbProgressBarModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    }),
    NbDatepickerModule,
    MatButtonModule,
    NbEvaIconsModule,
    SharedModule
  ],
  declarations: [
    FormComponent,
    ViewComponent,
    ConfirmDialog,
    AnswerComponent,
    DetailComponent,
    AssociateComponent,
    AssociateDialogComponent,
    CreateDigitalComponent,
    FieldDialogComponent,
    ConfirmAnswerDialog,
    BiometricComponent,
    HandwrittenComponent,
    ModalComponent,
    AddressComponent,
    SendComponent,
    ResendConfirmComponent,
    CustomInputDateFilterComponentAnswer,
    ModalAdditionalComponent,
    BioComponent,
    DocComponent,
    OtpComponent,
    CamDetectComponent
  ],
  providers: [
    UserService
  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class FormModule { }
