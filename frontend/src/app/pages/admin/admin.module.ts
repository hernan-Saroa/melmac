import { LocationComponent, LocationDialogComponent, CustomInputTextFilterComponentLocation } from './location/location.component';
import { ProjectComponent, CustomInputTextFilterComponentProject } from './project/project.component';
import { NgModule } from '@angular/core';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { PermitComponent, CustomInputTextFilterComponentPermit } from './permit/permit.component';
import { AdminRoutingModule } from './admin-routing.module';
import { ThemeModule } from '../../@theme/theme.module';
import { NbIconModule, NbInputModule, NbCardModule, NbAccordionModule, NbCheckboxModule, NbDialogModule, NbButtonModule, NbSelectModule, NbToggleModule, NbLayoutModule, NbSpinnerModule, NbFormFieldModule, NbTooltipModule, NbTimepickerModule, NbDatepicker, NbDatepickerModule } from '@nebular/theme';
import { AdminService } from '../../services/admin.service';
import { RoleDialogComponent, RoleComponent, ConfirmDialog, CustomInputTextFilterComponent } from './role/role.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TypeDeviceComponent, DialogComponent, CustomInputTextFilterComponentDevice } from '../device/device.component';
import { CustomInputTextFilterComponentUser } from '../user/user.component';
import { CustomInputDateFilterComponentAnswer, CustomInputTextFilterComponentAnswer } from '../answer/answer.component';
import { ParameterComponent, ParameterDialogComponent, CustomInputTextFilterComponentParameter } from './parameter/parameter.component';
import { AdminComponent, PermitItemComponent } from './permit/admin/admin.component';

@NgModule({
  declarations: [
    PermitComponent,
    RoleComponent,
    RoleDialogComponent,
    ConfirmDialog,
    TypeDeviceComponent,
    DialogComponent,
    ProjectComponent,
    LocationComponent,
    LocationDialogComponent,
    ParameterComponent,
    ParameterDialogComponent,
    CustomInputTextFilterComponent,
    CustomInputTextFilterComponentPermit,
    CustomInputTextFilterComponentDevice,
    CustomInputTextFilterComponentProject,
    CustomInputTextFilterComponentLocation,
    CustomInputTextFilterComponentParameter,
    CustomInputTextFilterComponentUser,
    CustomInputTextFilterComponentAnswer,
    CustomInputDateFilterComponentAnswer,
    AdminComponent,
    PermitItemComponent,
  ],
  imports: [
    NbCardModule,
    NbIconModule,
    NbInputModule,
    NbButtonModule,
    NbSelectModule,
    NbLayoutModule,
    NbToggleModule,
    ThemeModule,
    Angular2SmartTableModule,
    AdminRoutingModule,
    MatDialogModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    NbAccordionModule,
    NbCheckboxModule,
    NbSpinnerModule,
    NbDialogModule.forChild(),
    NbFormFieldModule,
    NbTooltipModule,
    NbTimepickerModule.forRoot(),
    NbDatepickerModule
    ],
  providers:[
    AdminService,
  ],
})
export class AdminModule { }
