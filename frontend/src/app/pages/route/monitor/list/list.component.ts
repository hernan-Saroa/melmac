import { LocalDataSource } from 'angular2-smart-table';
import { Router } from '@angular/router';
import { ToastService } from './../../../../usable/toast.service';
import { Component, OnInit } from '@angular/core';
import { RoutingService } from '../../../../services/routing.service';

@Component({
  selector: 'ngx-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class MonitorListComponent implements OnInit {

  constructor(
    private service:RoutingService,
    public toastService: ToastService,
    public router:Router,
  ) { }

  source: LocalDataSource = new LocalDataSource();


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
      editButtonContent: '<i class="nb-layout-default" title="Monitorear"></i>',
    },
    columns: {
      name: {
        title: 'Nombre',
        type: 'string',
      },
      description: {
        title: 'Nombre',
        type: 'string',
      },
      location_quantity: {
        title: 'Cantidad de Direcciones',
        type: 'string',
      },
      process_state__name:{
        title: 'Estado',
        type: 'string',
      }
    },
  };


  ngOnInit(): void {
    this.service.getServices().subscribe(response => {
      if (response['status']){
        this.source.load(response['data']);
      }
    }, error => {
      this.toastService.showToast('danger', "Error", error.error.detail);
    });
  }


  onEdit(event){
    var data = event.data;
    this.router.navigateByUrl("/pages/route/monitor/"+data.service_id)
  }

}
