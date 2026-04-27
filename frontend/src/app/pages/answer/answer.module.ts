import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { NgModule } from '@angular/core';
import { NbActionsModule, NbAutocompleteModule, NbButtonModule, NbCardModule, NbIconModule, NbInputModule, NbTreeGridModule, NbSpinnerModule, NbTooltipModule, NbDatepickerModule, NbContextMenuModule,NbSelectModule,NbRadioModule, NbTagModule, NbFormFieldModule, NbProgressBarModule,NbWindowModule } from '@nebular/theme';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { FormsModule } from '@angular/forms';


import { ThemeModule } from '../../@theme/theme.module';

import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AnswerComponent, CustomActionRenderComponent, CustomButtonFilterComponentAnswer } from './answer.component';
import { AnswerViewComponent} from './view/view.component';
import { AnswerHistoricalComponent } from './historical/historical.component';
import { ReportComponent } from './report/report.component';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { ZipComponent } from './report/zip/zip.component';
import { MainContainerComponent } from './report/main-container/main-container.component';
import { DetailAnswerComponent } from './detail-answer/detail-answer.component';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  imports: [
    NbCardModule,
    NbTreeGridModule,
    NbIconModule,
    NbInputModule,
    NbButtonModule,
    ThemeModule,
    Ng2SmartTableModule,
    MatDialogModule,
    MatButtonModule,
    LeafletModule,
    NbAutocompleteModule,
    NbActionsModule,
    FormsModule,
    NbSpinnerModule,
    NbTooltipModule,
    NbDatepickerModule,
    NbContextMenuModule,
    NbEvaIconsModule,
    NbSelectModule,
    NbRadioModule,
    NbFormFieldModule,
    NbTagModule,
    NbProgressBarModule,
    NbWindowModule.forRoot(),
    NgbCarouselModule,
  ],
  declarations: [
    AnswerComponent,
    AnswerViewComponent,
    AnswerHistoricalComponent,
    ReportComponent,
    CustomActionRenderComponent,
    CustomButtonFilterComponentAnswer,
    ZipComponent,
    MainContainerComponent,
    DetailAnswerComponent,
  ],
  providers: [
  ],
  
})
export class AnswerModule { }
