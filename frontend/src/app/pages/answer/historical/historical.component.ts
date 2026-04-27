import { Component, ViewChild, OnInit } from '@angular/core';
import { AnswerService } from '../../../services/answer.service';
import { LocalDataSource } from 'angular2-smart-table';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'ngx-historical',
  templateUrl: './historical.component.html',
  styleUrls: ['./historical.component.scss']
})
export class AnswerHistoricalComponent implements OnInit {

  options = [];
  filteredOptions$: Observable<any[]>;

  id_option;

  type_user;
  loading = false;

  user_data;
  data: LocalDataSource = new LocalDataSource();

  settings = {
    mode: 'external',
    // hideSubHeader: true,
    noDataMessage: 'No hay documentos diligenciados.',
    pager: {
      display: true,
      perPage: 5,
    },
    actions:{
      add: false,
      edit: false,
      delete: false,
    },
    columns: {
      name_form: {
        title: 'Nombre Documento',
        type: 'string',
      },
      source: {
        title: 'Dispositivo',
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos...',
            list: [
              { value: 1, title: 'Web' },
              { value: 2, title: 'Móvil' },
            ],
          },
        },
        valuePrepareFunction: function(cell, row) {
          if (cell == 1) {
            return 'Web';
          } else {
            return 'Móvil';
          }
        },
      },
      online: {
        title: 'Modo',
        filter: {
          type: 'list',
          config: {
            selectText: 'Todos...',
            list: [
              { value: true, title: 'Online' },
              { value: false, title: 'Offline' },
            ],
          },
        },
        valuePrepareFunction: function(cell, row) {
          if (cell == true || cell == 'true') {
            return 'Online';
          } else {
            return 'Offline';
          }
        },
      },
      creation_date: {
        title: 'Fecha y hora',
        valuePrepareFunction: function(cell, row) {
          let date = new Date(cell);
          return date.toLocaleString();
        },
        filterFunction: (cell, filter) => {
          let date = new Date(cell);
          return date.toLocaleString().includes(filter);
        }
      },
    },
  };

  constructor(
    private answerService: AnswerService,
    private router: Router,
  ) {

    const user = JSON.parse(localStorage.getItem('session')) || null;

    if (user) {
      this.type_user = user.role;
      if (this.type_user == 2) {
        this.answerService.get_user().subscribe(
          response => {
            if (response['status']){
              response['data'].forEach(element => {
                this.options.push({
                  'id': element.id,
                  'name': element.first_name + ' ' + element.first_last_name,
                });
              });
              this.filteredOptions$ = of(this.options);
            }
          }
        );
      } else if (this.type_user == 3) {
        this.answerService.get_historical(user.id).subscribe(
          response => {
            if (response['status']){
              this.user_data = response['data']['user'];
              this.data.load(response['data']['answers']);
              this.loading = true;
            }
          }
        );
      }
    }

  }

  @ViewChild('autoInput') input;
  ngOnInit(): void {

  }

  private filter(value){
    const filterValue = value.toLowerCase();
    let list_user_filer = this.options.filter(option => option.name.toLowerCase().includes(filterValue));
    return list_user_filer;
  }

  getFilteredOptions(value): Observable<any[]> {
    return of(value).pipe(
      map(filterString => this.filter(filterString)),
    );
  }

  onChange() {
    this.filteredOptions$ = this.getFilteredOptions(this.input.nativeElement.value);
  }

  onBack() {
    this.router.navigate(['/pages/answer', {}]);
  }

  onSelectionChange($event) {
    this.loading = false;
    this.id_option = $event.name;
    if ($event.id != undefined) {
      this.answerService.get_historical($event.id).subscribe(
        response => {
          if (response['status']){
            this.user_data = response['data']['user'];
            this.data.load(response['data']['answers']);
            this.loading = true;
          }
        }
      );
    }
  }

  onAnswer() {
    this.router.navigate(['/pages/answer']);
  }

}
