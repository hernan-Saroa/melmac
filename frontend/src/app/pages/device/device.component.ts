import { filter } from 'rxjs/operators';
import { LocalDataSource } from 'ng2-smart-table';
import { AdminService } from './../../services/admin.service';
import { Component, OnInit } from '@angular/core';
import { NbDialogRef, NbDialogService, NbGlobalPosition, NbComponentStatus, NbGlobalPhysicalPosition, NbToastrConfig, NbToastrService } from '@nebular/theme';
import { ConfirmDialog } from '../admin/role/role.component';
import { DeviceService } from '../../services/device.service';

import { OnChanges, SimpleChanges } from "@angular/core";
import { FormControl } from "@angular/forms";
import { DefaultFilter } from "ng2-smart-table";
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


export class CustomInputTextFilterComponentDevice extends DefaultFilter implements OnInit, OnChanges {
  inputControl = new FormControl();

  constructor() {
    super();
  }

  ngOnInit() {
    if (this.query) {
      this.inputControl.setValue(this.query);
    }
    this.inputControl.valueChanges.pipe(distinctUntilChanged(), debounceTime(this.delay)).subscribe((value: string) => {
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
  selector: 'ngx-type-device',
  templateUrl: './type_device.component.html',
  styleUrls: ['./device.component.scss']
})
export class TypeDeviceComponent implements OnInit {

  title = "Categorías de Dispositivos"

  source: LocalDataSource = new LocalDataSource();

  // Toast
  config: NbToastrConfig;

  index = 1;
  destroyByClick = true;
  duration = 3000;
  hasIcon = true;
  position: NbGlobalPosition = NbGlobalPhysicalPosition.TOP_RIGHT;
  preventDuplicates = false;
  status: NbComponentStatus = 'warning';

  toast_title = '';
  toast_content = '';

  onPermit(id:number): Boolean {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['permission'].includes(id)) {
      return true;
    }
    return false;
  }

  constructor(private service: AdminService, private dialogService: NbDialogService, private toastrService:NbToastrService) {
    service.getDeviceTypes().subscribe(response => {
      if (response['status'])
        this.source.load(response['data']);
    });
  }

  ngOnInit(): void {
  }

  private open(context) {
    this.dialogService.open(DialogComponent, {context:context});
  }

  onCreate(event):void {
    this.open({title:"Crear categoría de dispositivo", typeModal:1, parentComponent:this});
  }

  onEdit(event):void {
    var data = {title:"Editar categoría de dispositivo - " + event.data['name'], typeModal:2, parentComponent:this, inputName:event.data['name'], textDescription:event.data['description'], iconSelected:event.data['icon'], stateToggle:event.data['state'], row:event};
    const dialogRef = this.dialogService.open(DialogComponent, {context:data});

  }

  onDeleteConfirm(event): void {
    const dialogRef = this.dialogService.open(ConfirmDialog, {context:{data:{title: 'Eliminar categoría de dispositivo- ' + event.data['name'], content: 'Estas seguro de eliminar esta Categoría?'}}});
    dialogRef.onClose.subscribe(result => {
      if (result == true) {
        this.service.deleteDeviceType(event.data.id).subscribe(response => {
          if (response == null){
            this.status = 'success';
            this.toast_title = 'Listo';
            this.toast_content = 'Registro eliminado correctamente';
            //Eliminado y actualización de la tabla
            this.source.remove(event.data);
            this.source.refresh();
          }
          else if (response['status'] == true) {
            this.status = 'warning';
            this.toast_title = 'Listo';
            this.toast_content = response['message'];
            event.data['state'] = false;
            this.source.refresh();
            // event.confirm.resolve();
          } else {
            this.status = 'danger';
            this.toast_title = 'Error';
            this.toast_content = response['message'];
          }
          this.makeToast();
        });
      }
    });
  };

  getService(){
    return this.service;
  }

  settings = {
    mode: 'external',
    noDataMessage: 'Sin categorías',
    actions:{
      columnTitle: "Acciones",
      add: this.onPermit(20),
      edit: this.onPermit(21),
      delete: this.onPermit(22),
    },
    add: {
      addButtonContent: '<i class="nb-plus" itemprop="Nueva categoría de dispositivo"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    edit: {
      editButtonContent: '<i class="nb-edit" itemprop="Editar"></i>',
      saveButtonContent: '<i class="nb-checkmark" itemprop="Guardar"></i>',
      cancelButtonContent: '<i class="nb-close" itemprop="Cerrar"></i>',
      confirmSave: true,
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash" itemprop="Eliminar"></i>',
      confirmDelete: true,
    },
    columns: {
      name: {
        title: 'Nombre',
        type: 'string',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentDevice,
        }
      },
      description: {
        title: 'Descripción',
        type:'string',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentDevice,
        }
      },
      icon:{
        title: 'Icono',
        type: 'html',
        valuePrepareFunction: function(cell, row) {
          if (cell){
            return '<img src="/assets/icons/'+cell+'.png" height=48/>';
          }
          return 'N/A';
        },
        filter:false,
      },
      state: {
        title: 'Estado',
        // type: 'html',
        valuePrepareFunction: function(cell, row) {
          if (cell == true || cell == 'true') {
            return 'Activo';
            // return '<i class="nb-checkmark-circle-outline success"></i>';
          } else {
            return 'Inactivo';
            // return '<i class="nb-close-circle-outline danger"></i>';
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
        filter:{
          type: 'list',
          config: {
            selectText: 'Buscar por estado...',
            list: [
              { value: true, title: 'Activo' },
              { value: false, title: 'Inactivo' },
            ],
          },
        }
      },
    },
  };

  makeToast() {
    this.showToast(this.status, this.toast_title, this.toast_content);
  }

  private showToast(type: NbComponentStatus, title: string, body: string) {
    const config = {
      status: type,
      destroyByClick: this.destroyByClick,
      duration: this.duration,
      hasIcon: this.hasIcon,
      position: this.position,
      preventDuplicates: this.preventDuplicates,
    };
    const titleContent = title ? ` ${title}` : '';

    this.index += 1;
    this.toastrService.show(
      body,
      `${titleContent}`,
      config);
  }

}

//Componente Dispositivos
@Component({
  selector: 'ngx-device',
  templateUrl: './device.component.html',
  styleUrls: ['./device.component.scss']
})
export class DeviceComponent implements OnInit {

  data;

  selectList = [];

  settings = {
    // mode: 'external',
    noDataMessage: 'Lista de dispositivos vacía',
    pager: {
      display: true,
      perPage: 10,
    },
    actions:{
      columnTitle: "Acciones",
      add: this.onPermit(25),
      edit: this.onPermit(26),
      delete: this.onPermit(27),
    },
    add: {
      addButtonContent: '<i class="nb-plus" itemprop="Nueva categoría"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<i class="nb-edit" itemprop="Editar"></i>',
      saveButtonContent: '<i class="nb-checkmark" itemprop="Guardar"></i>',
      cancelButtonContent: '<i class="nb-close" itemprop="Cancelar"></i>',
      confirmSave: true,
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash" itemprop="Eliminar"></i>',
      confirmDelete: true,
    },
    columns: {
      name: {
        title: 'Nombre',
        type: 'string',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentDevice,
        }
      },
      type_device_id: {
        title: 'Tipo Dispositivo',
        editable: true,
        addable: true,
        valuePrepareFunction: (value) => {
          return this.selectList.filter(typeDevice => typeDevice.value == value).map(typeDevice => typeDevice.title)[0];
        },
        editor: {
          type: 'list',
          config: {
            selectText: 'Seleciona el tipo de dispositivo',
            list: []
          },
        },
        filter:{
          type:'list',
          config: {
            selectText: 'Buscar por tipo de dispositivo',
            list: []
          }
        }
      },
      mac:{
        title: "MAC",
        type: 'string',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentDevice,
        }
      },
      state: {
        title: 'Estado',
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
      },
    },
  };

  // Toast
  config: NbToastrConfig;

  index = 1;
  destroyByClick = true;
  duration = 2000;
  hasIcon = true;
  position: NbGlobalPosition = NbGlobalPhysicalPosition.TOP_RIGHT;
  preventDuplicates = false;
  status: NbComponentStatus = 'warning';

  title = '';
  content = '';

  onPermit(id:number): Boolean {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['permission'].includes(id)) {
      return true;
    }
    return false;
  }

  constructor(
    private service:DeviceService,
    private adminService:AdminService,
    private toastrService: NbToastrService,
    private dialogService:NbDialogService,
  ){

    this.adminService.getDeviceTypes().subscribe(
      response => {
        this.selectList.push({ value: '', title: ' -- ' });
        if (response['status']) {
          response['data'].forEach(deviceType => {
            this.selectList.push({value: deviceType['id'], title: deviceType['name']});
          });
        }
        this.settings.columns.type_device_id.editor.config.list = this.selectList;
        this.settings.columns.type_device_id.filter.config.list = this.selectList;
        this.settings = Object.assign({}, this.settings);
      }
    );

    this.service.getDevices().subscribe(
      response => {
        if (response['status'])
          this.data = response['data'];
      }
    );
  }
  ngOnInit(): void {

  }

  onDeleteConfirm(event): void {
    const dialogRef = this.dialogService.open(ConfirmDialog, {context:{data:{title: 'Confirmar eliminación', content: 'Estas seguro de eliminar el dispositivo?'}}});
    dialogRef.onClose.subscribe(result => {
      if (result == true) {
        this.service.deleteDevice(event.data.id).subscribe(response => {
          if(response == null){
            this.status = 'success';
            this.title = 'Listo';
            this.content = 'El registro fue eliminado correctamente';
            event.confirm.resolve();
          } else if (response['status']) {
            this.status = 'success';
            this.title = 'Listo';
            this.content = response['message'];
            event.confirm.resolve();
          } else {
            this.status = 'danger';
            this.title = 'Error';
            this.content = response['message'];
          }
          this.makeToast();
        });
      }
    });
  };

  onCreateConfirm(event): void {
    let data = event.newData;
    this.service.createDevice(data).subscribe(response => {
      if (response['status'] == true) {
        this.status = 'success';
        this.title = 'Listo';
        this.content = 'Dispositivo registrado correctamente.';
        event.newData['id'] = response['data']['id'];
        event.confirm.resolve(event.newData);
      } else {
        this.status = 'danger';
        this.title = 'Error';
        this.content = response['message'];
        event.confirm.reject();
      }
      this.makeToast();
     });

  }

  onEditConfirm(event): void {
    let data = event.newData;
    let pk = data['id'];

    this.service.updateDevice(pk, data).subscribe(response => {
      if (response['status']){
        this.status = 'success';
        this.title = 'Listo';
        this.content = 'Dispositivo editado correctamente.';
        this.makeToast();
        event.confirm.resolve();
      } else {
        event.confirm.reject();
      }
    });
  }

  makeToast() {
    this.showToast(this.status, this.title, this.content);
  }

  private showToast(type: NbComponentStatus, title: string, body: string) {
    const config = {
      status: type,
      destroyByClick: this.destroyByClick,
      duration: this.duration,
      hasIcon: this.hasIcon,
      position: this.position,
      preventDuplicates: this.preventDuplicates,
    };
    const titleContent = title ? ` ${title}` : '';

    this.index += 1;
    this.toastrService.show(
      body,
      `${titleContent}`,
      config);
  }

}

@Component({
  selector: 'nb-dialog-showcase',
  templateUrl: './dialog.html',
  styles: ['nb-layout{width:100%;height:100%;}', 'div .nb-theme-default nb-layout.with-scroll .scrollable-container {height: 200px; max-height:200px; }'],
})
export class DialogComponent implements OnInit{

  icons = {
    1: {
      name:"Móvil",
      value:"mobile",
    },
    2: {
      name:"Cámara",
      value:"camera",
    },
    3: {
      name:"Puntero",
      value:"pointer",
    },
  };

  colors = {
    0: 'No Color',
    1: 'Azul',
    2: 'Verde',
    3: 'Naranja',
    4: 'Amarillo',
  }

  iconSelected = ""
  iconSelectedValue = null
  urlIconSelected = ""
  colorSelected = null
  inputName = ""
  textDescription = ""
  title = ""
  typeModal:number;
  parentComponent:TypeDeviceComponent;
  row = null;

  showToggle = false;
  stateToggle = false;

  loading;

  constructor(protected dialogRef: NbDialogRef<DialogComponent>) {
  }

  ngOnInit(): void {
    if(this.typeModal > 1){
      this.showToggle = true;
      if (this.iconSelected != ""){
        let temp_icon = this.iconSelected;
        let x = temp_icon.split('_');
        for(let i = 1; i < 4; i++){
          if (this.icons[i].value == x[0]){
            this.iconSelectedValue = i;
            break;
          }
        }
        this.colorSelected = x[1] != '' ? parseInt(x[1]) : 0;
        this.urlIconSelected ='/assets/icons/' + temp_icon + '.png';
      }
    }
  }

  onChangeIcon(event){
    if(event > 0){
      this.iconSelectedValue = event;
      this.iconSelected = this.icons[event].value;
      let icon = this.iconSelected + '.png';
      this.urlIconSelected = '/assets/icons/' + icon;
      this.colorSelected = 0;
    }
  }

  onChangeColor(event){
    if(this.iconSelected != ''){
      if (event > 0) {
        this.iconSelected = this.icons[this.iconSelectedValue].value + '_' + event;
        let icon = this.iconSelected + '.png';
        this.urlIconSelected = '/assets/icons/' + icon;
      } else {
        this.onChangeIcon(this.iconSelectedValue);
      }
    }
  }

  onAccept(event){
    this.loading = true;
    let errors = false;
    let name = "";
    let descrip = "";

    setTimeout(() => {
      this.loading = false;
      }, 4000
    );

    if (this.typeModal == 1) {
      if (undefined == this.inputName || "undefined" == ('' + this.inputName).trim() || !this.inputName) {
        this.parentComponent.status = 'warning';
        this.parentComponent.toast_title = 'Parece que no hay dato';
        this.parentComponent.toast_content = 'Lo sentimos, pero es necesario que proveas un nombre para la categoría a crear.';
        this.parentComponent.makeToast();
        errors = true;
      } else {
        name = this.inputName.trim();
      }
      if (!("undefined" == ('' + this.textDescription).trim())){
        descrip = this.textDescription.trim();
      }
      // console.log('errors', errors);
      if (!errors) {
        let data = {name: name, description: descrip, icon:this.iconSelected};
        this.parentComponent.getService().createDeviceType(data).subscribe(response => {
          if (response['status']){
            response['data']['state'] = true;

            //Incluir nueva fila y actualización de la tabla
            this.parentComponent.source.add(response['data']);
            this.parentComponent.source.refresh();

            this.parentComponent.status = 'success';
            this.parentComponent.toast_title = 'Registrado';
            this.parentComponent.toast_content = 'Categoría Dispositivo creada con exito!';
            this.parentComponent.makeToast();
            this.dialogRef.close(true);
            this.loading = false;
          }
        },
        error => {
          this.parentComponent.status = 'warning';
          this.parentComponent.toast_title = 'No puedes guardarlo';
          this.parentComponent.toast_content = error.error.message;
          this.parentComponent.makeToast();
        });
      }

    } else {
      if (undefined == this.inputName || "undefined" == ('' + this.inputName).trim() || !this.inputName) {
        this.parentComponent.status = 'warning';
        this.parentComponent.toast_title = 'Parece que no hay dato';
        this.parentComponent.toast_content = 'Lo sentimos, pero es necesario que proveas un nombre para la categoría a crear.';
        this.parentComponent.makeToast();
        errors = true;
      } else {
        name = this.inputName.trim();
      }
      if (!("undefined" == ('' + this.textDescription).trim())){
        descrip = this.textDescription.trim();
      }
      if (!errors) {
        let data = {name: name, description: descrip, icon:this.iconSelected, state: this.stateToggle};
        this.parentComponent.getService().updateDeviceType(this.row.data.id ,data).subscribe(response => {
          if (response['status']){
            //Incluir nueva fila y actualización de la tabla
            this.row.data.name=name;
            this.row.data.description=descrip;
            this.row.data.icon=this.iconSelected;
            this.row.data.state=this.stateToggle;
            this.parentComponent.source.refresh();

            this.parentComponent.status = 'success';
            this.parentComponent.toast_title = 'Registrado';
            this.parentComponent.toast_content = 'Categoría Dispositivo actualizada con exito!';
            this.parentComponent.makeToast();
            this.dialogRef.close(true);
            this.loading = false;
          }
        },
        error => {
          this.parentComponent.status = 'warning';
          this.parentComponent.toast_title = 'No puedes guardarlo';
          this.parentComponent.toast_content = error.error.message;
          this.parentComponent.makeToast();
        });
      }
    }
  }

  close(){
    this.dialogRef.close();
  }
}

