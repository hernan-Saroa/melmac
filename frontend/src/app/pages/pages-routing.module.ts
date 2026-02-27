import { ComponentFixture } from '@angular/core/testing';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

import { PagesComponent } from './pages.component';
import { NotFoundComponent } from './miscellaneous/not-found/not-found.component';
import { UserComponent } from './user/user.component';
import { DeviceComponent } from './device/device.component';
import { AnswerComponent } from './answer/answer.component';
import { EnterpriseComponent } from './enterprise/enterprise.component';
import { ProfileComponent } from './user/profile/profile.component';
import { AnswerViewComponent } from './answer/view/view.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { AnswerHistoricalComponent } from './answer/historical/historical.component';
import { DetailComponent } from './enterprise/detail/detail.component';
import { TraceabilityComponent } from './traceability/traceability.component';
import { ReportComponent } from './answer/report/report.component';
import { ZipComponent } from './answer/report/zip/zip.component';
import { EnvelopeModule } from './envelope/envelope.module';
import { ContactsComponent } from './contacts/contacts.component';
import { AttemptsComponent } from './enterprise/attempts/attempts.component';
import { SupersetComponent } from './superset/superset/superset.component'
import { SearchComponent } from './search/search.component';

const routes: Routes = [{
  path: '',
  component: PagesComponent,
  children: [
    {
      path: 'dashboard',
      component: DashboardComponent,
    },
    {
      path: '',
      redirectTo: 'dashboard',
      pathMatch: 'full',
    },
    {
      path: 'admin',
      loadChildren: () => import('./admin/admin.module')
         .then(m => m.AdminModule),
    },
    {
      path: 'folder',
      loadChildren: () => import('./folder/folder.module')
         .then(m => m.FolderModule),
    },
    {
      path: 'user',
      component: UserComponent,
    },
    {
      path: 'contacts',
      component: ContactsComponent,
    },
    {
      path: 'profile',
      component: ProfileComponent,
    },
    {
      path: 'visits',
      loadChildren: () => import('./visits/visits.module')
         .then(m => m.VisitsModule),
    },
    {
      path: 'form',
      loadChildren: () => import('./form/form.module')
         .then(m => m.FormModule),
    },
    {
      path: 'device',
      children:[
        {
          path:'',
          component: DeviceComponent,
        }
      ]
    },
    {
      path: 'massive',
      loadChildren: () => import('./massive/massive.module')
         .then(m => m.MassiveModule),
    },
    {
      path: 'inbox',
      children: [
        {
          path: '',
          component: AnswerComponent,
        },
        {
          path: 'inactive',
          component: AnswerComponent,
          data: {option: 1}
        },
        {
          path: 'duplicate',
          component: AnswerComponent,
          data: {option: 2}
        },
        {
          path: 'filling-out',
          component: AnswerComponent,
          data: {option: 3}
        },
      ]
    },
    {
      path: 'answer',
      children: [
        {
          path: '',
          component: AnswerComponent,
        },
        {
          path: 'view/:id',
          component: AnswerViewComponent,
          data: {form: 0}
        },
        {
          path: 'view/consecutive/:id',
          component: AnswerViewComponent,
          data: {form: 1}
        },
        {
          path: 'historical',
          component: AnswerHistoricalComponent,
        },
        {
          path: 'report',
          children:[
            {
              path: '',
              component: ReportComponent,
            },
            {
              path: 'zip',
              component: ZipComponent,
            }
          ]
        },
      ],
    },
    {
      path: 'envelope',
      loadChildren: () => import('./envelope/envelope.module')
         .then(m => m.EnvelopeModule),
    },
    {
      path: 'enterprise',
      children:[
        {
          path:'',
          component: EnterpriseComponent,
        },
        {
          path:'detail',
          component: DetailComponent,
        },
        {
          path:'attempts/:id',
          component: AttemptsComponent,
        },
        {
          path:'api',
          loadChildren: () => import('./api/api.module')
          .then(m => m.ApiModule)
        }
      ],
    },
    {
      path: 'route',
      loadChildren: () => import('./route/route.module')
      .then(m => m.RouteModule)
    },
    {
      path: 'plataform',
      loadChildren: () => import('./plataform/plataform.module')
         .then(m => m.PlataformModule),
    },
    {
      path: 'geoportal',
      loadChildren: () => import('./geoportal/geoportal.module')
         .then(m => m.GeoportalModule),
    },
    {
      path: 'traceability',
      children:[
        {
          path:'',
          component: TraceabilityComponent,
        },
      ],
    },
    {
      path: 'search',
      children:[
        {
          path:'',
          component: SearchComponent,
        },
      ],
    },
    {
      path: 'system',
      loadChildren: () => import('./system/system.module')
        .then(m => m.SystemModule),

    },
    {
      path: 'plans',
      loadChildren: () => import('./plans/plans.module')
         .then(m => m.PlansModule),
    },
    {
      path: 'home',
      loadChildren: () => import('./home/home.module')
         .then(m => m.PlansModule),
    },
    {
      path: 'planUser',
      loadChildren: () => import('./plans/plan-user/planUser.module')
         .then(m => m.PlanUserModule),
    },
    {
      path: 'superset',
      component: SupersetComponent,
    },
    {
      path: 'apis-config',
      loadChildren: () => import('./apis-config/apis-config.module')
         .then(m => m.ApisConfigModule),
    },
    {
      path: '**',
      component: NotFoundComponent,
    },
  ],
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PagesRoutingModule {
}
