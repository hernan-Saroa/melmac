import { NgModule } from "@angular/core";
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
  NbAlertModule,
  NbToggleModule,
  NbDatepickerModule,
} from "@nebular/theme";

import { Angular2SmartTableModule } from "angular2-smart-table";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { ThemeModule } from "../../@theme/theme.module";

import { UserService } from "../../@core/mock/users.service";
import { FormsModule as ngFormsModule } from "@angular/forms";

import { DragDropModule } from "@angular/cdk/drag-drop";

import { SignaturePadModule } from "angular2-signaturepad";
import { PdfViewerModule } from "ng2-pdf-viewer";

import { ClipboardModule } from "@angular/cdk/clipboard";
import { CodeInputModule } from "angular-code-input";
import { FolderComponent, UploadDialogComponent } from "./folder.component";
import { FolderRoutingModule } from "./folder-routing.module";
import { RadioComponent } from "./radio/radio.component";
import { Ng2TelInputModule } from "ng2-tel-input";
import { DigitalService } from "../../services/digital.service";
import { NgxCommonModule } from "../common/common.module";
import { UserDialogComponent } from "./user/user.component";
import { DialogInfoComponent, FieldDialogComponent } from "./field-dialog/field-dialog.component";
import { FieldSettingDialogComponent } from "./field-setting-dialog/field-setting-dialog.component";
import { TableComponent } from './field-dialog/table/table.component';
import { MatTableModule } from "@angular/material/table";

@NgModule({
  imports: [
    FolderRoutingModule,
    ThemeModule,
    NbCardModule,
    NbInputModule,
    NbButtonModule,
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
    SignaturePadModule,
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
    NbTimepickerModule.forChild(),
    NbListModule,
    NbAlertModule,
    Ng2TelInputModule.forRoot(),
    NbToggleModule,
    NgxCommonModule,
    NbDatepickerModule.forRoot(),
    NbPopoverModule,
    MatTableModule
  ],
  declarations: [
    FolderComponent,
    UploadDialogComponent,
    UserDialogComponent,
    RadioComponent,
    FieldDialogComponent,
    FieldSettingDialogComponent,
    DialogInfoComponent,
    TableComponent
  ],
  providers: [UserService, DigitalService],
})
export class FolderModule {}
