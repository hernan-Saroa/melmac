import { ToastService } from './../../../usable/toast.service';
import { LocalDataSource } from 'angular2-smart-table';
import { NbMenuService, NbComponentStatus, NbDialogService } from '@nebular/theme';
import { Component, OnInit } from '@angular/core';
import { filter, map } from 'rxjs/operators';
import { ErrorComponent } from '../error/error.component';
import { UserService } from '../../../services/user.service';

@Component({
    selector: 'ngx-masive',
    templateUrl: './masive.component.html',
    styleUrls: ['./masive.component.scss'],
    standalone: false
})
export class DeviceMassiveComponent implements OnInit {

  data;

  source: LocalDataSource = new LocalDataSource();

  fileName;

  // items=[
  //   {
  //     title:'Descargar Plantilla',
  //     data:"/assets/templates/PlantillaDispositivo.xlsx",
  //   }
  // ]

  settings = {
    mode: 'external',
    pager: {
      display: true,
      perPage: 5,
    },
    actions:{
      add: false,
      delete: false,
      columnTitle: "Acciones",
    },
    edit: {
      editButtonContent: '<i class="nb-alert danger" title="Ver Errores"></i>',
    },
    columns: {
      template: {
        title: 'Nombre Archivo',
        type: 'string',
      },
      progressbar: {
        title: 'Progreso',
        type: 'html',
        valuePrepareFunction: function(cell, row) {
          let progress = "prog-bar-";
          if (cell == 100){
            progress += "100";
          } else if (cell != 0) {
            progress += Math.floor(cell/10).toString() + "0";
          } else {
            progress += cell
          }
          return '<div class="progress-bar-back" title="'+cell+'%"><div class="progress-bar-front '+progress+'" max="100"></div></div>';
        },
        editable:false,
        filter:false,
        sort:false,
        hideSubHeader: true,
      },
      amount: {
        title: 'Total Registros',
      },
      error: {
        title: 'Errores',
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
              { value: true, title: 'Activo' },
              { value: false, title: 'Finalizado' },
            ],
          },
        }
      },
    },
  };


  onFileSelected(event){
    const file:File = event.target.files[0];

    if (file) {
        const formData = new FormData();

        formData.append("template", file);

        this.service.uploadMassiveUsers(formData).subscribe(response => {
          let title = "Proceso de Carga Masiva Iniciado";
          let message = "El archivo fue cargado exitosamente";
          let toast_type:NbComponentStatus = "success";
          if (response['status']){
            this.source.add(response['data']);
            this.source.refresh();
          } else {
            toast_type = "danger";
            title = "Error";
            message = "No se logró cargar el archivo, intentalo de nuevo mas tarde";
          }
          this.toast.showToast(toast_type, title, message);
        }, error => {
          let toast_type:NbComponentStatus = "danger";

          this.toast.showToast(toast_type, "Error", error.message);
        });
    }

    this.fileName = null;

  }

  checkErrors(event){
    this.dialog.open(ErrorComponent, {context:{data:{id: event.data['id']}}});
  }

  constructor(private nbMenuService: NbMenuService, private service: UserService, private toast:ToastService, private dialog:NbDialogService) {
    this.service.getMassiveUsers().subscribe(response => {
      if (response['status']){
        this.data = [];
        response['data'].forEach(element => {
          element['progressbar'] = (element['success'] + element['error'])*100/ element['amount'];
          this.data.push(element);
        });
        this.source.load(this.data);
      }
    });
  }

  DownloadSheets() {
    const url = '/assets/templates/PlantillaDispositivo.xlsx';
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'PlantillaDispositivo.xlsx';
    anchor.click();
  }

  ngOnInit(): void {
    // this.nbMenuService.onItemClick()
    //   .pipe(
    //     filter(({ tag }) => tag === 'massive-file-context-menu'),
    //     map(({ item: { title, data } }) => [title, data]),
    //   )
    //   .subscribe(
    //     item => {
    //       if (item[0] === 'Descargar Plantilla'){
    //         window.open(item[1], '_blank');
    //       }
    //     }
    //   );
  }

}
