import { FormsModule } from '@angular/forms';
import { AdminModule } from './../admin/admin.module';
import { NgModule } from '@angular/core';
import { NbCardModule, NbIconModule, NbInputModule, NbTreeGridModule, NbButtonModule, NbSelectModule } from '@nebular/theme';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { UserService } from '../../@core/mock/users.service';

import { ThemeModule } from '../../@theme/theme.module';
import { UserComponent } from './user.component';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ProfileComponent } from './profile/profile.component';

@NgModule({
  imports: [
    NbCardModule,
    NbTreeGridModule,
    NbIconModule,
    NbInputModule,
    ThemeModule,
    Angular2SmartTableModule,
    MatDialogModule,
    MatButtonModule,
    AdminModule,
    FormsModule,
    NbButtonModule,
    NbSelectModule,
  ],
  declarations: [
    UserComponent,
    ProfileComponent,
    // ValidateInputDirective
  ],
  providers: [
    UserService
  ],
  
})

export class UserModule { }
