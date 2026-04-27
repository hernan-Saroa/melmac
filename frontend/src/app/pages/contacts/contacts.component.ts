import { Component, OnInit } from '@angular/core';
import { DefaultEditor, LocalDataSource } from 'angular2-smart-table';
import { ContactsService } from '../../services/contacts.service';
import { ToastService } from '../../usable/toast.service';
import { ContactsTable } from './contacts.table';

@Component({
  selector: 'ngx-contacts',
  templateUrl: './contacts.component.html',
  styleUrls: ['./contacts.component.scss']
})
export class ContactsComponent implements OnInit {

  data: LocalDataSource = new LocalDataSource();
  isLoading = true;
  iterator = 0;

  constructor(
    private contactsTable: ContactsTable,
    private contactsService: ContactsService,
    private toastService: ToastService
  ) {
    this.contactsService.view().subscribe(
      response => {
        this.data.load(response)
        this.isLoading = false;
      }
    );
  }

  settings = this.contactsTable.settings

  ngOnInit(): void {
    this.data.onChanged().subscribe((change) => {
      this.changeIcons()
    })
  }

  changeIcons() {
    let interval = setInterval(() => {
      var list = document.getElementsByClassName(this.contactsTable.classDel);
      this.iterator++;
      if(list.length > 0 || this.iterator >= 1000) {
        this.iterator = 0;
        clearInterval(interval);
        for (var i = 0; i < list.length; i++) {
          let iconDeletedCurrent = list[i].parentElement.parentElement.parentElement.parentElement;
          let isDeleted = iconDeletedCurrent.getElementsByClassName('badge')[0].classList.contains("deleted");
          if(isDeleted) {
            list[i].classList.remove('nb-trash')
            list[i].classList.add('nb-checkmark-circle')
            list[i].parentElement.classList.add('icon-active-or-delete')
            list[i].parentElement.parentElement.firstElementChild.classList.add('smart-action-edit-is-deleted')
          }
        }
      }
    }, 5);
  }

  onCreateConfirm(event): void {
    if(this.isLoading) return;
    if(!this.formValidate(event)) return;
    this.isLoading = true;
    let dataForm = this.getObjData(event.newData)
    this.contactsService.create(dataForm).subscribe(
      response => {
        if(response['status']) {
          this.success(event, dataForm, response['id'])
          this.toastService.showToast('success', 'Listo', response['message']);
        } else {
          this.toastService.showToast('danger', 'Error', response['message']);
        }
        this.isLoading = false;
      },
      error => {
        this.isLoading = false;
        console.error('onCreateConfirm', error)
        let msj = error.status == 403 ? error.error.detail : 'Ocurrio un problema al conectar con el servidor'
        this.toastService.showToast('danger', 'Error', msj);
      }
    );
  }

  onEditConfirm(event): void {
    if(this.isLoading) return;
    if(!this.formValidate(event)) return;
    this.isLoading = true;
    this.setUpdateData(event, true)
  }

  setUpdateData(event, edit) {
    let dataForm = edit ? this.getObjData(event.newData) : event.data
    this.contactsService.update(dataForm).subscribe(
      response => {
        if(response['status']) {
          if(edit) {
            this.success(event, dataForm)
          } else {
            this.data.refresh();
          }
          this.toastService.showToast('success', 'Listo', response['message']);
        } else {
          this.toastService.showToast('danger', 'Error', response['message']);
        }
        this.isLoading = false;
      },
      error => {
        this.isLoading = false;
        console.error('onEditConfirm', error)
        let msj = error.status == 403 ? error.error.detail : 'Ocurrio un problema al conectar con el servidor'
        this.toastService.showToast('danger', 'Error', msj);
      }
    );
  }

  onDeleteConfirm(event): void {
    if(this.isLoading) return;
    this.isLoading = true;
    if(event.data.state) {
      this.contactsService.delete(event.data.id).subscribe(
        response => {
          if(response['status']) {
            // event.confirm.resolve(event.newData);
            event.data['state'] = false;
            this.data.refresh();
            this.toastService.showToast('success', 'Listo', response['message']);
          } else {
            this.toastService.showToast('danger', 'Error', response['message']);
          }
          this.isLoading = false;
        },
        error => {
          this.isLoading = false;
          console.error('onDeleteConfirm', error)
          let msj = error.status == 403 ? error.error.detail : 'Ocurrio un problema al conectar con el servidor'
          this.toastService.showToast('danger', 'Error', msj);
        }
      );
    } else {
      event.data['state'] = true;
      this.setUpdateData(event, false)
    }
  }

  success(event, dataForm, id = null) {
    if(id) {
      let user = JSON.parse(localStorage.getItem('session')) || null;
      event.newData['id'] = id;
      event.newData['enterprise_id'] = user.enterprise;
    }
    event.newData['phone'] = dataForm.phone;
    event.newData['phone_ind'] = dataForm.phone_ind;
    event.confirm.resolve(event.newData);
  }

  formValidate(event): boolean {
    let list = Object.entries(event.newData);
    let formValidate = true;
    list.forEach(([key, data]) => {
      let last = true;
      let ind = ''
      if(key == 'phone') {
        ind = data['phoneInd'];
        data = data['phoneNumber'];
      }
      if (data === '' || data == null) {
        formValidate = false;
        last = false;
      } else if(!this.isValidate(key, data.toString())) {
        formValidate = false
        last = false;
      }
      let isPhone = false;
      if(key == 'phone' && ind == '+57-co' && data.toString().length != 10) {
        isPhone = true
        formValidate = false
        last = false;
      }
      if(!last) {
        let msj = 'Datos erroneos ' + this.settings['columns'][key].title;
        msj = isPhone ? msj + ', debe tener 10 números' :  msj;
        this.toastService.showToast('warning', 'Error', msj);
      }
    })
    return formValidate;
  }

  isValidate(type: string, value: string): boolean{
    switch (type) {
      case 'phone':
        var REGEX = /^[0-9]+$/;
        break;
      case 'email':
        var REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        value = value.trim();
        break;
      default:
        return true;
    }
    if (value != '') {
      return REGEX.test(value);
    }
  }

  onPermit(id:number): Boolean {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['permission'].includes(id)) {
      return true;
    }
    return false;
  }

  getObjData(objData) {
    let user_text = JSON.stringify(objData);
    let user_data = JSON.parse(user_text);
    let phone = user_data.phone;
    user_data.phone = phone.phoneNumber;
    user_data.phone_ind = phone.phoneInd;
    return user_data
  }

}

@Component({
  selector: "input-custom-phone",
  template: `
    <nb-form-field>
    <input type="number" ng2TelInput nbInput fullWidth autocomplete="off"
      style="background-color: white"
      class="tel-input-number"
      [(ngModel)]="phone.phoneNumber"
      [ng2TelInputOptions]="telOptions"
      (blur)="onBlur($event)"
      (intlTelInputObject)="telInputObject($event)">
    </nb-form-field>
  `,
})


export class CustomInputPhoneComponentUser extends DefaultEditor implements OnInit {
  telOptions = { initialCountry: 'co', preferredCountries: ['co']};
  inputObject: any = null;
  phone = {
    phoneInd: '',
    phoneNumber: ''
  }

  constructor() {
    super();
  }

  ngOnInit() {
    this.phone.phoneNumber = this.cell.getValue();
  }

  onBlur(event) {
    this.phone.phoneInd = this.inputObject ? `+${this.inputObject.s.dialCode}-${this.inputObject.s.iso2}` : null;
    this.cell.setValue(this.phone.phoneNumber);
  }

  telInputObject(event) {
    if(this.cell.getRow()['index'] >= 0) {
      let phoneInd = this.cell.getRow()['data']['phone_ind'];
      if(phoneInd) {
        let arrayPhone = phoneInd.split('-');
        let country = arrayPhone.length == 2 ? arrayPhone[1] : 'co'
        event.setCountry(country);
      }
    }
    this.inputObject = event;
    this.phone.phoneInd = this.inputObject ? `+${this.inputObject.s.dialCode}-${this.inputObject.s.iso2}` : null;
    this.cell.setValue(this.phone.phoneNumber);
  }

}
