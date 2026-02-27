import { RouteModule } from './route/route.module';
import { NgModule } from '@angular/core';
import { NbMenuModule, NbSpinnerModule, NbTooltipModule } from '@nebular/theme';

import { ThemeModule } from '../@theme/theme.module';
import { PagesComponent } from './pages.component';
import { PagesRoutingModule } from './pages-routing.module';
import { MiscellaneousModule } from './miscellaneous/miscellaneous.module';
import { UserModule } from './user/user.module';
import { DeviceModule } from './device/device.module';
import { MassiveModule } from './massive/massive.module';
import { FormModule } from './form/form.module';
import { AnswerModule } from './answer/answer.module';
import { EnterpriseModule } from './enterprise/enterprise.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PlataformModule } from './plataform/plataform.module';
import { GeoportalModule } from './geoportal/geoportal.module';
import { ApiModule } from './api/api.module';
import { TraceabilityModule } from './traceability/traceability.module';
import { FolderModule } from './folder/folder.module';
import { VisitsModule } from './visits/visits.module';
import { EnvelopeModule } from './envelope/envelope.module';
import { PlansModule } from './plans/plans.module';
import { ContactsModule } from './contacts/contacts.module';
import { SupersetComponent } from './superset/superset/superset.component';
import { SearchComponent } from './search/search.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms'; // Importar FormsModule
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { HttpClientModule } from '@angular/common/http';
import { NbDialogModule, NbDialogService } from '@nebular/theme';
import { ConfirmDialog } from './search/search.component';
import { NbCardModule, NbButtonModule } from '@nebular/theme';
import { MatButtonModule } from '@angular/material/button';
@NgModule({
  imports: [
    PagesRoutingModule,
    ThemeModule,
    NbMenuModule,
    MiscellaneousModule,
    UserModule,
    DeviceModule,
    MassiveModule,
    FormModule,
    AnswerModule,
    EnterpriseModule,
    DashboardModule,
    PlataformModule,
    GeoportalModule,
    RouteModule,
    ApiModule,
    TraceabilityModule,
    FolderModule,
    VisitsModule,
    EnvelopeModule,
    PlansModule,
    ContactsModule,
    NbSpinnerModule,
    NgbModule,
    FormsModule,
    NbTooltipModule,
    HttpClientModule,
    MatAutocompleteModule,
    NbDialogModule.forRoot(),
    NbCardModule,
    MatButtonModule,
    NbButtonModule,
  ],
  declarations: [
    PagesComponent,
    SupersetComponent,
    SearchComponent,
    ConfirmDialog,
  ],
})
export class PagesModule {
}
