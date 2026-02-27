import { Component, OnInit, ViewChild } from '@angular/core';
import { NbPopoverDirective } from '@nebular/theme';
import { Observable, of } from 'rxjs';
import { FolderComponent } from '../folder.component';
import { ToastService } from '../../../usable/toast.service';
import { UserService } from '../../../services/user.service';
import { AdminService } from '../../../services/admin.service';
import { map } from 'rxjs/operators';
import { ContactsService } from '../../../services/contacts.service';

@Component({
  selector: 'ngx-user',
  templateUrl: "dialog-user.html",
  styles: [
    "nb-card-footer { text-align:end}",
    "button {margin:5px}",
    "nb-checkbox {margin:5px 0px}",
    "nb-select {width:100%;}",
  ],
})
export class UserDialogComponent implements OnInit {
  loading;
  drag_class = "";
  user_list;
  user_select;
  role_list;
  user_selected;
  role_selected;
  user_sel_list;
  role_sel_list;
  user_name_option = '';
  role_name_option;
  filteredOptions$: Observable<any[]>;
  filteredOptionsRole$: Observable<any[]>;
  user_item = null;
  role_item = null;
  role_users = [];
  tab_sel;
  contact_name_option;
  filteredOptionsContacts$: Observable<any[]>;
  contact_list;
  contact_selected;
  contact_item = null;

  // Public
  public_validate = 0;
  public_main;
  type_public = '4';
  limit_public = 1;

  @ViewChild(NbPopoverDirective) popover: NbPopoverDirective;

  public data: {
    parentComponent: FolderComponent;
    index: number;
  };

  constructor(
    private toastService: ToastService,
    private userService: UserService,
    private adminService: AdminService,
    private contactsService: ContactsService
    ) {}

  ngOnInit(): void {
    this.user_sel_list = this.data.parentComponent.user_list.filter((val)=>val.type===1).map((val)=> val.id);
    this.role_sel_list = this.data.parentComponent.user_list.filter((val)=>val.type===2).map((val)=> val.id);


    // this.data.parentComponent.user_list.forEach(element => {
    //   console.log(element);
    //   console.log(this.data.parentComponent.user_list[this.data.index]);
    //   if ([4,5].includes(element.type) && element != this.data.parentComponent.user_list[this.data.index]) {

    //     console.log('this.public_main');
    //     console.log(this.public_main);

    //     if (this.public_main != undefined && element.type == 5) {
    //       this.public_main = element;
    //     } else {
    //       this.public_validate = false;
    //     }
    //   }
    // });

    this.loading = true;
    this.user_select = this.data.parentComponent.user_list[this.data.index];

    // console.log(this.user_select);

    if ([4,5].includes(this.user_select.type)) {
      this.type_public = this.user_select.type + '';
      this.limit_public = this.user_select.limit_public;
    }

    this.data.parentComponent.user_list.forEach(element => {
      if (this.public_main == undefined && [4,5].includes(element.type)) {
        this.public_main = element;
        // Toma el primer publico 2 como principal
        if (element.type == 5 && element != this.data.parentComponent.user_list[this.data.index]) {
          this.public_validate = 2;
          this.limit_public = element.limit_public;
          this.type_public = element.type + '';
        } else if (element.type == 4 && element != this.data.parentComponent.user_list[this.data.index]) {
          this.public_validate = 1;
          this.type_public = element.type + '';
        }
      }
    });

    this.userService.view().subscribe((response)=>{
      this.user_list = response;
      this.filteredOptions$ = this.getFilteredOptions('', 1);
      this.loading = false;
    });
    this.adminService.getRoles().subscribe((response)=>{
      this.role_list = response['data'];
      this.filteredOptionsRole$ = this.getFilteredOptions('', 2);

    });
    this.contactsService.view("active").subscribe((response) => {
      this.contact_list = response
      this.filteredOptionsContacts$ = this.getFilteredOptions('', 3);
    });
  }

  private filter(value, i){
    const filterValue = value.toLowerCase();
    let options:any[];
    let key:string[] = ['name'];
    switch(i){
      case 1:
        options = this.user_list;
        key = ['first_name', 'first_last_name'];
        break;
      case 2:
        options = this.role_list;
        break;
      case 3:
        options = this.contact_list;
        break;
    }
    let list_filer = options.filter(option => {
      let option_text = '';
      key.forEach(k => {
        option_text += ' ' + option[k];
      });
      return option_text.trim().toLowerCase().includes(filterValue)});
    return list_filer;
  }

  getFilteredOptions(value, i): Observable<any[]> {
    return of(value).pipe(
      map(filterString => this.filter(filterString, i)),
    );
  }

  onChange(input, i) {
    switch (i) {
      case 1:
        this.filteredOptions$ = this.getFilteredOptions(input.value, i);
        break;
      case 2:
        this.filteredOptionsRole$ = this.getFilteredOptions(input.value, i);
        break;
      case 3:
        this.filteredOptionsContacts$ = this.getFilteredOptions(input.value, i);
        break;
    }
  }

  onSelectionChange($event, i:number) {
    // console.log($event.id, i);
    if($event.id == undefined) {
      return;
    }
    switch(i){
      case 1:
        this.user_name_option = $event.first_name + ' ' + $event.first_last_name
        this.user_selected = $event.id;
        this.user_item = $event;
        break;
      case 2:
        this.role_name_option = $event.name;
        this.role_selected = $event.id;
        this.role_item = $event;
        this.role_users = this.user_list.filter((val)=>{
          return val.role_enterprise_id == this.role_selected;
        });
        break;
      case 3:
        this.contact_selected = null;
        this.contact_name_option = $event.name
        // Se coloca un timeout para que el campo tipo tel se puede refrescar y cambiar el pais
        setTimeout(() => {
          this.contact_selected = $event.id;
          this.contact_item = $event;
        }, 200);
        break;
    }

  }

  changeTab($event){
    this.tab_sel = $event.tabId;
  }

  formComplete(){
    switch(this.tab_sel){
      case "1":
        return this.user_item === null;
      case "2":
        return this.role_item === null;
      case "3":
        return this.contact_item === null;
      case "4":
        // Validación que limit != vacio o 0
        return !(this.limit_public >= 1);
    }
    return true;
  }

  assing(){
    this.loading = true;
    let item = this.data.parentComponent.user_list[this.data.index];
    this.data.parentComponent.changeParticipate = true;
    switch(this.tab_sel){
      case "1":
        if (this.user_item !== null){
          item.type = Number(this.tab_sel);
          item.name = this.user_item.first_name + ' ' + this.user_item.first_last_name;
          item.email = this.user_item.email;
          item.phone_ind = (''+this.user_item.phone).includes('+') ? '' : '+57'
          item.phone = this.user_item.phone;
          item.id = this.user_item.id;
          this.data.parentComponent.user_list[this.data.index] = item;
          this.close();
        }
        break;
      case "2":
        if (this.role_item !== null){
          item.id = this.role_item.id;
          item.name = this.role_item.name;
          item.type = Number(this.tab_sel);
          this.data.parentComponent.user_list[this.data.index] = item;
          this.close();
        }
        break;
      case "3":
        if (this.contact_item !== null){
          item.id = this.contact_item.id;
          item.name = this.contact_item.name;
          item.type = Number(this.tab_sel);
          item.email = this.contact_item.email;
          item.phone_ind = this.contact_item.phone_ind
          item.phone = this.contact_item.phone;
          item.reload = true;
          this.data.parentComponent.user_list[this.data.index] = item;
          // Se coloca un timeout para que el campo tipo tel se puede refrescar y cambiar el pais
          setTimeout(() => {
            item.reload = false;
            this.data.parentComponent.user_list[this.data.index] = item;
            this.close();
          }, 100);
        }
        break;
      case "4":
        // Tipo 4 y 5
        item.id = null;
        item.name = 'ACCESO GENERAL';
        if (Number(this.type_public) == 5) {
          item.name = 'ACCESO APROBADO POR TERCERO';
          this.data.parentComponent.order = true;
        }
        item.type = Number(this.type_public);
        item.limit_public = this.limit_public;

        this.data.parentComponent.user_list.forEach((element, index) => {
          if ([4,5].includes(element.type) && element != this.data.parentComponent.user_list[this.data.index]) {
            if (Number(this.type_public) == 5) {
              element.name = 'ACCESO APROBADO POR TERCERO';
              element.type = 5;
              element.limit_public = this.limit_public;
            } else {
              element.name = 'ACCESO GENERAL';
              element.type = 4;
            }
            this.data.parentComponent.user_list[index] = element;
          }
        });

        this.data.parentComponent.user_list[this.data.index] = item;
        this.close();

        break;
    }
    this.loading = false;
  }

  telInputObject(item, option: string){
    switch (option) {
      case 'user':
        let ind = this.user_item.ind;
        if (ind && ind !== ''){
          let country = item.p.filter((val) => {
            let isCountry = false;
            if (ind.includes('-')){
              for (let index = 0; index < (val.areaCodes) ? val.areaCodes.length : 0; index++) {
                const area = val.areaCodes[index];
                if (val.dialCode+'-'+area == ind){
                  isCountry = true;
                  break;
                }
              }
            } else {
              isCountry = (val.dialCode == ind && val.areaCodes === null);
            }
            return isCountry;
          })[0];
          if (country)
            item.setCountry(country.iso2);
        } else {
          item.setCountry('co');
        }
        break;
      case 'contact':
        let phoneInd = this.contact_item.phone_ind
        if(phoneInd) {
          let arrayPhone = phoneInd.split('-');
          let country = arrayPhone.length == 2 ? arrayPhone[1] : 'co'
          item.setCountry(country);
        }
        break;
    }
  }

  onSelectPublic(type) {
    this.type_public = type;
  }

  close() {
    this.data.parentComponent.docClic();
    this.data.parentComponent.dialogUserRef.close();
  }

}
