import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../usable/toast.service';
import { PlataformService } from '../../services/plataform.service';

@Component({
  selector: 'ngx-plataform',
  templateUrl: './plataform.component.html',
  styleUrls: ['./plataform.component.scss']
})
export class PlataformComponent implements OnInit {
  
  data;
  settings = {
    noDataMessage: 'Sin valores',
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
    edit: {
      editButtonContent: '<i class="nb-edit"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmSave: true,
    },
    columns: {
      name: {
        title: 'Nombre',
        type: 'string',
        editable: false,
      },
      value: {
        title: 'Valor',
        type: 'string',
      },
    },
  };
  load = true;

  constructor(
    private plataformService:PlataformService,
    private toastService: ToastService,
  ) {
    this.plataformService.list().subscribe(
      response => {
        if (response['status']) {
          this.data = response['data'];
        }
      }
    );
  }

  ngOnInit(): void {
  }

  onEditConfirm(event): void {
    if (this.load) {
      this.load = false;

      if (event.newData.value != '') {
        let data = { 'value': event.newData.value };
        this.plataformService.updateData(event.newData.id, data).subscribe(
          response => {
            if (response['status']) {
              this.toastService.showToast('success', 'Listo', 'Valor editado correctamente.');
              event.confirm.resolve();
            }
            this.load = true;
          }
        );
      } else {
        this.toastService.showToast('warning', 'Error', 'El valor no puede estar vacio!');
      }
    }
  }
}
