import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EnterpriseService } from '../../../services/enterprise.service';
import { ToastService } from '../../../usable/toast.service';

@Component({
    selector: 'ngx-attempts',
    templateUrl: './attempts.component.html',
    styleUrls: ['./attempts.component.scss'],
    standalone: false
})
export class AttemptsComponent implements OnInit {

  load=false
  data;
  field_type_list=[];
  id;

  settings = {
    hideSubHeader: false,
    pager: {
      display: true,
      perPage: 10,
    },
    actions:{
      columnTitle: "Acciones",
      add: true,
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
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },
    columns: {
      field_type_id: {
        title: 'Campo',
        editable: false,
        filter: false,
        valuePrepareFunction: (value) => {
          return this.field_type_list.filter(theme => theme.value == value).map(theme => theme.title)[0];
        },
        editor: {
          type: 'list',
          config: {
            selectText: 'Seleciona un campo',
            list: [],
          },
        },
      },
      attempts: {
        title: 'Intentos',
        type: 'number',
        filter: false,
      },
      description: {
        title: 'Descripción',
        type: 'string',
        filter: false,
      },
    },
  };

  constructor(
    private enterpriseService:EnterpriseService,
    private activatedRoute: ActivatedRoute,
    private toastService: ToastService
  ) {
    this.id = this.activatedRoute.snapshot.paramMap.get('id');
    this.enterpriseService.getAttempts(this.id).subscribe(
      response => {
        this.data = response['data'];
        response['fields'].forEach(theme => {
          this.field_type_list.push({value: theme['id'], title: theme['name']});
        });
        if(this.data.length == this.field_type_list.length) {
          this.settings.hideSubHeader = true;
        }
        this.settings.columns.field_type_id.editor.config.list = this.field_type_list
        this.settings = Object.assign({}, this.settings);
      }
    );
  }

  ngOnInit(): void {

  }

  onCreateConfirm(event): void {
    let attemps_text = JSON.stringify(event.newData);
    let attemps_data = JSON.parse(attemps_text);
    let exist_type_field = this.data.find(x => x['field_type_id'] == attemps_data['field_type_id'])
    if(exist_type_field) {
      this.toastService.showToast('warning', 'Atención', `Para el campo ${exist_type_field['name']} ya existe una configuración`);
      return;
    }
    attemps_data['enterprise_id'] = this.id
    this.enterpriseService.saveAttempts(attemps_data).subscribe(response => {
      if(response['status']) {
        this.toastService.showToast('success', 'Listo', 'Configuración creada');
        event.newData['id'] = response['data']['id'];
        event.newData['enterprise_id'] = attemps_data['enterprise_id'];
        event.newData['creation_date'] = response['data']['creation_date'];
        event.confirm.resolve(event.newData);
        setTimeout(() => {
          if(this.data.length == this.field_type_list.length) {
            this.settings.hideSubHeader = true;
            this.settings = Object.assign({}, this.settings);
          }
        }, 200);
      } else {
        this.toastService.showToast('danger', 'Error', 'Intentalo de nuevo');
      }
    })
  }

  onEditConfirm(event): void {
    let attemps_text = JSON.stringify(event.newData);
    let attemps_data = JSON.parse(attemps_text);
    this.enterpriseService.saveAttempts(attemps_data).subscribe(response => {
      this.toastService.showToast('success', 'Listo', 'Configuración actualizada');
      event.confirm.resolve();
    })
  }

}
