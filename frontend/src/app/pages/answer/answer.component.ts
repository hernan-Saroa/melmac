import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService } from '../../services/form.service';
import { AnswerService } from '../../services/answer.service';
import { ToastService } from '../../usable/toast.service';
import { NbDialogRef, NbDialogService, NbMenuService } from '@nebular/theme';

import { OnChanges, SimpleChanges } from "@angular/core";
import { FormControl } from "@angular/forms";
import { DefaultFilter } from "angular2-smart-table";
import { HttpClient } from '@angular/common/http';
import { BASE_URL } from '../../services/site.service';
import { CustomDataSource } from '../../usable/custom.dataSource';
import { debounceTime, distinctUntilChanged, filter, map } from "rxjs/operators";
import { SharedService } from './shared.service';
import { EnrollService } from '../../services/enroll.service';
import { SwitchService } from '../../services/switch.service';
import { country } from '../form/data';
import { DetailAnswerComponent } from './detail-answer/detail-answer.component';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
  template: `<button *ngIf="rowData && items.length > 0" (click)="clickMenu()" nbButton [nbContextMenu]="items" nbContextMenuTrigger="click" [nbContextMenuTag]="getTag()">
    <nb-icon icon="more-vertical-outline"></nb-icon>
  </button>`,
})
export class CustomActionRenderComponent implements OnInit, OnDestroy {

  option = 0;
  renderValue: string;
  items = [];
  action_active = true;
  menu_service;

  @Input() value: string | number;
  @Input() rowData: any;

  constructor(
    private nbMenuService: NbMenuService,
    private activatedRoute: ActivatedRoute,
    private _sharedService: SharedService,
    private modalSS:SwitchService,
    private router: Router,
    config: NgbCarouselConfig
  ) {
    config.showNavigationArrows = true;
		config.showNavigationIndicators = false;
    this.activatedRoute.data.subscribe(data => {
      if (data['option']) {
        this.option = data['option'];
      }
    });
  }

  ngOnDestroy() {
    try {
      this.menu_service.unsubscribe();
    } catch (error) {

    }
  }

  ngOnInit() {
    if(this.option == 3) return
    if (this.rowData.type == 1) {
      if (![2].includes(this.option)) {
        this.items = [
          {
            icon: 'file-text-outline',
            title: 'Ver PDF',
          },{
            icon: 'file-text-outline',
            title: 'Ver Excel',
          }
        ];
      } else {
        const user_data = JSON.parse(localStorage.getItem('session')) || null;
        if (user_data['permission'].includes(70)) {
          this.items = [{
            icon: 'edit-outline',
            title: 'Editar',
          }];
        }
      }

      if (![1,2].includes(this.option)) {
        this.onPermit();
      }
    } else {
      this.items = [
        {
          icon: 'file-text-outline',
          title: 'Ver PDF',
        }
      ]
    }

    this.renderValue = this.value == null? "":this.value.toString();
    this.menu_service = this.nbMenuService.onItemClick().pipe(
      filter(({ tag }) => tag === this.getTag()),
      map(({ item: { title } }) => title),
    ).subscribe(
      title => {
        if (title == "Ver PDF") {
          this._sharedService.emitChange({'action': 'pdf', 'data': this.rowData});
        } else if (title == "Ver Excel") {
          this._sharedService.emitChange({'action': 'excel', 'data': this.rowData});
        } else if (title == "Editar") {
          this._sharedService.emitChange({'action': 'edit', 'data': this.rowData});
        } else if (title == "Eliminar") {
          this._sharedService.emitChange({'action': 'delete', 'data': this.rowData});
        }
      }
    );
  }

  getTag(){
    let name_tag = 'answer-tag-' + this.rowData.id
    if (this.rowData.consecutive) {
      name_tag += '-' + 1
    }
    name_tag += '-' + this.rowData.type
    return name_tag
  }

  onPermit() {
    // Editar
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['permission'].includes(31)) {
      this.items.push({
        icon: 'edit-outline',
        title: 'Editar',
      })
    }
    // Eliminar
    if (user_data['permission'].includes(32)) {
      this.items.push({
        icon: 'trash-outline',
        title: 'Eliminar',
      })
    }
  }

  clickMenu() {
    this._sharedService.emitChange({'action': 'click', 'data': this.rowData});
  }
}

@Component({
  selector: "input-filter",
  template: `
    <nb-form-field>
      <nb-icon nbPrefix icon="search-outline" pack="eva"></nb-icon>
      <input
        [ngClass]="inputClass" nbInput fullWidth
        [formControl]="inputControl"
        class="form-control"
        type="text"
        placeholder="Buscar por {{ column.title }}..."
      />

    </nb-form-field>
  `,
})

export class CustomInputTextFilterComponentAnswer extends DefaultFilter implements OnInit, OnChanges {
  delay: number = 300;
  inputControl = new FormControl();

  constructor() {
    super();
  }

  ngOnInit() {
    this.delay = 1500;
    if (this.query) {
      this.inputControl.setValue(this.query);
    }
    this.inputControl.valueChanges.pipe(distinctUntilChanged(), debounceTime(300)).subscribe((value: string) => {
      this.query = this.inputControl.value;
      this.setFilter();
    });
  }

  ngOnChanges(changes: SimpleChanges) {}
}

@Component({
  selector: "datetime-filter",
  template: `
    <nb-form-field>
      <nb-icon nbPrefix icon="search-outline" pack="eva"></nb-icon>
      <input
        #input
        [ngClass]="inputClass" nbInput fullWidth
        [formControl]="inputControl"
        class="form-control"
        placeholder="Buscar por Fecha..."
        nbInput [nbDatepicker]="dateTimePicker"
        (keydown)="invalid($event)">
      <button nbSuffix nbButton ghost (click)="onClean()">
        <nb-icon icon='close-circle-outline'
          pack="eva">
        </nb-icon>
      </button>
      <nb-rangepicker format="yyyy-MM-dd" #dateTimePicker ></nb-rangepicker>
    </nb-form-field>
  `,
})
export class CustomInputDateFilterComponentAnswer extends DefaultFilter implements OnInit, OnChanges {
  delay: number = 300;
  inputControl = new FormControl();
  inputTextControl = new FormControl();
  change_value = true;
  value = '';
  constructor() {
    super();
  }

  ngOnInit() {
    this.delay = 2000;
    this.inputControl.valueChanges.pipe(distinctUntilChanged(), debounceTime(300)).subscribe((value: string) => {
      try {
        if (this.inputControl.value == null){
          this.query = '';
        } else {
          if (this.inputControl.value['start'] && this.inputControl.value['end']){
            let date_ini = (this.inputControl.value['start']);
            let text = date_ini.toLocaleString("es-CO");
            let text_parts = text.split(',')
            let date_text = text_parts[0].split('/')
            this.query = (date_text[2].length == 1 ?  '0': '') + date_text[2] + '-' +
            (date_text[1].length == 1 ?  '0': '') + date_text[1] + '-' +
            (date_text[0].length == 1 ?  '0': '') + date_text[0];

            let date_end = (this.inputControl.value['end']);
            text = date_end.toLocaleString("es-CO");
            text_parts = text.split(',')
            date_text = text_parts[0].split('/')
            this.query += ';' + (date_text[2].length == 1 ?  '0': '') + date_text[2] + '-' +
            (date_text[1].length == 1 ?  '0': '') + date_text[1] + '-' +
            (date_text[0].length == 1 ?  '0': '') + date_text[0];
          }
        }
        if (this.query != this.value) {
          this.change_value = true;
          this.value = this.query;
        }
      } catch {
        if (this.query != value)
          this.query = value;
        console.error('Please use Valid Dates');
      } finally {
        if (this.change_value) {
          this.setFilter();
          this.change_value = false;
        }
      }

    });
  }

  onClean() {
    this.value = '';
    this.change_value = true;
    this.query = '';
    this.inputControl.reset();
  }

  ngOnChanges(changes: SimpleChanges) {}

  invalid(evt){
    evt.preventDefault();
  }
}

@Component({
  selector: "input-button",
  template: `
  <button nbButton fullWidth
    status="primary"
    size="small"
    style="font-size: 20px;"
    nbTooltip="Historial por Usuario"
    nbTooltipStatus="primary"
    (click)="onHistorical()">
    <i class="nb-compose"></i>
  </button>
  `,
})
export class CustomButtonFilterComponentAnswer extends DefaultFilter implements OnChanges {
  delay: number = 300;

  inputControl = new FormControl();

  constructor(private router: Router) {
    super();
  }

  onHistorical() {
    this.router.navigate(['/pages/answer/historical']);
  }

  ngOnChanges(changes: SimpleChanges): void {}
}

@Component({
  selector: 'ngx-answer',
  templateUrl: './answer.component.html',
  styleUrls: ['./answer.component.scss']
})
export class AnswerComponent implements OnInit, OnDestroy {

  permit_view = false;
  view_option = 0;
  row_data_select;
  index_select;
  is_last;
  show_duplicate = false;

  // Lista
  isSelect = true;
  action_active = true;
  select_document = [];
  list_answer: CustomDataSource;
  message='';
  option = 0;

  loading = false;
  loading_element = false;

  settings = {
    mode: 'external',
    noDataMessage: 'No hay documentos diligenciados.',
    pager: {
      display: true,
      perPage: 10,
    },
    actions: false,
    add: {
      addButtonContent: '<i class="nb-compose" itemprop="Historial por Usuario"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>'
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
      fill_out: {
        filter: false,
        title: '',
        type: 'html',
        valuePrepareFunction: function(cell, row) {
          let text = ['Diligenciando','Presenta irregularidades','Presenta fraude','Recibido exitosamente','Cerrado por inactividad','Cerrado por el sistema']
          let i_class = 'gray';
          let icon = 'nb-alert';
          switch (cell) {
            case 1: // Irregularidad
              i_class = 'warning';
              break;
            case 2: // Fraude
              i_class = 'error';
              break;
            case 3: // Enviado con exito
              i_class = 'success';
              icon = 'nb-checkmark-circle'
              break;
            case 4: // Cerrado por inactividad
            case 5: // Cerrado por el sistema
              i_class = 'purple';
              break;
          }
          return `<div title="${text[cell]}" class="icon-fill-out"><i class="${icon} ${i_class}"></i></div>`;
        },
      },
      id: {
        title: '#',
        type: 'number',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentAnswer,
        }
      },
      subject: {
        title: 'Asunto',
        type: 'string',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentAnswer,
        },
        sort: false,
      },
      user_name: {
        title: 'Realizado Por',
        type: 'string',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentAnswer,
        },
        valuePrepareFunction: function(cell, row) {
          if ((''+cell).trim() != ''){
            return cell;
          } else {
            return 'Usuario Público';
          }
        }
      },
      origin_date: {
        title: 'Fecha de Diligenciamiento',
        valuePrepareFunction: function(cell, row) {
          let date = new Date(cell);
          let text = date.toLocaleString("es-CO", {hour12: false});
          let text_parts = text.split(',')
          let date_text = text_parts[0].split('/')
          return (date_text[2].length == 1 ? '0': '') + date_text[2] + '-' +
          (date_text[1].length == 1 ?  '0': '') + date_text[1] + '-' +
          (date_text[0].length == 1 ?  '0': '') + date_text[0] +
          text_parts[1];

        },
        filter: {
          type:'custom',
          component: CustomInputDateFilterComponentAnswer,
        }
      },
      creation_date: {
        title: 'Fecha de Envío',
        valuePrepareFunction: function(cell, row) {
          let date = new Date(cell);
          let text = date.toLocaleString("es-CO", {hour12: false});
          let text_parts = text.split(',')
          let date_text = text_parts[0].split('/')
          return (date_text[2].length == 1 ?  '0': '') + date_text[2] + '-' +
          (date_text[1].length == 1 ? '0': '') + date_text[1] + '-' +
          (date_text[0].length == 1 ?  '0': '') + date_text[0] +
          text_parts[1];

        },
        filter: {
          type:'custom',
          component: CustomInputDateFilterComponentAnswer,
        }
      },
      source: {
        title: 'Origen',
        valuePrepareFunction: function(cell, row) {
          if (cell){
            if (cell == 1)
              return 'Web';
            else if (cell == 2)
              return 'Móvil';
          }
          return 'N/A'
        },
        filter: {
          type: 'list',
          config: {
            selectText: 'Origen',
            list: [
              {value: 1, title: 'Web'},
              {value: 2, title: 'Móvil'},
            ],
          },
        }
      },
      online: {
        title: 'Tipo de Conexión',
        valuePrepareFunction: function(cell, row) {
          if (cell != undefined){
            if (cell)
              return 'Online';
            else
              return 'Offline';
          }
          return 'N/A'
        },
        filter: {
          type: 'list',
          config: {
            selectText: 'Seleccione una opción',
            list: [
              {value: true, title: 'Online'},
              {value: false, title: 'Offline'},
            ],
          },
        }
      },

      operation: {
        title: '',
        type: 'custom',
        filter: {
          type: "custom",
          component: CustomButtonFilterComponentAnswer,
        },
        renderComponent: CustomActionRenderComponent,
      },
    },
    //rowClassFunction: (row) => this.getRowClass(row),
  };

  // Resumen
  id:string;

  list_form = []// Consecutivo
  form_check = []
  nameNit = []

  consecutive = false;
  name:string;
  description:string;
  version;
  ani = false;
  nit = false;
  sign = false;
  form_list = [];
  enroll_data;
  form_value;
  service_subscribe;
  source;
  array_fraud;
  status_fraud = false;
  status_answer;
  count;
  totCount;
  pdf_view: boolean = false
  src;
  page_viewer = 1;
  url_dowload;
  name_pdf = '';
  params_route = "";

  // País - Departamento/Estado - Ciudad
  public country: any;

  constructor(
    private answerService: AnswerService,
    private enrollService:EnrollService,
    private formService: FormService,
    private toastService: ToastService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private dialogService :NbDialogService,
    private _sharedService: SharedService,
    private modalSS:SwitchService,
    private http: HttpClient,
  ) {
    this.loading = true;

    this.activatedRoute.data.subscribe(data => {
      if (data['option']) {
        this.option = data['option'];
      }
    });

    if (this.option == 0) {
      this.list_answer = new CustomDataSource(http, { endPoint: BASE_URL + 'inbox/'}, this);
    } else if (this.option == 1) {
      this.list_answer = new CustomDataSource(http, { endPoint: BASE_URL + 'inbox/0/'}, this);
    } else if (this.option == 2) {
      this.list_answer = new CustomDataSource(http, { endPoint: BASE_URL + 'inbox/2/'}, this);
    } else if (this.option == 3) {
      this.list_answer = new CustomDataSource(http, { endPoint: BASE_URL + 'inbox/3/'}, this);
    }

    this.list_answer.onChanged().subscribe((changes) => {
      setTimeout(() => {
        if (this.totCount == undefined){
          this.totCount = this.list_answer.getTotalCount()
        }
        this.count = this.list_answer.getTotalCount()
      }, 300);
    })

    
    this.activatedRoute.queryParams.subscribe(queryParams => {
      console.log("parametros recibidos", queryParams['param1']); // Captura parámetros adicionales
      this.params_route = queryParams['param1'];
    });
  }

  ngOnDestroy() {
    this.service_subscribe.unsubscribe();
  }

  ngOnInit(): void {
    if(this.params_route != ""){
      this.onUserRowSelectInitial(this.params_route);
    }
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['permission'].includes(38)) {
      this.permit_view = true;
    }
    this.country = country;
    this.modalSS.$modalsing.subscribe((valor)=>{
      this.view_option=valor
    })
    setTimeout(() => {
      this.message = 'No tienes formularios';
      }, 3000
    );

    this.service_subscribe = this._sharedService.changeEmitted$.subscribe(data => {
      if (data.action == 'click') {
        this.isSelect = false;
      } else {
        this.onCustom(data);
      }
    });

    this.answerService.getUniqueState().subscribe(
      response => {
        if (response['status'] && response['data']) {
          this.show_duplicate = true;
        }
      }
    );
  }

  onUserRowSelect(event): void {
    setTimeout(() => {
      if (this.isSelect) {
        // Resumen
        this.loading = true;
        this.row_data_select = event.data;
        this.index_select = this.list_answer.getData().findIndex((value) => {
          return value.id == this.row_data_select.id && value.type == this.row_data_select.type && this.row_data_select.consecutive == value.consecutive
        });
        this.is_last = (this.list_answer.getPaging().page-1)*10 + this.index_select + 1 == this.list_answer.getTotalCount();
        this.ani = false;
        this.nit = false;
        this.sign = false;
        this.getAllData();
      } else {
        this.isSelect = !this.isSelect;
      }
    }, 200);
  }

  onUserRowSelectInitial(event): void {
    console.log("parametros de envio", event);
    this.isSelect = true;
      if (this.isSelect) {
        // Resumen
        this.loading = true;
        this.index_select = this.list_answer.getData().findIndex((value) => {
          return value.id == event['id']
        });
        this.is_last = (this.list_answer.getPaging().page-1)*10 + this.index_select + 1 == this.list_answer.getTotalCount();
        this.ani = false;
        this.nit = false;
        this.sign = false;
        this.getAllData1();
      } else {
        this.isSelect = !this.isSelect;
      }
  }

  onNavigate(route) {
    this.router.navigate([route]);
  }

  getPDF(consecutive, id) {
    this.answerService.get_pdf(consecutive, id).subscribe(
      response => {
        this.downLoadFile(response, "application/pdf");
      },
      error => {
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      }
    );
  }

  getExcel(consecutive, id){
    this.answerService.get_excel(consecutive, id).subscribe(
      response => {
        // console.log(response);
        this.downLoadFile(response, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      },
      error => {
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      }
    );
  }

  onCreate(event):void {
    this.router.navigate(['/pages/answer/historical']);
  }

  getDigitalPDF(consecutive, id) {
    this.answerService.getDigitalPDF(consecutive, id).subscribe(
      response => {
        this.downLoadFile(response, "application/pdf");
      },
      error => {
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      }
    );
  }

  getPDFIns(val, form_field){
    val.preventDefault();
    this.loading = true;
    this.answerService.get_pdf_document(0, this.row_data_select.id, 5, form_field).subscribe(
      response => {
        this.downLoadFile(response, "application/pdf");
        this.toastService.showToast('success', 'Exitoso', 'Enviando Soporte.');
        this.loading = false
      },error => {
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta más tarde.');
        this.loading = false
      }
    );
  }

  onCustom(event) {
    try {
      this.name_pdf = `${event.data.subject}_${event.data.id}`
    } catch (error) {
      this.name_pdf = "name_file";
    }
    if (event.data.type == 2) {
      // Revisar
      // this.enrollService.get_pdf(this.row_data_select.id, event.data.id).subscribe(
      //   response => {
      //     this.downLoadFile(response, "application/pdf");
      //   },
      //   error => {
      //     this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      //   }
      // );
    } else if (event.data.type == 1) {
      if (event.data.consecutive) {
        if (event.action == 'pdf') {
          if (event.data.digital) {
            this.getDigitalPDF(1, event.data.id);
          } else {
            this.getPDF(1, event.data.id);
          }
        } else if (event.action == 'edit') {
          if (event.data.public) {
            this.toastService.showToast('warning', 'Editar', 'No puede editar esta respuesta pública.');
          } else {
            this.router.navigate(['/pages/form/answer/update/consecutive/' + event.data.id_form + '/' + event.data.id, {}]);
          }
        } else if (event.action == 'excel'){
          this.getExcel(1, event.data.id);
        }
      } else {
        if (event.action == 'pdf') {
          if (event.data.digital) {
            this.getDigitalPDF(0, event.data.id);
          } else {
            this.getPDF(0, event.data.id);
          }
        } else if (event.action == 'edit') {
          // Aqui
          if (event.data.public) {
            this.toastService.showToast('warning', 'Editar', 'No puede editar esta respuesta pública.');
          } else {
            if (event.data.digital) {
              this.router.navigate(['/pages/form/answer/update/digital/' + event.data.id_form + '/' + event.data.id, {}]);
            } else {
              this.router.navigate(['/pages/form/answer/update/' + event.data.id_form + '/' + event.data.id, {}]);
            }
          }
        } else if (event.action == 'excel'){
          this.getExcel(0, event.data.id);
        }
      }

      if (event.action == 'delete') {
        this.deleteForm(event);
      } else if (event.action == 'trace'){
        this.openTraceWindow();
      }
    }

  }

  downLoadFile(data: any, type: string) {
    this.src = data
    var blob = new Blob([data], { type: type.toString() });
    var url = window.URL.createObjectURL(blob);
    this.url_dowload = null;
    this.url_dowload = document.createElement("a");
    this.url_dowload.download = this.name_pdf + (type == "application/pdf" ? '.pdf' : '.xlsx');
    this.url_dowload.href = url;
    if(type == "application/pdf") {
      this.pdf_view = true
      setTimeout(() => {
        var div = document.getElementById('content_pdf_view');
        div.innerHTML = '<iframe style="width:100%;height:100%;" frameborder="0" src="' + url + '" />';
      }, 200);
      //this.MenuClick()
    } else {
      this.url_dowload.click();
    }
  }

  isImage(url: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const extension = url.split('.').pop()?.toLowerCase();
    return extension ? imageExtensions.includes(extension) : false;
  }

  downLoadFileClick() {
    this.url_dowload.click();
  }

  MenuClick() {
    // Obtener el elemento por su id
    const button = document.getElementById('sidenavToggle');
    if (button) {
      button.click();
    }
  }

  deleteForm(event) {
    this.pdf_view = false;
    const dialogRef = this.dialogService.open(ConfirmAnswerDialog, {context:{data:{title: 'Eliminar Respuesta', content: 'Estas seguro de eliminar esta respuesta?'}}});
    dialogRef.onClose.subscribe(result => {
      if (result == true) {
        let con = '0';
        if (event.data.consecutive) {
          con = '1';
        }
        this.answerService.delete(con, event.data.id).subscribe(
          response => {
            if (response['status']){
              this.list_answer.remove(event.data);
              this.list_answer.refresh();
              this.toastService.showToast('success', 'Respuesta', 'Eliminada con exito.');
              this.view_option = 0;
            }
          }, error => {
            let desc_error = 'No tienes permiso para realizar esta acción.';
            if (error.error['message']) {
              desc_error += ' ' + error.error['message'];
            }
            this.toastService.showToast('danger', 'Error', desc_error);
          }
        );
      }
    });
  }

  // Funcion que determina el color de una columna
  getRowClass(row): string {
    const sourceValue = row.getData().status_sign;
    if (sourceValue == 2) {
      return 'row-red';  // Clase CSS para el color de fraude
    } else if (sourceValue == 1) {
      return 'row-orange';   // Clase CSS para el color de irregularidad
    }
    return ''; // Si no hay coincidencia, no se aplica ninguna clase especial
  }

  openModal(sign, fraud) {
    // Se llama el modal que contiene la informacion detalla de la firma
    this.dialogService.open(DetailAnswerComponent, {context:{data: sign, fraud:fraud, id:this.row_data_select.id}, closeOnBackdropClick:false, closeOnEsc:true });
  }

  // Resumen
  getAllData() {
    if (this.row_data_select.type == 1){
      // Respuesta
      let consecutive = 0;
      if (this.row_data_select.consecutive) {
        consecutive = 1;
      }
      // Servicio que se consume para obtener las respuestas de los Estados
      this.answerService.list_state_answer(this.row_data_select.id).subscribe(
        response => {
          if (response['status']){
            let array_data = [];
            let array_fraud = [];
            // Se recorre la informacion que llega del backend
            response['data'].forEach(sign_bio => {
              let state_answer = []
              let main_status = 0
              sign_bio['state_answer'].forEach(info_answer => {
                let find = state_answer.find(value => value.status == info_answer.status);
                // Validacion de si exite la firma o sino la crea
                if (find){
                  find['data'].push(info_answer)
                }else{
                  state_answer.push({status: info_answer.status, data: [info_answer]})
                }
                // Validacion del estado de la firma
                if (info_answer.status > main_status){
                  main_status = info_answer.status
                }
              });
              sign_bio['state_answer'] = state_answer;
              sign_bio['main_status'] = main_status;
              // Validacion del estado de las firmas que contienes fraude
              if (main_status == 2){
                array_fraud.push(sign_bio)
                this.status_fraud = true;
              }
              // Agrupamiento de las firmas
              let group_sign = array_data.find(value => value.field_type == sign_bio.field_type);
              if ( group_sign){
                if (main_status > group_sign.main_status){
                  group_sign['main_status'] = main_status;
                }
                group_sign['sign'].push(sign_bio)
              }else{
                array_data.push({field_type: sign_bio.field_type, sign: [sign_bio], main_status: main_status})

              }
            });
            this.array_fraud = {sign: array_fraud}
            this.status_answer = array_data
          }
      })
      this.answerService.list_field(consecutive, this.row_data_select.id).subscribe(
        response => {
          if (response['status']){
            this.form_value = response['data']['list_form'][0];
            this.form_value['trace'] = response['data']['trace'] ? response['data']['trace'] : null;
            response['data']['list_form'].forEach(element => {
              let count = 0
              element['fields'].forEach(value => {
                if ([7, 10, 18, 22].includes(value['type'])) {
                  this.sign = true;
                }
                if (value['type'] == 11 || value['type'] == 18) {
                  this.ani = true;
                }
                if( value['type'] == 20){
                  let answer = [];
                  // console.log(value['answer'])
                  if (value['answer'].includes('[')) {
                    // console.log(value['answer'])
                    answer = JSON.parse(value['answer']);
                    answer.forEach(element => {
                      for (let el in element) {
                        if (el == 'numero_identificacion') {
                          this.nameNit[count]=element[el]
                        }
                      }
                    });
                  }else{
                    this.nameNit[count]=value['answer']
                  }

                  this.nit = true;
                }
                count +=1
              });
            });
            if (consecutive == 1) {
              response['data']['list_form'].forEach(element => {
                this.form_check.push(element['id']);
              });
              this.getSequence(response['data']['consecutive'], response['data']['list_form']);
            } else {
              this.list_form = response['data']['list_form'];
              // console.log(this.form_value);
              this.view_option = 1;
            }
            // Cambia a vista de resumen
          }
          this.loading = false;
          this.loading_element = false;
        }
      );
    } else if (this.row_data_select.type == 2) {
      // Inscripción
      this.enrollService.get_detail(this.row_data_select.id).subscribe(
        response => {
          if (response['status']){
            this.enroll_data = response['data'];
            this.view_option = 2;
            // Cambia a vista de resumen
          }
          this.loading = false;
          this.loading_element = false;
        }
      );
      // Servicio de Enrollment
    }

  }
  getAllData1() {
      // Respuesta
      let consecutive = 0;
      // Servicio que se consume para obtener las respuestas de los Estados
      this.answerService.list_state_answer(this.params_route).subscribe(
        response => {
          if (response['status']){
            let array_data = [];
            let array_fraud = [];
            // Se recorre la informacion que llega del backend
            response['data'].forEach(sign_bio => {
              let state_answer = []
              let main_status = 0
              sign_bio['state_answer'].forEach(info_answer => {
                let find = state_answer.find(value => value.status == info_answer.status);
                // Validacion de si exite la firma o sino la crea
                if (find){
                  find['data'].push(info_answer)
                }else{
                  state_answer.push({status: info_answer.status, data: [info_answer]})
                }
                // Validacion del estado de la firma
                if (info_answer.status > main_status){
                  main_status = info_answer.status
                }
              });
              sign_bio['state_answer'] = state_answer;
              sign_bio['main_status'] = main_status;
              // Validacion del estado de las firmas que contienes fraude
              if (main_status == 2){
                array_fraud.push(sign_bio)
                this.status_fraud = true;
              }
              // Agrupamiento de las firmas
              let group_sign = array_data.find(value => value.field_type == sign_bio.field_type);
              if ( group_sign){
                if (main_status > group_sign.main_status){
                  group_sign['main_status'] = main_status;
                }
                group_sign['sign'].push(sign_bio)
              }else{
                array_data.push({field_type: sign_bio.field_type, sign: [sign_bio], main_status: main_status})

              }
            });
            this.array_fraud = {sign: array_fraud}
            this.status_answer = array_data
          }
      })
      this.answerService.list_field(consecutive,this.params_route).subscribe(
        response => {
          if (response['status']){
            this.form_value = response['data']['list_form'][0];
            this.form_value['trace'] = response['data']['trace'] ? response['data']['trace'] : null;
            response['data']['list_form'].forEach(element => {
              let count = 0
              element['fields'].forEach(value => {
                if ([7, 10, 18, 22].includes(value['type'])) {
                  this.sign = true;
                }
                if (value['type'] == 11 || value['type'] == 18) {
                  this.ani = true;
                }
                if( value['type'] == 20){
                  let answer = [];
                  // console.log(value['answer'])
                  if (value['answer'].includes('[')) {
                    // console.log(value['answer'])
                    answer = JSON.parse(value['answer']);
                    answer.forEach(element => {
                      for (let el in element) {
                        if (el == 'numero_identificacion') {
                          this.nameNit[count]=element[el]
                        }
                      }
                    });
                  }else{
                    this.nameNit[count]=value['answer']
                  }

                  this.nit = true;
                }
                count +=1
              });
            });
            if (consecutive == 1) {
              response['data']['list_form'].forEach(element => {
                this.form_check.push(element['id']);
              });
              this.getSequence(response['data']['consecutive'], response['data']['list_form']);
            } else {
              this.list_form = response['data']['list_form'];
              // console.log(this.form_value);
              this.view_option = 1;
            }
            // Cambia a vista de resumen
          }
          this.loading = false;
          this.loading_element = false;
        }
      );
    
  }

  isString(val): boolean { return typeof val === 'string'; }

  onBack() {
    this.pdf_view=false;
    this.view_option = 0;
  }

  getSequence(id, list_form){
    this.answerService.get_sequence(id, this.row_data_select.id).subscribe(
      response => {
        if (response['status']){
          this.form_list = response['consecutive']['forms'];
          this.name = response['consecutive']['name'];
          this.description = response['consecutive']['description'];
          this.version = response['version'];
          this.list_form = list_form;
          this.view_option = 1;
        }
      }
    );
  }

  getTableData(field, body) {
    let position = body.map(function(e) { return e.field; }).indexOf(field + '');
    if (position != -1) {
      return body[position]['answer'];
    }
    return '';
  }

  getIdentification(answer) {
    let IDENTIFICATION = {
      1: 'Cédula de ciudadanía',
      2: 'Tarjeta de identidad',
      3: 'Cédula de extranjería',
      4: 'Pasaporte',
      5: 'Permiso de permanencia',
      6: 'Permiso por protección temporal'
    }
    let response = '';

    if (answer != '') {
      let answer_data = answer.split('-')
      if (answer_data.length > 1){
        response = IDENTIFICATION[answer_data[0]] + " - " + answer_data[1]
      }else {
        response = IDENTIFICATION[1] + " - " + answer
      }
    }
    return response;
  }

  getCountryData(answer) {
    let response = '';

    if (answer != '') {
      let answer_data = JSON.parse(answer.replace(/'/g, '"'));
      // País
      if (answer_data[0] && answer_data[0] != '') {
        let position_p = this.country.map(function(e) { return e.value; }).indexOf(answer_data[0]);
        if (position_p != -1) {
          response += this.country[position_p]['label'];

          // Departamento
          if (answer_data[1] && answer_data[1] != '') {
            let position_s = this.country[position_p]['state'].map(function(e) { return e.value; }).indexOf(answer_data[1]);
            if (position_s != -1) {
              response += ' - ' + this.country[position_p]['state'][position_s]['label'];

              // Ciudad
              if (answer_data[2] && answer_data[2] != '') {
                let position_c = this.country[position_p]['state'][position_s]['cities'].map(function(e) { return e.value; }).indexOf(answer_data[2]);
                if (position_c != -1) {
                  response += ' - ' + this.country[position_p]['state'][position_s]['cities'][position_c]['label'];
                }
              }
            }
          }
        }
      }
    }
    return response;
  }

  hiddenPermit(id) {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (![1,2].includes(this.option)) {
      if (user_data && user_data['permission'].includes(id)) {
        return false;
      }
    } else if (this.option == 2 && id == 31) {
      if (user_data && user_data['permission'].includes(70)) {
        return false;
      }
    }
    return true;
  }

  getPdfDocument(type) {
    let consecutive = 0;
    if (this.row_data_select.consecutive) {
      consecutive = 1;
    }
    this.loading = true

    this.answerService.get_pdf_document(consecutive, this.row_data_select.id, type).subscribe(
      response => {
        this.downLoadFile(response, "application/pdf");
        this.loading = false
      },
      error => {
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      }
    );
  }

  onActionAnswer(action) {
    let event = {'action': action, 'data': this.row_data_select};
    this.onCustom(event);
  }

  loadNext(){
    this.pdf_view=false;
    if (this.is_last)
      return
    this.loading_element = true;
    if(this.index_select < 9){
      let data_select = this.list_answer.getData()[this.index_select+1];
      this.onUserRowSelect({data: data_select});
    } else {
      this.list_answer.setPage(this.list_answer.getPaging().page + 1);
      this.list_answer.getElements().then((value)=>{
        this.onUserRowSelect({data: value[0]});
      });
    }
  }

  // openAddress(field, index){
  //   // Modal direccion
  //   const address = this.dialogService.open(AddressComponent, {context:{data: {field:field}}, closeOnBackdropClick:false, closeOnEsc:false });
  //     address.onClose.subscribe(result => {
  //       if (result != false) {
  //         field.answer = result;
  //       } else {
  //         console.log("prueba");
  //       }
  //     });
  // }

  getAdrress(answer){
    if (answer && answer != "") {
      let data_adrress = answer.split("-");
      return data_adrress.join(" ");
    }
    return "";
  }

  loadPrev(){
    this.pdf_view=false;
    if (this.list_answer.getPaging().page == 1 && this.index_select == 0)
    return
    this.loading_element = true;
    if(this.index_select > 0){
      let data_select = this.list_answer.getData()[this.index_select-1];
      this.onUserRowSelect({data: data_select});
    } else {
      this.list_answer.setPage(this.list_answer.getPaging().page - 1);
      this.list_answer.getElements().then((value)=>{
        this.onUserRowSelect({data: value[9]});
      });
    }
  }

  openTraceWindow(){
    let url = window.location.origin + '/public/trace/' + this.form_value.trace;
    let w = window.open(url);
  }
}

@Component({
  selector: 'confirm-dialog',
  template: `
    <nb-card>
      <nb-card-header>
        <h3>{{data.title}}</h3>
      </nb-card-header>
      <nb-card-body>
        {{data.content}}
      </nb-card-body>
      <nb-card-footer>
        <button nbButton (click)="close(false)">Cancelar</button>
        <button nbButton status="danger" (click)="close(true)" cdkFocusInitial color="warn">Aceptar</button>
      </nb-card-footer>
    </nb-card>`,
  styles: ['nb-card-footer { text-align:end}', 'button {margin:5px}']
})
export class ConfirmAnswerDialog {
  public data: {
    title:string,
    content:string
  }
  constructor(
    public dialogRef: NbDialogRef<ConfirmAnswerDialog>, ){
  }
  close(response:boolean){
    this.dialogRef.close(response);
  }
}
