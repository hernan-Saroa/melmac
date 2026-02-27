import { Component, OnInit,TemplateRef  } from '@angular/core';
import { NbDialogRef, NbDialogService } from '@nebular/theme';
import { ModalsProyectComponent } from './modals-proyect/modals-proyect.component';
import { VisitsService } from '../../../services/visits.service';
import { SwitchService } from '../../../services/switch.service';
import { Router } from '@angular/router';
import { LocalDataSource } from 'ng2-smart-table';
import { ToastService } from '../../../usable/toast.service';
import { Location } from '@angular/common';

@Component({
  selector: 'ngx-proyect',
  templateUrl: './proyect.component.html',
  styleUrls: ['./proyect.component.scss']
})
export class ProyectComponent implements OnInit {

  data;
  items;
  source: LocalDataSource = new LocalDataSource();
  valor1;
  form_visit_form;

  settings = {
    mode: 'external',
    noDataMessage: 'No tiene proyectos creados.',
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
        },
        {
          name: 'subproyect',
          title: '<i title="Sub proyectos" class="nb-layout-default"></i>'
        },
        {
          name: 'delete',
          title: '<i title="Eliminar" class="nb-trash"></i>',
        }
      ]
    },
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    columns: {
      identificator: {
        title: 'Identificador',
        type: 'string',
      },
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

  permitDialogRef: NbDialogRef<ModalsProyectComponent>;
  constructor(private visitService:VisitsService, private dialogService: NbDialogService,private modalSS:SwitchService,private router: Router,private singSS:SwitchService,private toastService: ToastService,private _location: Location ) {
    this.modalSS.$modalsing.subscribe((valor)=>{
      console.log(valor)
      if(valor = "crea proyecto"){
        this.visitService.listProyect().subscribe(
          response => {
            this.data = response['data'];
            this.form_visit_form = response['form_visit_form'];
            this.source.refresh()
          }
        );
      }
    })

    this.visitService.listProyect().subscribe(
      response => {
        this.data = response['data'];
        this.form_visit_form = response['form_visit_form'];
        console.log(this.form_visit_form)
      }
    );
  }

  ngOnInit(): void {
  }

  onCustom($event) {
    console.log($event)

    if($event.action == 'subproyect'){
      setTimeout(()=>{
        this.singSS.$sing.emit($event.data)
      }, 100);
      this.router.navigate(['/pages/visits/subproyect/' + $event.data.id, {}]);
    }else if($event.action == 'delete'){
      console.log($event.data.name)
      let deleteName=$event.data.name
      this.visitService.deleteListProyect($event.data.id).subscribe(
        response => {
          if(response['status']){
            this.toastService.showToast('success', 'Listo', 'Se ha eliminado el proyecto '+ deleteName.toUpperCase() +' correctamente.');
            this.visitService.listProyect().subscribe(
              response => {
                this.data = response['data'];
                this.form_visit_form = response['form_visit_form'];
                this.source.refresh()
              }
            );
          }
        }
      );
    }else{
      let closeOnBackdropClick = false
      this.permitDialogRef = this.dialogService.open(ModalsProyectComponent, { closeOnBackdropClick,context:{
          data : $event.data,source:$event,form_visit_form:this.form_visit_form,cantData:this.data.length
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
