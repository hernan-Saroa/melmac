import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { ApisConfigService } from '../../../services/apis-config.service';
import { ToastService } from '../../../usable/toast.service';
import { EnterpriseService } from '../../../services/enterprise.service';

@Component({
  selector: 'ngx-apis-config',
  templateUrl: './apis-config.component.html',
  styleUrls: ['./apis-config.component.scss']
})
export class ApisConfigComponent implements OnInit {

  data = new LocalDataSource();
  dataSelected = null
  viewCode = false
  user_hash = ''
  loading = true
  service_type_list = [
    { value: 1, title: 'API REST' },
    { value: 2, title: 'iFrame' },
  ];
  service_list = [
    { value: 1, title: 'Firma Biofacial' },
    { value: 2, title: 'Firma Cédula' },
    { value: 3, title: 'Firma OTP' },
    { value: 4, title: 'Firma Manuscrita' },
  ]
  listEnterprise = [];
  settings = {
    noDataMessage: 'Datos no encontrados',
    pager: {
      display: true,
      perPage: 20,
    },
    filter: false,
    actions: {
      columnTitle: "Acciones",
      add: this.onPermit(),
      edit: this.onPermit(),
      delete: false,
    },
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
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
    columns: {
      service_type: {
        title: 'Tipo de servicio',
        filter: false,
        valuePrepareFunction: (value) => {
          return this.service_type_list.filter(el => el.value == value).map(el => el.title)[0];
        },
        editor: {
          type: 'list',
          config: {
            selectText: 'Seleccione ...',
            list: [],
          },
        }
      },
      service: {
        title: 'Servicio',
        editable: true,
        filter: false,
        valuePrepareFunction: (value) => {
          return this.service_list.filter(el => el.value == value).map(el => el.title)[0];
        },
        editor: {
          type: 'list',
          config: {
            selectText: 'Seleccione ...',
            list: []
          },
        }
      },
      token: {
        title: 'Token',
        type: 'string',
        // editable: false,
        addable: false,
        filter: false,
      },
      name: {
        title: 'Nombre',
        type: 'string',
        filter: false,
      },
      url: {
        title: 'URL',
        type: 'string',
        filter: false,
        valuePrepareFunction: function(cell, row) {
          let port = window.location.port;
          let domain = window.location.protocol + '//' + window.location.hostname;
          if (port) domain += ':' + port
          domain += '/' + cell
          return domain;
        },
      },
      description: {
        title: 'Descripción',
        type: 'string',
        filter: false
      }
    }
  };

  constructor(
    private apisConfigService: ApisConfigService,
    private toastService: ToastService,
    private enterpriseService: EnterpriseService
  ) {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data && user_data['role'] == 1){
      this.enterpriseService.view().subscribe(
        response => {
          this.listEnterprise = [];
          response['data'].forEach(element => {
            let name = element['enterprise__name'];
            if (name == '') {
              name = `${element['first_name']} ${element['first_last_name']}`;
            }
            this.listEnterprise.push({value: element['enterprise_id'], title: name});
          });
          let enterprise = {
            title: 'Empresa',
            filter: false,
            valuePrepareFunction: (value) => {
              return this.listEnterprise.filter(el => el.value == value).map(el => el.title)[0];
            },
            editor: {
              type: 'list',
              config: {
                selectText: 'Seleccione ...',
                list: this.listEnterprise,
              },
            }
          }
          let news = {'enterprise_id': enterprise, ...this.settings.columns};
          this.settings.columns = news;
          this.settings = Object.assign({}, this.settings);
        }
      );
    }
    this.settings.columns.service_type.editor.config.list = this.service_type_list;
    this.settings.columns.service.editor.config.list = this.service_list;
    this.settings = Object.assign({}, this.settings);
  }

  ngOnInit() {
    let protocol = window.location.protocol
    let hostname = window.location.hostname;
    let port = window.location.port;
    this.getApisConfig();
  }

  getApisConfig() {
    this.apisConfigService.getApisConfig().subscribe((response) => {
      this.user_hash = response['user_hash'];
      this.data.load(response['data']);
      this.loading = false;
    });

  }
  onCreateConfirm(event) {
    let str_data = JSON.stringify(event.newData);
    let api_data = JSON.parse(str_data);
    this.apisConfigService.createApisConfig(api_data).subscribe((response) => {
      if (response['status'] == true) {
        this.toastService.showToast('success', 'Listo', 'Se ha guardado correctamente.');
        event.newData['id'] = response['data']['id'];
        event.newData['token'] = response['data']['token'];
        event.confirm.resolve(event.newData);
      } else {
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      }
    }, error => {
      console.error(error);
      this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
    });
  }

  onEditConfirm(event) {
    let str_data = JSON.stringify(event.newData);
    let api_data = JSON.parse(str_data);
    this.apisConfigService.updateApisConfig(api_data).subscribe((response) => {
      if (response['status'] == true) {
        this.toastService.showToast('success', 'Listo', 'Se ha actualizado correctamente.');
        event.newData['id'] = response['data']['id'];
        event.confirm.resolve(event.newData);
      } else {
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      }
    }, error => {
      console.error(error);
      this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
    });
  }

  onRowSelect(event): void {
    this.dataSelected = event.data;
    this.dataSelected['service_type_name'] = this.service_type_list.find(el => el.value == this.dataSelected.service_type).title
  }

  onBack() {
    if (this.viewCode) {
      this.viewCode = false
    } else {
      this.dataSelected = null
    }
  }

  viewCodeClick() {
    this.viewCode = true
  }

  onPermit(): Boolean {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['role'] == 1) {
      return true;
    }
    return false;
  }

}
