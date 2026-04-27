import { LocalDataSource } from 'angular2-smart-table';
import { AdminService } from '../../../services/admin.service';
import { Component, OnInit, Inject } from '@angular/core';
import { NbComponentStatus, NbDialogRef, NbDialogService, NbGlobalPhysicalPosition, NbGlobalPosition, NbToastrConfig, NbToastrService } from '@nebular/theme';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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


export class CustomInputTextFilterComponentPermit extends DefaultFilter implements OnInit, OnChanges {
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
  selector: 'ngx-permit',
  templateUrl: './permit.component.html',
  styleUrls: ['./permit.component.scss']
})
export class PermitComponent implements OnInit {

  settings = {
    noDataMessage: 'Lista de permisos vacía',
    actions:{
      columnTitle: "Acciones",
      add: false,
      delete: false,
      edit: this.onPermit(7)
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
        editable: false,
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentPermit,
        }
      },
      description: {
        title: 'Descripción',
        type: 'string',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentPermit,
        }
      },
    },
  };

  source: LocalDataSource = new LocalDataSource();


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

  load = true;

  constructor(private service:AdminService,
      private toastrService: NbToastrService,
    ) {
    this.service.getPermits().subscribe(response => {
      let permits = []
      if (response['status'])
        permits = response['data'];
      this.source.load(permits);
    });
  }

  ngOnInit(): void {
  }

  onEditConfirm(event): void {

    if (this.load) {
      this.load = false;

      // console.log("hola", event.newData)
      let list = Object.entries(event.newData);

      let permit_text = JSON.stringify(event.newData);
      let permit_data = JSON.parse(permit_text);

      this.service.updatePermit(permit_data, event.newData.id).subscribe(response => {
        if(response['status'] == true){
          this.status = 'success';
          this.title = 'Listo';
          this.content = 'Permiso editado correctamente.';
          this.makeToast();
          event.confirm.resolve();
          this.load = true;
        } else {
          event.confirm.reject();
        }
      });

      setTimeout(() => {
        this.load = true;
        }, 3000
      );
    } else {
      this.status = 'warning';
      this.title = 'Espera!';
      this.content = 'Se esta actualizando el registro.';
      this.makeToast();
    }
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
