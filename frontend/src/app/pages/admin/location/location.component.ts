import { NbDialogService, NbDialogRef } from '@nebular/theme';
import { AdminService } from './../../../services/admin.service';
import { ToastService } from './../../../usable/toast.service';
import { LocalDataSource } from 'angular2-smart-table';
import { Component, OnInit } from '@angular/core';

import { OnChanges, SimpleChanges } from "@angular/core";
import { FormControl } from "@angular/forms";
import { DefaultFilter } from "angular2-smart-table";
import { debounceTime, distinctUntilChanged } from "rxjs/operators";

@Component({
    selector: "input-filter-location",
    template: `
    <nb-form-field>
      <nb-icon nbPrefix icon="search-outline" pack="eva"></nb-icon>
      <input
        [ngClass]="inputClass" nbInput fullWidth
        [formControl]="inputControl"
        class="form-control"
        type="text"
        placeholder="Buscar por {{ column.title }}..."
      />

    </nb-form-field>
  `,
    standalone: false
})


export class CustomInputTextFilterComponentLocation extends DefaultFilter implements OnInit, OnChanges {
  inputControl = new FormControl();

  constructor() {
    super();
  }

  ngOnInit() {
    if (this.query) {
      this.inputControl.setValue(this.query);
    }
    this.inputControl.valueChanges.pipe(distinctUntilChanged(), debounceTime(300)).subscribe((value: string) => {
      this.query = this.inputControl.value;
      this.setFilter();
    });
  }
  ngOnChanges(changes: SimpleChanges) {
    if (changes.query) {
      this.inputControl.setValue(this.query);
    }
  }
}

@Component({
    selector: 'ngx-location',
    templateUrl: './location.component.html',
    styleUrls: ['./location.component.scss'],
    standalone: false
})
export class LocationComponent implements OnInit {

  city_values = [];
  country_values = [];

  settings = {
    mode: 'external',
    noDataMessage: 'No hay puntos de inicio registrados.',
    actions:{
      columnTitle: "Acciones",
      add: this.onPermit(51),
      edit: this.onPermit(52),
      delete: false, // this.onPermit(53),
    },
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
      confirmCreate: true,
    },
    edit: {
      editButtonContent: '<i class="nb-edit" itemprop="Editar"></i>',
      saveButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close" itemprop="Eliminar"></i>',
      confirmSave: true,
    },
    columns: {
      name: {
        title: 'Nombre Sucursal',
        type: 'html',
        valuePrepareFunction: function(cell, row) {
          if (row.is_default){
            return '<span class="primary">' + cell + '</span>'
          }
          return '<span>' + cell + '</span>'
        },
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentLocation,
        }
      },
      address: {
        title: 'Dirección',
        type: 'string',
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentLocation,
        }
      },
      country: {
        title:'Pais',
        type: 'list',
        filter: {
          type: 'list',
          config: {
            selectText: 'Buscar por Pais',
            list: [
            ],
          },
        },
        config:{
          selectText: 'Selecciona el Pais',
          list: [],
        },
        valuePrepareFunction: (value) => {
          return this.country_values.filter(country => country.value == value).map(country => country.title)[0];
        },
      },
      city: {
        title: 'Ciudad',
        type: 'list',
        filter: {
          type: 'list',
          config: {
            selectText: 'Buscar por ciudad',
            list: [],
          },
        },
        config:{
          selectText: 'Selecciona la ciudad',
          list: [],
        },
        valuePrepareFunction: (value) => {
          return this.city_values.filter(city => city.value == value).map(city => city.title)[0];
        },
      },
      lat: {
        title: 'Latitud',
        type: 'string',
        editor: false,
        editable: false,
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentLocation,
        }
      },
      lon: {
        title: 'Longitud',
        type: 'string',
        editable: false,
        editor: false,
        filter: {
          type: "custom",
          component: CustomInputTextFilterComponentLocation,
        }
      },
      state:{
        title:"Estado",
        type: 'html',
        valuePrepareFunction: function(cell, row) {
          if (cell == true || cell == 'true') {
            return '<span class="success">Activo</span>';
          } else {
            return '<span class="default">Inactivo</span>';
          }
        },
        editor: {
          type: 'list',
          config: {
            selectText: 'Seleciona el estado',
            list: [
              { value: true, title: 'Activo' },
              { value: false, title: 'Inactivo' },
            ],
          },
        },
        filter: {
          type: 'list',
          config: {
            selectText: 'Buscar por estado',
            list: [
              { value: true, title: 'Activo' },
              { value: false, title: 'Inactivo' },
            ],
          },
        }
      }
    },
  };

  source: LocalDataSource = new LocalDataSource();

  cities = [];
  countries = [];

  load = true;

  onPermit(id:number): Boolean {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['permission'].includes(id)) {
      return true;
    }
    return false;
  }

  constructor(public toastService: ToastService, private service:AdminService, private dialogService:NbDialogService) {
    // Carga de Paises
    this.service.getCountry().subscribe(response => {
      if (response['status']){
        this.countries = response['data'];
        this.country_values = [];

        this.countries.forEach(country => {
          this.country_values.push({value: country.id, title: country.name});
        });

        this.settings.columns.country.config.list = this.country_values;
        this.settings.columns.country.filter.config.list = this.country_values;
        this.settings = Object.assign({}, this.settings);
      } else {
        this.toastService.showToast('danger', 'Error', 'No se logro recuperar los datos');
      }
    }, error => {
      // console.log(error)
      this.toastService.showToast('danger', 'Error', error);
    })

    // Carga de Ciudades
    this.service.getCity().subscribe(response => {
      if (response['status']){
        this.cities = response['data'];
        this.city_values = [];

        this.cities.forEach(city => {
          this.city_values.push({value: city.id, title: city.name});
        });

        this.settings.columns.city.config.list = this.city_values;
        this.settings.columns.city.filter.config.list = this.city_values;
        this.settings = Object.assign({}, this.settings);
      } else {
        this.toastService.showToast('danger', 'Error', 'No se logro recuperar los datos');
      }
    }, error => {
      // console.log(error)
      this.toastService.showToast('danger', 'Error', error);
    })
  }

  ngOnInit(): void {
    this.service.getLocations().subscribe(response => {
      if (response['status']){
        this.source.load(response['data']);
      } else {
        this.toastService.showToast('danger', 'Error', 'No se logro recuperar los datos');
      }
    }, error => {
      // console.log(error)
      this.toastService.showToast('danger', 'Error', error.error.detail);
    })
  }

  onCreate(event):void {
    const dialogRef = this.dialogService.open(LocationDialogComponent, {context:{data: {title:"Registrar Sucursal", type:1, parentComponent:this}}});
  }

  onEdit(event):void {
    // console.log(event);
    var data = event.data;
    const dialogRef = this.dialogService.open(LocationDialogComponent, {context:{data: {title:"Editar Sucursal", type:2, parentComponent:this, location:data, row:event}}});
  }

  public getService():AdminService{
    return this.service;
  }
}


@Component({
    selector: 'ngx-location-dialog',
    templateUrl: 'dialog.html',
    styles: ['nb-card-footer { text-align:end}', 'button {margin:5px}', 'nb-checkbox {margin:5px 0px}', 'nb-select {width:100%;}'],
    standalone: false
})
export class LocationDialogComponent implements OnInit{

  name;
  address;
  country;
  city;
  isDefault;
  state_location = this.onPermit(53);

  public data: {title:string, type:number, location?:{id:number, name:string, address:string, country:string, city:string, is_default:boolean}, parentComponent: LocationComponent, row?:any}

  loading;

  onPermit(id:number): Boolean {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['permission'].includes(id)) {
      return true;
    }
    return false;
  }

  constructor(
   public dialogRef: NbDialogRef<LocationDialogComponent>,
   ){

  }
  ngOnInit(): void {
    if (this.data.location != undefined){
      this.name = this.data.location.name;
      this.address = this.data.location.address;
      this.country = this.data.location.country;
      this.city = this.data.location.city;
      this.isDefault = this.data.location.is_default;
    }
  }

  close(){
    this.dialogRef.close();
  }

  toggle(checked: boolean) {
    this.isDefault = checked;
  }

  // No se a notificado esta funcion. ¡Pendiente por notificar que proceso hacer cuando se deshabilite! 
  onDisable(event){
    this.data.parentComponent.toastService.showToast('warning', 'No se puede deshabilitar en este momento', 'Lo sentimos');
  }

  onAccept(event){

    this.loading = true;
    let errors = false;
    let name;
    let address;
    let country;
    let city;
    let isDefault = false;

    setTimeout(() => {
      this.loading = false;
      }, 4000
    );

    switch(this.data.type){
      case 1:
        if (undefined == this.name || "undefined" == ('' + this.name).trim() || !this.name){
          this.data.parentComponent.toastService.showToast('warning', 'Parece que no hay dato', 'Lo sentimos, pero es necesario que proveas un nombre para la sucursal a crear.');
          errors = true;
        } else {
          name = this.name.trim();
        }
        if (this.address !== undefined || !("undefined" == ('' + this.address).trim())){
          address = this.address.trim();
        }

        if (this.city !== undefined || !("undefined" == ('' + this.city).trim())){
          city = this.city;
        }

        if (this.country !== undefined || !("undefined" == ('' + this.country).trim())){
          country = this.country;
        }

        if (!errors) {
          let data = {name: name, address: address, city: city, country: country, is_default: this.isDefault != undefined ? this.isDefault : false };
          this.data.parentComponent.getService().createLocation(data).subscribe(response => {
            // console.log(response);
            if (response['status']){
              response['data']['state'] = true;

              //Incluir nueva fila y actualización de la tabla
              if (isDefault) {
                this.data.parentComponent.source.getAll().then(value => {
                  value.forEach(element => {
                       element["is_default"] = false;
                  });
                });
              }

              this.data.parentComponent.source.add(response['data']);

              this.data.parentComponent.source.refresh();

              this.data.parentComponent.toastService.showToast('success', 'Registrada', 'Sucursal registrada con exito.');
              this.dialogRef.close(true);
              this.loading = false;
            }
          },
          error => {
            this.data.parentComponent.toastService.showToast('danger', 'Oops! Ha ocurrido algo', error.error.detail);
          });
        }
        break;
      case 2:
        if (undefined == this.name || "undefined" == ('' + this.name).trim() || !this.name){
          this.data.parentComponent.toastService.showToast('warning', 'Parece que no hay dato', 'Lo sentimos, pero es necesario que proveas un nombre para la sucursal a modificar.');
          errors = true;
        } else {
          name = this.name.trim();
        }
        if (this.address !== undefined || !("undefined" == ('' + this.address).trim())){
          address = this.address.trim();
        }

        if (this.city !== undefined || !("undefined" == ('' + this.city).trim())){
          city = this.city;
        }

        if (this.country !== undefined || !("undefined" == ('' + this.country).trim())){
          country = this.country;
        }
        if (!errors) {

          let data = {name: name, address: address, city: city, country: country, is_default: this.isDefault != undefined ? this.isDefault : false };

          this.data.parentComponent.getService().updateLocation(this.data.location.id, data).subscribe(response => {
            // console.log(response);
            if (response['status']){
              //Incluir actualización de datos en la fila y actualización de la tabla
              if (isDefault) {
                this.data.parentComponent.source.getAll().then(value => {
                  value.forEach(element => {
                       element["is_default"] = false;
                  });
                });
              }
              this.data.row.data.name=name;
              this.data.row.data.address=address;
              this.data.row.data.city=response['data']['city'];
              this.data.row.data.country=response['data']['country'];
              this.data.row.data.is_default=response['data']['is_default'];
              // console.log(this.data.row.data);
              this.data.parentComponent.source.refresh();

              this.data.parentComponent.toastService.showToast('success', 'Cambio realizado', 'Sucursal ha sido modificada exitosamente!');

              this.dialogRef.close(true);
              this.loading = false;
            }
          },
          error => {
            this.data.parentComponent.toastService.showToast('danger', 'Oops! Ha ocurrido algo', error.error.detail);
          });
        }
        break;
      default:
        this.dialogRef.close(true);
    }
  }

}
