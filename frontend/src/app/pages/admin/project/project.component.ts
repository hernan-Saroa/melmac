import { ConfirmDialog } from './../role/role.component';
import { NbDialogService } from '@nebular/theme';
import { AdminService } from '../../../services/admin.service';
import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'angular2-smart-table';
import { ToastService } from '../../../usable/toast.service';


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


export class CustomInputTextFilterComponentProject extends DefaultFilter implements OnInit, OnChanges {
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
  selector: 'ngx-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {

  settings = {
    noDataMessage: 'No hay proyectos registrados.',
    actions:{
      columnTitle: "Acciones",
      add: this.onPermit(46),
      edit: this.onPermit(47),
      delete: false, // this.onPermit(48),
    },
    add: {
      addButtonContent: '<i class="nb-plus" itemprop="Nuevo proyecto"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close" itemprop="Eliminar"></i>',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<i class="nb-edit" itemprop="Editar"></i>',
      saveButtonContent: '<i class="nb-checkmark" itemprop="Guardar"></i>',
      cancelButtonContent: '<i class="nb-close" itemprop="Cancelar"></i>',
      confirmSave: true,
    },
    columns: {
      name: {
        title: 'Nombre',
        type: 'string',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentProject,
        }
      },
      identifier: {
        title: 'Identificador',
        type: 'string',
        editable: false,
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentProject,
        }
      },
      description: {
        title: 'Descripción',
        type: 'string',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentProject,
        }
      },
      state:{
        title:"Estado",
        type: 'html',
        valuePrepareFunction: function(cell, row) {
          if (cell == true || cell == 'true') {
            return '<span class="success">Activo</span>';
          } else {
            return '<span class="default">Inactivo</span>';
          }
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
        filter: {
          type: 'list',
          config: {
            selectText: 'Buscar por estado...',
            list: [
              { value: true, title: 'Activo' },
              { value: false, title: 'Inactivo' },
            ],
          },
        }
      }
    },
  };

  source: LocalDataSource = new LocalDataSource();

  load = true;

  onPermit(id:number): Boolean {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['permission'].includes(id)) {
      return true;
    }
    return false;
  }

  constructor(private toastService: ToastService, private service:AdminService, private dialogService:NbDialogService) { }

  ngOnInit(): void {
    this.service.getProjects().subscribe(response => {
      if (response['status']){
        this.source.load(response['data']);
      } else {
        this.toastService.showToast('danger', 'Error', 'No se logro recuperar los datos');
      }
    }, error => {
      // console.log(error)
      this.toastService.showToast('danger', 'Error', error.error.detail);
    })
  }

  onCreateConfirm(event): void {
    // console.log('onCreateConfirm');

    if (this.load) {
      this.load = false;

      let list = Object.entries(event.newData);

      if (this.dataValidate(list)) {

        let user_text = JSON.stringify(event.newData);
        let user_data = JSON.parse(user_text);

        this.service.createProject(user_data).subscribe(response => {
          if (response['status'] == true) {
            this.toastService.showToast('success', 'Listo', 'Proyecto creado correctamente.');
            event.newData['id'] = response['data']['id'];
            event.newData['identifier'] = response['data']['identifier'];
            event.confirm.resolve(event.newData);
            this.load = true;
          } else {
            this.toastService.showToast('danger', 'Error', response['message']);
          }
        }, error => {
          console.log(error);
          this.toastService.showToast('danger', 'Error', error.error.detail);
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

  dataValidate(list){
    let data_validate = true;
    list.forEach(value => {
      let key = value[0];
      let data = <string>value[1];
      if (!['id', 'name', 'identifier', 'description', 'state'].includes(key)){
        if (data == '') {
          this.toastService.showToast('warning', 'Error', 'Datos incompletos ' + this.settings['columns'][key].title);
          data_validate = false;
        }
      }
      if (!['id', 'description'].includes(key) && data != '' && data != null) {
        if (key == 'name') {
          if (data.length < 5 || data.length > 128) {
            this.toastService.showToast('danger', 'Error', 'Datos erroneos ' + this.settings['columns'][key].title + ', tamaño invalido, debe tener mas de 5 caracteres');
            data_validate = false;
          }
        }
        if (key == "identifier"){
          if (data.length < 3 || data.length > 10) {
            this.toastService.showToast('danger', 'Error', 'Datos erroneos ' + this.settings['columns'][key].title + ', tamaño invalido, debe ser de 3 a 10 caracteres');
            data_validate = false;
          }
        }
      }
    });
    return data_validate;
  }

  onEditConfirm(event): void {

    if (this.load) {
      this.load = false;

      let list = Object.entries(event.newData);

      if (this.dataValidate(list)) {
        let user_text = JSON.stringify(event.newData);
        let user_data = JSON.parse(user_text);

        this.service.updateProject(user_data['id'], user_data).subscribe(response => {
          this.toastService.showToast('success', 'Listo', 'Proyecto editado correctamente.');
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
}
