import { Router } from '@angular/router';
import { ToastService } from './../../../usable/toast.service';
import { RoutingService } from './../../../services/routing.service';
import { NbComponentStatus, NbMenuService } from '@nebular/theme';
import { LocalDataSource } from 'angular2-smart-table';
import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'ngx-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit {

  source_complete: LocalDataSource = new LocalDataSource();
  source_incomplete: LocalDataSource = new LocalDataSource();

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
      editButtonContent: '<i class="nb-location" title="Continuar"></i>',
    },
    columns: {
      massive_file__date: {
        title: 'Fecha Subida',
        type: 'string',
        valuePrepareFunction: (date) => {
          var raw = new Date(date);

          var formatted = new DatePipe('en-EN').transform(raw, 'dd/MM/yyyy HH:mm:ss');
          return formatted;
        }
      },
      massive_file__success: {
        title: 'Subidas',
      },
      massive_file__error: {
        title: 'No subidas',
      },
      massive_file__amount: {
        title: 'Total Direcciones',
      },
      status:{
        title: 'Estado',
        filter: {
          type:'list',
          config:{
            selectText: 'Seleciona el estado',
            list:[
              {value:0, title:"Procesando Archivo"},
              {value:1, title:"Direcciones procesadas"},
              {value:2, title:"Generación de Rutas"},
              {value:3, title:"En espera de asignación"},
            ]
          }
        },
        valuePrepareFunction: (value) => {
          switch(value){
            case 0:
              return 'Procesando Archivo';
            case 1:
              return 'Direcciones procesadas';
            case 2:
              return 'Generación de Rutas';
            case 3:
              return 'En espera de asignación';
            default:
              return 'N/A'
          }
        }
      }
    },
  };

  settings_complete = {
    mode: 'external',
    pager: {
      display: true,
      perPage: 5,
    },
    actions:{
      add: false,
      delete: false,
      edit:false,
      columnTitle: "Acciones",
    },
    edit: {
      editButtonContent: '<i class="nb-alert danger" title="Ver Errores"></i>',
    },
    columns: {
      massive_file__date: {
        title: 'Fecha Subida',
        type: 'string',
        valuePrepareFunction: (date) => {
          var raw = new Date(date);

          var formatted = new DatePipe('en-EN').transform(raw, 'dd/MM/yyyy HH:mm:ss');
          return formatted;
        }
      },
      massive_file__amount: {
        title: 'Total Direcciones',
      },
      massive_file__error: {
        title: 'No subidas',
      },
      massive_file__success: {
        title: 'Subidas',
      }
    },
  };

  btn_create = this.onPermit(41);

  onPermit(id:number): Boolean {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['permission'].includes(id)) {
      return true;
    }
    return false;
  }

  constructor(
    private service:RoutingService,
    public toastService: ToastService,
    public router:Router,
    private nbMenuService: NbMenuService,
  ) { }

  ngOnInit(): void {

    this.nbMenuService.onItemClick()
      .pipe(
        filter(({ tag }) => tag === 'massive-file-context-menu'),
        map(({ item: { title, data } }) => [title, data]),
      )
      .subscribe(
        item => {
          if (item[0] === 'Descargar Plantilla'){
            window.open(item[1], '_blank');
          }
        }
      );

    this.service.getAllUploads().subscribe(response => {
      if (response['status']){
        this.source_complete.load(response['data']['complete']);
        this.source_incomplete.load(response['data']['incomplete']);
      }
    }, error => {
      let toast_type:NbComponentStatus = "danger";
      this.toastService.showToast(toast_type, "Error", error.error.detail);
    });

  }

  onEdit(event){
    var data = event.data;
    this.router.navigateByUrl("/pages/route/load?id="+data.massive_file_id)
  }

}
