import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnswerService } from '../../services/answer.service';
import { OnChanges, SimpleChanges } from "@angular/core";
import { FormControl} from "@angular/forms";
import { DefaultFilter } from "angular2-smart-table";
import { debounceTime, distinctUntilChanged} from "rxjs/operators";
import { HttpClient } from '@angular/common/http';
import { BASE_URL } from '../../services/site.service';
import { CustomDataSource } from './custom.dataSource';
import { SharedService } from '../shared.service';


@Component({
  template: `<button *ngIf="rowData" (click)="clickMenu()" nbButton [nbContextMenu]="items" nbContextMenuTrigger="click" [nbContextMenuTag]="getTag()">
    <nb-icon icon="more-vertical-outline"></nb-icon>
  </button>`,
})
export class CustomActionRenderComponent implements OnInit, OnDestroy {

  inactive = false;
  renderValue: string;
  items = [];
  menu_service;

  @Input() value: string | number;
  @Input() rowData: any;

  constructor(
    private activatedRoute: ActivatedRoute,
  ) {
    this.activatedRoute.data.subscribe(data => {
      if (data['inactive']) {
        this.inactive = data['inactive'];
      }
    });
  }

  ngOnDestroy() {
    this.menu_service.unsubscribe();
  }

  ngOnInit() {

  }

  getTag(){
    let name_tag = 'answer-tag-' + this.rowData.id
    if (this.rowData.consecutive) {
      name_tag += '-' + 1
    }
    name_tag += '-' + this.rowData.type
    return name_tag
  }
}

@Component({
  selector: "input-filter-historial",
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
  selector: "datetime-filter-historial",
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
  `,
})
export class CustomButtonFilterComponentAnswer extends DefaultFilter implements OnChanges {
  delay: number = 300;

  inputControl = new FormControl();

  constructor(private router: Router) {
    super();
  }

  ngOnChanges(changes: SimpleChanges): void {}
}

@Component({
  selector: 'ngx-historial',
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.scss']
})
export class HistorialComponent implements OnInit {
  token_link = '';
  token_validate = false;
  name_user;
  list_answer: CustomDataSource;
  inactive = false;
  loading = false;

  settings = {
    mode: 'external',
    noDataMessage: 'No hay documentos diligenciados.',
    pager: {
      display: true,
      perPage: 10,
    },
    actions: false,
    columns: {
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
      origin_date: {
        title: 'Fecha de Diligenciamiento',
        valuePrepareFunction: function(cell, row) {
          let date = new Date(cell);
          let text = date.toLocaleString("es-CO");
          let text_parts = text.split(',')
          let date_text = text_parts[0].split('/')
          return (date_text[0].length == 1 ? '0': '') + date_text[0] + '-' +
          (date_text[1].length == 1 ?  '0': '') + date_text[1] + '-' +
          (date_text[2].length == 1 ?  '0': '') + date_text[2] +
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
          let text = date.toLocaleString("es-CO");
          let text_parts = text.split(',')
          let date_text = text_parts[0].split('/')
          return (date_text[0].length == 1 ?  '0': '') + date_text[0] + '-' +
          (date_text[1].length == 1 ? '0': '') + date_text[1] + '-' +
          (date_text[2].length == 1 ?  '0': '') + date_text[2] +
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
    },
  };

  constructor(
    private answerService: AnswerService,
    private activatedRoute: ActivatedRoute,
    private _sharedService: SharedService,
    private http: HttpClient,
  ) {
    this.token_link = this.activatedRoute.snapshot.paramMap.get('token');
    this.list_answer = new CustomDataSource(http, { endPoint: BASE_URL + 'inbox/'}, this);
  }

  ngOnInit(): void {
    this.getDataEnterprise();
  }

  getDataEnterprise() {
    this.loading = true;
    this.answerService.get_user_data_token(this.token_link).subscribe(
      response => {
        if (response['status']){
          this.token_validate = true;
          this.name_user = response['data']['user'];
          this._sharedService.emitChange(response['data']);
        }
      }, error => {
        this.loading = false;
      }
    );
  }

}
