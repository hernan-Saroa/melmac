import { Component, OnInit } from '@angular/core';
import { LocalDataSource } from 'angular2-smart-table';
import { AnswerService } from '../../../services/answer.service';
import { FormService } from '../../../services/form.service';
import { ToastService } from '../../../usable/toast.service';

@Component({
    selector: 'ngx-form-answer',
    templateUrl: './form-answer.component.html',
    styleUrls: ['./form-answer.component.scss'],
    standalone: false
})
export class FormAnswerComponent implements OnInit {

  source: LocalDataSource = new LocalDataSource();
  admin_list = [];

  file_name;
  user = '';
  form_name = '';

  loading = false;

  settings = {
    mode: 'external',
    pager: {
      display: true,
      perPage: 10,
    },
    actions:{
      add: false,
      edit: false,
      delete: false,
      columnTitle: "Acciones",
    },
    edit: {
      editButtonContent: '<i class="nb-alert danger" title="Ver Errores"></i>',
    },
    columns: {
      name_user: {
        title: 'Empresa',
        type: 'string',
      },
      amount: {
        title: 'Total Registros',
      },
      success: {
        title: 'Registrados',
      },
      status: {
        title: 'Estado',
        valuePrepareFunction: function(cell, row) {
          if (cell == 0) {
            return 'Activo';
          } else {
            return 'Finalizado';
          }
        },
        editor: false,
        filter: {
          type: 'list',
          config: {
            selectText: 'Seleciona el estado',
            list: [
              { value: 0, title: 'Activo' },
              { value: 1, title: 'Finalizado' },
            ],
          },
        }
      },
    },
  };

  constructor(
    // private formService:FormService,
    private answerService:AnswerService,
    private toastService: ToastService,
  ) {
    this.answerService.get_admin().subscribe(
      response => {
        // console.log(response);
        this.admin_list = response['data'];
      }
    );

    this.answerService.getMassiveAnswer().subscribe(
      response => {
        // console.log(response);
        this.source.load(response['data']);
      }
    );

  }

  ngOnInit(): void {
  }

  onSelect(value) {
    this.user = value;
    // console.log('value');
    // console.log(value);
  }

  onInput(value) {
    this.form_name = value;
    // console.log('value');
    // console.log(value);
  }

  onFileSelected(event){
    const file:File = event.target.files[0];
    if (this.form_name != '' && this.user != '') {
      this.loading = true;
      if (file) {
          const formData = new FormData();
          formData.append("template", file);
          formData.append("user", this.user);
          formData.append("form", this.form_name);

          this.answerService.uploadMassiveAnswer(formData).subscribe(response => {
            if (response['status']){
              this.form_name = '';
              this.user = '';
              this.source.add(response['data']);
              this.source.refresh();
              this.toastService.showToast('success', 'Subida Masiva', 'Proceso iniciado.');
              this.loading = false;
            } else {
              this.toastService.showToast('danger', 'Error!', 'Algo salió mal, verifica el archivo.');
              this.loading = false;
            }
          }, error => {
            this.toastService.showToast('danger', 'Error!', 'Algo salió mal, verifica el archivo.');
            this.loading = false;
          });
      } else {
        this.loading = false;
      }
    } else {
      this.toastService.showToast('warning', 'Datos incompletos!', 'Ingresa todos los parámetros.');
      this.loading = false;
    }


  }

}
