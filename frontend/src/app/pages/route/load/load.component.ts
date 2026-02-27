import { tileLayer, latLng, Map, Layer, LatLng, Marker, Polygon, LatLngExpression, icon } from 'leaflet';
import { NbComponentStatus, NbDialogRef, NbDialogService, NbStepperComponent } from '@nebular/theme';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastService } from './../../../usable/toast.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { RoutingService } from '../../../services/routing.service';
import { AdminService } from '../../../services/admin.service';
import { Observable} from 'rxjs';
import { Row } from 'ng2-smart-table/lib/lib/data-set/row';
import { pines } from '../../../usable/pines';

const html2canvas = require('../../../../../node_modules/html2canvas');

interface TreeNode<T> {
  data: T;
  children?: TreeNode<T>[];
  expanded?: boolean;
}

interface FSEntry {
  name: string;
  lat?: string;
  lon?: string;
  data?: any;
}

@Component({
  selector: 'ngx-load',
  templateUrl: './load.component.html',
  styleUrls: ['./load.component.scss']
})
export class LoadComponent implements OnInit {

  @ViewChild("stepper") stepper: NbStepperComponent;

  id: string
  process_id;
  title_component = 'Proceso de Enrutamiento';
  fileName;
  loading = false;

  loaded = 123;
  errors = 15;

  stepperIndex = 0;

  progress_value = 0;

  // Inputs
  firstForm: FormGroup;
  secondForm: FormGroup;
  thirdForm: FormGroup;
  fourthForm: FormGroup;

  inputMessagersModel:Number;

  messagers = []
  messagers_selected = {}

  addresses = {}

  passFirst = false;
  passSecond = false;
  passThird = false;
  passFourth = false;

  settings_field = {
    hideSubHeader: true,
    noDataMessage: 'Datos no encontrados',
    pager: {
      display: true,
      perPage: 10,
    },
    actions:{
      add: false,
      edit: false,
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
    },
    columns: {
      set: {
        title: 'Obtiene',
        type: 'string',
      },
      get: {
        title: 'Ingresa',
        type: 'string',
      },
    }
  };

  sourceSummary = [{
    text: "Subidas",
    value: 0 + " direcciones"
  },{
    text: "Sin subir",
    value: 0 + " direcciones"
  },{
    text: "Total",
    value: 0 + " direcciones"
  }];

  settingsSummary = {
    mode: 'external',
    pager: {
      display: true,
      perPage: 5,
    },
    hideSubHeader:true,
    hideHeader:true,
    actions:{
      add: false,
      delete: false,
      columnTitle: "Action",
      position:'right',
      edit: true,
    },
    edit: {
      editButtonContent: '<i class="fas fa-download fa-xs"></i>',
    },
    columns: {
      text: {
        title: 'Columna',
        type: 'text',
      },
      value: {
        title: 'Cantidad',
        type: 'text',
      }
    },
  };

  defaultColumns = [ 'name', 'lat', 'lon' ];
  allColumns = [ ...this.defaultColumns ];

  dataTreeGrid:TreeNode<FSEntry>[] = [];

  options = {
    layers: [
      tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
    ],
    zoom: 8,
    center: latLng(4.600868, -74.08175)
  };

  layersControlOptions;

  showLayer = true;
  map:Map;
  answers;
  mainLayer;
  heat_Layer;
  markers: { position:Layer[], paths:Layer[] } = {
    position: [],
    paths: [],
  };
  heat_layers_coords:LatLng[] = [];

  process;

  start_point;
  start_point_sel;

  addresses_enterprise;

  apiLoaded: Observable<boolean>;

  bounds;

  colors = ['#000000', '#ff0000', '#00ff00', '#0000ff'];

  messengerSel = 0;
  public pines: any;
  assigned_pins = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private adminService: AdminService,
    public toastService: ToastService,
    private fb: FormBuilder,
    private service: RoutingService,
    private dialogService :NbDialogService,
  ) {
    this.pines = pines;
    // console.log(pines);
  }

  ngOnInit(): void {

    this.toastService.duration = 5000;

    this.service.getFieldWorkers().subscribe(response => {
      if (response['status']){
        this.messagers = response['data'];
      }
    });

    this.adminService.getLocations().subscribe(response => {
      if (response['status']){
        this.addresses_enterprise = response['data'];
      }
    });

    this.activatedRoute.queryParams
      .subscribe(params => {
        this.process_id = params.id;
      }
    );

    if (this.process_id) {
      this.firstForm = this.fb.group({
        fileName: [''],
      });
      this.secondForm = this.fb.group({
        inputMessagers: [''],
        selectStartPoint: [''],
      });
      this.service.getProcess(this.process_id).subscribe(response => {
        if (response['status']){
          this.fileName = "...";
          this.stepperIndex = response['step'];
          this.loading = true;
          switch(this.stepperIndex){
            case 1:
              this.sourceSummary = [{
                text: "Subidas",
                value: response['data']['success'] + " direcciones"
              },{
                text: "Sin subir",
                value: response['data']['error'] + " direcciones"
              },{
                text: "Total",
                value: response['data']['total'] + " direcciones"
              }];
              this.addresses = response['data']['addresses'];

              this.secondForm = this.fb.group({
                inputMessagers: ['', [Validators.required, Validators.min(1), Validators.max(parseInt(this.sourceSummary[0].value.split(' ')[0]))]],
                selectStartPoint: ['', Validators.required],
              });
              this.process = setInterval(() => {
                this.checkStatus(this.process_id, null);
              }, 5000);


              break;
            case 2:
              this.secondForm = this.fb.group({
                inputMessagers: [''],
                selectStartPoint: [''],
              });
              this.inputMessagersModel = response['detail'].length + 1;
              this.start_point = response['detail'][0]['initial_position_id'] ? response['detail'][0]['initial_position_id'] : this.addresses_enterprise[0]['id'];
              setTimeout(()=>this.stepper.next(), 300);
              this.process = setInterval(() => {
                this.checkStatusSecond(null);
              }, 5000);
              break;
            case 3:

              this.secondForm = this.fb.group({
                inputMessagers: [''],
                selectStartPoint: [''],
              });
              this.inputMessagersModel = response['detail'].length;
              this.start_point = response['detail'][0]['initial_position_id'] ? response['detail'][0]['initial_position_id'] : this.addresses_enterprise[0]['id'];
              setTimeout(()=>this.stepper.next(), 300);
              this.process = setInterval(() => {
                this.checkStatusSecond(null);
              }, 5000);
              break;
            default:
              this.toastService.showToast('warning', 'No hay datos', 'El proceso no fue encontrado o no se inicio exitosamente');
          }
        }
      });
    }
    else {
      this.firstForm = this.fb.group({
        fileName: ['', Validators.required],
      });

      this.secondForm = this.fb.group({
        inputMessagers: ['', [Validators.required, Validators.min(1), Validators.max(parseInt(this.sourceSummary[0].value.split(' ')[0]))]],
        selectStartPoint: ['', Validators.required],
      });
    }

    this.thirdForm = this.fb.group({
      thirdCtrl: [''],
    });

  }

  formData = new FormData();

  onMapReady(map:Map){
    this.map = map;
  }

  setIniPoint(event){
    // console.log(event);
    this.start_point = event;
  }

  onFileSelected(event){
    const file:File = event.target.files[0];

    if (file) {
      this.fileName = file.name;
      this.formData.append("template", file);
    } else {
      this.fileName = null;
    }

  }

  onFirstSubmit(next_first) {
    if (this.fileName != null) {
      this.loading = true;
      let title = "Proceso de Carga de Direcciones Iniciado";
      let message = "El archivo se esta procesando";
      let toast_type:NbComponentStatus = "success";

      this.toastService.showToast(toast_type, title, message);
      this.service.uploadOrder(this.formData).subscribe(response => {
        if (response['status']){
          this.process_id = response['data']['id'];
          this.process = setInterval(() => {
            this.checkStatus(this.process_id, next_first);
          }, 5000);
          if (response['warning']){
            let title = "Aviso";
            let message = response['warning'];
            let toast_type:NbComponentStatus = 'warning';
            this.toastService.showToast(toast_type, title, message);
          }
        } else {
          toast_type = "danger";
          title = "Error";
          message = "No se logró cargar el archivo, intentalo de nuevo mas tarde";
          this.toastService.showToast(toast_type, title, message);
        }

      }, error => {
        let toast_type:NbComponentStatus = "danger";
        this.toastService.showToast(toast_type, "Error", error.error.detail);
        this.loading = false;
      });
    }

  }

  checkStatus(id, next_first) {
    this.service.checkStatus(id).subscribe(response => {
      if (response['status']){
        if (response['data']['finished']) {

          if (this.process) {
            clearInterval(this.process);
          }

          this.sourceSummary = [{
            text: "Subidas",
            value: response['data']['success'] + " direcciones"
          },{
            text: "Sin subir",
            value: response['data']['error'] + " direcciones"
          },{
            text: "Total",
            value: response['data']['total'] + " direcciones"
          }];
          this.secondForm = this.fb.group({
            inputMessagers: ['', [Validators.required, Validators.min(1), Validators.max(response['data']['success'])]],
            selectStartPoint: ['', Validators.required],
          });

          this.addresses = response['data']['addresses'];


          let title = "Proceso de Carga Masiva Terminado";
          let message = "El archivo fue cargado exitosamente";
          let toast_type:NbComponentStatus = "success";

          this.toastService.showToast(toast_type, title, message);
          if (next_first)
            next_first.hostElement.nativeElement.click();
          else
            this.stepper.next();
          this.loading = false;

        } else {
          if (response['data']) {
            this.progress_value = response['data']['progress'];
          }
        }
      }
    });
  }

  onSecondSubmit(next_second) {
    if (this.inputMessagersModel < 1){
      this.secondForm.markAsDirty();
    } else {
      this.loading = true;
      let data = {
        id: this.process_id,
        location: this.start_point,
        num_messagers: this.inputMessagersModel,
      };
      this.service.generate_routes(data).subscribe(response => {
        if (response['status']){
          this.toastService.showToast('success', 'Generando Rutas', 'Se estan generando las rutas para la entrega de paquetes, por favor, se paciente.');
          if (response['warning']){
            let title = "Aviso";
            let message = response['warning'];
            let toast_type:NbComponentStatus = 'warning';
            this.toastService.showToast(toast_type, title, message);
          }
        } else {
          if (response['internal_step'] == 2){
            this.toastService.showToast('success', 'Generando Rutas', 'Ya se habia empezado el proceso de generado de rutas.');
          } else if (response['internal_step'] == 3){
            this.toastService.showToast('success', 'Generando Rutas', 'Ya se encuentran registradas las rutas');
          }
        }
        this.process = setInterval(() => {
          this.checkStatusSecond(next_second);
        }, 5000);
      });

    }
  }

  info_routes;

  service_ids;

  reload_data_view(response, service_ids, service_values, service=false){
    this.bounds = [];
    this.markers = {
      position:[],
      paths:[]
    };

    if (service){
      if (!response['data']['routes']){
        response = {
          data:{
            routes:response['data']}
        };
      }
      this.info_routes = response;
      this.service_ids = Object.keys(this.info_routes['data']['routes']);
    }

    for (let i=0; i<service_ids.length; i++){
      let temp = {
        data: { name: "Ruta " + (i+1), data:{id:service_ids[i] ,data:service_values[i]}},
        children:[]
      }

      // Color ruta e icono
      let icon_random = '';
      if (this.assigned_pins.length == this.pines.length){
        this.assigned_pins = [];
      }
      do{
        icon_random = this.pines[Math.floor(Math.random() * this.pines.filter((el)=>{ return !this.assigned_pins.includes(el)}).length)];
        if (icon_random == undefined){
          continue
        }
      } while (this.assigned_pins.includes(icon_random))
      this.assigned_pins.push(icon_random);


      let route = {
        path: [],
        // strokeColor: this.generateColor(),
        strokeColor: '#' + icon_random,
        strokeOpacity: 1.0,
        strokeWeight: 2,
      };

      route.path = response['data']['routes'][service_ids[i]]['path']['path'];
      // console.log(response['data']['routes'], response['data']['routes'][service_ids[i]]);

      for (let j=0; j < response['data']['routes'][service_ids[i]]['points'].length; j++){
        if (j == 0)
        {
          response['data']['routes'][service_ids[i]]['path']['distance'] = Math.round(response['data']['routes'][service_ids[i]]['path']['distance']/1000)
          response['data']['routes'][service_ids[i]]['path']['time'] = Math.round(response['data']['routes'][service_ids[i]]['path']['time']/60)
          response['data']['routes'][service_ids[i]]['path']['color'] = route.strokeColor;
          temp.children.push({
            name: response['data']['routes'][service_ids[i]]['points'][j]['address'],
            lat: response['data']['routes'][service_ids[i]]['points'][j]['lat'],
            lon: response['data']['routes'][service_ids[i]]['points'][j]['lon'],
            data: response['data']['routes'][service_ids[i]]['path'],
          });

          let pos = {lat: response['data']['routes'][service_ids[i]]['points'][j]['lat'], lng: response['data']['routes'][service_ids[i]]['points'][j]['lon']};
          // console.log(i, pos);
         this.markers.position.push(
            new Marker([pos.lat, pos.lng],
            {
              icon: icon({
                iconSize: [ 30, 30 ],
                iconAnchor: [ 30, 30 ],
                iconUrl: '/assets/icons/pines/pines/pinmap-'+ icon_random +'.png',
              }),
              interactive:true,
              draggable:false,
              title: 'Punto Inicial - ' + response['data']['routes'][service_ids[i]]['points'][j]['address']
            })
          );
          this.bounds.push([pos.lat, pos.lng]);
        } else {
          temp.children.push({
            name: response['data']['routes'][service_ids[i]]['points'][j]['address_normalize'][0]['address'],
            lat: response['data']['routes'][service_ids[i]]['points'][j]['zone']['lat'],
            lon: response['data']['routes'][service_ids[i]]['points'][j]['zone']['lng'],
            data: response['data']['routes'][service_ids[i]]['points'][j],
          });
          let pos = {lat: response['data']['routes'][service_ids[i]]['points'][j]['zone']['lat'], lng: response['data']['routes'][service_ids[i]]['points'][j]['zone']['lng']};

          this.markers.position.push(
            new Marker([pos.lat, pos.lng],
            {
              icon: icon({
                iconSize: [ 30, 30 ],
                iconAnchor: [ 30, 30 ],
                iconUrl: '/assets/icons/pines/pines/pinmap-'+ icon_random +'.png',
              }),
              interactive:true,
              draggable:false,
              title: response['data']['routes'][service_ids[i]]['points'][j]['address_normalize'][0]['address']
            })
          );
          this.bounds.push([pos.lat, pos.lng]);
        }
      }

      let poly:LatLngExpression[] = [];
      for (let j=0; j<route.path.length; j++){
        poly.push([route.path[j]['lat'], route.path[j]['lng']]);
      }
      for (let j=route.path.length-1; j>0; j--){
        poly.push([route.path[j]['lat'], route.path[j]['lng']]);
      }
      this.markers.paths.push(
        new Polygon(
          poly,
          {
            color:route.strokeColor,
            interactive:false,
            fillOpacity:0
          }
        )
      );
      this.dataTreeGrid.push(temp);
      // this.polylineOptions.push(route);
      // Codigo para mover el mapa para que ocupe todos los puntos
      // let poly_bounds = new Polygon(this.bounds).getBounds();
      // this.map.fitBounds(poly_bounds);

    }
  }

  checkStatusSecond(next_second){
    this.service.checkStatus(this.process_id, 2).subscribe(response => {
      if (response['status']){
        if (response['data']['finished']) {

          if (this.process) {
            clearInterval(this.process);
          }

          let service_ids = Object.keys(response['data']['routes']);
          let service_values = Object.values(response['data']['routes'])

          this.reload_data_view(response, service_ids, service_values, true);

          let title = "Proceso de Generado de Rutas Terminado.";
          let message = "Se generaron las rutas recomendadas exitosamente.";
          let toast_type:NbComponentStatus = "success";

          this.toastService.showToast(toast_type, title, message);
          if (next_second)
            setTimeout(()=>next_second.hostElement.nativeElement.click(), 200);
          else
            setTimeout(()=>this.stepper.next(), 200);


          setTimeout(()=> {this.map.invalidateSize()}, 500);
          setTimeout(()=>{
            // this.map.fitBounds(this.bounds);
            this.loading = false;
          }, 1000);
        }
      }
    });
  }

  generateColor(){
    let simb = "0123456789ABCDEF";
    let random_simb = '';
    for ( var i = 0; i < simb.length; i++ ) {
      random_simb += simb.charAt(Math.floor(Math.random() * simb.length));
    }

    let color = "#";
    for(var i = 0; i < 6; i++){
      color = color + random_simb[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  new_markers = [];

  // Method to change routes in map.
  load_map_service(service_id, route) {
    let response = {data: {routes: {}}};
    response['data']['routes'][service_id] = route;

    let service_ids = Object.keys(response['data']['routes']);
    let service_values = Object.values(response['data']['routes']);

    this.reload_data_view(response, service_ids, service_values);

    setTimeout(()=> {this.map.invalidateSize()}, 500);
  }

  onThirdSubmit() {
    // console.log(this.service_ids);
    // for( let i=0; i< this.service_ids.length; i++){
    //   let service_id = this.service_ids[i];
    //   console.log(service_id);
    //   new Promise(() => {
    //     setTimeout(() => this.load_map_service(service_id, this.info_routes['data']['routes'][service_id]), 2000*(i+1))
    //   }).then(()=>console.log('end', service_id));

    // }
    // console.log(this.markerPositions);
    // this.thirdForm.markAsDirty();
  }

  onFinishStep(){
    this.loading = true;
    if (this.dataTreeGrid.length == Object.keys(this.messagers_selected).length && !Object.values(this.messagers_selected).includes(undefined) && !Object.values(this.messagers_selected).includes(null) && !Object.values(this.messagers_selected).includes('')){
      let data = {'assign': this.messagers_selected, 'id': this.process_id};
      this.service.assignMessagers(data).subscribe(response => {
        if (response['status']){
          this.toastService.showToast('success', 'Rutas Asignadas', 'Se ha asignado los agentes a sus respectivas rutas. En breve seras redirigido a otra pagina.');
          setTimeout(() => this.router.navigate(['/pages/route/view', {}]), 3000);
        } else {
          this.loading = false;
          this.toastService.showToast('danger', 'Ha ocurrido algo inesperado', 'Por favor, intenta de nuevo más tarde');
        }
      })
    } else {
      this.toastService.showToast('warning', 'Faltan datos', 'Por favor selecciona el agente encargado de cada una de las rutas');
      this.loading = false;
    }
  }

  openAddressInfoDialog(data){
    this.dialogService.open(AddressInfoDialogComponent, {context:{data: {title: "Información de Dirección", address:data, parentComponent:this}}});
  }

  openAddressRouteDialog(data_point){
    this.dialogService.open(AddressRouteDialogComponent, {context:{data: {title: "Cambio De Ruta - " + data_point.address_normalize[0].address , location_id: data_point.location_id, route_id: data_point.service_id, address_text: data_point.address_normalized, parentComponent:this}}});
  }

  getService(){
    return this.service;
  }

  onAgentSelected(event, index){
    if (!(index in Object.keys(this.messagers_selected))){
      this.messengerSel++;
    }
    this.messagers_selected[index] = event;

  }

  checkSelected(messager, index){
    if (this.messagers_selected[index] == messager){
      return false;
    } else if (Object.values(this.messagers_selected).includes(messager)){
      return true;
    }
    return false;
  }

  // Method to save screenshot of map.
  // saveRoute(form_data:FormData, id_service:number){
    // html2canvas(this.mapContainer.nativeElement, {
    //   backgroundColor: null,
    //   useCORS: true
    // }).then(canvas => {
    //   var imgData = canvas.toDataURL("image/png");
    //   form_data.append('route', imgData, 'route_'+id_service+'.png');
    // })
    // return form_data;
  // }

  getElementFile(event:Row){
    let data = {
      id: this.process_id,
      type: event.index,
    }
    let filename = "";
    switch(event.index){
      case 1:
        filename = "Errores.xlsx";
        break;
      case 2:
        filename = "Total.xlsx";
        break;
      default:
        filename = "Subidas.xlsx";
    }

    this.service.getElementFile(data).subscribe((response) => {

      let dataType = response.type;
      let binaryData = [];
      binaryData.push(response);
      let downloadLink = document.createElement('a');
      downloadLink.href = window.URL.createObjectURL(new Blob(binaryData, { type: dataType }));
      if (filename) {
        downloadLink.setAttribute('download', filename);
      }
      document.body.appendChild(downloadLink);
      downloadLink.click();
    });
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.loading) {
      if (this.process) {
        clearInterval(this.process);
      }
      $event.returnValue = true;
    }
  }

}

@Component({
  selector: 'ngx-role-dialog',
  templateUrl: './dialog.html',
  styles: ['nb-card-footer { text-align:end}', 'button {margin:5px}', 'nb-checkbox {margin:5px 0px}', '.info-address-modal{max-width: 800px;}', 'input {margin: 10px 0;}', '.success-val{color:#00d68f !important}', '.danger-val{color:#ff3d71 !important}']
})
export class AddressInfoDialogComponent implements OnInit{

  public data: {title:string, address?:{address, address_normalize, comment?, lat, lon, addressee, identification, id_number?,  phone, email, review}, parentComponent, points?}

  constructor(
   private dialogRef: NbDialogRef<AddressInfoDialogComponent>,
  ){
  }

  ngOnInit(): void {
    if (this.data.address == undefined){
      this.data.parentComponent.toastService.showToast('warning', 'Oops! Ha ocurrido algo', 'Parece que no hemos podido mostrar correctamente la información de la dirección que seleccionaste, intentalo de nuevo.');
      this.dialogRef.close();
    }
  }

  close(){
    this.dialogRef.close();
  }

}


@Component({
  selector: 'ngx-role-dialog',
  templateUrl: './dialog_addre_route.html',
  styles: ['nb-card-footer { text-align:end}', 'button {margin:5px}', 'nb-checkbox {margin:5px 0px}', '.info-address-modal{max-width: 800px;}', 'input {margin: 10px 0;}', '.success-val{color:#00d68f !important}', '.danger-val{color:#ff3d71 !important}']
})
export class AddressRouteDialogComponent implements OnInit{

  public data: {title:string, location_id, route_id, address_text, parentComponent: LoadComponent, }
  public new_route_id = null;

  public loading = false;

  constructor(
   private dialogRef: NbDialogRef<AddressRouteDialogComponent>,
  ){
  }

  ngOnInit(): void {

  }

  changeRoutes(){
    let data = {
      location: this.data.location_id,
      initial: this.data.route_id,
      final: this.new_route_id
    }

    this.data.parentComponent.getService().changeRoute(data).subscribe(response => {
      if (response['status']){
        if (response['warning']){
          let title = "Aviso";
          let message = response['warning'];
          let toast_type:NbComponentStatus = 'warning';
          this.data.parentComponent.toastService.showToast(toast_type, title, message);
        }
        this.data.parentComponent.dataTreeGrid = [];
        let service_ids = Object.keys(response['data']);
        let service_values = Object.values(response['data']);

        this.data.parentComponent.reload_data_view(response, service_ids, service_values, true);

        setTimeout(()=> {this.data.parentComponent.map.invalidateSize()}, 500);
        // this.data.parentComponent.map.fitBounds(this.data.parentComponent.bounds);

        this.data.parentComponent.toastService.showToast("success", "Direccion asignada a otra ruta", "Se editaron las rutas correctamente");
        this.close();
      }
    });

  }

  onChange(event){

  }

  close(){
    this.dialogRef.close();
  }

}
