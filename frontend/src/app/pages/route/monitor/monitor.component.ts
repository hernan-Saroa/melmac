import { ToastService } from './../../../usable/toast.service';
import { RoutingService } from './../../../services/routing.service';
import { ActivatedRoute} from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { NbMenuBag, NbMenuService } from '@nebular/theme';
import { latLng, Layer, Map, Marker, Polygon, tileLayer, icon } from 'leaflet';
import { pines } from '../../../usable/pines';

@Component({
    selector: 'ngx-monitor',
    templateUrl: './monitor.component.html',
    styleUrls: ['./monitor.component.scss'],
    standalone: false
})
export class MonitorComponent implements OnInit {

  data_service = [
    {
      title: 'Servicio',
      value: '#0057',
    },
    {
      title: 'Distancia',
      value: '12km',
    },
    {
      title: 'Tiempo',
      value: '20m',
    },
    {
      title: 'Observaciones',
      value: 'Niguna',
    },
  ];

  address_list = [];

  trace_service = {
    num: '#001',
    user: [],
    trace: []
  };

  address_index = null;
  items = [
    {
      title:'Datos de la Entrega',
    },
    {
      title:'Ver Comprobante',
    },
    {
      title:'Cancelar Servicio',
    },
  ];

  data_state = true;
  data_delivery = false;
  data_voucher = false;
  data_option = false;
  select_address;

  loading = false;
  map:Map

  markers: { position:Layer[], paths:Layer[] } = {
    position: [],
    paths: [],
  };

  options = {
    layers: [
      tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '...' })
    ],
    zoom: 8,
    center: latLng(4.600868, -74.08175)
  };

  polylineOptions = []

  location_selected = null;

  pines;

  assigned_pins = [];

  constructor(
    private route: ActivatedRoute,
    private service:RoutingService,
    public toastService:ToastService,
    private nbMenuService: NbMenuService
    ) {
      this.pines = pines;
    }

  ngOnInit(): void {
    this.markers = {paths:[], position:[]}
    let id = this.route.snapshot.params.route;
    this.service.getServiceDetail(id).subscribe(response => {
      if (response['status']){
        this.data_service[0].value = 'ME000-'+id;
        this.data_service[1].value = Math.ceil(response['data']['details']['total_distance']/1000) + ' km';
        this.data_service[2].value = Math.ceil(response['data']['details']['total_duration']/60) + ' min';
        this.data_service[3].value = response['data']['details']['description'];

        let pos = [response['data']['details']['lat'], response['data']['details']['lon']];

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

        this.markers.position.push(
          new Marker(
            [
              pos[0],
              pos[1]
            ], {
              title: 'Punto de Inicio - ' + response['data']['details']['initial_position__address'],
              draggable:false,
              interactive:true,
              icon: icon({
                iconSize: [ 30, 30 ],
                iconAnchor: [ 30, 30 ],
                iconUrl: '/assets/icons/pines/pines/pinmap-'+ icon_random +'.png',
              }),
            }));
        // Color ruta e icono


        let route = {
          path: [
            [
              response['data']['details']['lat'],
              response['data']['details']['lon']
            ]
          ],
          strokeColor: '#' + icon_random,
          strokeOpacity: 1.0,
          strokeWeight: 2,
        };

        this.address_list = [];
        response['data']['locations'].forEach((element, index) => {
          if (element['service__process_state__name'] != 'Servicio Cancelado') {
            let temp = {
              id: element['service_id'],
              address: element['service__address_normalized'],
              user_name: element['service__user_name'],
              user_phone: element['service__user_phone_number'],
              user_id_number: element['service__user_id_number'],
              comment: element['service__comment'],
              guide: element['service__guide_number'],
              answer: element['service__answer_form_id'],
            }
            this.address_list.push(temp);
            this.markers.position.push(
              new Marker([
                element['service__latitude'],
                element['service__longitude']
              ], {
                icon: icon({
                  iconSize: [ 30, 30 ],
                  iconAnchor: [ 30, 30 ],
                  iconUrl: '/assets/icons/pines/pines/pinmap-'+ icon_random +'.png',
                }),
                title: element['service__address_normalized'],
                draggable:false,
                interactive:true
              })
            );
          }
        });
        if (response['data']['path']){
          try{
            for(let i=0; i<response['data']['path']['path'].length; i++){
              route.path.push([
                response['data']['path']['path'][i]['lat'],
                response['data']['path']['path'][i]['lng']
              ]);
            }
            for(let i=response['data']['path']['path'].length-1; i>0; i--){
              route.path.push([
                response['data']['path']['path'][i]['lat'],
                response['data']['path']['path'][i]['lng']
              ]);
            }
          } catch(error){

          }
          this.polylineOptions = [route];

          this.trace_service = null;
          this.markers.paths.push(new Polygon(route.path, {
            color:route.strokeColor,
            interactive:false,
            fillOpacity:0
          }));
        }
      }
    })

    this.nbMenuService.onItemClick()
    .subscribe(
      (nbMenuBag:NbMenuBag) => {
        this.select_address = this.address_list[nbMenuBag.tag];
        this.address_index = Number(nbMenuBag.tag);

        this.loading = true;
        this.data_state = false;
        this.data_delivery = false;
        this.data_voucher = false;
        this.data_option= false;
        switch (nbMenuBag.item.title) {
          case 'Datos de la Entrega':
            this.data_delivery = true;
            this.loading = false;
            break;
          case 'Ver Comprobante':
            this.data_voucher = true;
            break
          case 'Cancelar Servicio':
            this.data_option= true;
            break;
        }
        this.loading = false;
      }
    );

    setTimeout(()=> {this.map.invalidateSize()}, 500);

  }

  showTrace(id, guide, index){
    this.loading = true;

    this.data_state = true;
    this.data_delivery = false;
    this.data_voucher = false;
    this.data_option= false;

    this.address_index = index;
    this.location_selected = id;
    this.service.getTraceLocation(id).subscribe(response => {
      if (response['status']){
        this.trace_service = {
          num: guide,
          user: response['data']['user'],
          trace: []
        };

        response['data']['trace'].forEach(element => {
          this.trace_service.trace.push({
            name: element['process_state__name'],
            date: element['date_trace'] + ' ' + element['hour_trace']
          })
        });
      }
      this.loading = false;
    });
  }

  onMapReady(map:Map){
    this.map = map;
  }

  cancelService() {
    this.loading = true;
    let data = {
      'id': this.select_address.id,
      'process_id': 6,
    }
    this.service.changeState(data).subscribe(response => {
      if (response['status']) {
        this.address_list.splice(Number(this.address_index), 1);

        this.trace_service = null;
        this.data_state = true;
        this.data_option= false;
      }
      this.loading = false;
    });
    this.address_index = null;
  }

  showAnswer(){
    window.open('/pages/answer/view/' + this.select_address.answer);
  }

  getClass(index) {
    if (index == this.address_index){
      return 'select-address';
    }
    return '';
  }
}
