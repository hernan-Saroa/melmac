import { AdminService } from './../../services/admin.service';
import { AdminModule } from './../admin/admin.module';

import { NgModule } from '@angular/core';
import { NbCardModule, NbIconModule, NbInputModule, NbSpinnerModule, NbTreeGridModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';

import { ThemeModule } from '../../@theme/theme.module';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DeviceComponent } from './device.component';
import { DeviceService } from '../../services/device.service';

@NgModule({
  imports: [
    NbCardModule,
    NbTreeGridModule,
    NbIconModule,
    NbInputModule,
    NbSpinnerModule,
    ThemeModule,
    Angular2SmartTableModule,
    MatDialogModule,
    MatButtonModule,
    AdminModule,
  ],
  declarations: [
    DeviceComponent,
  ],
  providers: [
    DeviceService,
    AdminService,
  ],
  
})
export class DeviceModule { }
