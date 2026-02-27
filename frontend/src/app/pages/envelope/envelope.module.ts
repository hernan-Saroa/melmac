import { NgModule } from '@angular/core';
import { NbCardModule, NbIconModule, NbInputModule, NbTreeGridModule, NbButtonModule, NbToggleModule } from '@nebular/theme';
import { CommonModule } from '@angular/common';
import { EnvelopeComponent } from './envelope/envelope.component';
import { EnvelopeRoutingModule } from './envelope-routing.module';
import { ThemeModule } from '../../@theme/theme.module';
import { NbThemeModule, NbMenuModule, NbContextMenuModule, NbSidebarModule   } from '@nebular/theme';
import { PdfViewerModule } from 'ng2-pdf-viewer';


@NgModule({
  declarations: [
    EnvelopeComponent
  ],
  imports: [
    EnvelopeRoutingModule,
    CommonModule,
    NbIconModule,
    NbThemeModule,
    ThemeModule,
    NbMenuModule,
    NbContextMenuModule,
    PdfViewerModule,
  ]
})
export class EnvelopeModule { }
