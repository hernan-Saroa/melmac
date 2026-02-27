import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NbCardModule, NbFormFieldModule, NbIconModule, NbInputModule } from '@nebular/theme';
import { ContactsComponent, CustomInputPhoneComponentUser } from './contacts.component';
import { Ng2SmartTableModule } from 'ng2-smart-table';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Ng2TelInputModule } from 'ng2-tel-input';



@NgModule({
  declarations: [
    ContactsComponent,
    CustomInputPhoneComponentUser
  ],
  imports: [
    CommonModule,
    NbCardModule,
    Ng2SmartTableModule,
    NbInputModule,
    NbIconModule,
    NbFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    Ng2TelInputModule
  ]
})
export class ContactsModule { }
