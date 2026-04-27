import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { DefaultFilter, LocalDataSource } from 'angular2-smart-table';
import { AnswerService } from '../../services/answer.service';
import { TraceabilityService } from '../../services/traceability.service';
import { ToastService } from '../../usable/toast.service';
import { CustomDataSource } from '../../usable/custom.dataSource';
import { HttpClient } from '@angular/common/http';
import { BASE_URL } from '../../services/site.service';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, filter, map } from "rxjs/operators";

@Component({
  selector: 'ngx-traceability',
  templateUrl: './traceability.component.html',
  styleUrls: ['./traceability.component.scss']
})
export class TraceabilityComponent implements OnInit {

  filter_enterprise = false;
  action = {};

  loading = false;
  trace_send: CustomDataSource;
  admin_list = [];

  user = '';

  settings = {
    // mode: 'external',
    noDataMessage: 'Sin datos',
    sort:true,
    pager: {
      display: true,
      perPage: 10,
    },
    actions:{
      columnTitle: "Acciones",
      add: false,
      edit: false,
      delete: false,
    },
    columns: {
      name_user: {
        title: 'Usuario',
        type: 'string',
      },
      action: {
        title: 'Acción',
        type: 'string',
        valuePrepareFunction: (value) => {
          return this.action[value] || '';
        },
        filterFunction: (cell, filter) => {
          return cell == filter;
        },
        filter: {
          type: 'list',
          config: {
            selectText: 'Seleccionar Acción',
            list: [],
          },
        },
      },
      description: {
        title: 'Descripción',
        type: 'string',
      },
      creation_date: {
        title: 'Fecha',
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
    },
  };

  constructor(
    private answerService:AnswerService,
    private traceabilityService:TraceabilityService,
    private toastService: ToastService,
    private http: HttpClient,
  ) {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data){
      if (user_data['role'] == 1) {
        this.filter_enterprise = true;
        this.answerService.get_admin().subscribe(
          response => {
            this.admin_list = response['data'];
          }
        );
      }
    }
    this.trace_send = new CustomDataSource(this.http, { endPoint: BASE_URL + 'traceability/trace_inbox/'}, this);
  }

  ngOnInit(): void {
    this.traceabilityService.list().subscribe(
      response => {
        this.action = response['action'];

        let action_list = [];
        Object.entries(response['action']).forEach(action => {
          action_list.push({value: action[0], title: action[1]});
        });

        this.settings.columns.action.filter.config.list = action_list;
        this.settings = Object.assign({}, this.settings);
      }
    );
  }

  // filter() {
  //   this.loading = true;
  //   this.traceabilityService.list(this.user).subscribe(
  //     response => {
  //       this.data.load(response['data']);
  //       this.loading = false;
  //     }
  //   );
  // }

  downLoadFile(data: any, type: string) {
    let filename = 'melmac_logs.txt'
    let dataType = type;
      let binaryData = [];
      binaryData.push(data);
      let downloadLink = document.createElement('a');
      downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, { type: dataType }));
      if (filename) {
        downloadLink.setAttribute('download', filename);
      }
      document.body.appendChild(downloadLink);
      downloadLink.click();
  }

  onChangeUser(event) {
    console.log('onChangeUser')
    console.log(event)
    this.trace_send = new CustomDataSource(this.http, { endPoint: BASE_URL + 'traceability/trace_inbox/' + event + '/'}, this);
  }

  getTXT() {
    let data = {}
    data['user'] = this.user;
    let filters = this.trace_send.getFilter()
    if(filters && filters.length > 0) {
      filters.forEach(filter => {
        if(filter['search'] != '') {
          data[filter['field']] = filter['search'];
        }
      });
    }
    this.traceabilityService.get_txt_enterprise(data).subscribe(
      response => {
        this.downLoadFile(response, "text/plain");
      },
      error => {
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      }
    );
  }
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
