import { Component, ElementRef, OnInit, Renderer2, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService } from '../../../services/form.service';
import { ToastService } from '../../../usable/toast.service';
import { Location } from '@angular/common';
import { NbDialogRef, NbDialogService } from '@nebular/theme';
import { CustomDataSource } from '../../../usable/custom.dataSource';
import { LocalDataSource, Ng2SmartTableComponent, DefaultFilter } from 'ng2-smart-table';
import { FormControl } from "@angular/forms";
import { debounceTime, distinctUntilChanged, filter, map } from "rxjs/operators";
import { HttpClient } from '@angular/common/http';
import { BASE_URL } from '../../../services/site.service';

@Component({
  selector: 'ngx-send',
  templateUrl: './send.component.html',
  styleUrls: ['./send.component.scss']
})
export class SendComponent implements OnInit {

  data: LocalDataSource = new LocalDataSource();
  list_send: CustomDataSource;
  charts = undefined;
  chart = false;

  @ViewChild('table') table: Ng2SmartTableComponent;

  dataChanged = [];
  selectedItems = [];
  state_action = {};
  selectedRows = [];
  selected_for_pages = [];
  items=0
  resend = true
  validate_check= false;
  closeCheck = true
  openCheck = false
  loading = true
  myInterval = null
  count = 0;
  totCount;
  count_init;
  isAllSelected;

  perPage = [5, 10, 20, 50]
  settings = {
    selectMode: 'multi',
    mode: 'external',
    noDataMessage: 'No tiene documentos enviados.',
    pager: {
      display: true,
      perPage: 20,
    },
    actions:{
      columnTitle: "Acciones",
      add: false,
      edit: false,
      delete: false
    },
    // attr: {
    //   class: 'dnone' // this is custom table scss or css class for table
    // },
    columns: {
      id: {
        title: '#',
        type: 'string',
      },
      form_enterprise_id__name: {
        title: 'Documento',
        type: 'string',
      },
      shared_media: {
        title: 'Medio de envío',
        type: 'html',
        valuePrepareFunction: function(cell, row) {
          if (cell){
            if (cell == 'correo electrónico')
              return 'Correo Electrónico';
            else if (cell == 'WhatsApp')
              return 'WhatsApp';
            else if (cell == 'SMS')
              return 'SMS';
          }
          return 'N/A'
        },
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: [
              {value: 'correo electrónico', title: 'Correo Electrónico'},
              {value: 'Whatsapp', title: 'WhatsApp'},
              {value: 'SMS', title: 'SMS'},
            ],
          },
        },
        //type: 'string',
      },
      shared_to: {
        title: 'Destinatario',
        type: 'string',
      },
      modify_date_d: {
        title: 'Fecha de Envío',
        valuePrepareFunction: function(cell, row) {
          return (cell);
        },
        filter: {
          type:'custom',
          component: CustomInputDateFilterComponentAnswer,
        }
      },
      modify_date_t: {
        title: 'Hora',
        type: 'string',
      },
      count_trace: {
        title: 'Cant. veces reenviado',
        type: 'string',
        filter: false,
      },
      process_state_id: {
        title: 'Estado',
        type: 'html',
        valuePrepareFunction: function(cell, row) {
          let i_class = 'gray';
          let icon = 'nb-alert';
          if (cell == 20) {
            icon = 'fas fa-check';
            return `<div title="${row['process_state__name']}" class="icon-process_state"><i class="${icon} ${i_class}"></i></div>`;
          } else if (cell == 21){
            icon = 'fas fa-check-double ';
            i_class = 'success';
            return `<div title="${row['process_state__name']}" class="icon-process_state"><i class="${icon} ${i_class}"></i></div>`;
          } else if (cell == 22) {
            return `<div title="${row['process_state__name']}"><label class="icon-process-ex">X</label></div>`;
          }else if (cell == 23) {
            return `<div title="${row['process_state__name']}"><label class="icon-process-ex error-process-ex">X</label></div>`;
          } else {
            return `<div title="${row['process_state__name']}"><label class="icon-process-ex">X</label></div>`;
          }
        },
        filterFunction: (cell, filter) => {
          return cell == filter;
        },
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos',
            list: [],
          },
        },
      },
    }
  };
  totalChart = []

  constructor(
    private http: HttpClient,
    private router: Router,
    private formService: FormService,
    private toastService: ToastService,
    private location: Location,
    private renderer2: Renderer2,
    private e: ElementRef,
    private dialogService :NbDialogService
  ) {
  }

  ngOnInit(): void {
    this.formService.get_send().subscribe(
      response => {
        if (response['status']){
          this.state_action = response['state'];
          let action_list = [];
          Object.entries(response['state']).forEach(state => {
            action_list.push({value: state[1][0], title: state[1][1]});
          });

          this.settings.columns.process_state_id.filter.config.list = action_list;
          this.settings = Object.assign({}, this.settings);
          this.charts = response['chart'];
          this.getAllData();
        } else {
          this.router.navigate(['/pages/form/view', {}]);
        }
      }
    );
  }

  onBack() {
    this.location.back();
  }

  numberElements(changes){
    this.count =  changes.paging.page * changes.elements.length;
    this.count_init = (this.count - changes.elements.length) + 1
    if (changes.elements.length != changes.paging.perPage){
      this.count = this.totCount
      this.count_init = (this.count - changes.elements.length) + 1
    }
    if(changes.paging.page == 1){
      this.count_init = 1
    }
  }

  getAllData(refresh=false){
    this.list_send = new CustomDataSource(this.http, { endPoint: BASE_URL + 'send_inbox/'}, this);
    if (!refresh) {
      this.list_send.onChanged().subscribe((changes) => {
        this.totCount = this.list_send.count();

        setTimeout(() => {
          if (!this.chart) {
            this.addChart('pending', this.charts['pending'], this.list_send.count());
            this.addChart('finalized', this.charts['finalized'], this.list_send.count());
            this.addChart('bounce', this.charts['bounce'], this.list_send.count());
            this.chart = true;
          }
        }, 1500);

        this.numberElements(changes);
        this.dataChanged = changes.elements
        switch (changes.action) {
          case 'page':
            console.log(this.list_send)
            if (changes.paging.page in this.selected_for_pages) {
              let id_elements = [];

              this.selected_for_pages[changes.paging.page].forEach(element => {
                id_elements.push(element.id)
              });

              setTimeout(() => {
                this.table.grid.getRows().forEach((row) => {
                  if (id_elements.includes(row.getData().id)) {
                    this.table.grid.multipleSelectRow(row);
                  }
                });
              }, 100);
            }
            this.validateCheckbox();
            break;
          case 'filter':
            this.validateCheckbox();
            setTimeout(() => {
              this.calculateDataChart(this.list_send)
            }, 500);
            break;
        }
      });
    }

    const checkbox = document.getElementsByClassName('ng-untouched ng-pristine ng-valid')[0] as HTMLInputElement | null;
    if (checkbox) {
      checkbox.classList.add('dnone');
    }

    setTimeout(() => {
      this.validateCheckbox();
    }, 500);
    // this.list_send.getAll().then(allData => {
    //   this.calculateDataChart(allData)
    // })
  }

  // getAllDataOLD(refresh=false){
  //   this.formService.get_send().subscribe(
  //     response => {
  //       if (response['status']){
  //         this.data.load(response['data']['form_link_val_share']);
  //         if(!refresh) {
  //           this.data.onChanged().subscribe((changes) => {
  //             this.totCount = this.data.count();
  //             this.numberElements(changes);
  //             this.dataChanged = changes.elements
  //             switch (changes.action) {
  //               case 'page':
  //                 if (changes.paging.page in this.selected_for_pages) {
  //                   let id_elements = [];
  //                   this.selected_for_pages[changes.paging.page].forEach(element => {
  //                     id_elements.push(element.id)
  //                   });

  //                   this.table.grid.getRows().forEach((row) => {
  //                     if (id_elements.includes(row.getData().id)) {
  //                       this.table.grid.multipleSelectRow(row);
  //                     }
  //                   });
  //                 }
  //                 this.validateCheckbox();
  //                 break;
  //               case 'filter':
  //                 this.validateCheckbox();
  //                 this.data.getFilteredAndSorted().then(filter => {
  //                   this.calculateDataChart(filter)
  //                 })
  //                 break;
  //             }
  //           });
  //         }
  //         this.state_action = response['state'];
  //         let action_list = [];
  //         Object.entries(response['state']).forEach(state => {
  //           action_list.push({value: state[1][0], title: state[1][1]});
  //         });

  //         this.settings.columns.process_state_id.filter.config.list = action_list;
  //         this.settings = Object.assign({}, this.settings);

  //         const checkbox = document.getElementsByClassName('ng-untouched ng-pristine ng-valid')[0] as HTMLInputElement | null;
  //         checkbox.classList.add('dnone');
  //         this.validateCheckbox()
  //         this.data.getAll().then(allData => {
  //           this.calculateDataChart(allData)
  //         })
  //       } else {
  //         this.router.navigate(['/pages/form/view', {}]);
  //       }
  //     }
  //   );
  // }

  download(){
    console.log(this.list_send.max_page)
    console.log(this.list_send)
    let csv = '\uFEFF#,Documento,Medio de envío,Destinatario,Fecha de Envío,Hora,Estado\n'; // Cabecera del CSV

    this.list_send.datas.forEach((item) => {
      csv += `${item.id},${item.form_enterprise_id__name},${item.shared_media},${item.shared_to},${item.modify_date_d},${item.modify_date_t},${item.process_state__name}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'datos.csv';
    a.click();
    window.URL.revokeObjectURL(url);


  }

  calculateDataChart(data) {
    console.log(this.list_send)
    this.totalChart = []
    this.addChart('pending', this.list_send.chart.pending, this.list_send.count())
    this.addChart('finalized', this.list_send.chart.finalized, this.list_send.count())
    this.addChart('bounce', this.list_send.chart.bounce, this.list_send.count())
}

  addChart(option: string, value: number, total: number) {
    let title = 'Documentos '
    let doc = 'Doc. '
    switch (option) {
      case 'pending':
        title += 'pendientes por diligenciar'
        doc += 'Pendientes'
        break;
      case 'finalized':
        title += ' diligenciados'
        doc += 'Diligenciados'
        break;
      case 'bounce':
        title += ' que no se entregaron'
        doc += 'Sin entregar'
        break;
    }
    let val = value.toLocaleString('es-CO')
    let percentage;
    if (value == 0){
      percentage = 100
    }else{
      percentage = Math.round((100 * value) / total)
    }
    let chartData = {
      title: title,
      percentage: percentage,
      value: `${val} ${doc}`,
      total: `de ${total} Enviados`
    }
    this.totalChart.push(chartData)
  }

  onChangePerPage(pager: number) {
    this.data.setPaging(1, pager)
    this.data.refresh()
    this.validateCheckbox();
  }

  // UserRowSelected Event handler
  onRowSelect(event) {
    this.isAllSelected = this.table.grid.dataSet['rows'].every(row => row.isSelected);
    let selected = []
    event.selected.forEach(e => {
      let hours = this.getTimeSend(e.modify_date_d, e.modify_date_t)
      if(e.process_state__name != 'Finalizado' && hours >= 48) {
        selected.push(e)
      }
    });
    this.selectedRows = selected;
    this.items=this.selectedRows.length;
    this.selected_for_pages[event.source.pagingConf.page] = selected;
    this.count_all_select();

    let contentChart = document.getElementById('content-chart');
    if(this.items > 0){
      this.resend=false
      this.validate_check=true
      contentChart.style.setProperty("margin-top", "2rem");
    }else{
      this.resend=true
      this.validate_check=false
      contentChart.style.setProperty("margin-top", "0rem");
    }
  }

  count_all_select() {
    this.items = 0;
    this.selected_for_pages.forEach(element => {
      this.items += element.length;
    });
  }

  validateCheckbox() {
    this.myInterval = setInterval(() => {
      var container = this.e.nativeElement.querySelector("#table-send")
      var checkbox = container.querySelectorAll('input[type=checkbox]')
      if(checkbox.length > 0) {
        clearInterval(this.myInterval)
        this.disableCheckboxes()
        this.loading = false;
      }
    }, 100);
  }

  disableCheckboxes() {
    var container = this.e.nativeElement.querySelector("#table-send")
    var checkbox = container.querySelectorAll('tbody input[type=checkbox]')
    checkbox.forEach((element, index) => {
      try {
        let doc = this.dataChanged[index];
        if (doc) {
          let hours = this.getTimeSend(doc['modify_date_d'], doc['modify_date_t']);
          if(doc['process_state__name'] == 'Finalizado') {
            element.parentNode.innerHTML = ''
          } else if(hours < 48) { // Si es mayor a 48 horas se puede reenviar el documento
            element.parentNode.innerHTML = '<div style="font-size: 12px;padding: 0px 2px">'+(48-hours)+' hr</div>'
          }
        }
      } catch(error){
        console.error(error)
      }
    });
  }

  getTimeSend(modify_date_d, modify_date_t) {
    let date = new Date(`${modify_date_d} ${modify_date_t}`)
    let data_now = new Date()
    var diff =(data_now.getTime() - date.getTime()) / 1000;
    diff /= (60 * 60);
    return Math.abs(Math.round(diff));
  }

  resendDate(){
    if (this.items > 0) {
      this.dialogService.open(ResendConfirmComponent, {context:{ parentComponent:this }});
    } else {
      this.toastService.showToast('warning', 'Atención', 'Por favor selecciona un documento.');
    }
  }

  checkAll(){
    // const checkbox = document.getElementsByClassName('ng-untouched ng-pristine ng-valid dnone')[0] as HTMLInputElement | null;
    // if (checkbox != undefined) {
    //   if(checkbox.className == 'ng-untouched ng-pristine ng-valid dnone'){
    //     checkbox.checked = true;
    //     checkbox.click();
    //   }else{
    //     const checkbox2 = document.getElementsByClassName('ng-untouched ng-valid ng-dirty dnone')[0] as HTMLInputElement | null;
    //     console.log(checkbox2)
    //     checkbox2.checked = true;
    //     checkbox2.click();
    //   }
    // }else{
    //   const checkbox2 = document.getElementsByClassName('ng-untouched ng-valid ng-dirty dnone')[0] as HTMLInputElement | null;
    //   checkbox2.checked = true;
    //   checkbox2.click();
    // }
    var container = this.e.nativeElement.querySelector("#table-send")
    var checkboxs = container.querySelectorAll('tbody input[type=checkbox]')
    this.checkboxFalse(checkboxs, true)
    this.closeCheck = false
    this.openCheck = true
  }

  outCheckAll(){
    const checkbox = document.getElementsByClassName('ng-untouched ng-valid ng-dirty')[0] as HTMLInputElement | null;
    if(checkbox == undefined){
      const checkbox = document.getElementsByClassName('ng-valid ng-dirty ng-touched')[0] as HTMLInputElement | null;
      checkbox.checked = false;
      checkbox.click();
      this.closeCheck = true
      this.openCheck = false
      return;
    }
    checkbox.checked = false;
    checkbox.click();
    this.closeCheck = true
    this.openCheck = false
  }

  outCheckCount() {
    // const checkbox = document.getElementsByClassName('ng-untouched ng-pristine ng-valid dnone')[0] as HTMLInputElement | null;
    // if (checkbox != undefined) {
    //   if (checkbox.checked) {
    //     checkbox.click();
    //   } else {
    //     const checkboxes = document.getElementsByClassName('ng-valid ng-touched ng-dirty') as HTMLCollectionOf<HTMLInputElement>;
    //     this.checkboxFalse(checkboxes);
    //   }
    // } else {
    //   const checkbox2 = document.getElementsByClassName('ng-untouched ng-valid dnone ng-dirty')[0] as HTMLInputElement | null;
    //   if (checkbox2.checked) {
    //     checkbox2.click();
    //   } else {
    //     const checkboxes = document.getElementsByClassName('ng-valid ng-touched ng-dirty') as HTMLCollectionOf<HTMLInputElement>;
    //     this.checkboxFalse(checkboxes)
    //   }
    // }
    var container = this.e.nativeElement.querySelector("#table-send")
    var checkboxs = container.querySelectorAll('tbody input[type=checkbox]')
    this.checkboxFalse(checkboxs, false)
    this.table.isAllSelected = false;
    this.selected_for_pages = [];
    this.validate_check = false;
    this.count_all_select();

    this.closeCheck = true;
    this.openCheck = false;
  }

  checkboxFalse(checkboxes, checked) {
    // Itera sobre todos los checkboxes seleccionados para marcarlos o no
    checkboxes.forEach(checkbox => {
      if (checkbox.checked != checked) {
        checkbox.checked = checked;
        checkbox.click();
      }
    });
  }

}

@Component({
  selector: 'resend-confirm-dialog',
  templateUrl: 'dialog.html',
  styles: ['nb-card-footer { text-align:end}', 'button {margin:5px}', 'nb-checkbox {margin:5px 0px}']
})
export class ResendConfirmComponent implements OnInit{

  public parentComponent: SendComponent;
  list_send = []
  list = []
  view=false

  constructor(
    public dialogRef: NbDialogRef<ResendConfirmComponent>,
    private toastService: ToastService,
    private formService: FormService
  ){
  }

  ngOnInit(): void {
    this.parentComponent.selected_for_pages.forEach(element => {
      this.list_send = this.list_send.concat(element);
    });

    if (this.list_send.length > 5) {
      this.list = this.list_send.slice(0, 5);
    } else {
      this.list = this.list_send;
    }
  }

  onAccept(){
    this.parentComponent.loading = true;
    this.dialogRef.close();
    let data = {data:this.list_send};
    this.formService.share_forwarding_all(data).subscribe(
      response => {
        if(response['status'] === true){
          this.toastService.showToast('success', 'Listo', 'Se ha reenviado los enlaces a sus destinatarios.');
          setTimeout(() => {
            this.toastService.showToast('success', 'Listo', 'Enlace compartido con exito.');
            this.parentComponent.items = 0
            this.parentComponent.resend=true
            this.parentComponent.validate_check=false
            this.parentComponent.selectedRows = [];
            this.parentComponent.selected_for_pages = [];
            this.parentComponent.getAllData(true)
          },1000)
        }
      }
    );
  }

  viewAll(view) {
    this.view = view
    if (view) {
      this.list = this.list_send;
    } else {
      this.list = this.list_send.slice(0, 5);
    }
  }

  close(){
    this.dialogRef.close();
  }

}

@Component({
  selector: "datetime-filter-send",
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
  inputControl = new FormControl();
  inputTextControl = new FormControl();
  change_value = true;
  value = '';
  constructor() {
    super();
  }

  ngOnInit() {
    this.delay = 1000;
    this.inputControl.valueChanges.pipe(distinctUntilChanged(), debounceTime(this.delay)).subscribe((value: string) => {
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
        console.log(this.query)
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

