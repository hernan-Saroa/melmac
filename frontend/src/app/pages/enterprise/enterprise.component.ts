import { Component, OnInit } from '@angular/core';
import { EnterpriseService } from '../../services/enterprise.service';
import { UserService } from '../../services/user.service';
import { ToastService } from '../../usable/toast.service';
import { NbDialogRef, NbDialogService } from '@nebular/theme';
import { AdminComponent } from '../admin/permit/admin/admin.component';
import { Router } from '@angular/router';

@Component({
  selector: 'ngx-enterprise',
  templateUrl: './enterprise.component.html',
  styleUrls: ['./enterprise.component.scss']
})
export class EnterpriseComponent implements OnInit {

  data;
  // settings: Object;
  select_identification = [];
  select_theme = [];

  settings = {
    // mode: 'external',
    pager: {
      display: true,
      perPage: 10,
    },
    actions:{
      columnTitle: "Acciones",
      add: true,
      edit: true,
      delete: false,
      custom: [
        {
          name: 'permit',
          title: '<i title="Permisos" class="nb-compose"></i>',
        },
        {
          name: 'attemps',
          title: '<i title="Intentos por firma" class="nb-gear"></i>',
        }
      ]
    },
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmSave: true,
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },
    columns: {
      first_name: {
        title: 'Primer nombre',
        type: 'string',
      },
      first_last_name: {
        title: 'Primer apellido',
        type: 'string',
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
            selectText: 'Seleciona el tipo de documento',
            list: [],
          },
        },
        editor: {
          type: 'list',
          config: {
            selectText: 'Seleciona el tipo de documento',
            list: [],
          },
        },
      },
      identification: {
        title: 'Identificación',
        editable: false,
        type: 'number',
      },
      email: {
        title: 'Correo',
        editable: false,
        type: 'email',
      },
      phone: {
        title: 'Teléfono',
        editable: false,
        type: 'number',
      },
      enterprise__theme_id: {
        title: 'Tema',
        valuePrepareFunction: (value) => {
          return this.select_theme.filter(theme => theme.value == value).map(theme => theme.title)[0];
        },
        filter: {
          type: 'list',
          config: {
            selectText: 'Seleciona el tema',
            list: [],
          },
        },
        editor: {
          type: 'list',
          config: {
            selectText: 'Seleciona el tema',
            list: [],
          },
        },
      },
      enterprise__max_users: {
        title: 'Max Users',
        type: 'number',
      },
      enterprise__visit_form: {
        title: 'Formulario visita',
        type: 'number',
      },
      login_state: {
        title: 'Estado Administrador',
        addable: false,
        valuePrepareFunction: function(cell, row) {
          if (cell == true || cell == 'true') {
            return 'Activo';
          } else {
            return 'Inactivo';
          }
        },
        filter: {
          type: 'list',
          config: {
            selectText: 'Seleciona el estado',
            list: [
              { value: true, title: 'Activo' },
              { value: false, title: 'Inactivo' },
            ],
          },
        },
        editor: {
          type: 'list',
          config: {
            selectText: 'Seleciona el estado',
            list: [
              { value: true, title: 'Activo' },
              { value: false, title: 'Inactivo' },
            ],
          },
        },
      },
      enterprise__state: {
        title: 'Estado Empresa',
        valuePrepareFunction: function(cell, row) {
          if (cell == true || cell == 'true') {
            return 'Activo';
          } else {
            return 'Inactivo';
          }
        },
        filter: {
          type: 'list',
          config: {
            selectText: 'Seleciona el estado',
            list: [
              { value: true, title: 'Activo' },
              { value: false, title: 'Inactivo' },
            ],
          },
        },
        editor: {
          type: 'list',
          config: {
            selectText: 'Seleciona el estado',
            list: [
              { value: true, title: 'Activo' },
              { value: false, title: 'Inactivo' },
            ],
          },
        },
      },
    },
  };

  permitDialogRef: NbDialogRef<AdminComponent>;

  load = true;

  constructor(
    private enterpriseService:EnterpriseService,
    private userService:UserService,
    private toastService: ToastService,
    private dialogService: NbDialogService,
    private router: Router,
  ) {

    this.userService.get_identification().subscribe(
      response => {
        response['data'].forEach(identification => {
          this.select_identification.push({value: identification['id'], title: identification['name']});
        });

        this.settings.columns.type_identification_id.editor.config.list = this.select_identification;
        this.settings.columns.type_identification_id.filter.config.list = this.select_identification;
        this.settings = Object.assign({}, this.settings);
      }
    );

    this.enterpriseService.get_theme().subscribe(
      response => {
        response['data'].forEach(theme => {
          this.select_theme.push({value: theme['id'], title: theme['name']});
        });

        this.settings.columns.enterprise__theme_id.editor.config.list = this.select_theme;
        this.settings.columns.enterprise__theme_id.filter.config.list = this.select_theme;
        this.settings = Object.assign({}, this.settings);
      }
    );

    this.enterpriseService.view().subscribe(
      response => {
        this.data = response['data'];
      }
    );
  }

  ngOnInit(): void {
  }

  onCreateConfirm(event): void {

    if (this.load) {
      this.load = false;

      let list = Object.entries(event.newData);

      if (this.dataValidate(list)) {

        let user_text = JSON.stringify(event.newData);
        let user_data = JSON.parse(user_text);

        if (user_data['enterprise__state'] == "true") {
          user_data['enterprise__state'] = true;
        } else if (user_data['enterprise__state'] == "false") {
          user_data['enterprise__state'] = false;
        }

        if (user_data['login_state'] == "true" || user_data['login_state'] == "") {
          user_data['login_state'] = true;
        } else if (user_data['login_state'] == "false") {
          user_data['login_state'] = false;
        }
        this.enterpriseService.create(user_data).subscribe(response => {
          if (response['status'] == true) {
            this.toastService.showToast('success', 'Listo', 'Usuario creado correctamente.');
            event.newData['id'] = response['data']['parameters']['id'];
            event.newData['enterprise_id'] = response['data']['parameters']['enterprise_id'];
            event.newData['login_state'] = response['data']['parameters']['login_state'];
            event.confirm.resolve(event.newData);
            this.load = true;
          } else {
            this.toastService.showToast('danger', 'Error', response['message']);
          }
        });
      } else {
        event.confirm.reject();
      }

      setTimeout(() => {
        this.load = true;
        }, 3000
      );

    } else {
      this.toastService.showToast('warning', 'Espera!', 'Se esta creando el registro.');
    }
  }

  onEditConfirm(event): void {

    if (this.load) {
      this.load = false;

      let list = Object.entries(event.newData);
      if (this.dataValidate(list)) {
        let user_text = JSON.stringify(event.newData);
        let user_data = JSON.parse(user_text);

        if (user_data['enterprise__state'] == "true") {
          user_data['enterprise__state'] = true;
        } else if (user_data['enterprise__state'] == "false") {
          user_data['enterprise__state'] = false;
        }

        if (user_data['login_state'] == "true" || user_data['login_state'] == "") {
          user_data['login_state'] = true;
        } else if (user_data['login_state'] == "false") {
          user_data['login_state'] = false;
        }
        this.enterpriseService.update(user_data).subscribe(response => {
          this.toastService.showToast('success', 'Listo', 'Empresa editado correctamente.');
          event.confirm.resolve();
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
    let data_validate = true;
    let columns = Object.keys(this.settings.columns)
    console.log(list)
    list.forEach(value => {
      let key = value[0];
      let data = <string>value[1];
      console.log(key)
      console.log(data)
      if (key != 'enterprise__state' && key != 'login_state' && data == '' && key != 'enterprise__max_users' && key != 'enterprise__visit_form'  && columns.includes(key)) {
        this.toastService.showToast('warning', 'Error', 'Datos incompletos ' + this.settings['columns'][key].title);
        data_validate = false;
      }
      if (key != 'id' && key != 'enterprise_id' && data != '' && data != null) {
        if (key == 'identification') {
          if (data.toString().length < 5 || data.toString().length > 11) {
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
        if (key == 'max_users'){
          if (parseInt(data) > 2) {
            this.toastService.showToast('danger', 'Error', 'Datos erroneos la cantidad máxima de usuarios debe ser mayor a 2');
            data_validate = false
          }
        }

        if(key != 'enterprise__visit_form' && key != 'enterprise__name'){
          if(!this.isValidate(key, data)){
            this.toastService.showToast('danger', 'Error', 'Datos erroneos ' + this.settings['columns'][key].title);
            data_validate = false
          }
        }

      }
    });
    return data_validate;
  }

  isValidate(type: string, value: string): boolean{
    switch (type) {
      // Letters
      case 'first_name':
      case 'first_last_name':
        var REGEX = /^[a-zA-Z ]{2,254}/;
        value = value.trim();
        break;
      // Number
      case 'type_identification_id':
      case 'identification':
      case 'phone':
      case 'enterprise__theme_id':
        var REGEX = /^[0-9]+$/;
        break;
      // Email
      case 'email':
        var REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        value = value.trim();
        break;
      case 'enterprise__state':
      case 'login_state':
      case 'enterprise__max_users':
          return true;
      case 'enterprise__visit_form':
          return true;
      default:
        return false;
    }
    if (value != '') {
      return REGEX.test(value);
    }
  }

  onCustom($event) {
    switch ($event.action) {
      case 'permit':
        this.permitDialogRef = this.dialogService.open(AdminComponent, {context:{data: {enterprise_id:$event.data.enterprise_id, parent:this}}});
        break;
      case 'attemps':
        let id = $event.data['enterprise_id']
        this.router.navigate([`/pages/enterprise/attempts/${id}`]);
        break;
      default:
        break;
    }
  }

}
