import { Component, ViewChild, OnInit, ElementRef, ViewContainerRef } from '@angular/core';
import { AnswerService } from '../../../services/answer.service';
import { FormService } from '../../../services/form.service';
import { ToastService } from '../../../usable/toast.service';
import { AssociateService } from '../../../services/associate.service';
import { UserService } from '../../../services/user.service';
import { SwitchService } from '../../../services/switch.service';
import { VisitsService } from '../../../services/visits.service';

import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { NbTagComponent, NbTagInputDirective, NbWindowService, NbWindowControlButtonsConfig, NbWindowState } from '@nebular/theme';
import { MainContainerComponent } from './main-container/main-container.component';


@Component({
  selector: 'ngx-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.scss']
})
export class ReportComponent implements OnInit {

  options = [];
  filteredOptions$: Observable<any[]>;
  filteredUser$: Observable<any[]>;
  filteredHelp$: Observable<any[]>;
  name_option_user;
  name_option_help;

  name_option;
  id_option;
  date_init: Date;
  date_end: Date;
  // date_init = new Date();
  // date_end = new Date();
  loading = false;
  data_filter = {};
  data_table = {
    'head': ['#', 'Nombreeeeeeeee Largooo', 'Nombre', 'Apellido', 'Nombre', 'Apellido', 'Fecha', 'Nombre', 'Nombre', 'Apellido', 'Nombre', 'Apellido', 'Fecha'],
    'body': [
      ['1', 'juan jo hernandez cortecero', 'juan', 'Hernandez', 'Carlos', 'Obregon', '2022-09-26', 'juan jo', 'juan', 'Hernandez', 'Carlos', 'Obregon', '2022-09-26'],
      ['', '', 'mar', 'lon',  'emi', 'lio', '', '', 'mar', 'lon',  'emi', 'lio', ''],
      ['2', 'juan jo', 'juan', 'Hernandez', 'Carlos', 'Obregon', '2022-09-27', 'juan jo', 'juan', 'Hernandez', 'Carlos', 'Obregon', '2022-09-26'],
      ['', '', 'mar', 'lon',  'emi', 'lio', '', '', 'mar', 'lon',  'emi', 'lio', ''],
      ['3', 'juan jo', 'juan', 'Hernandez', 'Carlos', 'Obregon', '2022-09-26', 'juan jo', 'juan', 'Hernandez', 'Carlos', 'Obregon', '2022-09-26'],
      ['', '', 'mar', 'lon',  'emi', 'lio', '', '', 'mar', 'lon',  'emi', 'lio', ''],
      ['4', 'juan jo', 'juan', 'Hernandez', 'Carlos', 'Obregon', '2022-09-27', 'juan jo', 'juan', 'Hernandez', 'Carlos', 'Obregon', '2022-09-26'],
      ['', '', 'mar', 'lon',  'emi', 'lio', '', '', 'mar', 'lon',  'emi', 'lio', ''],
      ['', '', 'otra', 'fila',  '', '', '', '', '', '', '', ''],
      ['5', 'juan jo', 'juan', 'Hernandez', 'Carlos', 'Obregon', '2022-09-26', 'juan jo', 'juan', 'Hernandez', 'Carlos', 'Obregon', '2022-09-26'],
    ],
  };
  optDocType =[
    {id: "1", name: "Soporte"},
    {id: "2", name: "Tareas"},
  ];
  first_num = 0;
  count = 0;
  list_rol;
  list_process;
  rol_select="0";
  shipment="0";
  process_select="0";
  addressee="";
  list_user;
  list_help;
  user_select=[];
  user_select_id=[];
  user_select_id_p=[];
  optionR="1";
  field_disabled="0";
  option_date="1";
  zipPermission = true;
  validate_info = false;
  minimize = true;
  maximize = true;
  fullScreen = false;
  checked = false;
  close = false;
  nameDocument = '';
  nameReportDocument = '';
  valorFinal;
  SubProyect;
  selectedItemNgModel='';
  selectedOption: string = "1";
  type_report=1
  help_select=[];
  help_select_id=[];
  help_select_name=[];
  help_select_id_P=[];
  count_support_excel;
  name_support_excel;
  id_support_excel;
  textTamVisit=true
  permit_list_prev=false
  name_help=''
  idSuProyect="0";
  dataResponseVisit;
  tam_report_visit=false
  tam_data_visit=0
  Proyect;
  nameVisitF='';
  documentSoportSelect;
  documentVisit = [];
  name_doc = []

  onPermit(id:number): Boolean {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['permission'].includes(id)) {
      return false;
    }
    return true;
  }

  permit_list_hzip=this.onPermit(69);
  permit_list_btnVisit=this.onPermit(63);

  constructor(
    private formService: FormService,
    private answerService: AnswerService,
    private toastService: ToastService,
    private associateService: AssociateService,
    private userService: UserService,
    private router: Router,
    private windowService: NbWindowService,
    private modalSS:SwitchService,
    private visitService:VisitsService,
  ) {
      const user_data = JSON.parse(localStorage.getItem('session')) || null;
      if (user_data['permission'].includes(69)) {
        this.zipPermission=false
      }
  }

  @ViewChild('autoInput') input;
  @ViewChild('autoUser') input_user;
  @ViewChild('autoHelp') input_help;
  ngOnInit(): void {

    this.modalSS.$taskSub.subscribe((valor)=>{
      // console.log("valor traido")
      // console.log(valor)
      this.valorFinal=valor.split("-")
      // console.log(this.valorFinal)
      if(this.valorFinal[0] < 1){
        clearInterval(valor);
      }
    })

    this.loading = true;
    this.formService.list().subscribe(
      form => {
        if (form['status']){
          form['data'].forEach(element => {
            this.options.push({
              'id': element.id,
              'name': element.name,
            });
          });
          this.filteredOptions$ = of(this.options);
          this.loading = false;
        }
      }
    );

    this.associateService.get_role().subscribe(
      response => {
        let data_list = response['data'];
        this.list_rol = data_list;
      }
    );

    this.associateService.get_enterprise_process('DOCUMENTACION').subscribe(
      response => {
        let data_list = response['data'];
        this.list_process = data_list;
      }
    );

    this.associateService.get_user().subscribe(
      response => {
        let data_list = response['data'];
        this.list_user = [];
        data_list.forEach(user => {
          this.list_user.push({
            'id': user.id,
            'name': user.first_name +' '+ user.middle_name + ' ' + user.first_last_name+ ' '+ user.second_last_name,
            'state': user.state,
          })
        });
        if(this.type_report == 1){
          this.list_user.push({
            'id': 0,
            'name': 'Usuario Público',
            'state': true,
          })
        }
        this.filteredUser$ = of(this.list_user);
      }
    );

  }

  private filter(value){
    const filterValue = value.toLowerCase();
    let list_option_filter = this.options.filter(option => option.name.toLowerCase().includes(filterValue));
    return list_option_filter;
  }

  getFilteredOptions(value): Observable<any[]> {
    return of(value).pipe(
      map(filterString => this.filter(filterString)),
    );
  }

  onChange() {
    if ((''+this.input.nativeElement.value).trim() == '') {
      this.id_option = undefined;
    }
    this.filteredOptions$ = this.getFilteredOptions(this.input.nativeElement.value);
  }

  onSelectionChange($event) {
    this.name_option = $event.name;
    // if (this.name_option == undefined) {
    //   this.name_option = $event
    // }

    if ($event.id != undefined) {
      if (!this.name_doc.includes($event.name)) {
        this.name_doc.push($event.name);
      }
      this.id_option = $event.id;
      // Reiniciar Filtros
      this.nameDocument = ''
      this.count = 0
      this.validate_info = false;
      this.option_date="1";
      this.rol_select="0";
      this.optionR="1";
      this.field_disabled="0";      
      this.date_init = null;
      this.date_end = null;
      this.user_select = [];
      this.user_select_id = [];
      this.user_select_id_p = [];
      this.shipment="0";
      this.process_select="0";
      this.addressee="";  
    }
  }

  // Filtro de Usuarios
  private filterUser(value){
    const filterValue = value.toLowerCase();
    let list_user_filer = this.list_user.filter(user => user.name.toLowerCase().includes(filterValue));
    return list_user_filer;
  }

  // Filtro de visitas
  private filterHelp(value){
    const filterValue = value.toLowerCase();
    let list_help_filer = this.list_help.filter(user => user.name.toLowerCase().includes(filterValue));
    return list_help_filer;
  }

  getFilteredUsers(value): Observable<any[]> {
    return of(value).pipe(
      map(filterString => this.filterUser(filterString)),
    );
  }

  getFilteredHelp(value): Observable<any[]> {
    return of(value).pipe(
      map(filterString => this.filterHelp(filterString)),
    );
  }

  onChangeUser() {
    this.filteredUser$ = this.getFilteredUsers(this.input_user.nativeElement.value);
  }

  onChangeHelp() {
    this.filteredHelp$ = this.getFilteredHelp(this.input_help.nativeElement.value);
  }

  onSelectionUserChange($event) {
    this.name_option_user = $event.name;

    if ($event.id != undefined) {
      this.user_select.push($event);
      this.user_select_id.push($event.id);
      this.name_option_user=''
    }
  }

  onSelectionHelpChange($event) {
    this.name_option_help = $event.name;

    if ($event.id != undefined) {
      this.help_select.push($event);
      this.help_select_id.push($event.id);
      this.help_select_name.push($event.name);
      this.name_option_help=''
      if(this.help_select.length > 1){
        this.textTamVisit=false
      }else{
        this.textTamVisit=true
      }
    }
  }

  // Funcion que permite validar el el tipo de documento escogido
  onChangeTypeDoc(event: any): void {
    if (event === "2") {
      this.checked = true; // Si se selecciona la opción "Tareas", cambia checked a True
    }else{
      this.checked = false; // Si se selecciona la opción "Soporte", cambia checked a false
    }
    this.validate_info = false;
    this.count = 0
    this.option_date="1";
    this.rol_select="0";
    this.optionR="1";
    this.field_disabled="0";      
    this.date_init = null;
    this.date_end = null;
    // this.list_help = [];
    // this.help_select = [];
    // this.help_select_id = [];
    // this.help_select_name
    // this.help_select_id_P = [];
    // this.user_select = [];
    // this.user_select_id = [];
    // this.user_select_id_p = [];
  }

  // VALIDACION DE SI SE TIENE O NO FILTROS
  onPreview() {
    if ((this.id_option != undefined && this.type_report == 1) || this.type_report == 2 || this.type_report == 3) {
      if(this.nameDocument == '' && this.type_report == 1 ) {
        this.nameDocument = 'Reporte '+ this.name_doc[this.name_doc.length - 1]
        this.nameReportDocument = this.nameDocument
      } else if (this.type_report == 2){
        this.nameDocument = 'Reporte ' + this.name_help
        this.nameReportDocument = this.nameDocument
        this.id_option = ''
      } else if (this.nameDocument == '' && this.type_report == 3){
        this.nameDocument = 'Reporte Enviados' + (this.name_doc[this.name_doc.length - 1] != '' ? (' - ' + this.name_doc[this.name_doc.length - 1]) : '');
        this.nameReportDocument = this.nameDocument;
      }
      this.name_doc.length=0

      this.loading = true;
      let userSelect;
      if(this.rol_select != "0"){
        if(this.user_select.length == 0){
          userSelect = this.user_select_id_p
        }else{
          userSelect = this.user_select_id
        }
      }else{
        userSelect = this.user_select_id
      }

      this.documentSoportSelect;
      if(this.help_select_id.length > 0){
        this.documentSoportSelect=this.help_select_id
      }else{
        this.documentSoportSelect=this.help_select_id_P
      }
      // console.log(this.documentSoportSelect)

      this.data_filter = {
        id: this.id_option,
        date_init: this.date_init,
        date_end: this.date_end,
        rol_select: this.rol_select,
        user_select: userSelect,
        formatDate: this.optionR,
        field_disabled: this.field_disabled,
        option_date: this.option_date,
        type_report:this.type_report,
        document_soport:this.documentSoportSelect,
        sub_proyect:this.idSuProyect,
        Cticket: this.checked,
        process_select: this.process_select,
        shipment: this.shipment,
        addressee: this.addressee,
      }
      // console.log("this.data_filter general:::::::::::::::::::::::r")
      // console.log(this.data_filter)
      this.answerService.get_document_excel(this.data_filter).subscribe(
        response => {
          if (response['status']) {
            if (this.type_report == 1 || this.type_report == 3) {
              this.data_table = response['data']['table'];
              // Cantidad total
              this.count = response['data']['count'];
              this.validate_info = true;
              // Cantidad que se esta mostrando
              if (this.type_report == 1) {
                let array_answer_id = []
                response['data']['table']['body'].forEach(element => {
                  array_answer_id.push(element[0])
                });
                array_answer_id = array_answer_id.filter((el, i, a) => i === a.indexOf(el))
                this.first_num = array_answer_id.length;
              } else {
                this.first_num = response['data']['table']['body'].length;
              }
            } else if (this.type_report == 2) {
              this.count = response['data']['count'];
              let support_count=[];
              let support_name=[];
              let support_id=[];
              response['data'].forEach(element => {
                if(element.count > 0){
                  support_count.push(element.count)
                  support_name.push(element.nameForm)
                  support_id.push(element.idForm)
                }
              });
              this.validate_info = true;
              this.count_support_excel = support_count
              this.name_support_excel = support_name
              this.id_support_excel = support_id
              this.dataResponseVisit=response
              // console.log(response)
              if(response['data'].length > 0){
                this.tableVisit(0)
              }else{
                this.tam_report_visit=false
                this.count = 0;
              }
            }
          }
          this.loading = false;
        },
        error => {
          this.loading = false;
          this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
        }
      );
    } else {
      this.count = 0;
      this.data_table = {
        'head': [],
        'body': [],
      };
      this.toastService.showToast('info', 'Reporte', 'Debes seleccionar el documento');
    }
  }

  tableVisit(index){
    if(this.dataResponseVisit['data'].length > 1){
      this.tam_report_visit=true
    }else{
      this.tam_report_visit=false
    }

    if(this.dataResponseVisit['data'].length > 0){

      this.nameVisitF=this.dataResponseVisit['data'][index]['nameForm'];
      this.data_table = this.dataResponseVisit['data'][index]['table'];
      this.count = this.dataResponseVisit['data'][index]['count'];
      let array_answer_id = []
      this.dataResponseVisit['data'][index]['table']['body'].forEach(element => {
        array_answer_id.push(element[0])
      });
      array_answer_id = array_answer_id.filter((el, i, a) => i === a.indexOf(el))
      this.first_num = array_answer_id.length;
    }else{
      this.tam_report_visit=false
      this.count = 0;
    }
  }

  cambioHoja(hoja){
    if(hoja == 1){
      if( this.tam_data_visit < this.dataResponseVisit['data'].length-1){
        this.tam_data_visit = this.tam_data_visit + 1
        this.tableVisit(this.tam_data_visit)
      }
    }else{
      if( (this.tam_data_visit <= this.dataResponseVisit['data'].length-1) && (this.tam_data_visit != 0)){
        this.tam_data_visit = this.tam_data_visit - 1
        this.tableVisit(this.tam_data_visit)
      }
    }
  }

  onReport() {
    this.loading = true;
    this.data_filter['file'] = true;
    if(this.type_report == 1 || this.type_report == 3 || this.checked){
      this.data_filter['amount'] = [this.count]
      this.data_filter['name_support_excel'] = [this.nameReportDocument];
    }else if(this.type_report == 2){
      if(this.checked == false){
        this.data_filter['amount'] = this.count_support_excel
        this.data_filter['document_soport'] = this.id_support_excel
        this.data_filter['name_document'] = this.nameDocument;
        this.data_filter['name_support_excel'] = this.name_support_excel
      }
      // this.data_filter['id_document_visit'] = this.documentSoportSelect[this.tam_data_visit]
    }
    // console.log("this.data_filter:::::::::::::::");
    // console.log(this.data_filter);
    //this.loading = false;
    this.answerService.get_document_excel(this.data_filter).subscribe(
      response => {
        console.log("Reporte excel")
        console.log(response)
        this.openWindow();
        //this.downLoadFile(response, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        this.loading = false;
      },
      error => {
        this.loading = false;
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      }
    );
  }

  onReportPDF(value) {
    this.data_filter['sub_project'] = this.idSuProyect,
    this.data_filter['Cticket'] = this.checked
    if(value == 1){
      this.loading = true;
      this.data_filter['id'] = [this.id_option]
      this.data_filter['name_document'] = [this.nameDocument]
      this.data_filter['name_report_document'] = this.nameReportDocument;
      this.downloadReport(this.data_filter)
    }else{
      if(this.help_select.length == 0){
          this.loading = true;
          this.data_filter['id'] = this.help_select_id_P
          this.data_filter['name_document'] = this.documentVisit
          this.data_filter['name_report_document'] = this.nameReportDocument;
          this.downloadReport(this.data_filter)
      }
      else{
          this.loading = true;
          this.data_filter['id'] = this.help_select_id;
          this.data_filter['name_document'] = this.help_select_name
          this.data_filter['name_report_document'] = this.nameReportDocument;
          this.downloadReport(this.data_filter)
      }
    }
  }

  downloadReport(data_filter){
    // console.log("data_filter::::: ZIP")
    // console.log(data_filter)
    this.loading = false;
    this.answerService.create_document_zip_pdf(data_filter).subscribe(
      response => {
        if(response['status']){
          this.openWindow();
          this.loading = false;
          //this.router.navigate(['/pages/answer/report/zip']);
        }else{
          this.toastService.showToast('warning', 'Detalle', response['detail']);
          //this.router.navigate(['/pages/answer/report/zip']);
          this.loading = false;
        }
      },
      error => {
        this.loading = false;
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      }
    );
  }

  downLoadFile(data: any, type: string) {
    let blob = new Blob([data], { type: type});
    let url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.nameDocument;
    a.click();
    URL.revokeObjectURL(a.href);
    /* let pwa = window.open(url);
    if (!pwa || pwa.closed || typeof pwa.closed == 'undefined') {
      console.log('Error');
    } */
  }

  onChangeOptionRol(){
    // console.log(this.rol_select);
    this.user_select = [];
    this.user_select_id = [];
    this.list_user = [];
    this.user_select_id_p = [];
    this.name_option_user = "";

    if(this.rol_select != "0"){
      this.userService.get_user_role(this.rol_select).subscribe(
        response => {
          let data_list = response['data'];
          this.list_user = [];
          data_list.forEach(user => {
            this.list_user.push({
              'id': user.id,
              'name': user.first_name +' '+ user.middle_name + ' ' + user.first_last_name+ ' '+ user.second_last_name,
              'state': user.state,
            })
          });

          this.filteredUser$ = of(this.list_user);

          for (let index = 0; index < data_list.length; index++) {
            const element = data_list[index];
            this.user_select_id_p.push(element.id);
          }
          // console.log(this.user_select_id_p);
        }
      );
    }else{
      this.associateService.get_user().subscribe(
        response => {
          let data_list = response['data'];
          this.list_user = [];
          data_list.forEach(user => {
            this.list_user.push({
              'id': user.id,
              'name': user.first_name +' '+ user.middle_name + ' ' + user.first_last_name+ ' '+ user.second_last_name,
              'state': user.state,
            })
          });
          this.filteredUser$ = of(this.list_user);
        }
      );
    }
  }

  onTagRemove(tagToRemove: NbTagComponent): void {
    let position = this.user_select.map(function(e) { return e.id; }).indexOf(tagToRemove._hostElement.nativeElement.key);
    if (position != -1) {
      this.user_select.splice(position, 1);
      this.user_select_id.splice(position, 1);
    }
  }

  onTagRemoveHelp(tagToRemove: NbTagComponent): void {
    let position = this.help_select.map(function(e) { return e.id; }).indexOf(tagToRemove._hostElement.nativeElement.key);
    if (position != -1) {
      this.help_select.splice(position, 1);
      this.help_select_id.splice(position, 1);
      this.help_select_name.splice(position, 1);
    }
    if(this.help_select.length > 1){
      this.textTamVisit=false
    }else{
      this.textTamVisit=true
    }
  }

  openWindow() {
    // console.log("INGRESA !!1")
    const idContBtn = document.getElementById('id_2');
    // console.log("idContBtn:::::")
    // console.log(idContBtn)
    // console.log(this.valorFinal)
    if(idContBtn != null){
      clearInterval(this.valorFinal[0])
      const windowRef = this.answerService.getWindowRef();
      if (windowRef) {
        windowRef.close();
      }
    }

    setTimeout(() => {
      const buttonsConfig: NbWindowControlButtonsConfig = {
        minimize: this.minimize,
        maximize: this.maximize,
        fullScreen: this.fullScreen,
        close: this.close,
        };
      const windowRef = this.windowService.open(MainContainerComponent, { title: `Descargando informes`, buttons: buttonsConfig, closeOnEsc:false, windowClass: "window-form-popup"});
      this.answerService.setWindowRef(windowRef);
    }, 1000);

  }

  onButtonGroupClick($event){
    let clickedElement = $event.target || $event.srcElement;
    if( clickedElement.nodeName === "BUTTON" ) {

      let isCertainButtonAlreadyActive = clickedElement.parentElement.querySelector(".btn-activate");
      // if a Button already has Class: .active
      if( isCertainButtonAlreadyActive ) {
        isCertainButtonAlreadyActive.classList.remove("btn-activate");
      }

      clickedElement.className += " btn-activate";
    }
  }

  btn_view_modul(opt){
    this.list_help = [];
    this.user_select=[];
    this.user_select_id=[];
    this.user_select_id_p=[];
    this.date_init = null;
    this.date_end = null;
    this.name_option='';
    this.nameDocument='';
    this.validate_info = false;
    this.count = 0
    this.help_select=[];
    this.help_select_id=[];
    this.help_select_id_P=[];
    this.textTamVisit=true
    this.name_help=''
    this.idSuProyect="0";
    this.dataResponseVisit;
    this.tam_data_visit=0
    this.Proyect;
    this.nameVisitF='';
    this.documentSoportSelect;
    const index = this.list_user.findIndex(item => item.name === 'Usuario Público');
    // console.log(this.type_report)
    switch (opt) {      
      case 1:
          this.type_report=1
          this.permit_list_prev=false
          this.tam_report_visit=false
          this.checked = false
          this.list_user.push({
            'id': 0,
            'name': 'Usuario Público',
            'state': true,
          });
        break;
      case 2:
          this.type_report=2
          this.selectedItemNgModel=''
          this.permit_list_prev=true
          this.listSubProyect()
          if(this.selectedOption == "1"){
            this.checked = false;
          }else{
            this.checked = true;
          }
          // Encuentra el índice del elemento
          if (index !== -1) {
            // Si el elemento existe, elimínalo
            this.list_user.splice(index, 1);
          }
        break;
      case 3:
          this.type_report=3;
          this.permit_list_prev=false;
          this.tam_report_visit=false;
          this.checked = false;
        break;

      default:
        break;
    }

  }

  listSubProyect(){
    // console.log()
    this.visitService.list_proyect_subproyect().subscribe(
      response => {
        if(response["message"]=="Lista de proyectos y subproyectos"){
          this.SubProyect=response["data"]
        }
      }
    );
  }

  selectSubProyect(){
    this.nameDocument = ''
    this.permit_list_prev=false
    // console.log(this.selectedItemNgModel)
    let idSub = this.selectedItemNgModel.split("_")
    this.list_help = [];
    this.help_select = [];
    this.help_select_id = [];
    this.help_select_name
    this.help_select_id_P = [];
    let numeros=idSub[3]
    this.Proyect=idSub[2]
    this.idSuProyect=idSub[0]

    this.SubProyect.forEach(element => {
      if(element.idP == this.Proyect){
        element.data.forEach(element => {
          if(element.id == this.idSuProyect){
            this.name_help=element.name
          }
        });
      }
    });

    this.options.forEach(element => {
      if(numeros.includes(element.id)){
        this.list_help.push({
          'id': element.id,
          'name': element.name,
        });
        this.help_select_id_P.push(element.id);
        this.documentVisit.push(element.name);
      }
    });
    this.filteredHelp$ = of(this.list_help);
    // Reiniciar Filtros
    this.validate_info = false;
    this.count = 0
    this.option_date="1";
    this.rol_select="0";
    this.optionR="1";
    this.field_disabled="0";      
    this.date_init = null;
    this.date_end = null;
    this.user_select = [];
    this.user_select_id = [];
    this.user_select_id_p = [];

  }

}
