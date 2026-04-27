import { LocalDataSource } from 'angular2-smart-table';
import { DatePipe } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NbComponentStatus, NbDialogRef, NbDialogService, NbMenuService} from '@nebular/theme';
import { GeoportalService } from '../../../services/geoportal.service';
import { ToastService } from '../../../usable/toast.service';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'ngx-point',
  templateUrl: './point.component.html',
  styleUrls: ['./point.component.scss']
})
export class PointComponent implements OnInit {

  id: string
  process_id;
  title_component = 'Proceso de Carga de Puntos Geoportal';
  title_component_table = 'Lista de Procesos de Carga';
  name;
  description;
  fileName;
  loading = false;
  process;

  addresses;

  firstForm: FormGroup;
  formData;

  progress_value = 0;

  data = new LocalDataSource();

  // items = [
  //   {
  //     title:'Descargar Plantilla',
  //     data:"/assets/templates/PlantillaDireccionPuntos.xlsx",
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
      edit: false,
      delete: false,
      columnTitle: "Acciones",
    },
    edit: {
      editButtonContent: '<i class="nb-location" title="Continuar"></i>',
    },
    columns: {
      name: {
        title: 'Proyecto',
        type: 'string',
      },
      description: {
        title: 'Descripción',
        type: 'string',
      },
      created_by: {
        title: 'Hecho por',
        type: 'string',
      },
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
              {value:1, title:"Finalizado"},
              {value:2, title:"JSON Generado"},
              {value:3, title:"Error"},
            ]
          }
        },
        valuePrepareFunction: (value) => {
          switch(value){
            case 0:
              return 'Procesando Archivo';
            case 1:
              return 'Finalizado';
            case 2:
              return 'JSON Generado';
            case 3:
              return 'Error';
            default:
              return 'N/A'
          }
        }
      }
    },
  };

  constructor(
    public toastService: ToastService,
    private fb: FormBuilder,
    private service: GeoportalService,
    private dialogService: NbDialogService,
    private nbMenuService: NbMenuService,
  ) { }

  ngOnInit(): void {
    this.firstForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
    });

    this.loadData();
  }

  DownloadSheets() {
    const url = '/assets/templates/PlantillaDireccionPuntos.xlsx';
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'PlantillaDireccionPuntos.xlsx';
    anchor.click();
  }

  loadData(){
    this.service.listAddresses(true).subscribe(response => {
      if (response['status']){
        let data = [];
        response['data'].forEach(element => {
          element['created_by'] = element['created_by__first_name'] +
          ' ' +
          element['created_by__first_last_name'];
          data.push(element)
        });

        this.data.load(data);
      }
    }, error => {
      let toast_type:NbComponentStatus = "danger";
      this.toastService.showToast(toast_type, "Error", error.error.detail);
    });
  }

  onFirstSubmit() {
    if (this.fileName != null) {
      this.loading = true;
      let title = "Proceso de Carga de Direcciones Iniciado";
      let message = "El archivo se esta procesando";
      let toast_type: NbComponentStatus = "success";

      this.toastService.showToast(toast_type, title, message);
      this.service.loadAddresses(this.formData).subscribe(response => {
        if (response['status']) {
          if (this.process){
            clearInterval(this.process);
          }
          if (response['warning']){
            let title = "Aviso";
            let message = response['warning'];
            let toast_type:NbComponentStatus = 'warning';
            this.toastService.showToast(toast_type, title, message);
          }
          this.process_id = response['data']['id'];
          this.process = setInterval(() => {
            this.checkStatus(this.process_id);
          }, 5000);
          this.loading = false;

          this.data.add(
            response['data']
          )
          this.data.refresh();
        } else {
          toast_type = "danger";
          title = "Error";
          message = "No se logró cargar el archivo, intentalo de nuevo mas tarde";
          this.toastService.showToast(toast_type, title, message);
        }

      }, error => {
        let toast_type: NbComponentStatus = "danger";
        this.toastService.showToast(toast_type, "Error", error.error.detail);
        this.loading = false;
      });
      this.fileName = '';
    }
  }

  onFileSelected(event) {
    this.formData = new FormData();
    const file: File = event.target.files[0];

    if (file && this.name) {
      this.fileName = file.name;
      this.formData.append("name", this.name);
      if (this.description){
        this.formData.append("description", this.description);
      }
      this.formData.append("template", file);
      this.onFirstSubmit();
    } else {
    }
    this.fileName = null;
    this.name = '';
    this.description = '';

  }

  checkStatus(thread_id) {
    let data = { id: thread_id };
    this.service.checkStatus(data).subscribe(response => {
      if (response['status']) {

        if (this.process) {
          clearInterval(this.process);
        }

        this.addresses = response['data']['addresses'];

        let title = "Proceso de Carga Masiva Terminado";
        let message = "El archivo fue cargado exitosamente";
        let toast_type: NbComponentStatus = "success";

        this.toastService.showToast(toast_type, title, message);
        this.loading = false;

        setTimeout(() => { window.location.reload(); }, 500);

      } else {
        if (response['data']) {
          this.progress_value = Math.round(response['data']['processed'] / response['data']['total'] * 10000) / 100
        }
      }
    });
  }

  openAddressInfoDialog(data) {
    this.dialogService.open(AddressInfoDialogComponent, { context: { data: { title: "Información de Dirección", address: data, parentComponent: this, points: true } } });
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.loading) {
      if (this.process) {
        clearInterval(this.process);
      }
      $event.returnValue = true;
    }
  }
}


@Component({
  selector: 'ngx-role-dialog',
  templateUrl: './dialog.html',
  styles: ['nb-card-footer { text-align:end}', 'button {margin:5px}', 'nb-checkbox {margin:5px 0px}', '.info-address-modal{max-width: 800px;}', 'input {margin: 10px 0;}', '.success-val{color:#00d68f !important}', '.danger-val{color:#ff3d71 !important}']
})
export class AddressInfoDialogComponent implements OnInit{

  public data: {title:string, address?:{address, address_normalize, comment?, lat, lon, addressee, identification, id_number?,  phone, email, review}, parentComponent, points?}

  constructor(
   private dialogRef: NbDialogRef<AddressInfoDialogComponent>,
  ){ }

  ngOnInit(): void {
    if (this.data.address == undefined){
      this.data.parentComponent.toastService.showToast('warning', 'Oops! Ha ocurrido algo', 'Parece que no hemos podido mostrar correctamente la información de la dirección que seleccionaste, intentalo de nuevo.');
      this.dialogRef.close();
    }
  }

  close(){
    this.dialogRef.close();
  }
}
