import { Component, OnInit } from '@angular/core';
import { NbDialogRef, NbDialogService } from '@nebular/theme';
import { ActivatedRoute, Router } from '@angular/router';
import { VisitsService } from '../../../../services/visits.service';
import { SwitchService } from '../../../../services/switch.service';
import { ModalsComponent } from './modals/modals.component';

@Component({
  selector: 'ngx-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {

  id:string;
  data;
  items;
  valor1;
  nameSubProyect;

  settings = {
    mode: 'external',
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
          title: '<i title="Editar" class="nb-compose"></i>',
        },
        {
          name: 'viewProgramming',
          title: '<i title="Ver programación" class="nb-checkmark-circle"></i>',
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

  permitDialogRef: NbDialogRef<ModalsComponent>;


  constructor(private activatedRoute: ActivatedRoute,private visitService:VisitsService, private dialogService: NbDialogService,private nameSubp:SwitchService,private modalSS:SwitchService,private nameSubpSS:SwitchService, private router: Router,) {

    this.nameSubpSS.$nameSubp.subscribe((valor)=>{
      this.valor1=valor
      this.nameSubProyect = this.valor1.name
      console.log(this.valor1)
    })

    this.id = this.activatedRoute.snapshot.paramMap.get('id');
    this.visitService.listProgramming(this.id).subscribe(
      response => {
        this.data = response['data'];
      }
    );

  }

  ngOnInit(): void {
  }

  onCustom($event) {
    console.log($event)

    if($event.action == 'edit'){
      //this.router.navigate(['/pages/visits/programming/' + this.id, {}]);
    }else if($event.action == 'viewProgramming'){
      //this.router.navigate(['/pages/visits/programming/create/' + this.id, {}]);
    }else{
      let closeOnBackdropClick = false
      this.permitDialogRef = this.dialogService.open(ModalsComponent, { closeOnBackdropClick,context:{
          data : $event.data, idSubproyect:this.id, nameSubProyectF:this.nameSubProyect
        } });
      setTimeout(()=>{
          this.modalSS.$modalsing.emit(this.permitDialogRef)
      }, 500);
    }
  }

}
