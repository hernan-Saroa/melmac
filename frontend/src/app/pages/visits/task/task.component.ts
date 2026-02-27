import { Component, OnInit } from '@angular/core';
import { NbDialogRef, NbDialogService } from '@nebular/theme';
import { ModalsTaskComponent } from './modals-task/modals-task.component';
import { VisitsService } from '../../../services/visits.service';
import { SwitchService } from '../../../services/switch.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalDataSource } from 'ng2-smart-table';
import { FormService } from '../../../services/form.service';
import { Location } from '@angular/common';

@Component({
  selector: 'ngx-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss']
})
export class TaskComponent implements OnInit {

  data;
  items;
  source: LocalDataSource = new LocalDataSource();
  valor1;
  id;
  mainF;
  infoTicket="0";
  status="primary";
  fields_form;

  settings = {
    mode: 'external',
    noDataMessage: 'No tiene tareas creadas para este sub proyecto.',
    pager: {
      display: true,
      perPage: 10,
    },
    actions:{
      columnTitle: "Acciones",
      add: true,
      edit: false,
      delete: false,
      custom: [
        {
          name: 'edit',
          title: '<i title="Actualizar" class="nb-compose"></i>',
        }
      ]
    },
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    columns: {
      name: {
        title: 'Nombre',
        type: 'string',
      },
      description: {
        title: 'Descripción',
        type: 'string',
      },
      initial_date: {
        title: 'Fecha',
        type: 'string',
      },
      initial_hour: {
        title: 'Hora de inicio',
        type: 'string',
      },
      finish_hour: {
        title: 'Hora finalización',
        type: 'string',
      },
    },
  };

  permitDialogRef: NbDialogRef<ModalsTaskComponent>;
  constructor(
    private visitService:VisitsService, 
    private dialogService: NbDialogService,
    private modalSS:SwitchService,
    private router: Router,
    private singSS:SwitchService,
    private activatedRoute: ActivatedRoute,
    private formService:FormService, 
    private _location: Location) {
    this.modalSS.$taskSub.subscribe((valor)=>{
      if(valor = "crea tarea"){
        this.id = this.activatedRoute.snapshot.paramMap.get('id');
        this.visitService.list_task(this.id,"28").subscribe(
          response => {
            this.data = response['taskList'];
            this.source.refresh()
            this.visitService.list_form_answer_task(this.id,this.mainF).subscribe(
              response => {
                if(response['count'] < 99 && response['count'] > 0 ){
                  this.infoTicket = response['count'];
                  this.status="danger"
                }else if(response['count'] > 0){
                  this.infoTicket = "99+";
                  this.status="danger"
                }
              }
            );
          }
        );
      }
    })
    this.id = this.activatedRoute.snapshot.paramMap.get('id');
    this.mainF = this.activatedRoute.snapshot.paramMap.get('mainF');
    this.visitService.list_task(this.id,"28").subscribe(
      response => {
        this.data = response['taskList'];
        this.visitService.list_form_answer_task(this.id,this.mainF).subscribe(
          response => {
            if(response['count'] < 99 && response['count'] > 0 ){
              this.infoTicket = response['count'];
              this.status="danger"
            }else if(response['count'] > 0){
              this.infoTicket = "99+";
              this.status="danger"
            }
          }
        );
      }
    );
  }

  ngOnInit(): void {
    this.formService.get_data_form(this.mainF).subscribe(
      response => {
        if (response['status']){
          this.fields_form = response['form']['fields'];
        }
      }
    );
  }

  onCustom($event) {
    let closeOnBackdropClick = false
    this.permitDialogRef = this.dialogService.open(ModalsTaskComponent, {
      closeOnBackdropClick, context: {
        dataLogs: undefined,
        data: $event.data,
        source: $event,
        idSubProyect: this.id,
        digital: undefined,
        fields: this.fields_form,
        form: this.mainF
      }
    });
    setTimeout(()=>{
        this.modalSS.$taskSub.emit(this.permitDialogRef)
    }, 500);
  }

  btnTicket(){
    this.router.navigate(['/pages/visits/ticket/' + this.id+'/'+this.mainF, {}]);
  }

  onBack() {
    this._location.back();
  }

}
