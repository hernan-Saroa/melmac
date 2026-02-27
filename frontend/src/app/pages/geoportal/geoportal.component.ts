import { FormService } from './../../services/form.service';
import { AfterViewInit, Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NbSelectComponent, NbSidebarService } from '@nebular/theme';
import { icon, latLng, Layer, Map, tileLayer, Marker, Polyline } from 'leaflet';
import { AnswerService } from '../../services/answer.service';
import { GeoportalService } from '../../services/geoportal.service';
import { pines, route_colors} from '../../usable/pines';
import { DatePipe } from '@angular/common';
import { Papa } from 'ngx-papaparse';

import * as L from "leaflet";
import "leaflet.markercluster";
import "leaflet-polylinedecorator";
import { WsSendService } from '../../services/ws-send.service';
import { AssociateService } from '../../services/associate.service';
import { UserService } from '../../services/user.service';

interface GeoportalMarker{
  id:number|string,
  marker:L.Marker,
  parent_id:number,
  popup?:string,
}

@Component({
  selector: 'ngx-geoportal',
  templateUrl: './geoportal.component.html',
  styleUrls: ['./geoportal.component.scss']
})
export class GeoportalComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild("docSelect") selectRef : NbSelectComponent;
  @ViewChild("userSelect") userSelRef : NbSelectComponent;
  @ViewChild("devSelect") devSelRef : NbSelectComponent;
  @ViewChild("folRolSelect") folRolSelect : NbSelectComponent;
  option = -1;
  project_open = -1;
  user_open = -1;
  user_tl_open = -1;
  date_open = null;
  ans_open = 0;
  ans_date_open = '';
  ans_date_form_open = '';
  option_board = false;
  data_board = false;
  group = true;
  tot_count;
  tot_count_point = 0;
  count_init = true;
  user_data_all;
  init_data = 0;
  end_data = 2000;

  answer_position = 0;
  answer_now_position = 0;
  answer_load = true;
  answer_data = {};
  answer_select = [];
  answer_stop = false;
  select_document = [];

  filter_options: { date_ini, date_fin, doc:String[], role:String[], user:String[] } = {
    date_ini:null,
    date_fin:null,
    doc:null,
    role:null,
    user:null,
  };
  doc_title = '';

  follow_options: { date_ini, date_fin, users:String[], role:String[] } = {
    date_ini:null,
    date_fin:null,
    users:null,
    role:null,
  };
  follow_title='';

  init_data_pro = 0;
  end_data_pro = 30;

  project_position = 0;
  project_now_position = 0;
  point_load = true;
  point_data = [];
  point_select = [];

  user_load = true;
  user_data = [];
  user_data_sel = [];
  user_select = [];
  user_date = new Date();
  user_now_position = 0;
  init_data_user = 0;
  end_data_user = 30;
  follow_data;

  device_load = true;
  answer_device = [];
  select_device = [];
  list_device = [];
  show_info_device = null;
  device_title;

  map:Map;

  markersShown = [];

  markers: { projects:GeoportalMarker[], answer:GeoportalMarker[], timeline:{data:any, initial:Layer, path:Layer, arrows:Layer, final:Layer, stops: Layer[]}[], user_last:GeoportalMarker[], devices:GeoportalMarker[] } = {
    projects: [],
    answer: [],
    timeline: [],
    user_last: [],
    devices: [],
  };

  options = {
    layers: [
      tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: ' &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors' }),
    ],
    zoom: 10,
    center: latLng(4.600868, -74.08175)
  };

  loading = false;
  public pines: any;
  public route_colors: any;
  assigned_pins = {project:{}, answer:{}, user:{}, device:{}};

  markerData;

  markerCluster:L.MarkerClusterGroup;

  markerClusterOptions:L.MarkerClusterGroupOptions = {
    maxClusterRadius: 100,
    iconCreateFunction: (cluster) => {
      let markers = cluster.getAllChildMarkers();
      let n = '<div><span>'+markers.length+'</span></div>';
      let secondary_class = markers.length < 50 ? 'marker-cluster-small' : (markers.length < 200) ? 'marker-cluster-medium' : 'marker-cluster-large'
      return L.divIcon({ html: n, className: `mycluster ${secondary_class}` , iconSize: L.point(40, 40) });
    },
    spiderfyOnMaxZoom: true,
    animate: true,
    chunkedLoading: true,
  };

  private lp_sock: WsSendService;
  update_listener;

  list_role = [];
  role_title = '';
  role_select;
  user_select_p;
  all_user = [];
  list_user = [];
  dict_user = {};
  dict_doc = {};
  ans_count = {};
  list_user_select;
  list_follow_role = [];
  list_follow_role_ids = [];
  follow_role_select;
  array_pin = ['2D0808', '5E6013', '7DBEFF', '45A7A1', 'E72C83']
  pin_final;
  code_pin;

  constructor(
    private geoportalService: GeoportalService,
    private associateService: AssociateService,
    private userService: UserService,
    private sidebarService: NbSidebarService,
    private activatedRoute: ActivatedRoute,
    private formService: FormService,
    private papa: Papa,
  ) {
    this.pines = pines;
    this.route_colors = route_colors;
    this.activatedRoute.data.subscribe(data => {
      if (data['option'] == 1) {
        this.data_board = true;
        this.option = 1;
        //this.onDataAnswer();
      }
    });

    this.loading = true;
    this.formService.list().subscribe(
      form => {
        if (form['status']){
          form['data'].sort((a,b) => a.name.localeCompare(b.name));
          form['data'].forEach(document => {
            this.select_document.push({value: document['id'], title: document['name']});
            this.dict_doc[document.id] = document;
          });
        }
      }, null, () =>{
        this.selectRef.selected = ['0'];
        this.loading = false;
      },
    );

    this.associateService.get_role().subscribe(
      response => {
        let data_list = response['data'];
        this.list_role = data_list;
      }
    );

    this.geoportalService.get_user().subscribe(
      response => {
        let data_list = response['data'];
        this.list_user = data_list;
        this.list_user.push({
          "id": 'null',
          "first_name": "Usuario",
          "first_last_name": "Publico",
          "count": ''
        });

        this.all_user = data_list;

        this.all_user.forEach(value => {
          this.dict_user[value.id] = value;
        });
      }
    );

    this.geoportalService.get_follow_role().subscribe(
      response => {
        let data_list = response['data'];
        this.list_follow_role = data_list;
        this.list_follow_role_ids = data_list.map((value)=>{
          value.id;
        });
        this.folRolSelect.selected = ['0'];
      }
    );

  }
  ngOnDestroy(): void {
    if (this.update_listener)
      this.update_listener.unsubscribe()
  }

  ngAfterViewInit(): void {
    setTimeout(()=> {this.map.invalidateSize()
      this.doc_title = this.selectRef.button.nativeElement.innerText;
      this.follow_title = this.userSelRef.button.nativeElement.innerText;
      this.device_title = this.userSelRef.button.nativeElement.innerText;
    }, 1200);

  }

  ngOnInit(): void {
    setTimeout(() => {
      this.sidebarService.compact('menu-sidebar');
    }, 1000);

  }

  onDataAddress() {
    this.loading = true;

    this.assigned_pins.project = {};
    this.geoportalService.listAddresses().subscribe(
      response => {
        if (response['status']) {
          this.point_data = response['data'];
          this.tot_count_point = this.point_data.length;
          response['data'].forEach(project => {
            let pin_color = '';

            if (project.id in Object.keys(this.assigned_pins.project)){
              pin_color = this.assigned_pins.project[project.id];
            }else{
              do {
                // Verificar que pines ya están asignados
                const available_pins = this.pines.filter((el) => !Object.values(this.assigned_pins.project).includes(el));
                if (available_pins.length === 0) { // Validacion de si hay mas pines disponibles
                  console.error("No hay más pines disponibles para asignar.");
                  break;
                }              
                pin_color = available_pins[Math.floor(Math.random() * available_pins.length)];
                            
              } while (Object.values(this.assigned_pins.project).includes(pin_color));
              this.assigned_pins.project[project.id] = pin_color; // Asigna el pin al proyecto
            }
            try {
              if (pin_color == undefined){
                this.code_pin = this.array_pin[Math.floor(Math.random() * this.array_pin.length)];
                this.pin_final = '/assets/icons/pines/point/pinmap-'+ this.code_pin +'.png'
              }else{
                this.pin_final = '/assets/icons/pines/point/pinmap-'+ pin_color +'.png'
              }
              if (project['json_path'] && project['json_path'].length > 0){
                project['json_path'].forEach((address, index) => {
                  let el = {
                    id: index,
                    parent_id: project.id,
                    marker: new L.Marker([address.lat, address.lon],
                      {
                        icon: icon({
                          iconSize: [ 50, 50 ],
                          iconUrl: this.pin_final
                        }),
                        interactive:true,
                        draggable:false,
                      }),
                      popup:`
                      <p>${address['name']}
                        ${address['address'] ? '<br>' + address['address'] : ''}
                        <br> Latitud ${address.lat}
                        <br> Longitud ${address.lon}
                      </p>`,
                  }
                  el['marker']['data'] = {id: index, parent_id: project.id};

                  this.markers.projects.push(el);
                });
              }
            } catch {
              console.log("Error try catch");
            }
          });

          this.point_load = false;
        }
        this.loading = false;
      }
    );
  }

  onDataAnswer() {
    console.log('this.answer_stop');
    console.log(this.answer_stop);
    if (!this.answer_stop){
      this.geoportalService.listAnswer(this.answer_position, this.filter_options).subscribe(
        response => {
          // console.log("geoportal4444444");
          // console.log(response);
          if (response['status']) {
            if (response['data']) {
              // Recorre el usuario
              this.answer_data = response['data'];
              Object.keys(response['data']).forEach(user_data => {
                let user_id = (user_data != '-1' ? user_data : 'null');
                let date_data = response['data'][user_data];
                this.dict_user[user_id]['count'] = date_data['count']

                if (!Object.keys(this.ans_count).includes(user_id)){
                  this.ans_count[user_id] = {'count': date_data['count'], 'selected':0};;
                }
                delete date_data['count'];
                // Recorre las fechas
                Object.keys(date_data).forEach(date =>{
                  let point_date = date;
                  let point_data:any = response['data'][user_data][date];
                  if (!Object.keys(this.ans_count[user_id]).includes(point_date)){
                    this.ans_count[user_id][point_date] = {
                      'count': point_data['count'],
                      'selected':0,
                      'checked': true
                    };
                  }
                  delete point_data['count'];


                  // Recorre los formularios
                  Object.keys(point_data).forEach(form =>{
                    let form_id = form;
                    let form_data:any[] = response['data'][user_data][date][form_id]['data'];
                    if (!Object.keys(this.ans_count[user_id][point_date]).includes(form_id)){
                      this.ans_count[user_id][point_date][form_id] = {
                        'count': response['data'][user_data][date][form_id]['count'],
                        'selected':0,
                        'checked': true
                      };
                    }

                    // Recorre las respuestas
                    form_data.forEach((answer) =>{
                      let pin_color = '';
                      // Si el formulario tiene un pin asignado desde su creación lo asigna
                      if (answer.pin_form != '') {
                        pin_color = answer.pin_form
                      } else {
                        // Si el formulario de la respuesta ya tiene asignado un pin, se lo asigna a todas sus respuestas
                        if (Object.keys(this.assigned_pins.answer).includes(answer.id_form)){
                          pin_color = this.assigned_pins.answer[answer.id_form];
                        } else {
                          // Si no tiene un pin asignado, se selecciona uno aleatoriamente, hasta que sea uno diferente de undefined.
                          do{
                            pin_color = this.pines[Math.floor(Math.random() * this.pines.length)];
                            if (pin_color == undefined){
                              continue
                            }
                          } while (pin_color != undefined && Object.values(this.assigned_pins.answer).includes(pin_color))
                          this.assigned_pins.answer[answer.id_form] = pin_color;
                        }
                      }
                      // Si la respuesta tiene una localización permitida (diferente de null o 0 cero)
                      if (answer.latitude && answer.longitude) {
                        // Se genera el id que despues es usado para identificar el pin e ir a sus coordenadas.
                        let pin_id = user_id + '&' + point_date + '&' + form_id + '&' + answer.id;
                        // Se crea el elemento que contiene toda la información necesaria del pin.
                        let el ={
                          id: pin_id,
                          parent_id: answer.id_form,
                          marker: new L.Marker([answer.latitude, answer.longitude],
                            {
                              icon: icon({
                                iconSize: [ 50, 50 ],
                                iconUrl: '/assets/icons/pines/file/pinmap-'+ pin_color +'.png',
                              }),
                              interactive:true,
                              draggable:false,
                            }),
                            popup: `
                            <p>Documento ${answer['name_form']}
                              <br> Diligenciado por ${answer['created_by__first_name'] ? answer['created_by__first_name'] : 'Usuario'}
                              ${answer['created_by__first_last_name'] ? answer['created_by__first_last_name'] : 'Público'}
                              <br> el ${new Date(answer["creation_date"]).toLocaleString()}
                              <br> <a href="/pages/answer/view/${answer['id']}"> Ir a respuesta</a>
                            </p>`,
                        };
                        // esta propiedad/llave contiene lo necesario para identificar el punto.
                        el['marker']['data'] = {id: pin_id, parent_id: answer.id_form};
                        this.markers.answer.push(el);
                        this.answer_select.push(pin_id);
                        this.ans_count[user_id][point_date]['selected'] += 1;
                        this.ans_count[user_id][point_date][form_id]['selected'] += 1;

                      }
                    });
                    // console.log("salioRespuesta::::::::::");
                  });
                });
              });
              this.answer_load = false;
              this.answer_stop = true;
            }
          }
          this.updateMarkersShown();
        }
      );
    }
  }

  getUserPath(user, date) {
    this.loading = true;
    let position = this.user_data.map((user) => ''+user.id).indexOf(user);

    this.geoportalService.listUserPath(user, date).subscribe(
      response => {
        // console.log("geoportal55555555");
        // console.log(response);
        if (response['status']) {
          let user_val = this.user_data[position];
          if (response['data'].length > 0) {
            let name = user_val['first_name'] + ' ' + user_val['first_last_name'];

            // Puntos de la ruta
            let polypoints = [];
            let logs = [];
            let log_times = [];
            let stops = [];
            let tmp_date = new Date();
            response['data'].forEach(element => {
              let values = Object.values(element)[0];
              // console.log(values);
              if (values[0] != null && values[1] != null){
                let key = Object.keys(element)[0];
                log_times.push(key);
                // console.log(typeof values[1])
                polypoints.push([parseFloat(''+values[0]), parseFloat(''+(values[1]))]);
              }
            });
            // console.log(polypoints);
            if (polypoints.length){
              // Punto de inicio
              let start_point = new Marker(polypoints[0], {
                icon:icon({
                  iconSize: [ 50, 50 ],
                  iconUrl: '/assets/icons/pines/follow/start_pin.png',
                }),
              }).bindPopup('Inicio <br>'+ name + '<br>' + date + ' ' + log_times[0]);

              logs.push({'creation_date': new Date(Date.parse(date + ' ' + log_times[0])), 'title': 'Inicio de Jornada', 'description': 'Primer captura de coordenadas via Móvil.'});
              // Punto Final/Actual
              let final_point = new Marker(polypoints[polypoints.length-1], {
                icon:icon({
                  iconSize: [ 50, 50 ],
                  iconUrl: '/assets/icons/pines/follow/end_pin.png',
                }),
              }).bindPopup('Ubicación final <br>'+ name + '<br>'+ date + ' ' + log_times[log_times.length-1]);

              logs.push({'creation_date': new Date(Date.parse(date + ' ' + log_times[log_times.length-1])), 'title': 'Ultima Captura', 'description': 'Última captura detectada en el dia.'});

              response['stops'].forEach(element => {
                stops.push(
                  new Marker(element.geo, {
                    icon:icon({
                      iconSize: [ 50, 50 ],
                      iconUrl: '/assets/icons/pines/follow/stop_pin.png',
                    })}
                  ).bindPopup(
                    'Parada iniciada a las ' + element.start_time + '<br>'+
                    'Parada terminada a las ' + element.end_time + '<br>'+
                    'Duración aproximada ' + Math.round(element.duration/60) + ' minutos.'
                    )
                );
                logs.push({
                  'creation_date': new Date(Date.parse(date + ' ' + element.start_time)), 'title': 'Inicio de Parada.',
                  'description': 'Inicio de parada.'
                });
                logs.push({
                  'creation_date': new Date(Date.parse(date + ' ' + element.end_time)), 'title': 'Fin de Parada',
                  'description': 'Parada terminada.'+ '<br>'+ 'Duración aproximada ' + Math.round(element.duration/60) + ' minutos.'
                });
              });

              logs = logs.concat(response['answers'].map(el => {
                el['creation_date'] = new Date(Date.parse(el['creation_date']));
                el['title'] = 'Diligenciamiento';
                return el;
              }));

              let pin_color = '';
              do{
                if (Object.values(this.assigned_pins.user).length == this.route_colors.length){
                  this.assigned_pins.user = {};
                }
                pin_color = this.route_colors[Math.floor(Math.random() * this.route_colors.filter((el)=>{ return !Object.values(this.assigned_pins.user).includes(el)}).length)];
                if (pin_color == undefined){
                  continue
                }
              } while (Object.values(this.assigned_pins.device).includes(pin_color))
              this.assigned_pins.device[user.id+'_'+date] = pin_color;

              if (pin_color == undefined || pin_color == ''){
                pin_color = '000000';
              }

              let polygon = new Polyline(
                polypoints,
                {
                  color:'#' + pin_color,
                  interactive:true,
                  smoothFactor: 10,
                  opacity:0.6,
                  fill: false,
                  lineJoin: 'miter',
                }
              );

              if (this.follow_data == undefined)
                this.follow_data = {};
              if (this.follow_data[user] == undefined){
                this.follow_data[user] = {};
              }
              this.follow_data[user][date]= {
                'map':[start_point, final_point, polygon, stops],
                'logs': logs.sort((d1,d2) => {
                  if (d1['creation_date'].getTime() > d2['creation_date'].getTime())
                    return 1;
                  if (d1['creation_date'].getTime() < d2['creation_date'].getTime())
                    return -1;
                  return 0;
                }),
                'color': pin_color,
              };
            }
          }
          // console.log(this.follow_data);
          this.updatePathsShown();
          this.updateMarkersShown();
        }
      }, null, ()=>{
        // this.loading = false;
      }
    );
  }

  onDataUser(first?) {
    this.loading = true;
    this.geoportalService.listUser(this.follow_options).subscribe(
      response => {
        // console.log("geoportal6666666");
        // console.log(response);
        if (response['status']) {
            response['data'].forEach(user => {
              // console.log("user");
              // console.log(user);
              user['dates'] = [];
              if(response['user_dates'] && response['user_dates'][user.id]){
                response['user_dates'][user.id].forEach(element => {
                  user['dates'].push(element.creation_date__date);
                });
              }

              this.user_data.push(user);
            });
            if(this.count_init){
              this.tot_count = response['data'].length;
              this.count_init = false;
              this.user_data_all = Object.assign([], this.user_data);
            }
            this.markers.user_last = [];
            if (response['last']){
              Object.values(response['last']).forEach(user_loc => {

                let user_data = response['data'].filter((el) => {
                  if (user_loc['user_id'] == el['id']){
                    return el;
                  }
                });

                user_data = (user_data && user_data[0]) ? user_data[0] : null;
                let options = ['', '_1', '_2', '_3', '_4'];
                let pin_color = '';
                do{
                  let pos = Math.floor(Math.random() * options.length);
                  pin_color = options[pos];
                  if (pin_color == undefined){
                    continue
                  }
                } while (pin_color == undefined)
                pin_color = pin_color != undefined ? pin_color : options[0];

                if (user_loc['latitude'] && user_loc['longitude']) {
                  let el ={
                    id: 'foll-'+user_loc['user_id'],
                    parent_id: null,
                    marker: new L.Marker([user_loc['latitude'], user_loc['longitude']],
                      {
                        icon: icon({
                          iconSize: [ 50, 50 ],
                          iconUrl: '/assets/icons/mobile'+ pin_color +'.png',
                        }),
                        interactive:true,
                        draggable:false,
                      }),
                      popup: `
                      <p><b>Ultima Ubicación</b>
                        <br> ${new Date(user_loc["creation_date"]).toLocaleString()}
                        <br>${user_data['first_name'] ? user_data['first_name'] : 'Usuario'}
                        ${user_data['first_last_name'] ? user_data['first_last_name'] : 'Público'}
                        <br>${user_data['email'] ? user_data['email'] : 'N/A'}
                        <br><b>Ultima Interacción en App</b>
                        <br>${new Date(user_data['mobile']["last_update"]).toLocaleString()}
                      </p>`,
                  };
                  el['marker']['data'] = {id: 'foll-'+user_loc['user_id'], parent_id: null};
                  this.markers.user_last.push(el);
                };
              });
            }else{
            }
          if (this.follow_options.users == null){
              this.userSelRef.selected=['0'];
            if(first){
              this.user_data_sel = Object.assign([], this.user_data);
              this.setUpdater();
            }
          }
          // console.log(this.user_data);

          this.user_load = false;
        }

      }, null, ()=>{
        this.loading = false;

        this.updateMarkersShown();
      }
    );
  }

  onMapReady(map:Map){
    this.map = map;
  }

  markerClusterReady(event:L.MarkerClusterGroup){
    this.markerCluster = event;
  }

  setUpdater(){
    this.lp_sock = new WsSendService();
    this.update_listener = this.lp_sock.lp_user().subscribe((next)=>{
      let data = JSON.parse(next.data)['message'];
      let change = false;
      Object.keys(data['last']).forEach((key) => {
        let values = data['last'][key];
        let pos = this.markers.user_last.findIndex((value, index) => {
          if (value.id == key && (values['latitude'] != value.marker['_latlng']['lat'] || values['longitude'] != value.marker['_latlng']['lng']) )
            return true
        });
        if (pos != -1){
          let el = this.markers.user_last[pos];
          let time = new Date();
          time.setHours(values['creation_date__hour']);
          time.setMinutes(values['creation_date__minute']);
          el.marker = new L.Marker([values['latitude'], values['longitude']],
          {
            icon: el.marker['options']['icon'],
            interactive:true,
            draggable:false,
          }),
          el.popup = `
          <p><b>Ultima Ubicación</b>
            <br> ${time.toLocaleString()}
            <br>${values['first_name'] ? values['first_name'] : 'Usuario'}
            ${values['first_last_name'] ? values['first_last_name'] : 'Público'}
            <br>${values['email'] ? values['email'] : 'N/A'}
          </p>`
          this.markers.user_last[pos] = el;
          change = true;
        }
      });
      if (change){
        this.updateMarkersShown();
      }
    });
  }

  updateMarkersShown(){
    this.loading = true;
    setTimeout(() => {
      let projects = Object.values(this.markers.projects).filter((el)=> {
        let key = el.parent_id+'-'+el.id;
        return this.point_select.includes(key);
      }).map((el) => { return el.marker.bindPopup(el.popup) });

      let answers = Object.values(this.markers.answer).filter((el)=> {
        return this.answer_select.includes(el.id);
      }).map((el) => { return el.marker.bindPopup(el.popup) });

      let devices = Object.values(this.markers.devices).filter((el)=> {
        return this.select_device.includes(el.id);
      }).map((el) => { return el.marker.bindPopup(el.popup) });

      let paths = Object.values(this.markers.timeline).filter((el) =>{
        return this.user_select.includes(el.data.id);
      }).map((el) => { return [el.initial, el.final, el.stops]});

      let users = Object.values(this.markers.user_last).map((el) => {
        return el.marker.bindPopup(el.popup);
      });

      let path_markers = [];
      paths.forEach(element => {
        path_markers.push(element[0]);
        path_markers.push(element[1]);
        if(element[2]){
          path_markers = path_markers.concat(element[2]);
        }
      });

      if (this.markerData != projects.concat(answers, devices, path_markers, users)){
        this.markerData = projects.concat(answers, devices, path_markers, users);
      }
      this.loading = false;
    }, 300);
  }

  updatePathsShown(){
    this.markers.timeline = [];
    this.user_select.forEach((id) => {
      let parts = id.split('&');
      let user = parts[0];
      let date = parts[1];
      let follow = this.follow_data[user];
      if (follow && follow[date] && follow[date]['map'].length == 4){
        var decorator = L.polylineDecorator(follow[date]['map'][2], {
          patterns: [
              {offset: 0, repeat: 100, symbol: L.Symbol.arrowHead({pixelSize: 10, polygon: false, pathOptions: {stroke: true, color: follow[date]['map'][2].options.color}})}
          ]
        });
        this.markers.timeline.push(
          {
            data:{id: id},
            initial: follow[date]['map'][0],
            final: follow[date]['map'][1],
            path: follow[date]['map'][2],
            arrows: decorator,
            stops: follow[date]['map'][3]
          }
        );
      }
    });
  }

  closeMenu() {
    this.data_board = !this.data_board;
    setTimeout(()=> {this.map.invalidateSize()}, 100);
    this.option = -1;
  }

  invalidMap(){
    this.map.invalidateSize();
  }

  changeOption(option) {
    this.loading = true;
    // Opciones y Menú derecho
    if (this.option == option) {
      this.closeMenu()
    } else {
      if (this.option == -1) {
        this.data_board = !this.data_board;
        setTimeout(()=> {this.map.invalidateSize()}, 100);
      }
      this.option = option;
      this.option_board = false;
    }
    // Carga de la información
    if (option == 0 && this.point_load) {
      this.onDataAddress();
    } else if (option == 1 && this.answer_load) {
      let now = new Date(Date.now());
      let last_week = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      this.filter_options.date_ini = last_week.getFullYear() + '-' +
        (last_week.getMonth() < 9 ? '0' : '') + (last_week.getMonth() + 1)  + '-' +
        (last_week.getDate() < 10 ? '0' : '') + last_week.getDate();
      this.onDataAnswer();
    } else if (option == 2 && this.user_load) {
      let now = new Date(Date.now());
      let last_week = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 31);
      this.follow_options.date_ini = last_week.getFullYear() + '-' +
        (last_week.getMonth() < 9 ? '0' : '') + (last_week.getMonth() + 1)  + '-' +
        (last_week.getDate() < 10 ? '0' : '') + last_week.getDate();
      let last_month = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      this.follow_options.date_fin = last_month.getFullYear() + '-' +
        (last_month.getMonth() < 9 ? '0' : '') + (last_month.getMonth() + 1)  + '-' +
        (last_month.getDate() < 10 ? '0' : '') + last_month.getDate();
      //this.onDataUser(true);
      this.onDataUser(true);
    } else if (option == 3 && this.device_load) {
      this.onDataDevice();
    } else {
      this.loading = false;
    }
  }

  toggleCheckbox(checked: boolean, value, parent=false) {
    // console.log(checked, value, this.answer_select)
    if (checked) {
      if (this.option == 0) {
        if (parent) {
          let pro_index = this.point_data.map((project) => project.id).indexOf(value);
          if (this.point_data[pro_index]['json_path']){
            let points = this.point_data[pro_index]['json_path'].map((el, index)=>{
              let key = value+'-'+index;
              if(!this.point_select.includes(key))
                return key;
            }).filter(el => el);
            this.point_select = this.point_select.concat(points);
          }
        } else {
          this.point_select.push(value);
        }

      } else if (this.option == 1) {
        console.log('option == 1');
        let value_parts = value.split('&');
        this.togglePins(value_parts);
      } else if (this.option == 2) {
        this.user_select.push(value);
        let parts = value.split('&');
        this.checkTimelineData(parts[0], parts[1], true);
      } else if (this.option == 3) {
        this.select_device.push(value);
      }
    } else {
      if (this.option == 0) {
        if (parent) {
          this.point_data.map((project) => project.id).indexOf(value);
          this.point_select = this.point_select.filter((val) => { return !(''+val).startsWith(value+'-')});
        } else {
          let position = this.point_select.map(function(e) { return e; }).indexOf(value);
          this.point_select.splice(position, 1);
        }
      } else if (this.option == 1) {
        let value_parts = value.split('&');
        this.togglePins(value_parts, false);
      } else if (this.option == 2) {
        let position = this.user_select.map(function(e) { return e; }).indexOf(value);
        this.user_select.splice(position, 1);

        this.updatePathsShown();
      } else if (this.option == 3) {
        let position = this.select_device.map(function(e) { return e; }).indexOf(value);
        this.select_device.splice(position, 1);
      }
    }
    if (this.option != 2 || (this.option == 2 && !checked))
      this.updateMarkersShown();
    // console.log(this.point_select);
    // console.log(this.answer_select);
    // console.log(this.user_select);
  }

  showMarker(option, id){
    if (option == 1){
      return this.answer_select.includes(id);
    } else if (option == 0) {
      return this.point_select.includes(id);
    }
    return false;
  }

  onDropdown() {
    this.option_board = !this.option_board;
  }

  loadPrevious() {
    if (this.loading) { return }
    if (this.option == 1) {
      if (this.init_data > 0) {
        this.init_data -= 1000;
        this.end_data -= 1000;
        this.answer_now_position = this.end_data/1000;
      }
    } else if ( this.option == 0){
      if (this.init_data_pro > 0) {
        this.init_data_pro -= 10;
        this.end_data_pro -= 10;
        this.project_now_position = this.end_data_pro/10;
      }
    } else if ( this.option = 2){
      if (this.init_data_user > 0) {
        this.init_data_user -= 10;
        this.end_data_user -= 10;
        this.user_now_position = this.end_data_user/10;
      }
    }
  }

  loadNext() {
    if (this.loading) { return }
    if (this.option == 1) {
      this.onDataAnswer();
    } else if ( this.option == 0){
      if (this.project_open != -1){
        let pro_index = this.point_data.map((val)=> {return val.id}).indexOf(this.project_open);
        if (pro_index > -1 && this.point_data[pro_index].json_path.length > this.end_data_pro){
          this.init_data_pro += 10;
          this.end_data_pro += 10;
          this.project_now_position = this.end_data_pro/10;
        }
      }
    } else if ( this.option == 2){
      if (this.user_open != -1 && this.date_open){
        let usr_index = this.follow_data.map((val)=> {return val.id}).indexOf(this.user_open);
        if (usr_index > -1 && this.follow_data[usr_index].json_path[this.date_open].length > this.end_data_user){
          this.init_data_user += 10;
          this.end_data_user += 10;
          this.user_now_position = this.end_data_user/10;
        }
      }
    }
  }

  getClass(elemet) {
    if (this.data_board) {
      if (elemet == 0) {
        return 'col-xl-9 col-lg-9 col-md-9 col-sm-8 col-8';
      } else if (elemet == 1) {
        return 'col-xl-3 col-lg-3 col-md-3 col-sm-4 col-4';
      }
    } else {
      if (elemet == 0) {
        return 'col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12';
      } else if (elemet == 1) {
        return 'hidden-col';
      }
    }
    return '';
  }

  getClassDropdown() {
    if (this.option_board) {
      return 'active';
    }
    return '';
  }

  setOpenList(id, follow=false, tl=false){
    if (follow && tl){
      if (id!=-1) {
        let parts = id.split('&');
        let user = parts[0];
        let date = parts[1];
        this.checkTimelineData(user, date);
      }
      setTimeout(()=>{
        this.user_tl_open = id;
        this.user_now_position = 0;
        this.init_data_user = 0;
        this.end_data_user = 30;
      }, 200);
    } else if (follow){
      this.user_open = id;
    } else {
      this.project_open = id;
      this.project_now_position = 0;
      this.init_data_pro = 0;
      this.end_data_pro = 30;
    }
  }

  childrenChecked(parent_id, quantity){
    let count = this.point_select.filter((val) => { return (''+val).startsWith(parent_id+'-')}).length;
    return count == quantity;
  }

  setFilterAnswers(){

    this.init_data = 0;
    this.end_data = 2000;

    this.answer_position = 0;
    this.answer_now_position = 0;
    this.answer_data = [];
    this.answer_stop = false;
    this.answer_select = [];
    this.markers.answer = [];
    this.assigned_pins.answer = {};
    if (this.role_select)
      this.filter_options.role = this.role_select;
    if (this.list_user_select)
      this.filter_options.user = this.list_user_select;

    this.onDataAnswer();
  }

  setFilterFollow(){
    this.user_select = [];
    this.follow_data = {};
    this.markers.timeline = [];
    this.user_data = [];
    this.assigned_pins.user = {};
    this.ans_count = {};
    this.onDataUser();
  }

  setValueFilter(event:any[], doc=true){
    if (doc){
      if (event.includes("0")){
        this.filter_options.doc = null;
        this.selectRef.selected = ['0'];
      } else {
        this.filter_options.doc = event;
      }
      setTimeout(() => {
        this.doc_title = this.selectRef.button.nativeElement.innerText;
      }, 200);
    } else {
      if (event.includes("0")){
        this.follow_options.users = null;
        this.userSelRef.selected=['0'];
      } else {
        this.follow_options.users = event;
      }
      setTimeout(() => {
        this.follow_title = this.userSelRef.button.nativeElement.innerText;
      }, 200);
    }
  }

  setDateFilter(event, ini=true, follow=false) {
    if (follow){
      if (ini){
        this.follow_options.date_ini = event.target.value == "" ? null : event.target.value;
      }
      else{
        this.follow_options.date_fin = event.target.value == "" ? null : event.target.value;
      }
    }else{
      if (ini){
        this.filter_options.date_ini = event.target.value == "" ? null : event.target.value;
      }
      else{
        this.filter_options.date_fin = event.target.value == "" ? null : event.target.value;
      }
    }


  }

  onDataDevice(){
    this.select_device = [];
    this.assigned_pins.device = {};
    this.geoportalService.getDataDevices({}).subscribe((response) => {
      this.answer_device = [];
      this.markers.devices = [];
      this.papa.parse(response['data'], {
        complete: (result)=> {
          let device_data = result.data.filter((val) => { return val.length > 3 && !val.includes("table")}).filter((val) => !val.includes("_result"));
          let temp = {};
          // console.log(device_data);

          device_data.forEach(element => {
            let key = element[12];
            let value = element[6];
            switch (element[1]) {
              case "max_core":
                key = element[13];
                value = parseInt(value);
              case "cpu_model":
              case "ram":
                if (!Object.keys(temp).includes(key))
                  temp[key] = {};
                temp[key][element[1]] = element[1] == "ram" ? Math.ceil(parseFloat(value) / (1024*1024*1024)) : value;
                break;
              case "disk":
                key = element[14];
                if (!Object.keys(temp).includes(key))
                  temp[key] = {};
                if (temp[key]['disks'] == undefined)
                  temp[key]['disks'] = {total:0, used:0};
                let volumen = element[8];
                if (!Object.keys(temp[key]['disks']).includes(volumen))
                  temp[key]['disks'][volumen] = {};
                if (element[7] == "bsize") {
                  temp[key]['disks'][volumen]["total"] = Math.ceil(parseFloat(value) / (1024*1024*1024));
                  temp[key]['disks']['total'] += temp[key]['disks'][volumen]["total"];
                } else if (element[7] == "busy"){
                  temp[key]['disks'][volumen]["used"] = Math.ceil(parseFloat(value) / (1024*1024*1024));
                  temp[key]['disks']['used'] += temp[key]['disks'][volumen]["used"];
                }
                break;
              case "geo":
                if (!Object.keys(temp).includes(key))
                  temp[key] = {};
                if (temp[key]['geo'] == undefined)
                  temp[key]['geo'] = { lat : null, lng: null};
                if (temp[key]['name'] == undefined)
                  temp[key]['name'] = element[10];
                  temp[key]['time'] = element[5];
                if (element[7] == "latitud")
                  temp[key]['geo']['lat'] = value;
                else
                  temp[key]['geo']['lng'] = value;
                break;
              default:
                break;
            }
          });
          let keys = Object.keys(temp);
          let values = Object.values(temp);
          // console.log(keys, values);
          keys.forEach((element, i) => {
            let pin_color = '';
            if (!Object.keys(this.assigned_pins.device).includes(element)){
              do{
                if (Object.values(this.assigned_pins.device).length == this.pines.length){
                  this.assigned_pins.device = {};
                }
                pin_color = this.pines[Math.floor(Math.random() * this.pines.filter((el)=>{ return !Object.values(this.assigned_pins.device).includes(el)}).length)];
                if (pin_color == undefined){
                  continue
                }
              } while (Object.values(this.assigned_pins.device).includes(pin_color))
              this.assigned_pins.device[element] = pin_color;
            }

            let value = values[i];
            value["serial"] = element;

            if (value['geo'].lat && value['geo'].lng) {
              this.answer_device.push(value);
              let el = {
                id: element,
                parent_id: null,
                marker: new L.Marker([value['geo'].lat.replace(',', '.'), value['geo'].lng.replace(',', '.')],
                  {
                    icon: icon({
                      iconSize: [ 50, 50 ],
                      iconUrl: '/assets/icons/pines/device/computers/pinmap-'+ pin_color +'.png',
                    }),
                    interactive:true,
                    draggable:false,
                  }),
                popup: `
                  <p>Dispositivo ${value['name']}
                    <br> Ultimo registro ${new Date(value["time"]).toLocaleString()}
                  </p>`,
              };
              el['marker']['data'] = {id: element, parent_id: null};
              this.markers.devices.push(el);
            }
          });
          this.devSelRef.selected = ['0'];
          this.device_title = this.devSelRef.button.nativeElement.innerText;
        },
        error: (error, file) => {
          // console.log(error);
        }
      })
      // console.log(response);
    }, null, () => {
      this.loading=false;
      this.device_load = this.answer_device.length == 0;
      // console.log(this.markers.devices);
    });
  }

  setDeviceInfo(serial, dev?){
    // console.log(dev);
    if (this.show_info_device == serial){
      this.show_info_device = null;
    } else {
      this.show_info_device = serial;
    }
  }

  checkTimelineData(user, date, update?){
    if (this.follow_data == undefined){
      this.follow_data = {};
    }

    if (Object.keys(this.follow_data).includes(user)){
      if (Object.keys(this.follow_data[user]).includes(date)){
        if (update){
          this.updatePathsShown();
          this.updateMarkersShown();
        }
        return true;
      }
    }

    this.getUserPath(user, date);
  }

  goToCoordinates(marker, parent_id?){
    let coord:L.LatLngTuple = [0,0];
    if (this.option == 0){
      coord = [parent_id.lat, parent_id.lon];
    }else if (this.option == 1){
      coord = [marker.latitude, marker.longitude];
      marker = this.markers.answer.find(value => parent_id + '&' + marker.id == value.id)
    }else if (this.option == 2){
      marker = this.markers.user_last.find((value)=>value.id == marker)
      if (marker) {
        coord = [marker.marker.getLatLng().lat, marker.marker.getLatLng().lng];
      }
    }else if (this.option == 3){
      coord = [marker.geo.lat, marker.geo.lng];
    }
    this.map.setView(coord, 19);
    setTimeout(
      () => this.map.eachLayer((layer)=>{
        if (layer['_layers']){
          Object.values(layer['_layers']).forEach(element => {
            if (element['_markers']){
              element['_markers'].forEach(el => {
                if (this.option && (el['data']['id'] == marker.id || el['data']['id'] == marker.serial)){
                  this.map.openPopup(el['_popup']['_content'], coord, {
                    autoClose:true,
                  })
                } else if (this.option == 0 && el['data']['parent_id']+'-'+el['data']['id'] == marker){
                  this.map.openPopup(el['_popup']['_content'], coord, {
                    autoClose:true,
                  })
                }
              });
            }else if(element['_popup']){
              if (this.option && (element['data']['id'] == marker.id || element['data']['id'] == marker.serial)){
                this.map.openPopup(element['_popup']['_content'], coord, {
                  autoClose:true,
                })
              } else if (this.option == 0 && element['data']['parent_id']+'-'+element['data']['id'] == marker){
                this.map.openPopup(element['_popup']['_content'], coord, {
                  autoClose:true,
                })
              }
            }
          });
        }
      }), 100
    )
  }

  toggleVisibility(checked){
    if (!checked){
      this.markerData = [];
      this.updateMarkersShown();
    }
  }

  getColorPath(user, follow){
    let colorPath = '#'+( user in this.follow_data && follow in this.follow_data[user] ? this.follow_data[user][follow].color : '000000')
    console.log("escoger color path")
    console.log(colorPath)
    return colorPath;
  }

  onChangeOptionRol(){
    // console.log(this.role_select)
    this.list_user_select = [];
    this.list_user = [];
    this.user_select_p = [];
    if(this.role_select != "0"){
      this.userService.get_user_role(this.role_select).subscribe(
        response => {
          let data_list = response['data'];
          this.list_user = data_list;
          data_list.forEach(element => {
            this.user_select_p.push(element.id)
          });
          // console.log(this.user_select_p)
        }
      );
    }else{
      this.associateService.get_user().subscribe(
        response => {
          let data_list = response['data'];
          this.list_user = data_list;
          this.list_user.push({
            "id": 'null',
            "first_name": "Usuario",
            "first_last_name": "Publico"
          });
        }
      );
    }
  }

  onChangeFollowRol(selection){
    this.user_select_p = [];
    if(selection.includes('0')){
      this.follow_options.users = null;
      this.follow_options.role = null;
      this.folRolSelect.selected = ['0'];
      this.user_data_sel = this.user_data_all;
      this.tot_count = this.user_data_all.length;
    }else{
      this.list_user = this.all_user.filter((value) => this.list_follow_role_ids.includes(value.r));
      this.user_data_sel = this.all_user.filter((value) => selection.includes(''+value.r));
      this.tot_count = this.user_data_sel.length;
      this.follow_options.role = selection;
      this.follow_options.users = null;
      this.userSelRef.selected = ['0'];
    }
  }

  setOpenListAnswer(user_id, date=false, form=false){
    if (user_id && date && form){
      this.ans_date_form_open = user_id + '&' + date + '&' + form;
    } else if (user_id && date){
      this.ans_date_open = user_id + '&' + date;
      this.ans_date_form_open = '';
    }
    else if (user_id){
      this.ans_open = user_id;
      this.ans_date_open = '';
    } else {
      this.ans_open = 0;
    }
  }

  togglePins(values:string[], flag=true){
    let prefix = values.join('&');
    switch(values.length){
      case 2:
      case 3:
        prefix += '&'
        this.markers.answer.forEach(element => {
          if((''+element.id).startsWith(prefix)){
            this.showHidePin(''+element.id, flag);
          }
        });
        break;
      case 4:
        this.showHidePin(prefix, flag);
        break;
    }
  }

  showHidePin(id:string, flag:boolean){
    let index = this.answer_select.indexOf(id);
    let state = null;
    let number;
    if (index != -1 && !flag){
      this.answer_select.splice(index,1);
      state = false;
      number = -1;
    } else if (index == -1 && flag){
      this.answer_select.push(id);
      state = true;
      number = 1;
    }
    let id_parts = id.split('&');
    if (state !== null){
      this.ans_count[id_parts[0]][id_parts[1]]['selected'] = this.ans_count[id_parts[0]][id_parts[1]]['selected'] + number;
      this.ans_count[id_parts[0]][id_parts[1]]['checked'] = this.ans_count[id_parts[0]][id_parts[1]]['selected'] == this.ans_count[id_parts[0]][id_parts[1]]['count'];
      this.ans_count[id_parts[0]][id_parts[1]][id_parts[2]]['selected'] = this.ans_count[id_parts[0]][id_parts[1]][id_parts[2]]['selected'] + number;
      this.ans_count[id_parts[0]][id_parts[1]][id_parts[2]]['checked'] = this.ans_count[id_parts[0]][id_parts[1]][id_parts[2]]['selected'] == this.ans_count[id_parts[0]][id_parts[1]][id_parts[2]]['count'];
    }

  }
}
