import { LocalDataSource } from 'ng2-smart-table';
import { AdminService } from './../../../services/admin.service';
import { Component, OnInit, Inject } from '@angular/core';
import { NbComponentStatus, NbDialogRef, NbDialogService, NbGlobalPhysicalPosition, NbGlobalPosition, NbToastrConfig, NbToastrService } from '@nebular/theme';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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

export class CustomInputTextFilterComponent extends DefaultFilter implements OnInit, OnChanges {
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
  selector: 'ngx-role',
  templateUrl: './role.component.html',
  styleUrls: ['./role.component.scss']
})
export class RoleComponent implements OnInit {

  onPermit(id:number): Boolean {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['permission'].includes(id)) {
      return true;
    }
    return false;
  }

  constructor(private service:AdminService,
    private toastrService: NbToastrService, private dialogService :NbDialogService) {
      service.getRoles().subscribe(response => {
        if (response['status'])
          this.source.load(response['data']);
      });
    }

  ngOnInit(): void {
  }

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

  title = '';
  content = '';

  data;

  settings = {
    mode: 'external',
    noDataMessage: 'Lista de roles vacía',
    actions:{
      columnTitle: "Acciones",
      add: this.onPermit(10),
      edit: this.onPermit(11),
      delete: this.onPermit(12),
    },
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
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
      name: {
        title: 'Nombre',
        type: 'string',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponent,
        }
      },
      description: {
        title: 'Descripción',
        type: 'string',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponent,
        }
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

  loading = false;

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

  onCreate(event):void {
    const dialogRef = this.dialogService.open(RoleDialogComponent, {context:{data: {title:"Crear rol", type:1, parentComponent:this}}});
  }

  onEdit(event):void {
    // console.log(event);
    var data = event.data;
    const dialogRef = this.dialogService.open(RoleDialogComponent, {context:{data: {title:"Editar rol - " + data['name'], type:2, parentComponent:this, role:event.data, row:event}}});
  }

  onDeleteConfirm(event): void {
    const dialogRef = this.dialogService.open(ConfirmDialog, {context:{data:{title: 'Eliminar Rol - ' + event.data['name'], content: 'Estas seguro de eliminar este Rol?'}}});
    dialogRef.onClose.subscribe(result => {
      if (result == true) {
        this.service.deleteRole(event.data.id).subscribe(response => {
          if (response == null){
            this.status = 'success';
            this.title = 'Listo';
            this.content = 'Registro eliminado correctamente';
            //Eliminado y actualización de la tabla
            this.source.remove(event.data);
            this.source.refresh();
          }
          else if (response['status'] == true) {
            this.status = 'warning';
            this.title = 'Listo';
            this.content = response['message'];
            event.data['state'] = false;
            this.source.refresh();
            // event.confirm.resolve();

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

  public getService():AdminService{
    return this.service;
  }
}

@Component({
  selector: 'ngx-role-dialog',
  templateUrl: 'dialog.html',
  styles: ['nb-card-footer { text-align:end}', 'button {margin:5px}', 'nb-checkbox {margin:5px 0px}']
})
export class RoleDialogComponent implements OnInit{

  inputNameNgModel;
  descriptionNgModel;
  isAdminNgModel;
  viewAllNgModel;
  allNgModel;
  timeInit;
  timeEnd;

  public data: {title:string, type:number, role?:{id:number, name:string, description:string, is_admin:boolean, view_all:boolean, time_zone:string}, parentComponent: RoleComponent, row?:any}

  loading;

  constructor(
   public dialogRef: NbDialogRef<RoleDialogComponent>,
   ){

  }
  ngOnInit(): void {
    this.loadPermits();
    if (this.data.role != undefined){
      this.inputNameNgModel = this.data.role.name;
      this.descriptionNgModel = this.data.role.description;
      this.isAdminNgModel = this.data.role.is_admin;
      this.viewAllNgModel = this.data.role.view_all;
      let time = this.data.role.time_zone.split("*%*");
      this.timeInit = time[0]
      this.timeEnd  = time[1]
    }
  }

  status: boolean = false;

  permissions = []
  assigned = {}

  close(){
    this.dialogRef.close();
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

    switch(this.data.type){
      case 1:
        if (undefined == this.inputNameNgModel || "undefined" == ('' + this.inputNameNgModel).trim() || !this.inputNameNgModel){
          this.data.parentComponent.status = 'warning';
          this.data.parentComponent.title = 'Parece que no hay datos';
          this.data.parentComponent.content = 'Lo sentimos, pero es necesario que proveas un nombre para el rol a crear.';
          this.data.parentComponent.makeToast();
          errors = true;
        } else {
          name = this.inputNameNgModel.trim();
        }
        if (this.descriptionNgModel !== undefined && "undefined" != ('' + this.descriptionNgModel).trim()){
          descrip = this.descriptionNgModel.trim();
        }
        if (!errors) {
          let data = {
            name: name,
            description: descrip,
            permits: this.assigned,
            time_zone: this.timeInit + "*%*" + this.timeEnd,
            is_admin: this.isAdminNgModel != undefined ? this.isAdminNgModel : false,
            view_all: this.viewAllNgModel != undefined ? this.viewAllNgModel : false,
          };
          this.data.parentComponent.getService().createRole(data).subscribe(response => {
            // console.log(response);
            if (response['status']){
              response['data']['state'] = true;

              //Incluir nueva fila y actualización de la tabla
              this.data.parentComponent.source.add(response['data']);
              this.data.parentComponent.source.refresh();

              this.data.parentComponent.status = 'success';
              this.data.parentComponent.title = 'Registrado';
              this.data.parentComponent.content = 'Rol creado con exito!';
              this.data.parentComponent.makeToast();
              this.dialogRef.close(true);
              this.loading = false;
            }
          },
          error => {
            this.data.parentComponent.status = 'warning';
            this.data.parentComponent.title = 'No puedes crearlo';
            this.data.parentComponent.content = error.error.message;
            this.data.parentComponent.makeToast();
          });
        }
        break;
      case 2:
        if (undefined == this.inputNameNgModel || "undefined" == ('' + this.inputNameNgModel).trim() || !this.inputNameNgModel){
          this.data.parentComponent.status = 'warning';
          this.data.parentComponent.title = 'Parece que no hay datos';
          this.data.parentComponent.content = 'Lo sentimos, pero es necesario que proveas un nombre para el rol a crear.';
          this.data.parentComponent.makeToast();
          errors = true;
        } else {
          name = this.inputNameNgModel.trim();
        }
        if (this.descriptionNgModel !== undefined && "undefined" != ('' + this.descriptionNgModel).trim()){
          descrip = this.descriptionNgModel.trim();
        }
        if (!errors) {
          let assigned_true = []
          Object.entries(this.assigned).forEach(element => {
            if (element[1]) {
              assigned_true.push(element[0])
            }
          });
          let data = {
            name: name,
            description: descrip,
            permits: assigned_true,
            time_zone: this.timeInit + "*%*" + this.timeEnd,
            is_admin: this.isAdminNgModel,
            view_all: this.viewAllNgModel,
          };
          this.data.parentComponent.getService().updateRole(this.data.role.id, data).subscribe(response => {
            // console.log(response);
            if (response['status']){
              //Incluir actualización de datos en la fila y actualización de la tabla
              this.data.row.data.name=name;
              this.data.row.data.description=descrip;
              this.data.parentComponent.source.refresh();

              this.data.parentComponent.status = 'success';
              this.data.parentComponent.title = 'Cambio realizado';
              this.data.parentComponent.content = 'El registro ha sido modificado exitosamente!';
              this.data.parentComponent.makeToast();
              this.dialogRef.close(true);
              this.loading = false;
            }
          },
          error => {
            this.data.parentComponent.status = 'warning';
            this.data.parentComponent.title = 'No puedes guardarlo';
            this.data.parentComponent.content = error.error.message;
            this.data.parentComponent.makeToast();
          });
        }
        break;
      default:
        this.dialogRef.close(true);
    }
  }

  toggle(event, permit_id){
    // console.log(event, permit_id);
    if (event) {
      this.assigned[permit_id] = true;
    }else{
      this.assigned
      delete this.assigned[permit_id];
    }
    // console.log(this.assigned);
  }

  toggleAdmin(event){
    if (this.data.role != undefined){
      this.data.role.is_admin = event;
    }
  }

  toggleViewAll(event){
    if (this.data.role != undefined){
      this.data.role.view_all = event;
    }
  }

  toggleAll(event){
    this.assigned = {};
    if (event) {
      Object.keys(this.permissions).forEach(element => {
        this.permissions[element].forEach(permit => {
          this.assigned[permit['id']] = true;
        });
      });
    }
  }

  validAll(permissions) {
    let all = true;
    if (this.permissions.length != 0) {
      Object.keys(this.permissions).forEach(element => {
        this.permissions[element].forEach(permit => {
          if (!permissions.includes(permit['id'])) {
            all = false;
          }
        });
      });
    } else {
      setTimeout(() => {
        this.validAll(permissions);
      }, 500);
    }
    this.allNgModel = all;
  }

  private loadPermits(){
    this.data.parentComponent.getService().getPermitsGrouped().subscribe(response => {
      if (response['status']){
        this.permissions = response['data'];
      }else{
        this.data.parentComponent.status = 'danger';
        this.data.parentComponent.title = 'Ha ocurrido un problema';
        this.data.parentComponent.content = 'No pudimos cargar los datos de los permisos, codigo de error: XYZ';
        this.data.parentComponent.makeToast();
        this.dialogRef.close();
      }
    });
    if ([2,3].includes(this.data.type)){
      this.data.parentComponent.getService().getPermitsRole(this.data.role.id).subscribe(response => {
        // console.log(response);
        if (response['status']){
          for (let element of response['data'])
            this.assigned[element] = true;
          setTimeout(() => {
            this.validAll(response['data']);
          }, 200);
        }else{
          this.data.parentComponent.status = 'danger';
          this.data.parentComponent.title = 'Ha ocurrido un problema';
          this.data.parentComponent.content = response['detail'];
          this.data.parentComponent.makeToast();
          this.dialogRef.close(false);
        }
        // console.log(this.assigned);
      });
    }
  }

}


@Component({
  selector: 'confirm-dialog',
  templateUrl: 'confirm_dialog.html',
  styles: ['nb-card-footer { text-align:end}', 'button {margin:5px}']
})
export class ConfirmDialog {

  public data: {title:string, content:string}

  constructor(
   public dialogRef: NbDialogRef<RoleDialogComponent>, ){
  }

  close(response:boolean){
    this.dialogRef.close(response);
  }
}
