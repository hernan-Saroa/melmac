import { ToastService } from './../../usable/toast.service';
import { FormsModule } from '@angular/forms';
import { UserService } from './../../services/user.service';
import { AdminModule } from './../admin/admin.module';

import { NgModule } from '@angular/core';
import { NbCardModule, NbIconModule, NbInputModule, NbTreeGridModule, NbButtonModule, NbContextMenuModule, NbDialogModule, NbSelectModule, NbSpinnerModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ThemeModule } from '../../@theme/theme.module';

import { MatButtonModule } from '@angular/material/button';
import { DeviceService } from '../../services/device.service';
import { DeviceMassiveComponent } from './device/massive.component';
import { MassiveRoutingModule } from './massive-routing.module';
import { ErrorComponent } from './error/error.component';
import { UserMassiveComponent } from './user/massive.component';
import { FormAnswerComponent } from './form-answer/form-answer.component';

@NgModule({
  imports: [
    MassiveRoutingModule,
    NbCardModule,
    NbTreeGridModule,
    NbIconModule,
    NbInputModule,
    ThemeModule,
    Angular2SmartTableModule,
    MatButtonModule,
    AdminModule,
    NbButtonModule,
    NbContextMenuModule,
    MatProgressBarModule,
    FormsModule,
    NbSpinnerModule,
    NbSelectModule,
    NbDialogModule.forChild(),
  ],
  declarations: [
    DeviceMassiveComponent,
    ErrorComponent,
    UserMassiveComponent,
    FormAnswerComponent,
  ],
  providers: [
    DeviceService,
    UserService,
    ToastService,
  ],
  
})
export class MassiveModule { }
