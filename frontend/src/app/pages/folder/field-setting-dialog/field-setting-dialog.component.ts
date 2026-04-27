import { Component, OnInit, ViewChild } from '@angular/core';
import { types, variables } from '../../form/create/types';
import { configGeneral, graphicElements_1, graphicElements_2 } from '../../form/create/configGeneral';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ToastService } from '../../../usable/toast.service';
import { NbDialogRef, NbPopoverDirective, NbPosition, NbTrigger } from '@nebular/theme';
import { FieldDialogComponent } from '../field-dialog/field-dialog.component';
import { FolderComponent } from '../folder.component';

@Component({
    selector: 'ngx-location-dialog',
    templateUrl: 'field-setting-dialog.component.html',
    styleUrls: ["field-setting-dialog.component.scss"],
    standalone: false
})
export class FieldSettingDialogComponent implements OnInit{

  label;
  description;
  required = false;
  assign_name_pdf = false
  min;
  max;
  iconSelected = null;
  graphicElements_1 = graphicElements_1;;
  graphicElements_2 = graphicElements_2

  num_list = 2;

  validations = [
    {
      field_type: '1',
      value: 'email',
      label: 'Email'
    },
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
      value: 'razon social',
      label: 'Razon social'
    },
    {
      field_type: '20',
      value: 'clase identificacion rl',
      label: 'Clase de identidicacion de representante legal'
    },
    {
      field_type: '20',
      value: 'num identificacion representante legal',
      label: 'numero de identificacion representante legal'
    },
    {
      field_type: '20',
      value: 'representante legal',
      label: 'Representante legal'
    },
    {
      field_type: '20',
      value: 'numero identificacion',
      label: 'Numero identificacion'
    },
    {
      field_type: '20',
      value: 'digito verificacion',
      label: 'Digito verificacion'
    },
    {
      field_type: '20',
      value: 'matricula',
      label: 'Matricula'
    },
    {
      field_type: '20',
      value: 'codigo camara',
      label: 'Codigo camara'
    },
    {
      field_type: '20',
      value: 'ultimo ano renovado',
      label: 'Ultimo año renovado'
    },
    {
      field_type: '20',
      value: 'fecha cancelacion',
      label: 'Fecha cancelacion'
    },
    {
      field_type: '20',
      value: 'organizacion juridica',
      label: 'Organizacion juridica'
    },
    {
      field_type: '20',
      value: 'estado Matricula',
      label: 'Estado Matricula'
    },
    {
      field_type: '20',
      value: 'Fecha actualizacion',
      label: 'Fecha actualizacion'
    },
  ];
  validation = '';
  validation2 = '';
  validation3 = '';
  validation_regis = false;

  validations_regis = [
    {
      field_type: '11',
      value: 'Nombre',
      label: 'Nombre'
    },
    {
      field_type: '11',
      value: 'Apellido',
      label: 'Apellido'
    },
    {
      field_type: '11',
      value: 'Identificacion',
      label: 'Identificacion'
    },
    {
      field_type: '11',
      value: 'fexpedicion',
      label: 'Fecha de expedicion'
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
    fields_drag:any,
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
    parentComponent: FolderComponent,
    edit?:boolean,
    approver?:boolean,
    fieldDialogComponent?: FieldDialogComponent,
    isConfig?: boolean,
    config?: any
    option?: any
    assign_name_pdf?: any
  }


  const = variables
  caseDialog = this.const.usual_fields

  // Funcionalidad para los campos especiales
  selectedList = 0;
  arrayTextList = ['Con enunciado', 'Lista visible', 'Opciones sin texto', 'Marque con una X (sin texto)'];
  fieldSpecialRequired = null;
  fieldSpecialRows = 2;
  minOption = 2
  dataFieldSpecialOptions = [
    { value: 'opción 1', edit: false, top: '0', left: '0' },
    { value: 'opción 2', edit: false, top: '0', left: '0' }]

  loading;
  fileInputSelected: string | ArrayBuffer;

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
   ){

  }
  ngOnInit(): void {
    // console.log('data', this.data)
    if(!this.data.isConfig) {
      switch(parseInt(this.data.field_type)) {
        case 3: // Lista
        case 12: // Única
        case 13: // Múltiple
          this.caseDialog = this.const.special_fields;
          if(this.data.edit) {
            this.fieldSpecialRequired = this.data.required ? 'YES' : 'NO'
            this.dataFieldSpecialOptions = this.data.values
            this.selectedList = this.data.option ? (parseInt(this.data.option)+1) : 0
            this.fieldSpecialRows = this.data.values.length
            this.assign_name_pdf = this.data.assign_name_pdf
          }
          if(parseInt(this.data.field_type) == 3) {
            this.selectedList = 1;
          }
        break;
      }
    } else {
      this.caseDialog = this.const.general_config_fields;
    }
    this.label = this.data.label;
    this.description = this.data.description;
    this.required = this.data.required;

    if (this.data.values != undefined){
      this.options = Object.assign([], this.data.values);
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

      if (this.data.validate.advanced != undefined){
        this.validation = this.data.validate.advanced;
        if (this.validation == '["registraduria"]') {
          this.validation_regis = true;
        }
      }
    }
  }

  activeBtn() {
    let active = true;
    if(this.data.isConfig && this.data.field_type == '5') {
      active = false;
    }
    return active;
  }

  onValidate() {
    // console.log('onValidate');
    let required = false;
    if(this.caseDialog == this.const.special_fields) {
      if(this.fieldSpecialRequired == null || this.selectedList == 0) required = true;
      return required
    }
    let option_type = !this.data.isConfig ? ['3','12','13'] : [];

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

    if(this.data.isConfig && this.data.field_type == '4' && this.iconSelected == null) {
      required = true;
    }

    // console.log(required);
    return required;
  }

  toggleRequired(checked: boolean) {
    this.required = checked;
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
    if (JSON.stringify(array_checkbox) == "[]" ) {
      this.validation2 = '';
    } else {
      this.validation2 = JSON.stringify(array_checkbox);
    }
  }

  toggleCheckbox3(checked: boolean, value, checkbox) {
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

    let validate = {
      'min': this.min,
      'max': this.max,
      'advanced': this.validation,
      'advancedNit': this.validation3,
      'advanced_options': this.validation2,
    }

    if (this.data.field_type == '17') {
      this.options = [];
    }

    let field = this.data['fields_drag'][this.data.index]
    if (['3','12','13'].includes(this.data.field_type+'')) {
      if(!this.data.edit) {
        this.dataFieldSpecialOptions.forEach((option, i) => {
          option.left = field['left'];
          option.top = field['top'] + (i * 12);
        });
      }
      field['values'] = this.dataFieldSpecialOptions;
      field['option'] = (this.selectedList - 1).toString();
      this.required = this.fieldSpecialRequired == 'YES'
    } else {
      field['values'] = this.options;
    }

    field['field'] = this.data.field;
    field['label'] = this.label,
    field['description'] = this.description;
    field['required'] = this.required;
    field['valuesDocuments'] = this.valueDocuments;
    field['valuesNit'] = this.valueNit;
    field['optionDocuments'] = this.optionsDocuments;
    field['fields'] = this.list_fields;
    field['row'] = this.num_list;
    field['validate'] = validate;
    field['assign_name_pdf'] = this.assign_name_pdf;
    if(this.data.isConfig && this.data.field_type == '4'){
      field['url_src'] = this.iconSelected.name;
    }
    if(this.data.isConfig && this.data.field_type == '5'){
      field['url_src'] = this.fileInputSelected;
    }

    // this.data.fields_drag[this.data.index] = {
    //   field: this.data.field,
    //   label: this.label,
    //   description: this.description,
    //   required: this.required,
    //   field_type: this.data.field_type,
    //   values: this.options,
    //   valuesDocuments: this.valueDocuments,
    //   valuesNit: this.valueNit,
    //   optionDocuments: this.optionsDocuments,
    //   fields: this.list_fields,
    //   row: this.num_list,
    //   validate: validate,
    // }
    if (this.data.fieldDialogComponent) {
      this.data.fieldDialogComponent.selectField(field, this.data.index, true);
    }
    this.dialogRef.close(true);
  }

  close(){
    // console.log('close');
    this.dialogRef.close();
    if (!this.data.edit) {
      this.data.parentComponent.fieldsConfigCount--;
      this.data.fields_drag.splice(this.data.index, 1);
    }
  }

  nameField(type) {
    if (this.data.approver){
      return 'Comprobante';
    }
    let typesRun = types
    if(this.data.isConfig) {
      typesRun = configGeneral
    }
    let position = typesRun.map(function(e) { return e.field_type; }).indexOf(type+"");
    return typesRun[position].label;
  }

  // Configuración para los campos generales y no diligenciables

  setLimit(type) {
    let position = configGeneral.map(function(e) { return e.field_type; }).indexOf(type+"");
    return configGeneral[position].config.limit;
  }

  setLowerCase(label: string) {
    return label.toLowerCase();
  }

  selectedIcon(icon, row) {
    // let index = this.graphicElements.map(function(e) { return e.name; }).indexOf(icon.name);
    // this.graphicElements[index].selected = true;
    let graphics = row == 1 ? this.graphicElements_1 : this.graphicElements_2;
    graphics.forEach(element => {
      if(element.name == icon.name) {
        element.selected = !element.selected;
        this.iconSelected = element.selected ? element : null;
      } else {
        element.selected = false
      }
    });
  }

  uploadFile(event: any) {
    if (event.target.files.length == 1) {
      var reader = new FileReader();
      reader.readAsDataURL(event.target.files[0] );
      reader.onload = (e: any) => {
        this.fileInputSelected = e.target.result;
        this.onAccept(null);
      }
    }
  }
  // Funcionalidad para los campos especiales
  createRange(number){
    return new Array(number).fill(0).map((n, index) => index + 1);
  }

  addStyle(i: number, j: number) {
    switch (j) {
      case 0:
        if(i == 0 || i == 2)
          return 'background-color: black';
        else
        return 'border: 1px solid darkgray';
      case 1:
        return 'border: 1px solid darkgray';
    }
  }

  fieldSpecialRowsChange() {
    console.log('fieldSpecialRowsChange', this.fieldSpecialRows, this.selectedList)
    if(this.selectedList > 2) {
      if(this.dataFieldSpecialOptions.length < this.fieldSpecialRows) {
        let pos = this.dataFieldSpecialOptions.length + 1
        this.dataFieldSpecialOptions.push({ value: `opción ${pos}`, edit: false, top: '0', left: '0' })
      } else {
        this.dataFieldSpecialOptions.pop(); //Elimina la utima posición del arreglo
      }
      console.log('fieldSpecialRowsChange',this.dataFieldSpecialOptions)
    }
  }

  onSelectedList(pos: number) {
    this.selectedList = pos + 1;
    console.log('onSelectedList', this.selectedList, this.fieldSpecialRows, this.fieldSpecialRequired)
  }

  editOption(pos: number, edit: boolean) {
    if(edit) {
      this.dataFieldSpecialOptions.forEach((option, index) => {
        if(pos == index)
          option.edit = !option.edit
        else
          option.edit = false
      });
    } else {
      this.dataFieldSpecialOptions.splice(pos, 1);
      this.minOption = this.minOption - 1
    }
  }

  addOption() {
    let pos = this.dataFieldSpecialOptions.length + 1
    this.minOption = pos
    this.dataFieldSpecialOptions.push({ value: `opción ${pos}`, edit: false, top: '0', left: '0' })
    // console.log('addOption',this.dataFieldSpecialOptions)
  }

}
