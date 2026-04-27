import { Component, OnInit, OnChanges, SimpleChanges, Input } from '@angular/core';

import { FormControl } from '@angular/forms';
import { DefaultFilter } from 'angular2-smart-table';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SystemService } from '../../services/system.service';

@Component({
  template: `
    <div *ngIf="status">
      <nb-alert class="type-table" [status]="status.status">
        <div class="type-text">
            <nb-icon [icon]="status.icon"></nb-icon>
            <span>{{status.name}}</span>
        </div>
      </nb-alert>
    </div>
  `,
})
export class CustomRenderComponent implements OnInit {
  delay = 300;


  status_list = [
    {
      'id': 0,
      'name': 'Todos',
      'status': 'default',
      'icon': 'list-outline'
    },
    {
      'id': 1,
      'name': 'trace',
      'status': 'primary',
      'icon': 'code-download-outline'
    },
    {
      'id': 2,
      'name': 'debug',
      'status': 'control',
      'icon': 'code-outline'
    },
    {
      'id': 3,
      'name': 'info',
      'status': 'info',
      'icon': 'info-outline'
    },
    {
      'id': 4,
      'name': 'warning',
      'status': 'warning',
      'icon': 'alert-triangle-outline'
    },
    {
      'id': 5,
      'name': 'error',
      'status': 'danger',
      'icon': 'close-circle-outline'
    },
    {
      'id': 6,
      'name': 'fatal',
      'status': 'danger',
      'icon': 'activity-outline',
    },
  ];
  status;

  @Input() value: number;
  @Input() rowData: any;

  ngOnInit() {
    if (this.value)
      this.status = this.status_list[this.value];
  }

}


@Component({
  selector: 'ngx-system',
  templateUrl: './system.component.html',
  styleUrls: ['./system.component.scss']
})
export class SystemComponent implements OnInit {

  status_list = [
    {
      'id': 0,
      'name': 'Todos',
      'status': 'default',
      'icon': 'list-outline',
      'quantity': 0
    },
    {
      'id': 1,
      'name': 'trace',
      'status': 'primary',
      'icon': 'code-download-outline',
      'quantity': 0
    },
    {
      'id': 2,
      'name': 'debug',
      'status': 'control',
      'icon': 'code-outline',
      'quantity': 0
    },
    {
      'id': 3,
      'name': 'info',
      'status': 'info',
      'icon': 'info-outline',
      'quantity': 0
    },
    {
      'id': 4,
      'name': 'warning',
      'status': 'warning',
      'icon': 'alert-triangle-outline',
      'quantity': 0
    },
    {
      'id': 5,
      'name': 'error',
      'status': 'danger',
      'icon': 'close-circle-outline',
      'quantity': 0
    },
    {
      'id': 6,
      'name': 'fatal',
      'status': 'danger',
      'icon': 'activity-outline',
      'quantity': 0
    },
  ];

  date_init;
  date_end;
  loading = false;
  data: any[];
  filtered_data: any[];
  selectedItemNgModel;
  selectedItemNgModel2;

  settings = {
    mode: 'external',
    noDataMessage: 'No hay datos.',
    pager: {
      display: true,
      perPage: 10,
    },
    actions: false,
    columns: {
      type:{
        title: 'Nivel',
        type: 'custom',
        filter: false,
        renderComponent: CustomRenderComponent
      },
      creation_date: {
        title: 'Fecha y Hora',
        valuePrepareFunction: function(cell, row) {
          let date = new Date(cell);
          let text = date.toLocaleString();
          return text;
        },
      },
      enterprise_id:{
        title: 'Ent',
        type: 'string'
      },
      action: {
        title: 'Accion',
        type: 'string',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentAnswer,
        },
        sort: false,
      },
      source: {
        title: 'Fuente',
        type: 'string',
        valuePrepareFunction: function(cell, row) {
          if (cell == 1){
            return 'Servidor';
          } else {
            return 'Móvil';
          }
        }
      },
      url:{
        title: 'url',
        type:'string'
      },
      data:{
        title: "Data",
        type: 'html',
        valuePrepareFunction: function(cell,row) {
          if (cell && cell.length > 300){
            return "<div title='"+cell+"\'>" + cell.slice(0,300) + '... </div>'
          }
          return cell
        }
      },
      response_data:{
        title:'Respuesta/Extra',
        type:'html',
        valuePrepareFunction: function(cell,row) {
          if ( cell && cell.length > 300){
            return "<div title='"+cell+"\'>" + cell.slice(0,300) + '... </div>'
          }
          return cell
        }
      }
    },
    hideSubHeader:true,
  }

  constructor(
    private systemService:SystemService,
  ) { }

  ngOnInit(): void {
  }

  filter(){
    this.loading = true;
    let data_filter = {
      date_init: this.date_init,
      date_end: this.date_end,
      source: this.selectedItemNgModel,
      type:this.selectedItemNgModel2,
    };

    this.systemService.getLogs(data_filter).subscribe((response)=>{
      if (response['status']){
        this.data = response['data'];
        this.filtered_data = response['data'];
        this.status_list.forEach((element, index) => {
          this.status_list[index].quantity = 0;
        });
        this.data.forEach(element => {
          this.status_list[0].quantity += 1;
          this.status_list[element.type].quantity += 1;
        });
      }
    }, null, ()=>this.loading=false);
  }

  filterByType(type){
    this.loading = true;
    if (type == 0){
      this.filtered_data = this.data;
    } else {
      this.filtered_data = this.data.filter((element)=>{
        return type==element.type
      });
    }
    this.loading = false;
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
  inputControl = new FormControl();

  constructor() {
    super();
  }

  ngOnInit() {
    if (this.query) {
      this.inputControl.setValue(this.query);
    }
    this.inputControl.valueChanges.pipe(distinctUntilChanged(), debounceTime(300)).subscribe((value: string) => {
      this.query = this.inputControl.value;
      this.setFilter();
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.query) {
      this.inputControl.setValue(this.query);
    }
  }
}
