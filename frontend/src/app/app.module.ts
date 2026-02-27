/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LOCALE_ID, NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { CoreModule } from './@core/core.module';
import { ThemeModule } from './@theme/theme.module';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import '@angular/common/locales/global/es-CO';
import { FormsModule } from '@angular/forms'; // Importar FormsModule
import {
  NbChatModule,
  NbDatepickerModule,
  NbDialogModule,
  NbMenuModule,
  NbSidebarModule,
  NbToastrModule,
  NbWindowModule,
} from '@nebular/theme';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LoginNewComponent } from './login-new/login-new.component';
import { UploadComponent } from './components/upload/upload.component';
// Módulos de Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';



@NgModule({
  declarations: [AppComponent, UploadComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    NbSidebarModule.forRoot(),
    NbMenuModule.forRoot(),
    NbDatepickerModule.forRoot(),
    NbDialogModule.forRoot(),
    NbWindowModule.forRoot(),
    NbToastrModule.forRoot(),
    NbChatModule.forRoot({
      messageGoogleMapKey: 'AIzaSyA_wNuCzia92MAmdLRzmqitRGvCF7wCZPY ',
    }),
    CoreModule.forRoot(),
    ThemeModule.forRoot(),
    NgbModule,
    FormsModule,
    MatFormFieldModule, // Agrega este módulo
    MatInputModule,     // Agrega este módulo
    MatButtonModule,    // Para botones
    MatCheckboxModule,  // Para checkboxes
    MatAutocompleteModule,
  ],
  bootstrap: [AppComponent],
  providers:[{ provide: LOCALE_ID, useValue: 'es-CO' }]
})
export class AppModule {
}
