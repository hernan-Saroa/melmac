import { ConfirmDialog } from './../admin/role/role.component';
import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../usable/toast.service';
import { NbDialogService } from '@nebular/theme';
import { ActivatedRoute, Router } from '@angular/router';
import { OnChanges, SimpleChanges } from "@angular/core";
import { FormControl } from "@angular/forms";
import { DefaultFilter } from "angular2-smart-table";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

@Component({
  selector: "input-filter",
  template: `
    <nb-form-field>
      <nb-icon nbPrefix icon="search-outline" pack="eva"></nb-icon>
      <input
        [ngClass]="inputClass" nbInput fullWidth
        [formControl]="inputControl"
        class="form-control"
        type="text"
        placeholder="Buscar por {{ column.title }}..."
      />

    </nb-form-field>
  `,
})


export class CustomInputTextFilterComponentUser extends DefaultFilter implements OnInit, OnChanges {
  delay = 300;

  inputControl = new FormControl();

  constructor() {
    super();
  }

  ngOnInit() {
    if (this.query) {
      this.inputControl.setValue(this.query);
    }
    this.inputControl.valueChanges.pipe(distinctUntilChanged(), debounceTime(300)).subscribe((value: string) => {
      this.query = this.inputControl.value;
      this.setFilter();
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.query) {
      this.inputControl.setValue(this.query);
    }
  }
}
@Component({
  selector: 'ngx-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent {
  data;
  // settings: Object;
  select_role = [];
  select_identification = [];

  settings = {
    // mode: 'external',
    noDataMessage: 'Sin usuarios',
    pager: {
      display: true,
      perPage: 10,
    },
    actions:{
      columnTitle: "Acciones",
      add: this.onPermit(2),
      edit: this.onPermit(3),
      delete: this.onPermit(4),
    },
    add: {
      addButtonContent: '<i class="nb-person"></i><i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<i class="nb-edit" itemprop="Editar"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmSave: true,
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash" itemprop="Eliminar"></i>',
      confirmDelete: true,
    },
    columns: {
      first_name: {
        title: 'Primer nombre',
        type: 'string',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentUser,
        }
      },
      middle_name: {
        title: 'Segundo nombre',
        type: 'string',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentUser,
        }
      },
      first_last_name: {
        title: 'Primer apellido',
        type: 'string',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentUser,
        }
      },
      second_last_name: {
        title: 'Segundo apellido',
        type: 'string',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentUser,
        }
      },
      type_identification_id: {
        title: 'Tipo de Documento',
        editable: false,
        valuePrepareFunction: (value) => {
          return this.select_identification.filter(identification => identification.value == value).map(identification => identification.title)[0];
        },
        filter: {
          type: 'list',
          config: {
            selectText: 'Buscar por tipo de documento...',
            list: [],
          },
        },
        editor: {
          type: 'list',
          config: {
            selectText: 'Selecciona el tipo de documento',
            list: [],
          },
        },
      },
      identification: {
        title: 'Identificación',
        editable: true,
        type: 'number',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentUser,
        }
      },
      phone: {
        title: 'Teléfono',
        editable: true,
        type: 'number',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentUser,
        }
      },
      email: {
        title: 'Correo',
        editable: true,
        type: 'email',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentUser,
        }
      },
      role_enterprise_id: {
        title: 'Rol',
        editable: true,
        // addable: true,
        valuePrepareFunction: (value) => {
          return this.select_role.filter(role => role.value == value).map(role => role.title)[0];
        },
        filter: {
          type: 'list',
          config: {
            selectText: 'Buscar por tipo de usuario...',
            list: [],
          },
        },
        editor: {
          type: 'list',
          config: {
            selectText: 'Selecciona el tipo de usuario',
            list: []
          },
        },
      },
      login_state: {
        title: 'Estado de ingreso',
        valuePrepareFunction: function(cell, row) {
          if (cell == true || cell == 'true') {
            return 'Activo';
          } else {
            return 'Inactivo';
          }
        },
        editor: {
          type: 'list',
          config: {
            selectText: 'Selecciona el estado',
            list: [
              { value: true, title: 'Activo' },
              { value: false, title: 'Inactivo' },
            ],
          },
        },
        filter: {
          type: 'list',
          config: {
            selectText: 'Buscar por estado',
            list: [
              { value: true, title: 'Activo' },
              { value: false, title: 'Inactivo' },
            ],
          },
        }
      },
    },
  };

  onPermit(id:number): Boolean {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['permission'].includes(id)) {
      return true;
    }
    return false;
  }

  load = true;

  constructor(
    private router: Router,
    private userService:UserService,
    private toastService: ToastService,
    private dialogService:NbDialogService,
  ){

    this.userService.get_role().subscribe(
      response => {
        // this.select_role.push({ value: '', title: ' -- ' });
        response.forEach(role => {
          this.select_role.push({value: role['id'], title: role['name']});
        });

        this.settings.columns.role_enterprise_id.editor.config.list = this.select_role;
        this.settings.columns.role_enterprise_id.filter.config.list = this.select_role;
        this.settings = Object.assign({}, this.settings);
      }
    );

    this.userService.get_identification().subscribe(
      response => {
        // console.log(response);
        // this.select_identification.push({ value: '', title: ' -- ' });
        response['data'].forEach(identification => {
          this.select_identification.push({value: identification['id'], title: identification['name']});
        });

        this.settings.columns.type_identification_id.editor.config.list = this.select_identification;
        this.settings.columns.type_identification_id.filter.config.list = this.select_identification;
        this.settings = Object.assign({}, this.settings);
      }
    );

    this.userService.view().subscribe(
      response => {
        this.data = response
      }
    );
  }

  onDeleteConfirm(event): void {
    const dialogRef = this.dialogService.open(ConfirmDialog, {context:{data:{title: 'Confirmar eliminación', content: 'Estas seguro de eliminar el usuario?'}}});
    dialogRef.onClose.subscribe(result => {
      if (result == true) {
        this.userService.delete(event.data.id).subscribe(response => {
          if (response['status'] == true) {
            this.toastService.showToast('success', 'Listo', response['message']);
            event.confirm.resolve();
            this.load = true;
                  setTimeout(() => this.router.navigateByUrl('/RefrshComponent', {skipLocationChange: true}).then(()=> this.router.navigate(["/pages/user/"])), 1800);
          } else {
            this.toastService.showToast('danger', 'Error', response['message']);
          }
        });
      }
    });
  };

  onCreateConfirm(event): void {
    // console.log('onCreateConfirm');

    if (this.load) {
      this.load = false;
      event.newData['identification'] = this.dataTrim(event.newData['identification']);
      event.newData['phone'] = this.dataTrim(event.newData['phone']);
      let list = Object.entries(event.newData);

      if (this.dataValidate(list)) {

        let user_text = JSON.stringify(event.newData);
        let user_data = JSON.parse(user_text);
        // Rol usuario
        user_data['role_id'] = 3;
        this.userService.create(user_data).subscribe(response => {
          if (response['status'] == true) {
            this.toastService.showToast('success', 'Listo', 'Usuario creado correctamente.');
            event.newData['id'] = response['data']['parameters']['id'];
            event.confirm.resolve(event.newData);
            this.load = true;
          } else {
            //&& response['message'] == 'Algo salio mal, esta empresa ya supero el limite de usuarios permitidos'
            if (response['status'] == false && response['message'] == 'Algo salio mal, esta empresa ya supero el limite de usuarios permitidos'
              || response['status'] == false && response['message'] == 'Cambio de estado no fue exitoso supera la cantidad de usuarios de la empresa') {
              this.toastService.showToast('danger', 'Error', response['message']);
              this.load = true;
              setTimeout(() => this.router.navigateByUrl('/RefrshComponent', {skipLocationChange: true}).then(()=> this.router.navigate(["/pages/user/"])), 2000);
            } else {
              const dialogRef = this.dialogService.open(ConfirmDialog, {context:{data:{title: 'Confirmar Habilitación', content: 'Estás seguro de Habilitar el usuario?'}}});
              dialogRef.onClose.subscribe(result => {
              if (result == true) {
                  this.toastService.showToast('success', 'Listo', 'Usuario Habilitado correctamente.');
                  this.load = true;
                  setTimeout(() => this.router.navigateByUrl('/RefrshComponent', {skipLocationChange: true}).then(()=> this.router.navigate(["/pages/user/"])), 1800);          
              }
              });
            }
          }
        })
      } else {
        event.confirm.reject();
      }

      setTimeout(() => {
        this.load = true;
        }, 3000
      );

    } else {
      this.toastService.showToast('warning', 'Espera!', 'Se esta validando el registro.');
    }

  }

  onEditConfirm(event): void {

    if (this.load) {
      this.load = false;
      event.newData['identification'] = this.dataTrim(event.newData['identification']);
      event.newData['phone'] = this.dataTrim(event.newData['phone']);
      let list = Object.entries(event.newData);

      if (this.dataValidate(list)) {
        let user_text = JSON.stringify(event.newData);
        let user_data = JSON.parse(user_text);
        if (user_data['middle_name'] == '') {
          user_data['middle_name'] = null;
        }
        if (user_data['second_last_name'] == '') {
          user_data['second_last_name'] = null;
        }
        if ( user_data['login_state'] == true || user_data['login_state'] == "true") {
          user_data['login_state'] = true;
          user_data['login_count'] = 0;
        }else{
          user_data['login_state'] = false;
          user_data['login_count'] = 0;
        }
        this.userService.update(user_data).subscribe(response => {
          if(response['optionResp']==1){
            this.toastService.showToast('success', 'Listo', response['message']);
          }else{
            this.toastService.showToast('warning', 'Listo', response['message']);
            this.userService.view().subscribe(
              response => {
                this.data = response
              }
            );
          }
          event.confirm.resolve(event.newData);
          this.load = true;
        });
      } else {
        event.confirm.reject();
      }

      setTimeout(() => {
        this.load = true;
        }, 3000
      );

    } else {
      this.toastService.showToast('warning', 'Espera!', 'Se esta actualizando el registro.');
    }
  }

  dataValidate(list): boolean {
    //console.log(list)
    let data_validate = true;
    list.forEach(value => {
      let key = value[0];
      let data = <string>value[1];
      if (!['id', 'middle_name', 'second_last_name', 'enterprise_id'].includes(key)){
        if (data === '') {
          this.toastService.showToast('warning', 'Error', 'Datos incompletos ' + this.settings['columns'][key].title);
          data_validate = false;
        }
      }
      if (key != 'id' && key != 'enterprise_id' && data != '' && data != null) {
        if (key == 'identification') {
          if (data.length < 5 || data.length > 11) {
            this.toastService.showToast('danger', 'Error', 'Datos erroneos ' + this.settings['columns'][key].title + ', tamaño invalido');
            data_validate = false
          }
        }
        if (key == 'phone') {
          if (data.toString().length != 10) {
            this.toastService.showToast('danger', 'Error', 'Datos erroneos ' + this.settings['columns'][key].title + ', debe tener 10 números');
            data_validate = false
          }
        }
        if(!this.isValidate(key, data)){
          this.toastService.showToast('danger', 'Error', 'Datos erroneos ' + this.settings['columns'][key].title);
          data_validate = false
        }
      }
    });
    return data_validate;
  }

  isValidate(type: string, value: string): boolean{
    switch (type) {
      // Letters
      case 'first_name':
      case 'middle_name':
      case 'first_last_name':
      case 'second_last_name':
        var REGEX = /^[a-zA-Z ]{2,254}/;
        value = value.trim();
        break;
      // Number
      case 'type_identification_id':
      case 'identification':
      case 'phone':
      case 'role_id':
      case 'role_enterprise_id':
        var REGEX = /^[0-9]+$/;
        break;
      // Email
      case 'email':
        var REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        value = value.trim();
        break;
      case 'login_state':
        return true;
      default:
        return false;
    }
    if (value != '') {
      return REGEX.test(value);
    }
  }

  dataTrim(value) {
    try {
      value = value.trim()
    } catch (error) {
      // console.error(error)
    }
    return value
  }

}

// import { Directive, ElementRef, HostListener } from '@angular/core';

// @Directive({
//   selector: '[validateInput]'
// })
// export class ValidateInputDirective {
//   constructor(private element: ElementRef) {

//   }

//   @HostListener('onkeydown') onChange() {
//     this.highlight('yellow');
//   }

//   private highlight(color: string) {
//     console.log('askdjasd');
//     this.element.nativeElement.style.backgroundColor = color;
//   }

// }
