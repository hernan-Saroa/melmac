import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  NbCardModule, 
  NbSelectModule, 
  NbButtonModule, 
  NbDatepickerModule,
  NbIconModule 
} from '@nebular/theme';
import { NbMomentDateModule } from '@nebular/moment';
import { NgxEchartsModule, NGX_ECHARTS_CONFIG } from 'ngx-echarts';

import { ThemeModule } from '../../@theme/theme.module';
import { StatisticsRoutingModule } from './statistics-routing.module';
import { StatisticsComponent } from './statistics.component';
import * as echarts from 'echarts';

@NgModule({
  declarations: [
    StatisticsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ThemeModule,
    NbCardModule,
    NbSelectModule,
    NbButtonModule,
    NbDatepickerModule,
    NbMomentDateModule,
    NbIconModule,
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts')
    }),
    StatisticsRoutingModule
  ],
  providers: [
    {
      provide: NGX_ECHARTS_CONFIG,
      useValue: { echarts }
    }
  ]
})
export class StatisticsModule { }
