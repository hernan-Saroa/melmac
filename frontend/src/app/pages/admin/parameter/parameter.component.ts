import { NbDialogService, NbDialogRef } from '@nebular/theme';
import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'angular2-smart-table';
import { ParameterService } from '../../../services/parameter.service';
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


export class CustomInputTextFilterComponentParameter extends DefaultFilter implements OnInit, OnChanges {
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
  selector: 'ngx-parameter',
  templateUrl: './parameter.component.html',
  styleUrls: ['./parameter.component.scss']
})
export class ParameterComponent implements OnInit {

  data: LocalDataSource = new LocalDataSource();
  list_values_parameter = [];

  settings = {
    mode: 'external',
    noDataMessage: 'Lista de parámetros vacía',
    actions:{
      columnTitle: "Acciones",
      add: false,
      edit: this.onPermit(57),
      delete: false,
    },
    edit: {
      editButtonContent: '<i class="nb-edit" itemprop="Editar"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmSave: true,
    },
    columns: {
      parameter__name: {
        title: 'Nombre',
        type: 'string',
        editable: false,
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentParameter,
        }
      },
      value: {
        title: 'Valor',
        type: 'string',
        valuePrepareFunction: function(cell, row) {
          return row.description;
        },
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentParameter,
        }
      },
    }
  };

  loading = false;

  constructor(
    private parameterService: ParameterService,
    public toastService: ToastService,
    private dialogService:NbDialogService,
  ) {
    this.parameterService.Parameterlist().subscribe(
      response => {
        this.list_values_parameter = response['data'];
        this.parameterService.list().subscribe(
          response => {
            if (response['status']) {
              let data = response['data']
              data.forEach(opt => {
                let param = this.list_values_parameter.filter(param => param.parameter_id == opt.parameter_id && param.value == opt.value)
                opt['description'] = param && param.length > 0 ? param[0]['description'] : '--'
              });
              this.data.load(data);
            }
          }
        );
      }
    );
  }

  ngOnInit(): void {}

  onPermit(id:number): Boolean {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['permission'].includes(id)) {
      return true;
    }
    return false;
  }

  onEdit(event):void {
    var data = event.data;
    const dialogRef = this.dialogService.open(ParameterDialogComponent, {context:{data: {title:"Editar Parámetro", parentComponent:this, parameter:data, row:event}}});
  }

}

@Component({
  selector: 'ngx-location-dialog',
  templateUrl: 'dialog.html',
  styles: ['nb-card-footer { text-align:end}', 'button {margin:5px}', 'nb-checkbox {margin:5px 0px}', 'nb-select {width:100%;}']
})
export class ParameterDialogComponent implements OnInit{

  id;
  parameter;
  type;
  value;
  list_values=[];

  public data: {title:string, parameter?:{id:number, parameter_id:number, parameter__name:string, value:string}, parentComponent: ParameterComponent, row?:any}

  loading;

  onPermit(id:number): Boolean {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['permission'].includes(id)) {
      return true;
    }
    return false;
  }

  constructor(
   public dialogRef: NbDialogRef<ParameterDialogComponent>,
   private parameterService: ParameterService,
   ){

  }
  ngOnInit(): void {
    if (this.data.parameter != undefined){
      this.id = this.data.parameter.id;
      this.parameter = this.data.parameter.parameter__name;
      this.type = this.data.parameter.parameter_id;
      this.value = this.data.parameter.value;
      let list_valuesI = this.data.parentComponent.list_values_parameter;
      list_valuesI.forEach(opt => {
        if (opt['parameter_id'] == this.type){
          this.list_values.push(opt)
        }
      });
    }
  }

  close(){
    this.dialogRef.close();
  }

  onAccept(event){

    this.loading = true;
    let data_form = {
      'value': this.value
    }

    this.parameterService.updateData(this.id, data_form).subscribe(
      response => {
        let param = this.data.parentComponent.list_values_parameter.filter(param => param.parameter_id == this.data.parameter.parameter_id && param.value == this.value)
        this.data.row.data.description = param && param.length > 0 ? param[0]['description'] : '--'
        this.data.row.data.value=this.value;
        this.data.parentComponent.data.refresh();
        this.data.parentComponent.toastService.showToast('success', 'Cambio realizado', 'Parámetro ha sido modificada exitosamente!');
        this.loading = false;
      },
      error => {
        this.data.parentComponent.toastService.showToast('danger', 'Oops! Ha ocurrido algo', error.error.detail);
        this.loading = false;
      }
    );

    this.dialogRef.close(true);
  }

}
