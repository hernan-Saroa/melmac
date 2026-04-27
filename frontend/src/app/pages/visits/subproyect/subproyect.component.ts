import { Component, OnInit } from '@angular/core';
import { NbDialogRef, NbDialogService } from '@nebular/theme';
import { ActivatedRoute, Router } from '@angular/router';
import { VisitsService } from '../../../services/visits.service';
import { SwitchService } from '../../../services/switch.service';
import { ModalsSubComponent } from './modals-sub/modals-sub.component';
import { LocalDataSource } from 'angular2-smart-table';
import { Location } from '@angular/common';

@Component({
    selector: 'ngx-subproyect',
    templateUrl: './subproyect.component.html',
    styleUrls: ['./subproyect.component.scss'],
    standalone: false
})
export class SubproyectComponent implements OnInit {

  id:string;
  data;
  items;
  valor1;
  nameProyect;
  form_visit_form;
  source: LocalDataSource = new LocalDataSource();

  settings = {
    mode: 'external',
    noDataMessage: 'No tiene subproyectos asignados a este proyecto.',
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
          title: '<i title="Editar" class="nb-edit"></i>',
        },
        {
          name: 'task',
          title: '<i title="Tareas" class="nb-list"></i>'
        },
        {
          name: 'programming',
          title: '<i title="programación" class="nb-layout-sidebar-right"></i>'
        },
        {
          name: 'link',
          title: '<i title="Ticket publico" class="nb-shuffle"></i>'
        },
        {
          name: 'editForm',
          title: '<i title="Editar documento ticket" class="nb-compose"></i>'
        },
      ]
    },
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
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
    },
  };

  permitDialogRef: NbDialogRef<ModalsSubComponent>;

  constructor(private activatedRoute: ActivatedRoute,private visitService:VisitsService, private dialogService: NbDialogService,private nameSubp:SwitchService,private modalSS:SwitchService,private singSS:SwitchService, private router: Router,private processSubSS:SwitchService,private _location: Location) {
    this.singSS.$sing.subscribe((valor)=>{
      this.valor1=valor
      this.nameProyect=" del sub proyecto: "+ this.valor1.name
      console.log(this.valor1)
    })

    this.processSubSS.$processSub.subscribe((valor)=>{
      this.visitService.listSubProyect(this.id).subscribe(
        response => {
          this.data = response['data'];
          this.form_visit_form = response['form_visit_form'];
          this.source.refresh()
        }
      );
    })

    this.id = this.activatedRoute.snapshot.paramMap.get('id');
    this.visitService.listSubProyect(this.id).subscribe(
      response => {
        this.data = response['data'];
        this.form_visit_form = response['form_visit_form'];
      }
    );
  }

  ngOnInit(): void {
  }
  onCustom($event) {
    console.log($event)

    if($event.action == 'task'){
      this.router.navigate(['/pages/visits/task/' + $event.data.id + '/'+$event.data.main_form, {}]);
    }else if($event.action == 'programming'){
      setTimeout(()=>{
        this.nameSubp.$nameSubp.emit($event.data)
      }, 100);
      //this.router.navigate(['/pages/visits/programming/list/' + $event.data.id, {}]);
      this.router.navigate(['/pages/visits/programming/create/' + $event.data.id+'/1', {}]);
    }else if($event.action == 'link'){
      this.router.navigate(['/pages/form/associate/' + $event.data.main_form + '/link', {}]);
    }else if($event.action == 'editForm'){
      //Se envian value y param para que se sepa que desde este modulo se edita e formulario
      this.router.navigate(['/pages/form/update/' + $event.data.main_form, {param: true, value: this.id }]);
     // this.router.navigate(['/pages/form/update/' + $event.data.main_form, {}]);
    }else{
      let closeOnBackdropClick = false
      this.permitDialogRef = this.dialogService.open(ModalsSubComponent, { closeOnBackdropClick,context:{
          data : $event.data,source:$event,idProyect:this.id,form_visit_form:this.form_visit_form
        } });
      setTimeout(()=>{
          this.modalSS.$modalsing.emit(this.permitDialogRef)
      }, 500);
    }
  }

  onBack() {
    this._location.back();
  }
  
}
