import { ChangeDetectorRef, Component, OnDestroy, OnInit, Type, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, NavigationExtras, Router } from '@angular/router';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

import { FormService } from '../../../services/form.service';
import { DigitalService } from '../../../services/digital.service';
import { ToastService } from '../../../usable/toast.service';
import { LocalDataSource } from 'angular2-smart-table';

import { NbDialogService, NbDialogRef } from '@nebular/theme';
import { NbPopoverDirective, NbPosition, NbTrigger } from '@nebular/theme';

import { types } from './types';
import { pines } from './pines';
// import { runInThisContext } from 'vm';

@Component({
    selector: 'ngx-create',
    templateUrl: './create.component.html',
    styleUrls: ['./create.component.scss'],
    standalone: false
})
export class CreateComponent implements OnInit, OnDestroy {

  id = null;
  version = null;
  title_component = 'Crear documento';
  end_component = '¡Documento Guardado!';

  // Step and views
  create_process = true;
  form_process = false;
  drag_process = false;
  input_process = false;
  pdf_process = false;
  end_process = false;
  metadataCollapsed = false;

  loading = false;

  createForm: FormGroup;
  buildForm: FormGroup;
  pdfForm: FormGroup;

  // --- Create ---
  name = '';
  description = '';
  template_option = '0';
  template_color = '#000000';
  pin_color = '';
  template_preview = 'template_1.png';
  file_source:File;
  file_name = '';
  digital = false;
  digital_ia = false;
  process_digital_ia = false;
  interval_ia: any;
  is_pin = false;
  is_digital = false;
  consecutive = false;
  pines = [];
  logo_source:File;
  logo_name = '';

  // Template
  trigger = NbTrigger.CLICK;
  position = NbPosition.TOP;

  // --- Create Consecutive ---
  // Drag and Drop
  todo;
  done = [];
  done_original = [];

  // Form Fields
  form_set = null;
  list_field_set;
  field_set = null;

  list_form_get = [];
  form_get = null;
  list_field_get;
  field_get = null;

  field_consecutive = [];
  field_consecutive_original = [];

  field_data_files = {};

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


  // --- Form Builder ---
  public options: any;
  public valueDocuments: any;
  public valueNit: any;
  public optionsDocuments: any;
  public types: any;
  public form: Object = {
    components: [
    ]
  };

  //validate fields visit
  compare_types = ["1","2","4","5","6","16","19"];
  types_visit = []
  validateVisit = false

  field_types = [];
  form_field = [];
  form_field_original = [];
  form_content;

  // --- PDF ---
  src;
  width = 0;
  height = 500;
  pages_count;
  pages;
  // Opciones
  page = 1;
  font = 'Arial';
  color = '#000000';
  size = 9;
  bold = false;
  italic = false;
  underline = false;
  line_check = false;
  line_height = 10;
  // Tipos de campo
  // Firma - Imagen
  size_image_x = 100;
  size_image_y = 50;
  // Fecha - Selecionable
  option = '0';
  option_value = null;

  column_value = null;
  column_type = null;
  column_options = [];
  row_field = 1;

  new_field = false;

  // Campos
  forms = [];
  fields_drag = [];
  fields_drag_original = '';
  fields_id = {};
  field_option_over = undefined;
  field_over = undefined;

  field = [];
  field_type = 0;
  field_index = null;

  fields_answer = [
    {
      key: 1,
      answer_value: 1,
      label: 'Fecha de Diligenciamiento',
      field_type: '4',
    },
    {
      key: 2,
      answer_value: 2,
      label: 'Fecha de Envió',
      field_type: '4',
    },
    {
      key: 3,
      answer_value: 3,
      label: 'Nombre Completo del Usuario',
      field_type: '1',
    },
    {
      key: 4,
      answer_value: 4,
      label: 'Número Identificación Usuario',
      field_type: '1',
    },
    {
      key: 5,
      answer_value: 5,
      label: 'Correo Electrónico Usuario',
      field_type: '1',
    },
    {
      key: 6,
      answer_value: 100,
      label: 'Configuración Adicional',
      field_type: '1000',
    },
  ];

  fields_visits = [
    {
      key: 1,
      answer_value: 200,
      label: '# Ticket',
      field_type: '1',
    },
  ];

  columns_additional = [];
  additional_value = null;
  permitsVisit=true

  data_identifications = [
    { 'key': 'A', 'value': 1, 'label': 'Registro civil de nacimiento' },
    { 'key': 'B', 'value': 2, 'label': 'Tarjeta de identidad' },
    { 'key': 'C', 'value': 3, 'label': 'Cédula de ciudadanía' },
    { 'key': 'D', 'value': 4, 'label': 'Tarjeta de extranjería' },
    { 'key': 'E', 'value': 5, 'label': 'Cédula de extranjería' },
    { 'key': 'F', 'value': 6, 'label': 'NIT' },
    { 'key': 'G', 'value': 7, 'label': 'Pasaporte' },
  ]

  // Tipos de Documento
  type_identification = [
    {'key': 'A', 'id': 1, 'name': 'Cédula de ciudadanía'},
    {'key': 'B', 'id': 2, 'name': 'Tarjeta de identidad'},
    {'key': 'C', 'id': 3, 'name': 'Cédula de extranjería'},
    {'key': 'D', 'id': 4, 'name': 'Pasaporte'},
    {'key': 'E', 'id': 5, 'name': 'Permiso de permanencia'},
    {'key': 'F', 'id': 6, 'name': 'Permiso por protección temporal'},
  ];

  param_visit;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private formService: FormService,
    private digitalService: DigitalService,
    private toastService: ToastService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    private dialogService:NbDialogService,
    private route: ActivatedRoute
  ) {
    this.id = this.activatedRoute.snapshot.paramMap.get('id');
    this.activatedRoute.data.subscribe(data => {
      this.consecutive = data['consecutive'];
      if (data['consecutive']) {
        this.title_component = 'Crear documento en serie';
        this.end_component = '!Documento en serie Guardado!';
      }
    });

    this.createForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      template: [''],
      template_option: ['0'],
      template_color: ['#000000'],
      pin_color: [''],
      logo: [''],
    });
    // this.options = options;
    this.types = types;
    this.pines = pines;


    //this.field_types = Object.assign([], this.types);
    this.param_visit = this.route.snapshot.params['param'];
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    const dataFirms = ["10","18"]
    this.types.forEach(element => {
      if (user_data['permission'].includes(61)) {
        if(this.compare_types.includes(element.field_type)){
          this.field_types.push(element);
          this.types_visit.push(element);
          this.validateVisit = true;
        }
        else if(this.param_visit == undefined){
          this.field_types.push(element);
          this.validateVisit = false;
        }
      }else if( !dataFirms.includes(element.field_type)){
        this.field_types.push(element);
      }
    });


  }

  ngOnInit(): void {
    //Permit visit
    const userPermit = JSON.parse(localStorage.getItem('session')) || null;
    if (userPermit) {
      const permits:number[] = userPermit.permission;
      let view:string;
      if(permits.includes(63)){
        this.permitsVisit=true
      }else{
        this.permitsVisit=false
      }
    }

    if (this.id != null) {
      this.title_component = 'Modificar documento';
      if (this.consecutive) {
        this.title_component = 'Modificar documento en serie';
        this.getFormConsecutiveData();
      } else {
        this.getFormData();
      }
    } else if (this.consecutive) {
      // Secciones Individuales
      this.formService.view(0).subscribe(
        response => {
          if (response['status']){
            this.todo = response['data'];
          }
        }
      );
    }

    // this.getDataDigital();
  }

  ngOnDestroy() {
    clearInterval(this.interval_ia);
  }

  // --- Creación ---

  // Valida el archivo y su tipo
  onFileSelected(event, type){
    let change_file = false;

    if (type == 'template') {
      this.file_source = event.target.files[0];
      if (this.file_source && this.file_source.type == 'application/pdf') {
        this.file_name = this.file_source.name;
        change_file = true;
      }
    } else if (type == 'logo') {
      let logo_ext = ['image/png', 'image/jpg', 'image/jpeg']
      this.logo_source = event.target.files[0];
      if (this.logo_source && logo_ext.includes(this.logo_source.type)) {
        this.logo_name = this.logo_source.name;
        change_file = true;
      }
    }

    if (!change_file) {
      if (type == 'template') {
        this.toastService.showToast('warning', 'Documento Digital', 'El archivo no es formato PDF.');
      } else if (type == 'logo') {
        this.toastService.showToast('warning', 'Documento Digital', 'El archivo no es formato Imagen.');
      }
      this.logo_name = null;
      this.file_name = null;
      this.createForm.setValue({
        name:  this.createForm.controls['name'].value,
        description: this.createForm.controls['description'].value,
        template: null,
        template_option: this.createForm.controls['template_option'].value,
        template_color: this.createForm.controls['template_color'].value,
        pin_color: this.createForm.controls['pin_color'].value,
        logo: null,
      });
    }
  }

  // Crear el formulario con la plantilla
  onFirstSubmit(next_first) {
    if (this.createForm.controls['name'].value != '' && this.createForm.controls['description'].value != '') {
      this.loading = true;

      this.name = this.createForm.controls['name'].value;
      this.description = this.createForm.controls['description'].value;
      // servicio de creación
      const formData = new FormData();
      if (this.id != null) {
        formData.append("id", this.id);
      }
      formData.append("name", this.createForm.controls['name'].value);
      formData.append("description", this.createForm.controls['description'].value);
      formData.append("theme", this.createForm.controls['template_option'].value);
      formData.append("color", this.createForm.controls['template_color'].value);
      formData.append("pin", this.createForm.controls['pin_color'].value);
      if (this.consecutive) {
        formData.append("consecutive", '1');
      } else {
        formData.append("consecutive", '0');
      }
      if (this.digital) {
        formData.append("digital", '1');
        if (this.digital_ia) {
          formData.append("digital_ia", '1');
        } else {
          formData.append("digital_ia", '0');
        }
      } else {
        formData.append("digital", '0');
      }
      if (this.file_name != null) {
        formData.append("template", this.file_source);
      }

      if (this.logo_name != null) {
        formData.append("logo", this.logo_source);
      }

      this.digitalService.create(formData).subscribe(response => {
        if (response['status']) {
          this.id = response['id'];
          if (this.digital && this.digital_ia) {
            this.getStatusIA(next_first)
          } else {
            setTimeout(() => {
              this.loading = false;
              this.toastService.showToast('success', 'Documento', 'Documento guardado. Ahora puedes agregar campos.');
              this.metadataCollapsed = true; // Auto-collapse to give space to field builder
              // Siguiente paso
              if (this.consecutive) {
                this.create_process = true;
                this.form_process = false;
                this.drag_process = true;
                this.pdf_process = false;
              } else {
                this.create_process = true;
                this.form_process = true;
                this.drag_process = false;
                this.pdf_process = false;
              }
            }, 1000);
          }
        }
      });

      this.createForm.markAsDirty();
    } else {
      this.toastService.showToast('warning', 'Documento Digital', 'Datos incompletos.');
    }
  }

  getFormData(){
    this.loading = true;
    this.formService.get_data_form(this.id).subscribe(
      response => {
        if (response['status']){
          let color_update = '#000000';
          let pin_update = '#000000';
          if (response['form']['color'] != '') {
            color_update = response['form']['color'];
          }
          if (response['form']['pin'] != '') {
            pin_update = response['form']['pin'];
          }
          this.createForm.setValue({
            name:  response['form']['name'],
            description: response['form']['description'],
            template: null,
            template_option: response['form']['theme'],
            template_color: color_update,
            pin_color: pin_update,
            logo: null,
          });
          this.template_option = response['form']['theme'];
          this.template_color = color_update;
          this.pin_color = pin_update;

          this.digital = response['form']['digital'];
          this.is_digital = response['form']['digital'];

          if (response['form']['digital']) {
            this.file_name = 'Plantilla cargada';
          }
          this.version = response['form']['version']
          this.form_field = response['form']['fields'];
          // console.log("this.form_field:::::::::");
          // console.log(this.form_field);

          if (response['form']['digital_ia_state']) {
            if (response['form']['digital_ia_status'] == 1) {
              this.getStatusIA();
            }
          }

          this.form_field_original = Object.assign([], response['form']['fields']);
          this.form_field = this.form_field.filter(item => !(item.field_type === '11' && item.label === 'Número de documento a validar biometricamente'));
          // this.form = new Object({components: response['form']['fields']});
          // this.form_content = {components: JSON.parse(JSON.stringify(response['form']['fields']))};
          this.loading = false;
          this.metadataCollapsed = true; // Auto-collapse for existing docs
        }
      }
    );
  }

  getStatusIA(next_first = undefined){
    this.process_digital_ia = true;
    this.interval_ia = setInterval(() => {
      this.loading = true;
      this.formService.get_digital_ia_state(this.id).subscribe(
        response => {
          if (response['status']){
            if (response['number_status'] != 0 && response['number_status'] != 1) {
              this.getFormData();
              clearInterval(this.interval_ia);
              if (next_first != undefined) {
                next_first.hostElement.nativeElement.click();
              }
              this.create_process = false;
              this.form_process = true;
              this.drag_process = false;
              this.pdf_process = false;
            }
          }
        }
      );
      setTimeout(() => {
        this.loading = false;
      }, 1500);
    }, 10000);
  }

  isFieldFixed(field: any): boolean {
    return field.field_type === 1 || field.field_type === 3 || field.field_type === 7;
  }

  toggle(checked: boolean) {
    this.digital = checked;
    if (this.digital){
      this.digital_ia = false;
    }
  }

  toggleIA() {
    if (this.digital){
      this.digital_ia = !this.digital_ia;
    }
  }

  toggle_pin(checked: boolean) {
    this.is_pin = checked;
  }
  // --- Creación Consecutivo ---
  getFormConsecutiveData(){
    this.loading = true;
    this.formService.get_data_consecutive(this.id).subscribe(
      response => {
        if (response['status']){
          let color_update = '#000000';
          let pin_update = '';
          if (response['consecutive']['color'] != '') {
            color_update = response['consecutive']['color'];
          }
          if (response['consecutive']['pin'] != '') {
            pin_update = response['consecutive']['pin'];
          }
          this.createForm.setValue({
            name: response['consecutive']['name'],
            description: response['consecutive']['description'],
            template: null,
            template_option: response['consecutive']['theme'],
            template_color: color_update,
            pin_color: pin_update,
            logo: null,
          });
          this.template_option = response['consecutive']['theme'];
          this.template_color = color_update;
          this.pin_color = pin_update;

          this.digital = response['consecutive']['digital'];
          this.is_digital = response['consecutive']['digital'];

          if (response['consecutive']['digital']) {
            this.file_name = 'plantilla.pdf';
          }
          this.version = response['consecutive']['version'];

        // se debe quitar los de todo que esten en done.
          this.todo = response['consecutive']['todo'];
          response['consecutive']['forms'].forEach(consecutive => {
            this.done.push({
              id: consecutive['id'],
              name: consecutive['name'],
            })

            // Sección con sus campos.
            this.field_consecutive.push({
              id: consecutive['id'],
              name: consecutive['name'],
              fields: new LocalDataSource(consecutive['fields'])
            });

            // Campos Originales.
            consecutive['fields'].forEach(e => {
              this.field_consecutive_original.push({
                'set': e['id_set'],
                'get': e['id_get'],
              });
            });

          });
          this.done_original = Object.assign([], this.done);

        } else {
          this.router.navigate(['/pages/form/view', {}]);
        }
        this.loading = false;
      }, error => {
        this.toastService.showToast('danger', 'Error!', 'Intentalo mas tarde.');
        this.router.navigate(['/pages/form/view', {}]);
      }
    );
  }


  drop(event: CdkDragDrop<string[]>) {
    this.form_set = null;
    this.field_set = null;
    this.form_get = null;
    this.field_get = null;
    setTimeout(()=>{
      this.list_field_set = [];
      this.list_field_get = [];
    }, 500);
    this.field_consecutive = [];

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }

    this.done.forEach((value, index) => {
      this.field_consecutive.push({
        id: value.id,
        name: value.name,
        fields: new LocalDataSource()
      });
    });
  }

  onSelectFormSet(){
    this.field_set = null;
    this.form_get = null;
    this.field_get = null;
    setTimeout(()=>{
      this.list_field_get = [];
    }, 500);

    let position = this.done.map(function(e) { return e.id; }).indexOf(this.form_set);
    this.list_form_get = this.done.slice(0, position);

    this.formService.get_fields(this.form_set).subscribe(
      response => {
        this.list_field_set = response;
      }
    );
  }

  onSelectFormGet(){
    if (this.field_set != undefined && this.form_get != undefined) {
      this.onGetField();
    }

  }

  onSelectFieldSet() {
    if (this.field_set != undefined && this.form_get != undefined) {
      this.onGetField();
    }
  }

  onGetField() {
    this.field_get = null;
    setTimeout(()=>{
      this.list_field_get = [];

      let pos_field = this.list_field_set.map(function(e) { return e.id; }).indexOf(this.field_set);
      let type = this.list_field_set[pos_field]['field_type_id'];

      this.formService.get_fields_type(this.form_get, type).subscribe(
        response => {
          this.list_field_get = response;
        }
      );
    }, 300);
  }

  onAddField(){
    if (this.form_set != null && this.field_set != null && this.form_get != null && this.field_get != null) {
      let pos_field_consecutive = this.field_consecutive.map(function(e) { return e.id; }).indexOf(this.form_set);

      let pos_field_set = this.list_field_set.map(function(e) { return e.id; }).indexOf(this.field_set);
      let name_set = this.list_field_set[pos_field_set]['name'];

      let pos_field_get = this.list_field_get.map(function(e) { return e.id; }).indexOf(this.field_get);
      let name_get = this.list_field_get[pos_field_get]['name'];

      this.field_consecutive[pos_field_consecutive].fields.add({
        id_set: this.field_set,
        set: name_set,
        id_get: this.field_get,
        get: name_get,
      });
      this.field_consecutive[pos_field_consecutive].fields.refresh();

      this.toastService.showToast('success', 'Listo', 'Campo agregado correctamente.');

      this.field_set = null;
      this.field_get = null;
      setTimeout(()=>{
        this.list_field_get = [];
      }, 500);
    } else {
      this.toastService.showToast('warning', 'Sección', 'Datos incompletos.');
    }
  }


  // --- Formulario ---
  dropField(event: CdkDragDrop<string[]>) {
    if (event.previousContainer === event.container) {
      if(this.param_visit == undefined){
        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      }else{
        if(event.previousIndex == 0 || event.previousIndex == 1 || event.previousIndex == 2){
          this.toastService.showToast('warning', 'Estructura del documento', '¡Este campo no permite moverse, puede alterar la función del documento!');
        }else{
          if(event.currentIndex == 0 || event.currentIndex == 1 || event.currentIndex == 2){
            this.toastService.showToast('warning', 'Estructura del documento', '¡No se permite realizar este movimiento, puede alterar la función del documento!');
          }else{
            moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
          }
        }
      }
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      let field_data = event.container.data[event.currentIndex];
      let create = true;
      // if del proceso para fijar los 3 primeros campos del documento cuando se usa en visitas.
      if(this.param_visit != undefined){
        if(event.currentIndex == 0 || event.currentIndex == 1 || event.currentIndex == 2){
          create = false;
          this.form_field.splice(event.currentIndex, 1);
          this.toastService.showToast('warning', 'Estructura del documento', '¡No se permite realizar este movimiento, puede alterar la función del documento!');
        }
      }
      if (this.form_field.length > 70) {
        create = false;
        this.form_field.splice(event.currentIndex, 1);
        this.toastService.showToast('warning', 'Cantidad Máxima', '¡Solo se permiten 70 campos por sección!');
      } else if (field_data['field_type'] == '7') {
        let count_sign = 0;
        this.form_field.forEach(input => {
          if (input.field_type == '7') {
            count_sign += 1;
          }
        });
        if (count_sign > 6) {
          create = false;
          this.form_field.splice(event.currentIndex, 1);
          this.toastService.showToast('warning', 'Campo Firma Digitalizada', '¡Solo se permiten 6 campos de este tipo!');
        }
      } else if (field_data['field_type'] == '10') {
        let count_bio = 0;
        this.form_field.forEach(input => {
          if (input.field_type == '10') {
            count_bio += 1;
          }
        });
        if (count_bio > 4) {
          create = false;
          this.form_field.splice(event.currentIndex, 1);
          this.toastService.showToast('warning', 'Campo Firma Biométrica', '¡Solo se permiten 4 campos de este tipo!');
        }
      } else if (field_data['field_type'] == '15') {
        let count = 0;
        this.form_field.forEach(input => {
          if (input.field_type == '15') {
            count += 1;
          }
        });
        if (count > 1) {
          create = false;
          this.form_field.splice(event.currentIndex, 1);
          this.toastService.showToast('warning', 'Campo Ubicación', '¡Solo se permite 1 campo de este tipo!');
        }
      } else if (field_data['field_type'] == '17') {
        let count_table = 0;
        this.form_field.forEach(input => {
          if (input.field_type == '17') {
            count_table += 1;
          }
        });
        if (count_table > 4) {
          create = false;
          this.form_field.splice(event.currentIndex, 1);
          this.toastService.showToast('warning', 'Campo Tabla', '¡Solo se permiten 4 campos de este tipo!');
        }
      } else if (field_data['field_type'] == '18') {
          let count_firmDoc = 0;
          this.form_field.forEach(input => {
            if (input.field_type == '18') {
              count_firmDoc += 1;
            }
          });
          if (count_firmDoc > 4) {
            create = false;
            this.form_field.splice(event.currentIndex, 1);
            this.toastService.showToast('warning', 'Campo Firma con documento', '¡Solo se permiten 4 campos de este tipo!');
          }
      } else if (field_data['field_type'] == '24') {
          let count_serie = 0;
          this.form_field.forEach(input => {
            if (input.field_type == '24') {
              count_serie += 1;
            }
          });
          if (count_serie > 1) {
            create = false;
            this.form_field.splice(event.currentIndex, 1);
            this.toastService.showToast('warning', 'Campo Número de serie', '¡Solo se permite 1 campo de este tipo!');
          }
      }

      if (create && event.container.id == 'form-field-list') {
        const dialogRef = this.dialogService.open(FieldDialogComponent, {closeOnBackdropClick: false, context:{data:{
          index: event.currentIndex,
          field: '',
          field_type: field_data['field_type'],
          label: field_data['label'],
          description: '',
          required: false,
          parentComponent:this,
        }}});
      }

    }
    if(this.validateVisit == true){
      this.field_types = Object.assign([], this.types_visit);
    }else{
      this.field_types = Object.assign([], this.types);
    }
  }

  typeField(type:number) {
    if (type == 2 || type == 11) {
      return 'number';
    } else if (type == 4) {
      return 'date';
    } else {
      return 'text';
    }
  }

  nameField(type) {
    let position = types.map(function(e) { return e.field_type; }).indexOf(type);
    return types[position].label;
  }

  onEditField(index){
    let field_data = this.form_field[index];
    const dialogRef = this.dialogService.open(FieldDialogComponent, {closeOnBackdropClick: false, context:{data:{
      index: index,
      field: field_data['field'],
      field_type: field_data['field_type'],
      label: field_data['label'],
      description: field_data['description'],
      required: field_data['required'],
      values: field_data['values'],
      validate: field_data['validate'],
      optionDocuments: field_data['optionDocuments'],
      row: field_data['row'],
      fields: field_data['fields'],
      parentComponent:this,
      edit: true,
    }}});
  }

  onDeleteField(index){
    // console.log(index);
    this.form_field.splice(index, 1);
  }

  onSecondSubmit(next_second) {
    // console.log("b1")
    this.loading = true;
    if (this.consecutive) {
      if (this.done.length >= 2) {
        next_second.hostElement.nativeElement.click();
        // Siguiente paso
        this.create_process = false;
        this.form_process = false;
        this.drag_process = false;
        this.input_process = true;
        this.pdf_process = false;
        this.loading = false;
      } else {
        this.toastService.showToast('warning', 'Sección', 'Tienes que agregar 2 o mas secciones a la secuencia.');
      }
    } else {
      if (this.form_field.length > 0) {
        const formData = new FormData();
        formData.append('id', this.id);
        formData.append('name', this.name);
        formData.append('description', this.description);
        formData.append('theme', this.template_option);
        formData.append('color', this.template_color);
        formData.append('pin', this.pin_color);

        // let form_data = {
        //   id: this.id,
        //   name: this.name,
        //   description: this.description,
        //   theme: this.template_option,
        //   color: this.template_color,
        //   pin: this.pin_color,
        // }

        if (JSON.stringify(this.form_field) != JSON.stringify(this.form_field_original)) {
          // form_data['fields'] = this.form_field;
          formData.append('fields', JSON.stringify(this.form_field));
          // this.field_data_files.forEach((value ,key) => {
          //   formData.append('file_' + key, value);
          // });

          let keys_file=Object.keys(this.field_data_files);
          // console.log(keys_file);
          keys_file.forEach(key => {
            formData.append(key, this.field_data_files[key]);
          });

        }
        // console.log('formData:::::::::::::::::::::');
        // console.log(formData);
        // this.formService.create(formData).subscribe(response => {
        this.digitalService.create(formData).subscribe(response => {
          if (response['status']) {
            if (this.digital) {
              this.getDataDigital();
              next_second.hostElement.nativeElement.click();
            } else {
              //Sin plantilla
              this.toastService.showToast('success', 'Documento sin Plantilla', 'Documento registrado con exito.');
              next_second.hostElement.nativeElement.click();
              // Siguiente paso
              this.create_process = false;
              this.form_process = false;
              this.pdf_process = false;
              this.end_process = true;
            }
          }
        });
      } else {
        this.toastService.showToast('warning', 'Fatan Datos', 'Debes de agregar mínimo un campo a la sección');
      }
    }
  }

  getDataDigital() {
    this.digitalService.getDataDigital(this.id).subscribe(
      response => {
        if (response['status']) {
          // this.width = response['data']['width'];

          this.pages_count = response['data']['pages_count'];
          this.pages = response['data']['pages'];
          this.forms = response['data']['forms'];

          let key_field = 1;
          this.forms.forEach(form => {
            form['fields'].forEach(field => {
              if (field['field_type'] != '8' && field['field_type'] != '14' && (field['label'] != 'Número de documento a validar biometricamente')) {
                this.fields_id[field['field']] = key_field;
                key_field++;
              }
            });
          });

          this.width = this.pages[0]['width'];
          this.height = this.pages[0]['height'];

          // this.fields = response['data']['form']['fields'];
          // Condicional de cuando es actualización
          this.fields_drag = response['data']['digital'];
          this.fields_drag_original = JSON.stringify(response['data']['digital']);
          this.columns_additional = response['data']['data_additional']
          // Siguiente paso

          this.create_process = false;
          this.form_process = false;
          this.pdf_process = true;
          this.input_process = false;
          this.end_process = false;

          this.digitalService.getPDF(this.id).subscribe(
            response => {
              this.src = {
                data: response
              }
              this.loading = false;
            }
          );
        }
      }
    );
  }

  // --- PDF ---

  // Cambios y actualización del elemento
  pageChange(value) {
    this.page = value;
    this.width = this.pages[value-1]['width'];
    this.height = this.pages[value-1]['height'];
  }

  fieldChange(value) {
    this.field = value;

    if (this.field['field_type'] == '3' || this.field['field_type'] == '12' || this.field['field_type'] == '13') {
      this.option_value = this.field['data']['values'][0]['value'];
    } else if (this.field['field_type'] == '4' || this.field['field_type'] == '11' || this.field['field_type'] == '23') {
      this.option = '0';
      if (this.field['field_type'] == '11') {
        this.option_value = 0;
      }
    } else if (this.field['field_type'] == '26' || this.field['field_type'] == '1000') {
      this.additional_value = '0';
    } else if (this.field['field_type'] == '7' || this.field['field_type'] == '9' || this.field['field_type'] == '10' || this.field['field_type'] == '18' || this.field['field_type'] == '22') {
      if (this.field['field_type'] == '22') {
        this.option = '0';
      }
      if (this.size_image_x == 0) {
        this.size_image_x = 100;
        if (this.field['field_type'] == '7') {
          this.size_image_y = 50;
        } else {
          this.size_image_y = 100;
        }
        this.font = 'Arial';
        this.color = '#000000';
        this.size = 9;
        this.bold = false;
        this.italic = false;
        this.underline = false;
        this.option = '0';
        this.option_value = null;
      } else {
        if (this.field['field_type'] == '7') {
          this.size_image_y = this.size_image_x/2;
        } else {
          this.size_image_y = this.size_image_x;
        }
      }
    } else if (this.field['field_type'] == '17') {
      this.row_field = 1;
      this.column_value = this.field['fields'][0]['field'];
    }

    this.column_type = null;
    this.field_index = null;
  }

  fontChange(value) {
    this.font = value;
    if (this.field_index != null) {
      this.fields_drag[this.field_index]['font'] = this.font;
    }
  }

  colorChange(value) {
    this.color = value;
    if (this.field_index != null) {
      this.fields_drag[this.field_index]['color'] = this.color;
    }
  }

  sizeChange(value) {
    if (value < 7) {
      this.size = 7;
    } else if (value > 20) {
      this.size = 20;
    } else {
      this.size = value;
    }

    if (this.field_index != null) {
      this.fields_drag[this.field_index]['size'] = this.size;
    }
  }

  lineHeightChange(value) {
    if (value < 10) {
      this.line_height =10;
    } else if (value > 25) {
      this.line_height = 25;
    } else {
      this.line_height = value;
    }

    if (this.field_index != null) {
      this.fields_drag[this.field_index]['line_height'] = this.line_height;
    }
  }

  toggleLine(checked: boolean) {
    this.line_check = checked;
    if (checked) {
      this.size_image_x = 100;
      this.line_height = 10;
      if (this.field_index != null) {
        this.fields_drag[this.field_index]['size_image_x'] = this.size_image_x;
        this.fields_drag[this.field_index]['line_height'] = this.line_height;
      }
    } else {
      if (this.field_index != null) {
        this.fields_drag[this.field_index]['line_height'] = '';
        this.fields_drag[this.field_index]['size_image_x'] = '';
      }
    }
  }

  sizeSignChange(value, field_type) {
    if (value < 50) {
      this.size_image_x = 50;
    } else if (value > 400) {
      this.size_image_x = 400;
    } else {
      this.size_image_x = value;
    }

    if (field_type == '7') {
      this.size_image_y = this.size_image_x/2;
    } else if (field_type == '17') {
      if (this.column_type && this.column_type == '7') {
        this.size_image_y = this.size_image_x/2;
      }
    } else {
      this.size_image_y = this.size_image_x;
    }

    if (this.field_index != null) {
      this.fields_drag[this.field_index]['size_image_x'] = this.size_image_x;
      this.fields_drag[this.field_index]['size_image_y'] = this.size_image_y;
    }
  }

  boldChange() {
    this.bold = !this.bold;
    if (this.field_index != null) {
      this.fields_drag[this.field_index]['bold'] = this.bold;
    }
    return this.bold;
  }

  italicChange() {
    this.italic = !this.italic;
    if (this.field_index != null) {
      this.fields_drag[this.field_index]['italic'] = this.italic;
    }
    return this.italic;
  }

  underlineChange() {
    this.underline = !this.underline;
    if (this.field_index != null) {
      this.fields_drag[this.field_index]['underline'] = this.underline;
    }
    return this.underline;
  }

  // Fecha
  dateChange(value): void {
    // Opciones
    // 0 - Completa
    // 1 - Día
    // 2 - Mes
    // 3 - Año
    if (value.length > 0) {
      this.option = value[0];
    } else {
      this.option = '0';
    }
    if (this.field_index != null) {
      this.fields_drag[this.field_index]['option'] = this.option;
    }
    this.cd.markForCheck();
  }

  // Selecionable, Radio o Checkbox
  optionChange(value): void {
    // Opciones
    // 0 - Texto
    // 1 - Marca x
    if (value.length > 0) {
      this.option = value[0];
    } else {
      this.option = '0';
    }
    if (this.field_index != null) {
      this.fields_drag[this.field_index]['option'] = this.option;
    }
    this.cd.markForCheck();
  }
  optionValueChange(value): void {
    if (value.length > 0) {
      this.option_value = value[0] + "";
      if (this.field_index != null) {
        if (this.new_field) {
          this.field_index = null;
        } else {
          this.fields_drag[this.field_index]['option_value'] = this.option_value;
        }
      }
    }
    this.cd.markForCheck();
  }

  // País
  countryChange(value): void {
    // Opciones
    // 0 - Completa
    // 1 - País
    // 2 - Departamneto
    // 3 - Ciudad
    if (value.length > 0) {
      this.option = value[0];
    } else {
      this.option = '0';
    }
    if (this.field_index != null) {
      this.fields_drag[this.field_index]['option'] = this.option;
    }
    this.cd.markForCheck();
  }

  // Numero de Documento
  docChange(value): void {
    // Opciones
    // 0 - Tipo de Documento
    // 1 - Numero de Documento
    if (value.length > 0) {
      this.option = value[0];
    } else {
      this.option = '0';
    }

    if (this.option == '0') {
      if (this.option_value != 1) {
        this.option_value = 0;
        this.row_field = 1;
      }
    } else {
      this.option_value = '0';
    }

    if (this.field_index != null) {
      this.fields_drag[this.field_index]['option'] = this.option;
    }
    this.cd.markForCheck();
  }

  // OTP
  OTPChange(value): void {
    // Opciones
    // 0 - Email
    // 1 - Teléfono
    if (value.length > 0) {
      this.option = value[0];
    } else {
      this.option = '0';
    }

    if (this.option == '0') {
      this.bold = false;
      this.italic = false;
      this.underline = false;
    }

    if (this.field_index != null) {
      this.fields_drag[this.field_index]['option'] = this.option;
    }
    this.cd.markForCheck();
  }

  // Tabla
  rowChange(value) {
    this.row_field = value;
    if (this.field_index != null) {
      if (this.new_field) {
        this.field_index = null;
      } else {
        this.fields_drag[this.field_index]['row_field'] = this.row_field;
      }
    }
  }
  columnValueChange(value): void {
    // console.log("columnValueChange");
    // console.log(value);
    if (value.length > 0) {
      this.column_value = value[0].field;
      this.column_type = value[0].field_type;

      let option_type = ['3','12','13'];

      if (option_type.includes(this.column_type)) {
        this.column_options = value[0].values;
        if (this.field_index == null) {
          if (this.new_field) {
            this.option_value = this.column_options[0]['value'];
          }
        }
      } else if (this.column_type == '4' || this.column_type == '11' || this.column_type == '22' || this.column_type == '23') {
        this.option = '0';
      } else if (this.column_type  == '7') {
        if (this.size_image_x == 0) {
          this.size_image_x = 100;
          this.size_image_y = 50;
          this.font = 'Arial';
          this.color = '#000000';
          this.size = 9;
          this.bold = false;
          this.italic = false;
          this.underline = false;
          this.option = '0';
          this.option_value = null;
        } else {
          this.size_image_y = this.size_image_x/2;
        }
      } else {
        this.size_image_y = 0;
      }

      if (this.field_index != null) {
        if (this.new_field) {
          this.field_index = null;
        } else {
          this.fields_drag[this.field_index]['column_value'] = this.column_value;
          this.fields_drag[this.field_index]['size_image_y'] = this.size_image_y;
        }
      }
    }
    this.cd.markForCheck();
  }

  // Campo Firma con Cédula
  signIdentificationChange(value): void {
    if (value.length > 0) {
      this.option = value[0];
    } else {
      this.option = '0';
    }

    if (this.option == '0') {
      if (this.fields_drag[this.field_index]['size_image_x'] != 100) {
        this.size_image_x = this.fields_drag[this.field_index]['size_image_x'];
        this.size_image_y = this.size_image_x;
      } else {
        this.size_image_x = 100;
        this.size_image_y = 100;
      }
      this.bold = false;
      this.italic = false;
      this.underline = false;
    } else {
      this.size_image_y = 0;
    }

    if (this.option == '6') {
      if (this.option_value != 1) {
        this.option_value = 0;
        this.row_field = 1;
      }
    } else {
      this.option_value = '0';
    }
    if (this.field_index != null) {
      this.fields_drag[this.field_index]['option'] = this.option;
      this.fields_drag[this.field_index]['size_image_x'] = this.size_image_x;
      this.fields_drag[this.field_index]['size_image_y'] = this.size_image_y;
      this.fields_drag[this.field_index]['bold'] = this.bold;
      this.fields_drag[this.field_index]['italic'] = this.italic;
      this.fields_drag[this.field_index]['underline'] = this.underline;
    }
    this.cd.markForCheck();
  }
  signIdentificationOptionChange(value): void {
    // Opciones
    // 0 - Texto
    // 1 - Marca x
    if (value.length > 0) {
      this.option_value = value[0];
    } else {
      this.option_value = '0';
    }
    if (this.field_index != null) {
      this.fields_drag[this.field_index]['option_value'] = this.option_value;
    } else {
      if (this.option_value == '1') {
        this.row_field = 1;
      }
    }
    this.cd.markForCheck();
  }
  signIdentificationOptionValueChange(value): void {
    if (value.length > 0) {
      this.row_field = value[0];
      if (this.field_index != null) {
        if (this.new_field) {
          this.field_index = null;
        } else {
          this.fields_drag[this.field_index]['row_field'] = this.row_field;
        }
      }
    }
    this.cd.markForCheck();
  }

  // Configuración Adicional
  additionalDataUser() {
    const dialogRef = this.dialogService.open(ModalAdditionalComponent, {closeOnBackdropClick: false, context:{
      data: {
        form: this.id,
        columns: this.columns_additional
      }
    }});
    dialogRef.onClose.subscribe(result => {
      this.columns_additional = result;
    });
  }
  additionalValueChange(value): void {
    if (value.length > 0) {
      this.additional_value = value[0] + "";
      if (this.field_index != null) {
        if (this.new_field) {
          this.field_index = null;
        } else {
          // console.log(this.additional_value);
          this.fields_drag[this.field_index]['option_value'] = this.additional_value;
        }
      }
    }
    this.cd.markForCheck();
  }

  addField(){
    this.field_index = this.fields_drag.length;

    let x = 0;
    let y = 0;
    // Obtiene el tamaño para el campo firma
    let line_type = ['1','2','5','6','25'];
    let file_type = ['7','9','10','18','22'];
    if (file_type.includes(this.field['field_type'])) {
      x = this.size_image_x;
      y = this.size_image_y;
    } else if (line_type.includes(this.field['field_type'])) {
      x = this.size_image_x;
      this.line_check = false;
      // x = this.size_image_x;
    } else if (this.field['field_type'] == '17') {
      if (this.column_type && this.column_type == '7') {
        x = this.size_image_x;
        y = this.size_image_y;
      } else if (line_type.includes(this.column_type )) {
        this.line_check = false;
        x = this.size_image_x;
      }
    } else if (this.field['field_type'] == '26' || this.field['field_type'] == '1000') {
      this.option_value = this.additional_value;
    } else {
      this.column_type = null;
    }
    let top = '0';
    // Ubicación del elemento en pantallas grandes
    let contet_layput = document.getElementsByClassName('scrollable-container');
    if (contet_layput[0].parentElement.offsetWidth > 767) {
      if ((contet_layput[0].scrollTop * 0.7) > this.height) {
        top = (this.height * 0.7) + '';
      } else {
        top = (contet_layput[0].scrollTop * 0.7) + '';
      }
    }
    // Agregar el elemento con todas las opciones seleccionadas
    this.fields_drag.push({
      'page': this.page,
      'field': this.field['field'],
      'field_type': this.field['field_type'],
      'answer_value': this.field['answer_value'] ? this.field['answer_value'] : 0,
      'data': this.field['data'],
      'id': 0,
      'label': this.field['label'],
      'left': '14.99554443359375',
      'top': top,
      'font': this.font,
      'color': this.color,
      'size': this.size,
      'bold': this.bold,
      'italic': this.italic,
      'underline': this.underline,
      'line_height': this.line_height,
      'size_image_x': x,
      'size_image_y': y,
      'option': this.option,
      'option_value': this.option_value,
      'fields': this.field['fields'],
      'row': this.field['row'],
      'row_field': this.row_field,
      'column_value': this.column_value,
    });

    this.new_field = true;
  }

  getKeyField(field){
    let key = this.fields_id[field.field];
    if (key == undefined) {
      if (field.answer_value > 0 && field.answer_value < 200) {
        // Campos informativos
        let position = this.fields_answer.map(function(e) { return e.answer_value; }).indexOf(field.answer_value);
        key = 'I' + this.fields_answer[position].key;
      } else if (field.answer_value >= 200 && field.answer_value < 300) {
        // Campos visita
        let position = this.fields_visits.map(function(e) { return e.answer_value; }).indexOf(field.answer_value);
        key = 'V' + this.fields_visits[position].key;
      }
    }
    return key != undefined ? key : '';
  }

  getKeyLetter(index: number): string {
    let letters = '';
    index++; // Ajustar para que comience en 1
    while (index > 0) {
      index--; // Reducir porque trabajamos con base 0
      letters = String.fromCharCode(65 + (index % 26)) + letters;
      index = Math.floor(index / 26);
    }
    return letters;
  }

  // Tamaño de la plantilla
  getHeight() {
    return 'height: ' + this.height + 'px;';
  }

  getWidth() {
    return 'width: ' + this.width + 'px;';
  }

  // Funciones para cargar opciones y textos.
  getTitle(field) {
    // console.log("A10")
    let label = this.getKeyField(field);
    //  + '. '
    if (field['field_type'] == '3' || field['field_type'] == '12' || field['field_type'] == '13') {
      if (field['option'] == '1') {
        // Busca el nombre de la opción
        let position = field['data']['values'].map(function(e) { return e.value; }).indexOf(field['option_value']);
        label += this.getKeyLetter(position) + '.' + field['label'] + ' - ' + field['data']['values'][position]['label'];
      } else {
        label += '.Texto - ' + field['label'];
      }
    } else if (field['field_type'] == '22') {
      label += '.Comprobante - ' + field['label'];
    } else if (field['field_type'] == '17') {
      // Busca el nombre de la columna
      let position = field['fields'].map(function(e) { return e.field; }).indexOf(field['column_value']);
      label += this.getKeyLetter(position) + '.' + field['row_field'] + ' - ' + field['fields'][position]['label'] + ' - ' + field['label'];
    } else if (field['field_type'] == '10' || field['field_type'] == '18') {
      switch (field['option']) {
        case '0':
          label += 'A.QR-' + field['label'];
          break;
        case '1':
          label += 'B.Valor-'+field['label']+'-Primer Nombre';
          break;
        case '2':
          label += 'C.Valor-'+field['label']+'-Segundo Nombre';
          break;
        case '3':
          label += 'D.Valor-'+field['label']+'-Primer Apellido';
          break;
        case '4':
          label += 'E.Valor-'+field['label']+'-Segundo Apellido';
          break;
        case '5':
          label += 'F.Valor-'+field['label']+'-Nombre de Completo';
          break;
        case '6':
          label += 'G.Valor-'+field['label']+'-Tipo de Documento';
          break;
        case '7':
          label += 'H.Valor-'+field['label']+'-Número de Identificación';
          break;
        case '8':
          label += 'I.Valor-'+field['label']+'-Estado de Vida';
          break;
        case '9':
          label += 'J.Valor-'+field['label']+'-Fecha de Expedición';
          break;
        case '12':
          label += 'K.Valor-'+field['label']+'-Fecha de Nacimiento';
          break;
        case '13':
          label += 'L.Valor-'+field['label']+'-Edad';
          break;
        case '10':
          label += 'M.Valor-'+field['label']+'-Correo';
          break;
        case '11':
          label += 'N.Valor-'+field['label']+'-Teléfono';
          break;
        default:
          break;
      }
    } else if (field['field_type'] == '4') {
      let name_option = '';
      switch (field['option']) {
        case '0':
          name_option = 'A.Completa - '
          break;
        case '1':
          name_option = 'B.Día - '
          break;
        case '2':
          name_option = 'C.Mes - '
          break;
        case '3':
          name_option = 'D.Año - '
          break;
        case '4':
          name_option = 'E.Fecha - '
          break;
        case '5':
          name_option = 'F.Tiempo - '
          break;

        default:
          break;
      }
      label += name_option + field['label'];
    } else if (field['field_type'] == '26') {
      if (field['option'] == '0') {
        if (field['data']['values'][field['option_value']] != undefined) {
          label += this.getKeyLetter(field['option_value']) + '.Valor-' + field['data']['values'][field['option_value']]['label'];
        }
      }
    } else if (field['field_type'] == '1000') {
      if (field['option'] == '0') {
        if (this.columns_additional[field['option_value']] != undefined) {
          label += '.Columna-' + this.columns_additional[field['option_value']];
        }
      }
    } else {
      label += '.' + field['label'];
    }
    return label
  }

  getLabel(field) {
    let label = this.getKeyField(field);
    if (field['field_type'] == '3' || field['field_type'] == '12' || field['field_type'] == '13') {
      if (field['option'] == '1') {
        let position = field['data']['values'].map(function(e) { return e.value; }).indexOf(field['option_value']);
        label += this.getKeyLetter(position) + '.x';
      }
    } else if (field['field_type'] == '11') {
      if (field['option'] == '0') {
        label += '.Tipo-' + field['label'];
      } else {
        label += '.Numero-' + field['label'];
      }
    } else if (field['field_type'] == '22') {
      if (field['option'] == '0') {
        label += '.QR-' + field['label'];
      } else {
        label += '.Valor-' + field['label'];
      }
    } else if (field['field_type'] == '10' || field['field_type'] == '18') {
      if (field['option_value'] == '1') {
        label += '.x';
      } else {
        switch (field['option']) {
          case '0':
            label += 'A.QR-' + field['label'];
            break;
          case '1':
            label += 'B.Valor-'+field['label']+'-Primer Nombre';
            break;
          case '2':
            label += 'C.Valor-'+field['label']+'-Segundo Nombre';
            break;
          case '3':
            label += 'D.Valor-'+field['label']+'-Primer Apellido';
            break;
          case '4':
            label += 'E.Valor-'+field['label']+'-Segundo Apellido';
            break;
          case '5':
            label += 'F.Valor-'+field['label']+'-Nombre de Completo';
            break;
          case '6':
            label += 'G.Valor-'+field['label']+'-Tipo de Documento';
            break;
          case '7':
            label += 'H.Valor-'+field['label']+'-Número de Identificación';
            break;
          case '8':
            label += 'I.Valor-'+field['label']+'-Estado de Vida';
            break;
          case '9':
            label += 'J.Valor-'+field['label']+'-Fecha de Expedición';
            break;
          case '12':
            label += 'K.Valor-'+field['label']+'-Fecha de Nacimiento';
            break;
          case '13':
            label += 'L.Valor-'+field['label']+'-Edad';
            break;
          case '10':
            label += 'M.Valor-'+field['label']+'-Correo';
            break;
          case '11':
            label += 'N.Valor-'+field['label']+'-Teléfono';
            break;
          default:
            break;
        }
      }
    } else if (field['field_type'] == '17') {
      // Busca el nombre de la columna
      let position = field['fields'].map(function(e) { return e.field; }).indexOf(field['column_value']);
      let option_type = ['3','12','13'];
      if (option_type.includes(field['fields'][position]['field_type'])) {
        if (field['option'] == '1') {
          label += this.getKeyLetter(position) + '.x-' + field['row_field'];
        }
      } else {
        label += this.getKeyLetter(position) + '.' + field['row_field'] + '-' + field['fields'][position]['label'] + '-' + field['label'];
      }
    } else if (field['field_type'] == '4') {
      let name_tag = '';
      switch (field['option']) {
        case '0':
          name_tag = 'A.Completa - '
          break;
        case '1':
          name_tag = 'B.Día - '
          break;
        case '2':
          name_tag = 'C.Mes - '
          break;
        case '3':
          name_tag = 'D.Año - '
          break;
        case '4':
          name_tag = 'E.Fecha - '
          break;
        case '5':
          name_tag = 'F.Tiempo - '
          break;

        default:
          break;
      }

      label += name_tag + field['label'];
    } else if (field['field_type'] == '23') {
      let name_tag = '';
      switch (field['option']) {
        case '0':
          name_tag = 'A.Completo-'
          break;
        case '1':
          name_tag = 'B.País-'
          break;
        case '2':
          name_tag = 'C.Dep-'
          break;
        case '3':
          name_tag = 'D.Ciu-'
          break;

        default:
          break;
      }
      label += name_tag + field['label'];
    } else if (field['field_type'] == '26') {
      if (field['option'] == '0') {
        if (field['data']['values'][field['option_value']] != undefined) {
          label += this.getKeyLetter(field['option_value']) + '.Valor-' + field['data']['values'][field['option_value']]['label'];
        }
      }
    } else if (field['field_type'] == '1000') {
      if (field['option'] == '0') {
        if (this.columns_additional[field['option_value']] != undefined) {
          label += '.Columna-' + this.columns_additional[field['option_value']];
        }
      }
    } else {
      label += '.' + field['label'];
    }
    return label
  }

  // Estilos del elemento
  getBold(bold) {
    if (bold){
      return 'font-weight: 700;';
    }
    return '';
  }

  getItalic(italic) {
    if (italic){
      return 'font-style: italic;';
    }
    return '';
  }

  getUnderline(underline) {
    if (underline){
      return 'text-decoration: underline;';
    }
    return '';
  }

  getSizeSign(field_type, x, y, option) {
    if (!['1','2','5','6','25'].includes(field_type) && x != 0 && y != 0){
      if ((field_type == '22' && option == '1') || (field_type == '18' && option != '0')) {
        return '';
      }
      return 'width: ' + x + 'px; height: ' + y + 'px;';
    }
    return '';
  }

  getClass(index) {
    if (index == this.field_index){
      return 'select-box';
    }
    return '';
  }

  getSizeLine(x, line_height) {
    if (x != 0 && line_height != 0){
      return 'width: ' + x + 'px; line-height: ' + line_height + 'px;';
    }
    return '';
  }

  getLine(x) {
    let divide_line = Math.round(x/2.05);
    let array_line = Array(divide_line).fill(1);
    let line = '';
    array_line.forEach(el => {
      line += '_';
    });
    return line;
  }

  // Guarda la posición del campo
  moveField(event, el, index){

    this.field_index = index;
    let father = el.offsetParent;
    let position_father = father.getBoundingClientRect();
    let position_children = el.getBoundingClientRect();
    // console.log(position_children.left - position_father.left);
    // console.log(position_children.top - position_father.top);

    event.source._dragRef.reset();
    this.fields_drag[index].left = (position_children.left - position_father.left).toString();
    this.fields_drag[index].top = (position_children.top - position_father.top).toString();
    // console.log(position_children.left - position_father.left - 14.99554443359375);
    // console.log(position_children.top - position_father.top + 14.00445556640625);

    this.field = this.fields_drag[index];
    this.setElement(this.field);
    // console.log(this.field);
  }

  selectField(field, index) {
    this.field_index = index;
    this.field = field;
    this.setElement(field);

    this.new_field = false;
    // console.log(this.field);
  }

  mouseFieldOver(field, index){
    if (!field['field']) {
      if (field['answer_value'] > 0 && field['answer_value'] < 200) {
        this.field_option_over = 2;
        this.field_over = field['answer_value'];
      } else if (field['answer_value'] >= 200 && field['answer_value'] < 300) {
        this.field_option_over = 3;
        this.field_over = field['answer_value'];
      }
    } else {
      this.field_option_over = 1;
      this.field_over = field['field'];
    }
  }

  mouseFieldOut(field, index){
    this.field_over = undefined;
    this.field_option_over = undefined;
  }

  mouseClass(option, field) {
    if (this.field_option_over == option && this.field_over == field) {
      return 'radio-bold';
    }
    return '';
  }

  setElement(field) {
    // Opciones del elemento
    this.font = field['font'];
    this.size = field['size'];
    this.color = field['color'];
    this.bold = field['bold'];
    this.italic = field['italic'];
    this.underline = field['underline'];
    this.size_image_x = field['size_image_x'];
    this.size_image_y = field['size_image_y'];
    this.line_height = field['line_height'];
    this.option = field['option'];
    this.option_value = this.field['option_value'];
    this.additional_value = this.field['option_value'];
    this.row_field = this.field['row_field'];
    this.column_value = this.field['column_value'];

    if (field['field_type'] != '17') {
      this.column_type = null;
    }

    if (this.line_height+'' != '') {
      this.line_check = true;
    } else {
      this.line_check = false;
    }
  }

  deleteField() {
    if (this.field_index != null) {
      this.fields_drag.splice(this.field_index, 1);
      this.field_index = null;
    }
    this.field = [];
  }

  see() {
    // console.log(this.fields_drag);
  }

  onPrevThird(prev_third) {
    // console.log('onPrevThird');
    this.loading = true;
    prev_third.hostElement.nativeElement.click();

    this.create_process = false;
    this.form_process = false;
    this.drag_process = true;
    this.input_process = false;
    this.pdf_process = false;

    this.loading = false;
  }

  onThirdSubmitConsecutive(next_third) {
    // console.log("A11")
    this.loading = true;
    if (this.consecutive) {
      // Consecutivo
      let array_fields = [];
      this.field_consecutive.forEach((value) => {
        value.fields.data.forEach((field) => {
          array_fields.push({
            set: field.id_set,
            get: field.id_get,
          });
        });
      });

      // console.log('form_data');
      let form_data = {
        name: this.createForm.controls['name'].value,
        description: this.createForm.controls['description'].value,
      }

      if (this.id != null) {
        form_data['id'] = this.id;
      }

      if (JSON.stringify(this.done) != JSON.stringify(this.done_original)) {
        form_data['forms'] = this.done;
      }

      if (JSON.stringify(array_fields) != JSON.stringify(this.field_consecutive_original)) {
        form_data['fields'] = array_fields;
      }

      this.formService.create_consecutive(form_data).subscribe(
        response => {
          if (response['status']) {
            if (this.id != null){
            }

            next_third.hostElement.nativeElement.click();
            if (this.digital) {
              this.getDataDigital();
            } else {
              // Siguiente paso
              this.create_process = false;
              this.form_process = false;
              this.pdf_process = false;
              this.input_process = false;
              this.end_process = true;

              this.loading = false;
            }
          }
        }, error => {
          this.toastService.showToast('danger', 'Error!', 'Intentalo mas tarde.');
          this.loading = false;
        }
      );
    }
  }

  // --- Final ---
  onThirdSubmit(next_third, next_fourth) {
    if (this.fields_drag.length > 0) {
      if (JSON.stringify(this.fields_drag) != this.fields_drag_original) {
        let data = { fields: this.fields_drag }
        this.digitalService.createData(this.id, data).subscribe(response => {
          if (response['status']) {
            if (this.consecutive) {
              next_fourth.hostElement.nativeElement.click();
            } else {
              next_third.hostElement.nativeElement.click();
            }
            this.toastService.showToast('success', 'Documento con Plantilla', 'Documento registrado con exito.');
            // Se Valida el vlaor de value y param para saber desde donde se esta enviando el formulario si desde visitas o si desde documentos
            setTimeout(() => {
              const id = this.route.snapshot.params['value'];
              const val = this.route.snapshot.params['param'];
              if(id == undefined || val== undefined){
                this.router.navigate(['/pages/form/view', {}]);
              }else{
                this.router.navigate(['/pages/visits/subproyect/' + id, {}]);
              }
            }, 2000);
          }
        }, error => {
          this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error! intentalo mas tarde');
          this.loading = false;
        });
      } else {
        if (this.consecutive) {
          next_fourth.hostElement.nativeElement.click();
        } else {
          next_third.hostElement.nativeElement.click();
        }
        //Con plantilla
        this.toastService.showToast('success', 'Documento con Plantilla', 'Documento registrado con exito.');
        // Se Valida el vlaor de value y param para saber desde donde se esta enviando el formulario si desde visitas o si desde documentos
        setTimeout(() => {
          const id = this.route.snapshot.params['value'];
          const val = this.route.snapshot.params['param'];
          if(id == undefined || val== undefined){
            this.router.navigate(['/pages/form/view', {}]);
          }else{
            this.router.navigate(['/pages/visits/subproyect/' + id, {}]);
          }
        }, 2000);
      }
    } else {
      this.loading = false;
      this.toastService.showToast('warning', 'PDF', 'Debes de agregar mínimo un campo al documento');
    }
  }

  onAccept(value) {
    const id = this.route.snapshot.params['value'];
    const val = this.route.snapshot.params['param'];
    if(id == undefined || val== undefined){
      this.router.navigate(['/pages/form/view', {}]);
    }else{
      this.router.navigate(['/pages/visits/subproyect/' + id, {}]);
    }
  }
}

// Field Dialog


@Component({
    selector: 'ngx-location-dialog',
    templateUrl: 'dialog.html',
    styles: ['nb-card-footer { text-align:end}', 'button {margin:5px}', 'nb-checkbox {margin:5px 0px}', 'nb-select {width:100%;}'],
    standalone: false
})
export class FieldDialogComponent implements OnInit{

  label;
  description;
  required = false;
  min;
  max;

  num_list = 2;
  file;
  file_status = false;

  special_view = true;
  special = '';
  specials = [
    {
      field_type: ['1', '2', '5'],
      value: 'unique',
      label: 'Validación Única',
      field_array: true
    },
  ];

  validations = [
    {
      field_type: '1',
      value: 'email',
      label: 'Email'
    },
    {
      field_type: ['1', '2', '5'],
      value: 'confirm',
      label: 'Confirmación de Valor',
      field_array: true
    },
    // {
    //   field_type: '7',
    //   value: 'otpemail',
    //   label: 'Validación OTP por Email'
    // },
    {
      field_type: '7',
      value: 'otpsms',
      label: 'Validación OTP por Mensaje de Texto y Whatsapp'
    },
    {
      field_type: '9',
      value: 'timewatermark',
      label: 'Marca de tiempo'
    },
    {
      field_type: '25',
      value: 'nomenclature',
      label: 'Nomenclatura'
    },
    // {
    //   field_type: '11',
    //   value: 'pdf417',
    //   label: 'PDF417'
    // },
    {
      field_type: '11',
      value: 'restrictivas',
      label: 'Listas restrictivas'
    },
    {
      field_type: '11',
      value: 'registraduria',
      label: 'Registraduría'
    },
    {
      field_type: '20',
      value: 'razón social',
      label: 'Razón social'
    },
    {
      field_type: '20',
      value: 'clase identificación rl',
      label: 'Clase de identificación de representante legal'
    },
    {
      field_type: '20',
      value: 'num identificación representante legal',
      label: 'numero de identificación representante legal'
    },
    {
      field_type: '20',
      value: 'representante legal',
      label: 'Representante legal'
    },
    {
      field_type: '20',
      value: 'numero identificación',
      label: 'Número identificación'
    },
    {
      field_type: '20',
      value: 'digito verificación',
      label: 'Digito verificación'
    },
    {
      field_type: '20',
      value: 'matricula',
      label: 'Matrícula'
    },
    {
      field_type: '20',
      value: 'código camara',
      label: 'Código cámara'
    },
    {
      field_type: '20',
      value: 'ultimo ano renovado',
      label: 'Ultimo año renovado'
    },
    {
      field_type: '20',
      value: 'fecha cancelación',
      label: 'Fecha cancelación'
    },
    {
      field_type: '20',
      value: 'organización juridica',
      label: 'Organización jurídica'
    },
    {
      field_type: '20',
      value: 'estado Matrícula',
      label: 'Estado Matrícula'
    },
    {
      field_type: '20',
      value: 'Fecha actualización',
      label: 'Fecha actualización'
    },
    {
      field_type: '22',
      value: 'phone',
      label: 'Envio a Teléfono'
    },
    {
      field_type: '22',
      value: 'phone-email',
      label: 'Envio a Teléfono y correo'
    },
    {
      field_type: '23',
      value: 'dep',
      label: 'País y Departamento'
    },
    {
      field_type: '23',
      value: 'dep_ciu',
      label: 'País, Departamento y Ciudad'
    },


    // {
    //   field_type: '11',
    //   value: 'qr',
    //   label: 'QR'
    // },
    // {
    //   field_type: '2',
    //   value: 'currency',
    //   label: 'Moneda'
    // },
  ];
  validation = '';
  validation2 = '';
  validation3 = '';
  validation_regis = false;

  positions_stamp = [
    {
      value: 'top_left',
      label: 'Arriba Izquierda'
    },
    {
      value: 'top_right',
      label: 'Arriba Derecha'
    },
    {
      value: 'bot_left',
      label: 'Abajo Izquierda'
    },
    {
      value: 'bot_right',
      label: 'Abajo Derecha'
    },
  ];
  position_stamp = 'top_left';

  confirm_validation = '';

  validations_regis = [
    {
      field_type: '11',
      value: 'Nombre',
      label: 'Primer nombre'
    },
    {
      field_type: '11',
      value: 'snombre',
      label: 'Segundo nombre'
    },
    {
      field_type: '11',
      value: 'Apellido',
      label: 'Primer apellido'
    },
    {
      field_type: '11',
      value: 'sapellido',
      label: 'Segundo apellido'
    },
    {
      field_type: '11',
      value: 'Identificacion',
      label: 'Identificación'
    },
    {
      field_type: '11',
      value: 'fexpedicion',
      label: 'Fecha de expedición',
      confirm: true
    },
    {
      field_type: '11',
      value: 'Existencia',
      label: 'Existencia'
    },

  ];

  options = [
    {
      value: '',
      label: '',
    }
  ];

  optionsDocuments = [];
  valueDocuments = [];
  valueNit = [];

  list_fields = [
    {
      field: '',
      label: '',
      field_type: '',
      values: [
        {
          value: '',
          label: ''
        }],
    },
    {
      field: '',
      label: '',
      field_type: '',
      values: [
        {
          value: '',
          label: ''
        }],
    }
  ];

  public data: {
    field:string,
    field_type:string,
    label:string,
    description:string,
    required:boolean,
    index:any,
    values?:any,
    fields?:any,
    row?:any,
    validate?:any,
    optionDocuments?:any,
    parentComponent: CreateComponent,
    edit?:boolean
  }

  values = [];

  loading;

  @ViewChild(NbPopoverDirective) popover: NbPopoverDirective;

  onPermit(id:number): Boolean {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['permission'].includes(id)) {
      return true;
    }
    return false;
  }

  trigger = NbTrigger.CLICK;
  position = NbPosition.BOTTOM;

  constructor(
   public dialogRef: NbDialogRef<FieldDialogComponent>,
   private toastService: ToastService,
   private formService: FormService,
   ){

  }
  ngOnInit(): void {
    // console.log("A1")
    // this.field_copy = Object.assign([], this.data);
    this.label = this.data.label;
    this.description = this.data.description;
    this.required = this.data.required;

    if (this.data.values != undefined){
      this.options = Object.assign([], this.data.values);
      this.values = Object.assign([], this.data.values);
      if (this.values.length > 1) {
        this.file_status = true;
      }
    }

    if (this.data.optionDocuments != undefined){
      this.validation2 = this.data.validate.advanced_options;
    }

    if (this.data.fields != undefined){
      let fields = JSON.stringify(this.data.fields);
      this.list_fields = Object.assign([], JSON.parse(fields));
      this.num_list = this.data.row;
    }

    if (this.data.validate != undefined){
      this.min = this.data.validate.min;
      this.max = this.data.validate.max;

      if (this.data.validate.advancedNit != undefined){
        this.validation3 = this.data.validate.advancedNit;
      }

      if (this.data.validate.advanced_confirm != undefined){
        this.confirm_validation = this.data.validate.advanced_confirm;
      }

      if (this.data.validate.advanced != undefined){
        if (this.data.field_type == '9') {
          let validation_cap = this.data.validate.advanced.split('-');
          if (validation_cap[0] == 'timewatermark') {
            this.validation = validation_cap[0];
            this.position_stamp = validation_cap[1];
            console.log('this.position_stamp')
            console.log(this.validation);
            console.log(this.position_stamp)
          }
        } else {
          this.validation = this.data.validate.advanced;
          if (this.validation == '["registraduria"]') {
            this.validation_regis = true;
          }
        }
      }

      if (this.data.validate.special != undefined){
        this.special = this.data.validate.special;
      }

      // Validación para un solo campo.
      // if (this.special == '') {
      //   this.data.parentComponent.form_field.forEach(field_value => {
      //     if (field_value.validate && field_value.validate.special && field_value.validate.special != '') {
      //       this.special_view = false;
      //       return;
      //     }
      //   });
      // }

    }
  }

  onFileSelectedAdditional(event, field, index){
    const file:File = event.target.files[0];
    // this.data_files[field] = file;

    this.loading = true;
    if (file) {
        const formData = new FormData();
        formData.append("template", file);

        this.formService.fieldHeadAdditionalData(formData).subscribe(response => {
          if (response['status']){
            this.file_status = true;
            this.values = response['data'];
            this.file = file;

            this.loading = false;
          } else {
            this.toastService.showToast('danger', 'Error!', 'Algo salió mal, verifica el archivo.');
            this.loading = false;
          }
        }, error => {
          this.toastService.showToast('danger', 'Error!', 'Algo salió mal, verifica el archivo.');
          this.loading = false;
        });

    } else {
      this.loading = false;
    }


    // if(file.type == "image/png" && file.name.split(".")[1].toUpperCase() == "PNG"){
    //   this.fields[index]['answer'] = file.name;
    // } else {
    //   this.fields[index]['answer'] = '';
    //   this.toastService.showToast('danger', '¡Error!', 'Las imágenes solo son soportadas en formato PNG.');
    // }
  }

  onValidate() {
    // console.log('onValidate');
    let required = false;
    let option_type = ['3','12','13'];

    if (this.label.trim() == ''){
      required = true;
    }

    if (this.data.field_type == '14') {
      if (this.description.trim() == '') {
        required = true;
      }
    }

    // console.log(this.data.field_type);
    if (option_type.includes(this.data.field_type)) {
      // console.log("Opciones");
      this.options.forEach(option => {
        if (option.label.trim() == '') {
          required = true;
        }
      });
    } else if (this.data.field_type == '26') {
      if (this.values.length <= 1) {
        required = true;
      }
      this.values.forEach(option => {
        if (option.label.trim() == '') {
          required = true;
        }
      });
    } else if (this.data.field_type == '17') {
      this.list_fields.forEach(field => {
        if (field.label.trim() == '' || field.field_type == '') {
          required = true;
        }
        if (option_type.includes(field.field_type)) {
          field.values.forEach(option => {
            if (option.label.trim() == '') {
              required = true;
            }
          });
        }
      });
    }

    // console.log(required);
    return required;
  }

  toggleRequired(checked: boolean) {
    this.required = checked;
  }

  onCheckSpecial(option: string) {
    if (this.special != '') {
      let array_answer = JSON.parse(this.special);
      if (array_answer.indexOf(option) !== -1) {
        return true;
      }
    }
    return false;
  }

  toggleCheckboxSpecial(checked: boolean, value) {
    let array_checkbox = [];
    if (this.special != '') {
      array_checkbox = JSON.parse(this.special);
    }

    if (checked) {
      array_checkbox.push(value);
    } else {
      let position = array_checkbox.map(function(e) { return e; }).indexOf(value);
      array_checkbox.splice(position, 1);
    }
    if (JSON.stringify(array_checkbox) == "[]" ) {
      this.special = '';
    } else {
      this.special = JSON.stringify(array_checkbox);
    }
  }

  onAddOption(){
    this.options.push(
      {
        value: '',
        label: ''
      }
    );
  }

  onValidateOptionTable(index) {
    let validate = true;
    this.list_fields[index]['values'].forEach(option => {
      if (option.label.trim() == '') {
        validate = false;
      }
    });

    if (validate) {
      return "success"
    }
    return "danger"
  }

  onChangeOption(value, index, inputS) {
    // console.log("onChangeOption")
    // console.log(inputS)
    this.options[index]['label'] = value;
    inputS.value = value;
  }

  onDeleteOption(index){
    // console.log(index);
    this.options.splice(index, 1);
  }

  dropSelect(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.options, event.previousIndex, event.currentIndex);
  }

  onCheck(answer: string, option: string) {
    // console.log('answer');
    // console.log(answer);
    this.valueDocuments=[]
    if (answer != '') {
      let array_answer = JSON.parse(answer);
      let count = 0;
      JSON.parse(answer).forEach(option => {
        if(option == "registraduria"){
          this.validation_regis = true;
        }
        this.valueDocuments.push({
          'label': option,
          'value': String(count),
        })
        count +=1;
      });

      if (array_answer.indexOf(option) !== -1) {
        return true;
      }
    }
    return false;
  }

  onCheck3(answer: string, option: string) {
    // console.log('onCheck3');
    // console.log(answer);
    this.valueNit=[]
    if (answer != '' && answer != undefined) {
      let array_answer = JSON.parse(answer);
      let count = 0;
      JSON.parse(answer).forEach(option => {
        this.valueNit.push({
          'label': option,
          'value': String(count),
        })
        count +=1;
      });

      if (array_answer.indexOf(option) !== -1) {
        return true;
      }
    }
    return false;
  }

  onCheck2(answer: string, option: string) {
    // console.log('answer32');
    // console.log(answer);
    this.optionsDocuments=[]
    if (answer != '' && answer != undefined) {
      let array_answer = JSON.parse(answer);
      let count = 0;
      JSON.parse(answer).forEach(option => {
        this.optionsDocuments.push({
          'label': option,
          'value': String(count),
        })
        count +=1;
      });

      if (array_answer.indexOf(option) !== -1) {
        return true;
      }
    }
    return false;
  }

  toggleCheckbox2(checked: boolean, value, checkbox) {
    // console.log('Bandera1');
    // console.log(checked);
    // console.log(value);
    // console.log(checkbox.value);

    this.validation2 = checkbox.value;
    let array_checkbox = [];
    if (checkbox.value != '') {
      array_checkbox = JSON.parse(checkbox.value);
    }
    if (checked) {
      array_checkbox.push(value);
    } else {
      let position = array_checkbox.map(function(e) { return e; }).indexOf(value);
      array_checkbox.splice(position, 1);
    }
    const found = array_checkbox.includes("fexpedicion")
    // console.log('found');
    // console.log(found);
    let Filtro = array_checkbox.filter((item) => item !== "fexpedicion")
    if(found == true){
      Filtro.unshift("fexpedicion")
    }
    // console.log('Bandera2');
    // console.log(Filtro);

    if (JSON.stringify(Filtro) == "[]" ) {
      this.validation2 = '';
    } else {
      this.validation2 = JSON.stringify(Filtro);
    }
    // console.log("validation2")
    // console.log(this.validation2)
  }

  confirmValidate(value) {
    let response = false;
    if (this.validation2 != '' && JSON.parse(this.validation2).includes(value)) {
      response = true;
    }
    return response;
  }

  onCheckConfirm(answer: string, option: string) {
    if (answer != '' && answer != undefined) {
      let array_answer = JSON.parse(answer);
      if (array_answer.indexOf(option) !== -1) {
        return true;
      }
    }
    return false;
  }

  toggleCheckboxConfirm(checked: boolean, value, checkbox) {
    this.confirm_validation = checkbox.value;
    let array_checkbox = [];
    if (checkbox.value != '') {
      array_checkbox = JSON.parse(checkbox.value);
    }
    if (checked) {
      array_checkbox.push(value);

    } else {
      let position = array_checkbox.map(function(e) { return e; }).indexOf(value);
      array_checkbox.splice(position, 1);
    }
    // console.log('array_checkbox');
    // console.log(array_checkbox);
    if (JSON.stringify(array_checkbox) == "[]" ) {
      this.confirm_validation = '';
    } else {
      this.confirm_validation = JSON.stringify(array_checkbox);
    }
  }

  toggleCheckbox3(checked: boolean, value, checkbox) {
    // console.log('Ingresa aaaaaaaa toggleCheckbox3');
    // console.log(checked);
    // console.log(value);
    // console.log(checkbox.value);

    this.validation3 = checkbox.value;
    let array_checkbox = [];
    if (checkbox.value != '') {
      array_checkbox = JSON.parse(checkbox.value);
    }
    if (checked) {
      array_checkbox.push(value);
    } else {
      let position = array_checkbox.map(function(e) { return e; }).indexOf(value);
      array_checkbox.splice(position, 1);
    }
    if (JSON.stringify(array_checkbox) == "[]" ) {
      this.validation3 = '';
    } else {
      this.validation3 = JSON.stringify(array_checkbox);
    }

  }

  toggleCheckbox(checked: boolean, value, checkbox) {
    // console.log('Ingresa aaaaaaaa toggleCheckbox');
    // console.log(checked);
    // console.log(value);
    // console.log(checkbox.value);

    this.validation = checkbox.value;
    let array_checkbox = [];
    if (checkbox.value != '') {
      array_checkbox = JSON.parse(checkbox.value);
    }
    if (checked) {
      array_checkbox.push(value);
    } else {
      let position = array_checkbox.map(function(e) { return e; }).indexOf(value);
      array_checkbox.splice(position, 1);
    }
    if (JSON.stringify(array_checkbox) == "[]" ) {
      this.validation = '';
    } else {
      this.validation = JSON.stringify(array_checkbox);
    }

  }

  // Type Table
  onAddField(){
    let index = this.options.length + 1;
    this.list_fields.push(
      {
        field: '',
        label: '',
        field_type: '',
        values: [
          {
            value: '',
            label: ''
          }]
      },
    );
  }

  onChangeField(value, index) {
    this.list_fields[index]['label'] = value;
  }

  onChangeFieldType(value, index, element) {
    // console.log("ingresa aca")
    this.list_fields[index]['field_type'] = value;
    let option_type = ['3','12','13'];
    let create = true;
    if (option_type.includes(value)) {
      this.options = this.list_fields[index]['values'];
      this.popover.show();
    }

    if (value == '7') {
      if (this.countLimit(value) > 1) {
        this.toastService.showToast('warning', 'Campo Firma Digitalizada', '¡Solo se permite 1 campo de este tipo por tabla!');
        create = false;
      }
    } else if (value == '15') {
      if (this.countLimit(value) > 1) {
        this.toastService.showToast('warning', 'Campo Ubicación', '¡Solo se permite 1 campo de este tipo por tabla!');
        create = false;
      }
    }

    if (!create) {
      this.list_fields[index]['field_type'] = '';
      setTimeout(() => {
          element.reset(null);
          this.list_fields[index]['field_type'] = '';
        }, 300
      );
    }

  }

  countLimit(type) {
    let count = 0;
    this.list_fields.forEach(column => {
      if (column.field_type == type) {
        count += 1;
      }
    });
    return count
  }

  onDeleteField(index){
    // console.log(index);
    this.list_fields.splice(index, 1);
  }

  dropField(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.list_fields, event.previousIndex, event.currentIndex);
  }

  openOption(index) {
    this.options = this.list_fields[index]['values'];
    this.popover.show();
  }

  onCloseOption() {
    this.popover.hide();
  }

  onAccept(event){

    this.loading = true;
    // console.log('onAccept');
    // console.log(this.label);
    // console.log(this.data.parentComponent.form_field[this.data.index].label);

    // this.data.parentComponent.form_field.splice(this.data.index, 1)

    if (this.validation == "timewatermark") {
      this.validation += '-' + this.position_stamp;
    }

    let validate = {
      'min': this.min,
      'max': this.max,
      'advanced': this.validation,
      'advancedNit': this.validation3,
      'advanced_options': this.validation2,
      'advanced_confirm': this.confirm_validation,
      'special': this.special,
    }

    // this.list_field = this.list_fields;
    if (this.data.field_type == '17') {
      this.options = [];
    }

    if (this.data.field_type == '26') {
      this.options = this.values;
      if (this.file != undefined) {
        this.data.parentComponent.field_data_files['index_file_' + this.data.index] = this.file;
      }
    }

    this.data.parentComponent.form_field[this.data.index] = {
      field: this.data.field,
      label: this.label,
      description: this.description,
      required: this.required,
      field_type: this.data.field_type,
      values: this.options,
      valuesDocuments: this.valueDocuments,
      valuesNit: this.valueNit,
      optionDocuments: this.optionsDocuments,
      fields: this.list_fields,
      row: this.num_list,
      validate: validate,
    }
    this.dialogRef.close(true);
  }

  close(){
    // console.log('close');
    this.dialogRef.close();
    if (!this.data.edit) {
      this.data.parentComponent.form_field.splice(this.data.index, 1);
    }
  }

  nameField(type) {
    let position = types.map(function(e) { return e.field_type; }).indexOf(type);
    return types[position].label;
  }

  omitSpecialChar(e: any) {
    if (/^[a-zA-Z0-9\s.,!¡#$%&*+=¿?_-]*$/.test(e.key)) {
      return true;
    } else {
      e.preventDefault();
      return false;
    }
  }

}

// Modal condfiguración adicional
@Component({
    selector: 'ngx-modal-additional',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss'],
    standalone: false
})
export class ModalAdditionalComponent implements OnInit {

  // Inputs
  value = '';
  confirm = '';
  file = false;
  loading = false;

  columns = [];

  public data: {
    form:number,
    columns:any
  }

  constructor(
    public dialogRef: NbDialogRef<ModalAdditionalComponent>,
    private formService: FormService,
    private toastService: ToastService,
  ) { }

  ngOnInit(): void {
    // console.log(this.data.form);
    if (this.data.columns.length > 0) {
      this.file = true;
      this.columns = this.data.columns;
    }
  }

  onFileSelected(event){
    const file:File = event.target.files[0];
    this.loading = true;
    if (file) {
        const formData = new FormData();
        formData.append("template", file);
        formData.append("form", this.data.form + '');

        this.formService.uploadAdditionalData(formData).subscribe(response => {
          if (response['status']){
            this.file = true;
            this.columns = response['data'];
            this.toastService.showToast('success', 'Archivo Cargado con Exito', 'Proceso de datos base iniciado.');
            this.loading = false;
          } else {
            this.toastService.showToast('danger', 'Error!', 'Algo salió mal, verifica el archivo.');
            this.loading = false;
          }
        }, error => {
          this.toastService.showToast('danger', 'Error!', 'Algo salió mal, verifica el archivo.');
          this.loading = false;
        });

    } else {
      this.loading = false;
    }
  }

  close(){
    this.dialogRef.close(this.columns);
  }

}
