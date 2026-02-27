import { Component, OnInit, Input,OnDestroy } from '@angular/core';
import { LocalDataSource } from 'ng2-smart-table';
import { ActivatedRoute, Router } from '@angular/router';
import { VisitsService } from '../../../services/visits.service';
import { DatePipe } from '@angular/common';
import { ViewCell } from 'ng2-smart-table';
import { SharedService } from '../../answer/shared.service';
import { NbMenuService } from '@nebular/theme';
import { filter, map } from "rxjs/operators";


@Component({
  template: `<button (click)="clickMenu()" nbButton [nbContextMenu]="items" nbContextMenuTrigger="click" [nbContextMenuTag]="getTag()">
    <nb-icon icon="more-vertical-outline"></nb-icon>
  </button>`,
})
export class CustomActionRenderComponent implements ViewCell, OnInit, OnDestroy {

  inactive = false;
  renderValue: string;
  items = [];
  action_active = true;
  menu_service;

  @Input() value: string | number;
  @Input() rowData: any;

  constructor(
    private nbMenuService: NbMenuService,
    private activatedRoute: ActivatedRoute,
    private _sharedService: SharedService
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
    this.items = [
      {
        icon: 'clipboard',
        title: 'Ver información y soportes',
      }
    ]

    this.renderValue = this.value == null? "":this.value.toString();
    this.menu_service = this.nbMenuService.onItemClick().pipe(

      filter(({ tag }) => tag === this.getTag()),
      map(({ item: { title } }) => title),
    ).subscribe(
      title => {

          if (title == "Ver información y soportes") {
            if(this.rowData.id != ''){
              window.open('/pages/visits/ticket/detail/' + this.rowData.id, '_blank');
            }else{
              window.open('/pages/visits/ticket/detail/0', '_blank');
            }
          }

      }
    );
  }

  getTag(){
    let name_tag = 'answer-tag-' + this.rowData.id
    return name_tag
  }

  onPermit() {
    // Editar
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['permission'].includes(31)) {
      this.items.push({
        icon: 'edit-outline',
        title: 'Editar',
      })
    }
    // Eliminar
    if (user_data['permission'].includes(32)) {
      this.items.push({
        icon: 'trash-outline',
        title: 'Eliminar',
      })
    }
  }

  clickMenu() {
    this._sharedService.emitChange({'action': 'click', 'data': this.rowData});
  }
}

@Component({
  selector: 'ngx-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
})
export class TableComponent implements OnInit {

  ngModelValue = '0';
  selectedItemNgModel='';
  Tasks;
  SubProyect;
  task1=0;
  task2=0;
  task3=0;
  task4=0;
  task5=0;
  task6=0;
  task7=0;
  mainF;
  ValueNameJson;
  ValueDateJson;
  ValueHIJson;
  ValueHFJson;
  ValueDesJson;
  ValuecreateJson;
  ValueEstJson;
  ValueUserJson;
  viewT=true;
  idSub;
  tickets;
  data;
  idProyect=[];
  textidp='';
  source: LocalDataSource = new LocalDataSource();

  settings = {
    mode: 'external',
    noDataMessage: 'No tiene tareas creadas para este sub proyecto.',
    pager: {
      display: true,
      perPage: 10,
    },
    actions:false,
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    columns: {
      serial_number: {
        title: '#',
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
      creation_date: {
        title: 'Fecha de creación',
        type: 'string',
        valuePrepareFunction: (value) => {
          return new DatePipe('en-EN').transform(value, 'yyyy-MM-dd HH:mm:ss');
        },
      },
      initial_date: {
        title: 'Fecha de programación',
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
      subproject__name: {
        title: 'Sub proyecto',
        type: 'string',
      },
      state__name: {
        title: 'Estado',
        type: 'string',
      },
      operation: {
        title: '',
        type: 'custom',
        filter: false,
        renderComponent: CustomActionRenderComponent,
      },
    },
  };

  constructor(private visitService:VisitsService,private router: Router,) {
    this.listInitial()
  }

  ngOnInit(): void {
  }

  onCustom($event) {
  }

  selectSubProyect(){
    console.log(this.selectedItemNgModel)
    this.idSub = this.selectedItemNgModel.split("_")
    this.mainF = this.idSub[1]
    this.countTicket(this.idSub[0],0)
    //Todas las tareas
    this.visitService.list_task_all(this.idSub[0],false).subscribe(
      response => {
        console.log("list tareas")
        this.data = response['taskList'];
        this.Tasks=[]
        this.Tasks=response['taskList']
        this.task4=this.Tasks.length
        this.viewT=false
        this.viewTask(0)
        this.visitService.list_form_answer_task(this.idSub[0],this.mainF).subscribe(
          response => {
            this.tickets=response['data']
            this.task5=this.tickets.length
            this.listTicket()
          }
        );
      }
    );
  }

  listInitial(){
    this.visitService.list_proyect_subproyect().subscribe(
      response => {
        if(response["message"]=="Lista de proyectos y subproyectos"){
          console.log(response["data"])
          console.log(response["tickets"])
          this.SubProyect=response["data"]
          this.tickets=response["tickets"]
          for (let index = 0; index < this.SubProyect.length; index++) {
            const element = this.SubProyect[index];
            this.idProyect.push(element.idP)
            this.textidp += element.idP+','
          }

          this.visitService.list_task_all(this.textidp.substring(0, this.textidp.length - 1),true).subscribe(
            response => {
              this.data = response['taskList'];
              this.task5=this.tickets.length
              this.countTicket(this.textidp.substring(0, this.textidp.length - 1),1)
              this.viewT=true
              this.selectedItemNgModel=null
              this.listTicket()
            }
          );

        }
      }
    );
  }

  countTicket(idSub,opt){
    //Tareas sin programar
    this.visitService.list_task(idSub,"28",opt).subscribe(
      response => {
        console.log(response['taskList'])
        this.task1=response['taskList'].length
      }
    );

    //Tareas en reasignadas
    this.visitService.list_task(idSub,"25",opt).subscribe(
      response => {
        console.log(response['taskList'])
        this.task3=response['taskList'].length
      }
    );

    //Tareas en programadas
    this.visitService.list_task(idSub,"23",opt).subscribe(
      response => {
        console.log(response['taskList'])
        this.task6=response['taskList'].length
      }
    );

    //Tareas en proceso
    this.visitService.list_task(idSub,"24",opt).subscribe(
      response => {
        console.log(response['taskList'])
        this.task7=response['taskList'].length
      }
    );

    //Tareas en finalizadas 26
    this.visitService.list_task(idSub,"26",opt).subscribe(
      response => {
        console.log(response['taskList'])
        this.task2=response['taskList'].length
      }
    );
  }

  listTicket(){
    let aux1=[]
    console.log(this.tickets.length)

    this.tickets = this.tickets.sort((a, b) => {
      if (a.id < b.id) {
        return -1;
      }
    });
    let aux2=this.tickets.length - 1;
    for (let index = 0; index < this.tickets.length; index++) {
      const element = this.tickets[aux2];
      console.log(element)
      let data0;
      let data1;
      let data2;
      let data = element.resp
      if(data[0]){ data0 = data[0].value }else{ data0 = "" }
      if(data[1]){ data1 = data[1].value }else{ data1 = "" }
      if(data[2]){ data2 = data[2].value }else{ data2 = "" }
      aux1[index]={
        id:element.serial+"-"+element.id,
        answer_form_id: "",
        name:"Ticket #"+element.serial,
        address:data0,
        creation_date:element.creation_date,
        description:data2,
        duration:"",
        finish_date:"",
        finish_hour:"",
        initial_date:"",
        initial_hour:"",
        modify_date:"",
        phone:data1,
        serial_number:element.serial,
        state__name:"Tickets",
        state_id:"",
        subproject_id:"",
        user__first_last_name:null,
        user__first_name:null,
        user__middle_name:null,
        user__role_enterprise_id:null,
        user__second_last_name:null,
        user_id:null,
        subproject__name:element.nameSubproyect,
      };
      aux2=aux2-1
    }
    for (let index = 0; index < this.data.length; index++) {
      const element = this.data[index];
      aux1.push(element)
    }
    this.task4=aux1.length
    this.source.load(aux1)
    console.log(aux1)
  }

  viewTask(i){
    console.log(i)
    this.ValueNameJson=""
    this.ValueDateJson=""
    this.ValueHIJson=""
    this.ValueHFJson=""
    this.ValueDesJson=""
    this.ValueEstJson=""
    this.ValuecreateJson=""
    this.ValueUserJson="N/A"

    if(this.Tasks.length > 0){
      this.ValueNameJson=this.Tasks[i].name
      this.ValueDateJson=this.Tasks[i].initial_date
      this.ValueHIJson=this.Tasks[i].initial_hour
      this.ValueHFJson=this.Tasks[i].finish_hour
      this.ValueDesJson=this.Tasks[i].description
      this.ValueEstJson=this.Tasks[i].state__name
      this.ValuecreateJson= new DatePipe('en-EN').transform(this.Tasks[i].creation_date, 'yyyy-MM-dd HH:mm:ss');
      if(this.Tasks[i].user__role_enterprise_id != null){
        let name="";
        let lastName="";
        let secontName="";
        let secontLastName="";
        if (this.Tasks[i].user__middle_name != null)
          secontName=this.Tasks[i].user__middle_name
        if (this.Tasks[i].user__first_name != null)
          name=this.Tasks[i].user__first_name
        if (this.Tasks[i].user__first_last_name != null)
          lastName=this.Tasks[i].user__first_last_name
        if (this.Tasks[i].user__first_last_name != null)
          secontLastName=this.Tasks[i].user__second_last_name
        this.ValueUserJson = name+" "+secontName+" "+lastName+" "+secontLastName
      }
    }
  }

  btnRedirect(opt){
    switch (opt) {
      case 1:
        window.open('/pages/visits/programming/create/' + this.idSub[0]+'/1', '_blank');
        break;
      case 2:
        window.open('/pages/visits/ticket/' + this.idSub[0]+'/'+this.mainF, '_blank');
        break;
      case 3:
        if (this.viewT){
          //window.open('/pages/visits/proyect', '_blank');
          this.router.navigate(['/pages/visits/proyect', {}]);
        }else{
          window.open('/pages/visits/subproyect/'+this.idSub[2], '_blank');
        }

        break;
      default:
        break;
    }
  }

}
