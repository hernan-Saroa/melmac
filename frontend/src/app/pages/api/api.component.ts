import { LocalDataSource } from 'angular2-smart-table';
import { NbSelectComponent } from '@nebular/theme';
import { EnterpriseService } from './../../services/enterprise.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'ngx-api',
    templateUrl: './api.component.html',
    styleUrls: ['./api.component.scss'],
    standalone: false
})
export class ApiComponent implements OnInit {

  @ViewChild("entSelect") selectRef : NbSelectComponent;

  loading = true;
  select_enterprise = [];
  user_ent = {};
  selected_enterprise;
  data;
  api_list;

  settings = {
    // mode: 'external',
    noDataMessage: 'Sin datos',
    sort:true,
    pager: {
      display: true,
      perPage: 10,
    },
    actions:{
      columnTitle: "Acciones",
      add: false,
      edit: true,
      delete: false,
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
    columns: {
      name: {
        title: 'Empresa',
        editable: false,
        type: 'string',
        valuePrepareFunction: function(cell, row) {
          if (cell != undefined){
            return cell;
          }
          return '';
        },
        filter:false
      },
      user__name: {
        title: 'Administrador',
        editable: false,
        type: 'html',
        filter: false,
      },
      api_id: {
        title: 'API',
        type: 'string',
        editable:false,
        filter: {
          type: 'list',
          config:{
            selectText: 'Selecciona la API',
            list: [],
          }
        },
        editor: {
          type: 'list',
          config:{
            selectText: 'Selecciona la API',
            list: [],
          }
        },
        valuePrepareFunction: function(cell, row) {
          return row['api__name'];
        },
      },
      limit: {
        title: 'Limite',
        type: 'number',
        filter: false,
      },
      state: {
        title: 'Estado',
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
    },
  };

  constructor(private ent_service:EnterpriseService, private service:ApiService) {
    service.getApiList().subscribe((response:any)=>{
      this.api_list = response.map((e)=>{
        return {value: e['id'], title: e['name']};
      });
    }, null, ()=>{
      if (this.api_list){
        this.settings.columns.api_id.editor.config.list = this.api_list;
        this.settings.columns.api_id.filter.config.list = this.api_list;
        this.settings = Object.assign({}, this.settings);
      }
    })
  }

  ngOnInit(): void {
    this.data = new LocalDataSource();

    this.ent_service.view().subscribe((response)=>{
      response['data'].forEach((e)=>{
        this.user_ent[e['enterprise_id']] = e['first_name'] + ' ' + e['first_last_name'];
        let name = e['enterprise__name'] != '' ? e['enterprise__name'] : 'Sin nombre'
        this.select_enterprise.push({
          id: e['enterprise_id'],
          name: name,
          user: {
            id: e['id'],
            name: e['first_name'] + ' ' + e['first_last_name'],
          }
        });
      });
      this.settings = Object.assign({}, this.settings);
      this.selectRef.selected = ['0'];
    }, null, ()=>{
      this.loading = false;
      this.filter();
    });
  }

  setValueEnterprise(event:any[]){
    if (event.includes("0")){
      this.selected_enterprise = null;
      this.selectRef.selected = ['0'];
    } else {
      this.selected_enterprise = event;
    }
  }

  filter(){
    this.loading = true;
    let temp_data = [];
    this.service.getApiEnterprise().subscribe((response)=> {
      if (response['status']){
        response['data'].forEach(element => {

          let ent_info = this.select_enterprise.filter((e)=> {
            // console.log(e['id'], element['enterprise_id'],'' + e['id'] == '' + element['enterprise_id'])
            return ''+e['id'] == ''+element['enterprise_id']
          });
          // console.log(ent_info);

          if (ent_info != undefined && ent_info.length > 0){
            // console.log('ADD ======================')
            element['name'] = element['enterprise_id'] + ' - ' + ent_info[0].name;
            element['user__name'] = ent_info[0].user.name;
            temp_data.push(element);
          }
        });
      }
    }, null, () => {
      if (this.selected_enterprise != null && this.selected_enterprise != undefined){
        temp_data = temp_data.filter((e)=>{
          return this.selected_enterprise.includes(''+e['enterprise_id']);
        });
      }
      this.data = Object.assign([], temp_data);
      this.loading = false;
    });

  }

  onEditConfirm(event){

  }
}
