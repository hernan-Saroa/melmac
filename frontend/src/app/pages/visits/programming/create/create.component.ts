import { Component, OnInit,ViewChild, ChangeDetectionStrategy,HostBinding  } from '@angular/core';
import { MatTable } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { NbSidebarService,NbDateService,NbGlobalPhysicalPosition, NbToastrService,NbDialogRef,NbDialogService  } from '@nebular/theme';
import { SwitchService } from '../../../../services/switch.service';
import { VisitsService } from '../../../../services/visits.service';
import { ProgrammingService } from '../../../../services/programming.service';
import { ToastService } from '../../../../usable/toast.service';
import { Location } from '@angular/common';

@Component({
  selector: 'ngx-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'example-height-60' },
})

export class CreateComponent implements OnInit {

  @ViewChild(MatTable) tabla1!: MatTable<Articulo>;
  @ViewChild('item') accordion;
  @HostBinding('class')
  classes = 'example-items-rows';
  private textToast;
  private descToast;

  positions = NbGlobalPhysicalPosition;
  date = new Date();
  min: Date;
  max: Date;
  idSubProyect;
  programmingType;
  Finicial;
  Ffinal;
  loading = true;
  valor1;
  taskInfo="0";
  nameSubProyectfinal;
  ngModelValue = '0';
  ngModelRadioName;
  TaskTotal;
  dataProgramming;
  Tasks=[];
  hoy;
  week;
  titleTable="TABLA DE DISPONIBLES";;

  //Titulos de las cabeceras
  columnas: string[] = ['hora','domingo','lunes', 'martes', 'miercoles','jueves','viernes','sabado'];

  //Matriz inicial
  datos: Articulo[] =
  [
  new Articulo("","", "", "","","","",""),
  new Articulo("01:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("02:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("03:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("04:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("05:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("06:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("07:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("08:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("09:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("10:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("11:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("12:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("13:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("14:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("15:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("16:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("17:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("18:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("19:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("20:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("21:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("22:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  new Articulo("23:00:00","0 disp", "0 disp", "0 disp","0 disp","0 disp","0 disp","0 disp"),
  ];

  constructor(
    private toastrService: NbToastrService,
    private visitService:VisitsService,
    private programmingService:ProgrammingService,
    private activatedRoute: ActivatedRoute,
    private sidebarService: NbSidebarService,
    private nameSubProyect:SwitchService, 
    private dateService: NbDateService<Date>,
    private dialogService :NbDialogService,
    private _location: Location) {

    this.visitService.list_proyect_subproyect().subscribe((valor)=>{
      this.valor1=valor['data']
      this.nameSubProyectfinal = this.valor1[0]['data'][0]['name']
    })
    this.min = dateService.addDay(this.date, 0);
    this.max = dateService.addMonth(this.date, 1);
  }

  ngOnInit(): void {
    this.idSubProyect = this.activatedRoute.snapshot.paramMap.get('id');
    this.programmingType = this.activatedRoute.snapshot.paramMap.get('option');

    if(this.programmingType == "1"){
      //console.log("programacion manual")
        setTimeout(() => {
          this.accordion.toggle();
          this.sidebarService.compact('menu-sidebar');
        }, 600);


        const diasRestantes = 0 + this.date.getDay()
        const diasFaltantes = 6 - this.date.getDay()
        this.Finicial=this.sumarDias(this.date, -diasRestantes)
        this.Ffinal=this.sumarDias(this.date, diasFaltantes)
        this.hoy = this.sumarDias(this.date, 0)

        this.datos[0]['domingo']=this.Finicial
        this.datos[0]['lunes']=this.sumarDias(this.Finicial, 2)
        this.datos[0]['martes']=this.sumarDias(this.Finicial, 3)
        this.datos[0]['miercoles']=this.sumarDias(this.Finicial, 4)
        this.datos[0]['jueves']=this.sumarDias(this.Finicial, 5)
        this.datos[0]['viernes']=this.sumarDias(this.Finicial, 6)
        this.datos[0]['sabado']=this.Ffinal;

        this.restDataInitial(0)

    }else{
      //console.log("programacion automatica")
    }
  }

 // #Inicion de proceso para realizar programaciones desde 0  -- SECCIÓN CRUD
 // En las siguientes lineas se encontrara un proceso para cuando se genera una programación desde 0

  sumarDias(fecha, dias){
    var res = new Date(fecha);
    res.setDate(res.getDate() + dias);
    let mes;
    let dia;

    if( res.getMonth()+1 < 10 ){
      mes ="0" + Number(res.getMonth()+1)
    }else{
      mes = res.getMonth()+1;
    }

    if(res.getDate() < 10){
      dia ="0"+ Number(res.getDate())
    }else{
      dia =res.getDate()
    }
    return res.getFullYear()+"-"+mes+"-"+dia;
  }

  dateF(event){
    //console.log("aqui")
    const diasRestantes = 0 + event.getDay()
    const diasFaltantes = 6 - event.getDay()
    this.Finicial=this.sumarDias(event, -diasRestantes)
    this.Ffinal=this.sumarDias(event, diasFaltantes)

    this.datos[0]['domingo']=this.Finicial
    this.datos[0]['lunes']=this.sumarDias(this.Finicial, 2)
    this.datos[0]['martes']=this.sumarDias(this.Finicial, 3)
    this.datos[0]['miercoles']=this.sumarDias(this.Finicial, 4)
    this.datos[0]['jueves']=this.sumarDias(this.Finicial, 5)
    this.datos[0]['viernes']=this.sumarDias(this.Finicial, 6)
    this.datos[0]['sabado']=this.Ffinal

    return this.datos[0]['domingo']+","+this.datos[0]['lunes']+","+this.datos[0]['martes']+","+this.datos[0]['miercoles']+","+this.datos[0]['jueves']+","+this.datos[0]['viernes']+","+this.datos[0]['sabado']
  }

  celdaDisponibles(dia,hora,j){
    let valor;
    valor = this.datos[j][dia].split(" ")
    if(valor[1] == 'disp'){
      if(valor[0] == "Ø"){
        this.textToast="FECHA Y HORA BLOQUEADA"
        this.descToast="El horario escogido esta bloqueado, por favor seleccione otro horario, este ya fue se vencio por calendario."
        this.showToast(this.positions.BOTTOM_LEFT, 'danger')
      }else{
        //console.log("disponibles fuera del dia de la tarea")
        this.textToast="FECHA Y HORA FUERA DEL RANGO"
        this.descToast="El horario escogido esta fuera del rango (fecha y/u hora) de la estimacion de la tarea seleccionada, en caso que desee cambiar el rango por favor edite la tarea."
        this.showToast(this.positions.BOTTOM_LEFT, 'warning')
      }
    }else if(valor[1] == 'disponible(s)'){
      //console.log("disponibles de la tarea seleccionada")
      if(valor[0] == "0"){
        //console.log("disponibles fuera del dia de la tarea")
        this.textToast="FECHA Y HORA SIN DISPONIBLES"
        this.descToast="En el horario no se encuentra personal disponible para realizar la tarea, en caso que desee cambiar el rango por favor edite la tarea."
        this.showToast(this.positions.BOTTOM_LEFT, 'danger')
      }else if(hora != '' && valor[0] != "Ø"){
        //console.log(dia)
        //console.log(hora)
        //console.log(j)
        //console.log(this.datos[j][dia])
        //console.log(this.ngModelValue)
        this.asignarTask()
        //this.datos[j][dia]=10
      }
    }else{
      //console.log("click a  elemento de la tabla de tareas asignadas")

    }
  }

  infoTask(j,value){
    //console.log("task1")
    this.taskInfo=value;
    this.ngModelRadioName = this.Tasks[j].name
    setTimeout(() => {
      this.taskInfo="0";
    }, 600);
  }

  viewTask(j){
    if(this.taskInfo == '0'){
      //console.log("task")
      this.printCalendarBlock(this.hoy,2)
      this.loading=true;
      document.getElementById('btnoculto').click();
      this.ngModelRadioName = this.Tasks[j].name
      this.taskInfo="0";
      this.consultaDia(j)
    }
  }

  viewTable(value){
    if(value == 1){
      this.titleTable="TABLA DE DISPONIBLES";

    }else{
      this.titleTable="TABLA DE TAREAS ASIGNADAS";

    }
  }

  printCalendarBlock(hoy,option=1){
    if(option == 1){
      for (let index = 1; index < this.columnas.length; index++) {
        const element = this.columnas[index];
        if(hoy <= this.datos[0][element]){
          for (let index = 1; index < 24; index++) {
            let textID=element+'_'+index;
            const box0 = document.getElementById(textID.toString());
            box0.classList.remove("blockDay");
          }
        }else{
          for (let index = 1; index < 24; index++) {
            let textID=element+'_'+index;
            const box0 = document.getElementById(textID.toString());
            box0.classList.add("blockDay");
            this.datos[index][element]="Ø disp"
          }
        }
      }
    }else{
      for (let index = 1; index < this.columnas.length; index++) {
        const element = this.columnas[index];
        for (let index = 1; index < 24; index++) {
          let textID=element+'_'+index;
          const box0 = document.getElementById(textID.toString());
          box0.classList.remove("HourAtiveDisp");
          box0.classList.remove("HourInactiveDisp");
        }
      }
    }
  }

  printCalendarHourBlock(hoy){
    var today = new Date();
    var now = today.toLocaleString();
    let dayH1 = now.split(" ")
    let dayH2 = dayH1[1].split(":")
    let idDay=this.columnas[today.getDay()+1]

    this.datos[0][idDay]
    if (hoy == this.datos[0][idDay]) {
      for (let index = 1; index < this.datos.length; index++) {
        const element2 = this.datos[index].hora
        let dayBase = element2.split(":")
        if(Number(dayBase[0]) <= Number(dayH2[0])){
          let textID=idDay+'_'+index;
          const box0 = document.getElementById(textID.toString());
          box0.classList.add("blockDay");
          this.datos[index][idDay]="Ø disp"
        }
      }
    }
  }

  restDataInitial(ind){
    this.visitService.list_task(this.idSubProyect,"28").subscribe(
      response => {
        //console.log(response['taskList'].length)
        if(response['taskList'].length != 0){
          //console.log(response['taskList'])
          this.Tasks=response['taskList']
          this.ngModelRadioName=this.Tasks[0].name
          this.TaskTotal = this.Tasks.length
          //console.log(this.Tasks)
          this.consultaDia(ind)
        }else{
          document.getElementById('btnoculto2').click();
        }
      }
    );

  }

  borrar(){
    this.TaskTotal = 0
    this.ngModelRadioName= "Sin tareas por asignar"
    for (let index = 1; index < this.columnas.length; index++) {
      const element = this.columnas[index];
      for (let index = 1; index < 24; index++) {
        let textID=element+'_'+index;
        const box0 = document.getElementById(textID.toString());
        box0.innerHTML="0 disp"
      }
    }
    this.loading=false
  }

  consultaDia(indice){
    //console.log("consultaDia")
    //console.log(indice)
    //priemra tarea
    let dayT=this.Tasks[indice].initial_date.split("-")
    this.date = new Date(dayT[0],dayT[1]-1,dayT[2]);
    let week=this.dateF(this.date)
    this.week=week
    let dayH=this.Tasks[indice].initial_hour.split(":")
    let idDay=this.columnas[this.date.getDay()+1]
    const box0 = document.getElementById(idDay+"_"+Number(dayH[0]).toString());
    this.programmingService.programming_available(this.idSubProyect,this.Tasks[indice].id,this.week).subscribe(
      response => {
        //console.log(response)
        if(response['message'] == "usurios con permiso de visitas"){
          this.dataProgramming=response
          for (let index = 0; index < response['data']['daysDisp'].length; index++) {
            const element = response['data']['daysDisp'][index];
            let dayT2=element['day'].split("-")
            let date2 = new Date(dayT2[0],dayT2[1]-1,dayT2[2]);
            let idDay=this.columnas[date2.getDay()+1]
            for (let index2 = 0; index2 < element['hrI'].length; index2++) {
              const element1 = element['hrI'][index2];
              this.datos[index2+1][idDay]=element1+" disp"
            }
          }

          let tam=response['data'].users_suggested_homework.length;
          if(tam != 0){
            this.datos[Number(dayH[0])][idDay]=tam+" disponible(s)"
            box0.classList.add("HourAtiveDisp");
          }else{
            this.datos[Number(dayH[0])][idDay]="0 disponible(s)"
            box0.classList.add("HourInactiveDisp");
          }
          this.printCalendarBlock(this.hoy)
          this.printCalendarHourBlock(this.hoy)
          this.loading=false;
          document.getElementById('btnoculto').click();
        }else{
          this.Tasks=[]
          this.TaskTotal = 0
          this.ngModelRadioName= "Tiene tareas pero no cuenta con usurios que tengan el permiso de \"Asignarle visitas (tareas)\""
          this.loading=false;
          this.textToast="NO TIENE USUARIOS PARA ASIGANR TAREAS"
          this.descToast="Para poder realizar una programación debe asignarle el permiso de \"Asignarle visitas (tareas)\" en roles."
          this.showToast(this.positions.BOTTOM_LEFT, 'danger')
          document.getElementById('btnoculto').click();
        }

      }
    );
  }

  showToast(position, status) {
    this.toastrService.show(`${this.descToast}`, `${this.textToast}`, { position, status });
  }
  // #Finalizacion de proceso para realizar programaciones desde 0 -- SECCIÓN CRUD

  asignarTask(){
    let dataF;
    let dataAux=[];
    let name = this.Tasks[this.ngModelValue].name
    let id = this.Tasks[this.ngModelValue].id
    let idJsonTask;

    if(this.dataProgramming['data']['users_suggested_homework'].length == this.dataProgramming['data']['users'].length){
      dataF=this.dataProgramming['data']['users']
      //console.log("iguales")
    }else{
      //console.log("diferentes")
      for (let index = 0; index < this.dataProgramming['data']['users_suggested_homework'].length; index++) {
        const element1 = this.dataProgramming['data']['users_suggested_homework'][index];
        //console.log(element1)
        for (let index = 0; index < this.dataProgramming['data']['users'].length; index++) {
          const element = this.dataProgramming['data']['users'][index];
          if(element.id == element1){
            //console.log(element.id)
            dataAux.push(element)
          }
        }
      }
      dataF=dataAux
    }
    //console.log(dataF)
    //console.log(name)


    let data_content = {
      name:name,
      profesionals:dataF,
      idTask:id,
    };
    const dialogRef = this.dialogService.open(ConfirmDialogC, {
      context: {
        data: data_content
      }
    });
    dialogRef.onClose.subscribe(result => {
      if (result == true) {
       //console.log("finaliza")
       //console.log(this.Tasks)
       //console.log(id)

       for (let index = 0; index < this.Tasks.length; index++) {
        const element = this.Tasks[index];
        if(element.id == id ){
          idJsonTask=index
        }
      }
      //console.log(this.Tasks)
       let dayH=this.Tasks[idJsonTask].initial_hour.split(":")
       let idDay=this.columnas[this.date.getDay()+1]
       const box0 = document.getElementById(idDay+"_"+Number(dayH[0]).toString());
       box0.classList.remove("HourAtiveDisp");
       this.restDataInitial(0)
      }
    });
  }

  onBack() {
    this._location.back();
  }

}

export class Articulo {
  constructor(public hora: string,public lunes: string, public martes: string, public miercoles: string, public jueves: string, public viernes: string, public sabado: string, public domingo: string) {
  }
}



/*Modal de creacion de tarea*/
@Component({
  selector: 'confirm-dialog',
  template: `
  <div class="row">
  <div class="col-md-12" style="width: 1000px;">
    <div class="col-md-12 mx-auto container">
      <nb-card>
        <nb-card-header><h2 class="text-center">Asignar Tarea: {{nameF}}</h2></nb-card-header>
        <nb-card-body>
              <div class="form-group">
                <label for="inputName" class="titleLabel" style="font-size: 14px !important;text-transform: uppercase;font-style: italic;font-weight: 600;"> Usuario que realizará la tarea </label><br><br>
                <nb-select fullWidth placeholder="Seleccione un usuario..." [(ngModel)]="selectedItemNgModel" [(selected)]="selectedItems2">
                  <nb-option *ngFor="let forms_data of users;"
                      [value]="forms_data.id">{{ forms_data.name }} {{ forms_data.last_name }} - {{ forms_data.email }} ({{ forms_data.cell }})
                  </nb-option>
                </nb-select>
              </div>
        </nb-card-body>
        <nb-card-footer class="text-right">
          <button nbButton shape="rectangle" status="primary" (click)="onsubmitData()" class="mr-3" >Asignar tarea</button>
          <button nbButton shape="rectangle" status="danger" style="float: left;" (click)="close(false)">Cancelar</button>
        </nb-card-footer>
      </nb-card>
    </div>
  </div>
</div>
`,
})

export class ConfirmDialogC {
  public data: {
    name:string,
    profesionals,
    idTask:string,
  }

  nameF;
  users;
  idTask;
  selectedItemNgModel;
  selectedItems2;

  constructor(
   public dialogRef: NbDialogRef<ConfirmDialogC>,private visitService:VisitsService,private toastService: ToastService ){}

   ngOnInit(): void {
    this.nameF=this.data.name;
    this.users=this.data.profesionals;
    this.idTask=this.data.idTask;
  }

  onsubmitData(){
    //console.log(this.selectedItemNgModel)
    //console.log(this.idTask)
    this.visitService.change_state_task("23",this.idTask,this.selectedItemNgModel).subscribe(
      response => {
        this.toastService.showToast('success', 'Proceso exitoso','Tareas asignada exitosamente')
        this.close(true)
      });
  }

  close(response:boolean){
    this.dialogRef.close(response);
  }
}

