import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { LocalDataSource } from 'angular2-smart-table';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ApisConfigService } from '../../../services/apis-config.service';
import { ToastService } from '../../../usable/toast.service';

@Component({
    selector: 'ngx-apis-config-detail',
    templateUrl: './apis-config-detail.component.html',
    styleUrls: ['./apis-config-detail.component.scss'],
    standalone: false
})
export class ApisConfigDetailComponent implements OnInit {

  @Input() dataSelected: any;
  @Input() viewCode: boolean;
  @Input() user_hash: string;
  @Output() back: EventEmitter<boolean> = new EventEmitter<boolean>();
  @ViewChild('autoInputForm') inputForm;

  dataParams = new LocalDataSource();
  dataResponse = new LocalDataSource();

  codePre;
  codeString
  
  options: any[];
  filteredOptions$: Observable<any[]>;

  inputAutocomplete
  form_selected_id;
  form_selected_name;

  domain = ''
  loading = true
  isAdmin = false;

  settings = {
    noDataMessage: 'Datos no encontrados',
    pager: {
      display: false,
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
      param: {
        title: 'Parámetro',
        type: 'string',
        filter: false
      },
      type: {
        title: 'Tipo',
        filter: false,
        editor: {
          type: 'list',
          config: {
            selectText: 'Seleccione ...',
            list: [
              { value: 'string', title: 'String' },
              { value: 'file(base64)', title: 'File(base64)' },
              { value: 'number', title: 'Number' },
              { value: 'email', title: 'Email' },
            ],
          },
        }
      },
      required: {
        title: 'Requerido',
        filter: false,
        valuePrepareFunction: (value) => {
          return value ? 'Si' : 'No';
        },
        editor: {
          type: 'list',
          config: {
            selectText: 'Seleccione ...',
            list: [
              { value: true, title: 'Si' },
              { value: false, title: 'No' }
            ],
          },
        }
      },
      value: {
        title: 'Valor',
        type: 'string',
        filter: false,
        editable: false,
        addable: false,
      },
      description: {
        title: 'Descripción',
        type: 'string',
        filter: false
      }
    }
  }

  constructor(
    private apisConfigService: ApisConfigService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.form_selected_id = undefined;
    this.form_selected_name = undefined;
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['role'] == 1) {
      this.isAdmin = true;
      this.form_selected_id = 'N/A'
      this.form_selected_name = 'N/A'
      this.getParams();
    } else {
      if(this.dataSelected.service_type == 2) {
        this.form_selected_id = 'N/A'
        this.getParams();
      } else {
        this.getForms();
      }
    }
    let protocol = window.location.protocol
    let hostname = window.location.hostname;
    let port = window.location.port;
    let domain = protocol + '//' + hostname;
    if (port) domain += ':' + port
    this.domain = domain + '/';
  }

  getParams() {
    this.loading = true;
    this.apisConfigService.getApisConfigParams(this.dataSelected.id).subscribe((response) => {
      let dataParams = []
      let dataResponse = []
      dataParams.push({
          "param": "user_hash",
          "type": "string",
          "param_type": 1,
          "description": "Usuario con permisos para acceder a este servicio",
          "required": true,
          "value": this.user_hash,
      })
      dataParams.push({
        "id": 4,
        "param": "form_hash",
        "type": "string",
        "param_type": 1,
        "description": "Formulario para realizar la firma",
        "required": true,
        "value": this.form_selected_id,
    })
      response['data'].forEach(element => {
        if (element['param_type'] == 1) {
          dataParams.push(element);
        } else {
          dataResponse.push(element);
        }
      });
      this.settings.noDataMessage = 'Datos no encontrados';
      this.settings = Object.assign({}, this.settings);
      this.dataParams.load(dataParams);
      this.dataResponse.load(dataResponse);
      this.loading = false;
      this.clearEdit();
      if(this.dataSelected.service_type == 1) {
        this.getJson();
      } else if(this.dataSelected.service_type == 2) {
        this.getHtml();
      }
    });
  }

  clearEdit(){
    if(this.dataSelected.service_type == 1) {
      let count = 0;
      let interval = setInterval(() => {
        try {
          let table = document.getElementById('table-data-params');
          let trAll = table.querySelectorAll('table > tbody > tr')
          for (let i = 0; i < trAll.length; i++) {
            let tdall = trAll[i].querySelectorAll('td')
            for (let j = 0; j < tdall.length; j++) {
              let div = tdall[j].querySelectorAll('angular2-smart-table-cell > table-cell-view-mode > div > div')
              if (div.length > 0 && ['user_hash', 'form_hash'].includes(div[0].textContent)) {
                let row1 = tdall[0].querySelectorAll('td > ng2-st-tbody-edit-delete')
                if (row1.length > 0) {
                  row1[0].removeChild(row1[0].firstChild);
                }
              }
            }
          }
          clearInterval(interval);
        } catch (error) {
          console.error(error);
        }
        // maximo espera 10 segundos
        if (count > 100) clearInterval(interval);
        count++;
      },100);
    }
  }

  getForms() {
    let field_type = 0;
    switch (parseInt(this.dataSelected.service)) {
      case 1: // Firna Manuscrita
        field_type = 7;
        break;
      case 2: // Firma Biofacial
        field_type = 10;
        break;
      case 3: // Firma Cédula
        field_type = 18;
      case 4: // Firma OTP
        field_type = 22;
        break;
    }
    if (field_type == 0) {
      this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error al obtener los formularios, intenta mas tarde.');
      this.loading = false;
      return
    }
    this.apisConfigService.getApisConfigForms(field_type, this.dataSelected.enterprise_id).subscribe((response) => {
      if(response['status']) {
        this.options = []
        response['data'].forEach(element => {
          this.options.push({id: element['id'], name: element['name']});
        });
        this.filteredOptions$ = of(this.options);
      }
      this.loading = false;
    });
  }

  private filter(value){
    const filterValue = value.toLowerCase();
    let list_user_filer = this.options.filter(option => option.name.toLowerCase().includes(filterValue));
    return list_user_filer;
  }

  getFilteredOptions(value): Observable<any[]> {
    return of(value).pipe(
      map(filterString => this.filter(filterString)),
    );
  }

  onChange() {
    this.filteredOptions$ = this.getFilteredOptions(this.inputForm.nativeElement.value);
  }

  onSelectionChange($event) {
    this.inputAutocomplete = $event.name;
    if ($event.id != undefined && $event.id != this.form_selected_id) {
      this.form_selected_name = $event.name;
      this.form_selected_id = $event.id;
      this.getParams()
    }
  }

  onCreateConfirm(event, type) {
    let str_data = JSON.stringify(event.newData);
    let api_data = JSON.parse(str_data);
    api_data['apis_config_id'] = this.dataSelected.id;
    api_data['param_type'] = type;
    this.apisConfigService.createApisConfigParams(api_data).subscribe((response) => {
      if (response['status'] == true) {
        this.toastService.showToast('success', 'Listo', 'Se ha guardado correctamente.');
        event.newData['id'] = response['data']['id'];
        event.confirm.resolve(event.newData);
        if (type == 1) {
          this.clearEdit();
        }
        if(this.dataSelected.service_type == 1) {
          this.getJson();
        } else if(this.dataSelected.service_type == 2) {
          this.getHtml();
        }
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
    this.apisConfigService.updateApisConfigParams(api_data).subscribe((response) => {
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

  onPermit(): Boolean {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['role'] == 1) {
      return true;
    }
    return false;
  }

  getService(service) {
    switch (parseInt(service)) {
      case 1:
        return 'bio'
      case 2:
        return 'doc'
      case 3:
        return 'otp'
      case 4:
        return 'manuscrita'
      default:
        return 'error'
    }
  }

  onBack() {
    if (this.viewCode) {
      this.clearEdit()
      this.viewCode = false;
    } else {
      this.back.emit();
    }
  }

  viewCodeClick(){
    this.viewCode = true;
  }

  copyCode() {
    this.toastService.showToast('success', 'Listo', 'Código copidado correctamente.');
  }

  getJson(){
    let formdata = []
    this.dataParams.getAll().then(data => {
      data.forEach(element => {
        formdata.push({
          "key": element.param,
          "value": element.value ?? '',
          "description": `(${element.type}) ${element.description ?? ''}`,
          "type": "text"
        })
      });
    });
    this.codePre = {
      "name": this.dataSelected.name,
      "request": {
        "auth": {
          "type": "noauth"
        },
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": `Token ${this.dataSelected.token}`,
            "type": "text"
          }
        ],
        "body": {
          "mode": "formdata",
          "formdata": formdata
        },
        "url": {
          "raw": `${this.domain}${this.dataSelected.url}`,
          "host": [
            `${this.domain}`
          ],
          "path": this.dataSelected.url.split('/')
        }
      },
      "response": []
    }
    this.codeString = JSON.stringify(this.codePre);
  }

  getHtml(){
    const urlIframe = `${this.domain}public/servicies/sign/${this.getService(this.dataSelected.service)}/_token_/_hash_`;
    this.codePre = `<iframe width="100%" height="250px" src="${urlIframe}" frameborder="0" allow="allow-same-origin; camera; microphone"></iframe>`;
    this.codeString = this.codePre;
  }

}

