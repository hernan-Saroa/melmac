import { Component, OnInit, TemplateRef } from '@angular/core';
import { FormService } from '../../../services/form.service';
import { ToastService } from '../../../usable/toast.service';
import { LocalDataSource } from 'ng2-smart-table';
import { ActivatedRoute, Router } from '@angular/router';
import { NbDialogRef, NbDialogService } from '@nebular/theme';

@Component({
  selector: 'ngx-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit {
  option_form;
  id:string;
  data = new LocalDataSource();
  loading = false;
  // data_consecutive = new LocalDataSource();
  inactive = false;
  inactiveSend = true;
  totDoc;
  doc_count;

  settings = {
    mode: 'external',
    noDataMessage: 'Datos no encontrados',
    pager: {
      display: true,
      perPage: 10,
    },
    actions:{
      columnTitle: "Acciones",
      custom: this.onPermit(),
      add: false,
      edit: false,
      delete: false
    },
    columns: {
      id: {
        title: '#',
        type: 'string',
      },
      name: {
        title: 'Nombre',
        type: 'string',
      },
      description: {
        title: 'Descripción',
        type: 'html',
        valuePrepareFunction: function(cell, row) {
          return '<div title ="' + cell + '">' + (cell.length > 50 ? cell.slice(0,50) + '...' : cell) + '</div>';
        }
      },
      consecutive: {
        title: 'Tipo',
        valuePrepareFunction: function(cell, row) {
          if (cell == false) {
            return 'Individual';
          } else {
            return 'Serie';
          }
        },
        filter: {
          type: 'list',
          config: {
            selectText: 'Seleccionar',
            list: [
              { value: false, title: 'Individual' },
              { value: true, title: 'Serie' },
            ],
          },
        },
      },
      digital: {
        title: 'Plantilla',
        valuePrepareFunction: function(cell, row) {
          if (cell == true) {
            return 'Con plantilla';
          } else {
            return 'Sin plantilla';
          }
        },
        filter: {
          type: 'list',
          config: {
            selectText: 'Seleccionar',
            list: [
              { value: true, title: 'Con plantilla' },
              { value: false, title: 'Sin plantilla' },
            ],
          },
        },
      },
      creation_date: {
        title: 'Fecha Creación',
        valuePrepareFunction: function(cell, row) {
          let date = new Date(cell);
          return date.toLocaleString();
        },
        filterFunction: (cell, filter) => {
          let date = new Date(cell);
          return date.toLocaleString().includes(filter);
        }
      }
    }
  };

  onPermit(): any[] {
    // Editar
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    let buttons = [];
    // Diligenciar
    this.activatedRoute.data.subscribe(data => {
      if (data['inactive']) {
        if (user_data['permission'].includes(16)) {
          buttons.push({
            name: 'reactivate',
            title: '<i title="Reactivar" class="nb-checkmark-circle"></i>'
          })
        }
      } else {
        if (user_data['permission'].includes(30)) {
          buttons.push({
            name: 'answer',
            title: '<i title="Diligenciar" class="nb-compose"></i>'
            // title: '<i class="ion-forward"></i>'
          })
        }
        if (user_data['permission'].includes(34)) {
          buttons.push({
            name: 'associate',
            title: '<i title="Acceso" class="nb-person"></i>'
          })
          buttons.push({
            name: 'link',
            title: '<i title="Compartir" class="nb-shuffle"></i>'
            // Estos ninguno sirve
            // title: '<nb-icon icon="star"></nb-icon>'
            // title: '<i class="fa-solid fa-link-simple"></i>'
            // title: '<ion-icon name="link-outline"></ion-icon>'
            // title: '<nb-icon class="link-outline"></nb-icon>'
            // title: '<i itemprop="Enlace" class="far fa-link custom_icon_action"></i>'
            // Este si
            // title: '<i itemprop="Enlace" class="fa fa-link ng-star-inserted custom_icon_action"></i>'
          })
        }
        if (user_data['permission'].includes(16)) {
          buttons.push({
            name: 'edit',
            title: '<i title="Editar" class="nb-edit"></i>'
          })
        }
        if (user_data['permission'].includes(15)) {
          buttons.push({
            name: 'clone',
            title: '<i title="Clonar" class="nb-layout-two-column"></i>'
          })
        }
        if (user_data['permission'].includes(17)) {
          buttons.push({
            name: 'delete',
            title: '<i title="Eliminar" class="nb-trash"></i>'
          })
        }
      }
    });
    return buttons;
  }

  constructor(
    private router: Router,
    private formService:FormService,
    private dialogService :NbDialogService,
    private toastService: ToastService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.activatedRoute.data.subscribe(data => {
      if (data['inactive']) {
        this.inactive = data['inactive'];
      }
    });
    if (this.inactive) {
      this.inactiveSend = false
      this.formService.list_state(0).subscribe(
        response => {
          if (response['status']){
            this.data.load(response['data']);
          }
        }
      );
      this.data.onChanged().subscribe((changes) => {
        setTimeout(() => {
            this.totDoc = this.data['data'].length;
            this.doc_count = this.data['filteredAndSorted'].length;
        }, 200);
      })
    } else {
      this.inactiveSend = true
      this.formService.list().subscribe(
        response => {
          if (response['status']){
            this.data.load(response['data']);
          }
        }
      );
      this.data.onChanged().subscribe((changes) => {
        setTimeout(() => {
            this.totDoc = this.data['data'].length;
            this.doc_count = this.data['filteredAndSorted'].length;
        }, 200);
      })
    }
  }

  onCustom(event) {
    if (event.data.consecutive) {
      if (event.action == 'answer') {
        this.router.navigate(['/pages/form/consecutive/answer/' + event.data.id, {}]);
      } else if (event.action == 'edit') {
        this.router.navigate(['/pages/form/consecutive/update/' + event.data.id, {}]);
      } else if (event.action == 'associate' || event.action == 'link') {
        this.router.navigate(['/pages/form/associate/' + event.data.id + '/' + event.action, {}]);
      } else if (event.action == 'clone') {
        this.cloneForm(this.data, event);
      } else if (event.action == 'delete') {
        this.deleteForm(this.data, event);
      } else if (event.action == 'reactivate') {
        this.reactiveForm(this.data, event);
      }
    } else {
      if (event.action == 'answer') {
        if (event.data.digital) {
          this.router.navigate(['/pages/form/digital/answer/' + event.data.id, {}]);
        } else {
          this.router.navigate(['/pages/form/answer/' + event.data.id, {}]);
        }
      } else if (event.action == 'edit') {
        this.router.navigate(['/pages/form/update/' + event.data.id, {}]);
      } else if (event.action == 'associate' || event.action == 'link') {
        this.router.navigate(['/pages/form/associate/' + event.data.id + '/' + event.action, {}]);
      } else if (event.action == 'clone') {
        this.cloneForm(this.data, event);
      } else if (event.action == 'delete') {
        this.deleteForm(this.data, event);
      } else if (event.action == 'reactivate') {
        this.reactiveForm(this.data, event);
      }
    }
  }

  cloneForm(data, event) {
    let data_content = {
      option: 'clone',
      title: 'Clonar - ' + event.data.name,
      content: 'Estas seguro de clonar este documento?',
      num_clone: 1,
    };
    const dialogRef = this.dialogService.open(ConfirmDialog, {
      context: {
        data: data_content
      }
    });
    dialogRef.onClose.subscribe(result => {
      if (result == true) {
        let form_data = {
          'clone': data_content.num_clone
        }
        this.formService.clone(event.data.id, form_data).subscribe(
          response => {
            if (response['status']){
              this.toastService.showToast('success', event.data.name, 'Se empezó el proceso de clonado, espera unos minutos y recarga la página.');
              this.loading = true;
              this.router.navigateByUrl('/RefrshComponent', {skipLocationChange: true}).then(()=> this.router.navigate(["/pages/form/view/"]));
            }
          }, error => {
            this.toastService.showToast('danger', 'Error', '¡Ha ocurrido un error, inténtalo más tarde!');
          }
        );
      }
    });
  }

  deleteForm(data, event) {
    const dialogRef = this.dialogService.open(ConfirmDialog,{
      context:{
        data: {
          option: 'delete',
          title: 'Eliminar - ' + event.data.name,
          content: 'Estas seguro de eliminar este documento?'
        }
      }
    });
    dialogRef.onClose.subscribe(result => {
      if (result == true) {
        this.formService.delete(event.data.id).subscribe(
          response => {
            if (response['status']){
              data.remove(event.data);
              data.refresh();
              this.toastService.showToast('success', event.data.name, 'Eliminado con exito.');
            }
          }, error => {
            this.toastService.showToast('danger', 'Error', 'No tienes permiso para realizar esta acción.');
          }
        );
      }
    });
  }

  reactiveForm(data, event) {
    const dialogRef = this.dialogService.open(ConfirmDialog,{
      context:{
        data: {
          option: 'reactive',
          title: 'Reactivar - ' + event.data.name,
          content: 'Estas seguro de reactivar este documento?'
        }
      }
    });
    dialogRef.onClose.subscribe(result => {
      if (result == true) {
        this.formService.activate(event.data.id).subscribe(
          response => {
            if (response['status']){
              data.remove(event.data);
              data.refresh();
              this.toastService.showToast('success', event.data.name, 'Reactivado con exito.');
            }
          }, error => {
            this.toastService.showToast('danger', 'Error', 'No tienes permiso para realizar esta acción.');
          }
        );
      }
    });
  }

  ngOnInit() {
  }

  onEraser() {
    this.router.navigate(['/pages/form/inactive']);
  }

  onSend() {
    this.router.navigate(['/pages/form/send']);
  }

  onForm() {
    this.router.navigate(['/pages/form/view']);
  }
}

// Delete
@Component({
  selector: 'confirm-dialog',
  template: `
    <nb-card>
      <nb-card-header>
        <h4>{{data.title}}</h4>
      </nb-card-header>
      <nb-card-body>
        <div *ngIf="data.option == 'clone'">
          <label class="label" for="input-clone">Cantidad</label>
          <input id="input-clone" type="number" min="1" max="10" nbInput fullWidth placeholder="Cantidad" [(ngModel)]="data.num_clone" style="margin: 5px 0;">
        </div>
        <div style="margin: 5px 0;">
          {{data.content}}
        </div>
      </nb-card-body>
      <nb-card-footer>
        <button nbButton (click)="close(false)">Cancelar</button>
        <button nbButton [status]="data.option ? 'primary' : 'danger'"
          [disabled]="data.option == 'clone' && (data.num_clone < 1 || data.num_clone > 10)"
          (click)="close(true)"
          cdkFocusInitial color="warn">
          Aceptar
        </button>
      </nb-card-footer>
    </nb-card>`,
  styles: ['nb-card-footer { text-align:end}', 'button {margin:5px}']
})
export class ConfirmDialog {
  public data: {
    option:string,
    title:string,
    content:string,
    num_clone?
  }
  constructor(
   public dialogRef: NbDialogRef<ConfirmDialog>, ){
  }
  close(response:boolean){
    this.dialogRef.close(response);
  }
}
