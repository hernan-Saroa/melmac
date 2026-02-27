import { NgModule } from '@angular/core';
import { NbCardModule, NbIconModule, NbInputModule, NbTreeGridModule, NbButtonModule, NbToggleModule,NbTooltipModule,NbSelectModule,NbSpinnerModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { EnterpriseService } from '../../services/enterprise.service';

import { ThemeModule } from '../../@theme/theme.module';
import { EnterpriseComponent } from './enterprise.component';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DetailComponent } from './detail/detail.component';
import { FormsModule } from '@angular/forms';
import { AdminModule } from '../admin/admin.module';

import { ClipboardModule } from '@angular/cdk/clipboard';
import { EmailComponent } from './email/email.component';
import { AttemptsComponent } from './attempts/attempts.component';
@NgModule({
  imports: [
    NbButtonModule,
    NbCardModule,
    NbTreeGridModule,
    NbIconModule,
    NbInputModule,
    ThemeModule,
    Ng2SmartTableModule,
    MatDialogModule,
    MatButtonModule,
    FormsModule,
    AdminModule,
    NbToggleModule,
    ClipboardModule,
    NbTooltipModule,
    NbSelectModule,
    NbSpinnerModule,
  ],
  declarations: [
    EnterpriseComponent,
    DetailComponent,
    EmailComponent,
    AttemptsComponent,
  ],
  providers: [
    EnterpriseService
  ],
  entryComponents: [
  ]
})

export class EnterpriseModule { }
