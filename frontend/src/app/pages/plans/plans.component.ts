import { Component, OnInit } from '@angular/core';
import { PlansService } from '../../services/plans.service';
import { NbDialogRef, NbDialogService } from '@nebular/theme';
import { PlansModalComponent } from './plans-modal/plans-modal.component';
import { SwitchService } from '../../services/switch.service';

@Component({
  selector: 'ngx-plans',
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss']
})
export class PlansComponent implements OnInit {
  data;
  items;
  // settings: Object;
  select_identification = [];
  select_theme = [];
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
      price: {
        title: 'Valor',
        type: 'string',
      },
    },
  };
  permitDialogRef: NbDialogRef<PlansModalComponent>;
  constructor(private planService:PlansService, private dialogService: NbDialogService,private modalSS:SwitchService, ) {
    this.planService.list().subscribe(
      response => {
        this.data = response['data'];
        this.items = response['items'];
        console.log(this.data)
      }
    );
  }
  ngOnInit(): void {
  }
  onCustom($event) {
    console.log($event)
    if ($event.action == 'edit'){
      let closeOnBackdropClick = false
      this.permitDialogRef = this.dialogService.open(PlansModalComponent, { closeOnBackdropClick,context:{
        indexField:$event.data, indexItems : this.items
      } }); setTimeout(()=>{
        this.modalSS.$modalsing.emit(this.permitDialogRef)
    }, 500);
    }else{
      let closeOnBackdropClick = false
      this.permitDialogRef = this.dialogService.open(PlansModalComponent, { closeOnBackdropClick,context:{
        indexField:$event.data, indexItems : this.items
      } }); setTimeout(()=>{
        this.modalSS.$modalsing.emit(this.permitDialogRef)
    }, 500);
    }
  }

}
