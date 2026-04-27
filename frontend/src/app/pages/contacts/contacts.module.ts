import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NbCardModule, NbFormFieldModule, NbIconModule, NbInputModule } from '@nebular/theme';
import { ContactsComponent, CustomInputPhoneComponentUser } from './contacts.component';
import { Angular2SmartTableModule } from 'angular2-smart-table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';




@NgModule({
  declarations: [
    ContactsComponent,
    CustomInputPhoneComponentUser
  ],
  imports: [
    CommonModule,
    NbCardModule,
    Angular2SmartTableModule,
    NbInputModule,
    NbIconModule,
    NbFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    
  ]
})
export class ContactsModule { }
