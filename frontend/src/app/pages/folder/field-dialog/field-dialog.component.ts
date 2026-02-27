import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ConfirmDialogComponent } from '../../common/confirm-dialog/confirm-dialog.component';
import { NbDialogService, NbDialogRef } from '@nebular/theme';
import { DigitalService } from '../../../services/digital.service';
import { ToastService } from '../../../usable/toast.service';
import { FolderComponent, User } from '../folder.component';
import { types } from '../../form/create/types';
import { configGeneral } from '../../form/create/configGeneral';
import { FieldSettingDialogComponent } from '../field-setting-dialog/field-setting-dialog.component';
import { hexToCSSFilter, HexToCssConfiguration } from 'hex-to-css-filter';
import { TableComponent } from './table/table.component';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: "ngx-field-dialog",
  templateUrl: "field-dialog.component.html",
  styleUrls: ["field-dialog.component.scss"],
  animations: [
    trigger('tooltipAnimation', [
      state('show', style({
        opacity: 1
      })),
      state('hide', style({
        opacity: 0
      })),
      transition('show <=> hide', [
        animate('0.5s')
      ]),
    ]),
  ]
})
export class FieldDialogComponent implements OnInit{

  public data: {
    parentComponent: FolderComponent;
  };
  zInd:number|null = null;
  field_types:any = [];
  form_field = [];
  zoomOptions = [75, 100, 125, 150, 200];
  zoomOpt = 1.25;
  types = types;
  configGeneral = configGeneral;
  types_names:any = { 1:'Campos Habituales', 2:'Campos Especiales', 3:'Firmas' };
  partSelected:User;
  d_index;
  approver = false;
  cdkDragStarted = false;
  onEdit = {
    edit: false,
    top: 0,
    left: 0
  };
  fileInputSelected = FileList;
  // --- PDF ---
  src;
  width = 0;
  height = 500;
  pages;

  doc_select;
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

  defaul_values = {};
  new_field = false;

  // Campos
  forms = [];
  fields_drag = [];
  // fields_drag = [{
  //   'left': '14.99554443359375',
  //   'top': '14.99554443359375',
  // }];
  fields_drag_original = '';

  field = [];
  field_current = [];
  field_type = 0;
  doc_index = 0;
  field_index = null;
  clone_index = null;
  doc_selected_index = 0
  assign_name_pdf = false;

  loading;
  tooltipState: string = 'hide';

  car_index = 0;
  car_items = [];

  configHexToCss: HexToCssConfiguration = {
    acceptanceLossPercentage: 1,
    maxChecks: 50
  };

  dialogInfoRef: NbDialogRef<DialogInfoComponent>;

  constructor(
    private toastService: ToastService,
    private digitalService: DigitalService,
    private cd: ChangeDetectorRef,
    private dialogService:NbDialogService,
  ){ }

  ngOnInit(): void {
    setInterval(() => {
      this.toggleTooltip();
    }, 2000);

    this.defaul_values = Object.assign({},
      {
        font: this.font,
        size: this.size,
        color: this.color,
        bold: this.bold,
        italic: this.italic,
        underline: this.underline,
        size_image_x: this.size_image_x,
        size_image_y: this.size_image_y,
        line_height: this.line_height,
        option: this.option,
        option_value: this.option_value,
        row_field: this.row_field,
        column_value: this.column_value,
        column_type: this.column_type,
      }
    );
    this.changeSrc(this.data.parentComponent.doc_list[0], 0);
    this.setFieldList()
    if (this.data.parentComponent.id == null) {
      this.setParticipant(this.data.parentComponent.user_list[0] || null);
    }
    this.setCarItems();
    // Se comenta para efectos de desarrollo
    this.dialogInfoRef = this.dialogService.open(DialogInfoComponent, {closeOnBackdropClick:false, closeOnEsc:false });
    this.dialogInfoRef.onClose.subscribe();
  }

  toggleTooltip(): void {
    // Funcion que valida el stado del input del nombre del sobre
    this.tooltipState = this.tooltipState === 'hide' ? 'show' : 'hide';
  }

  setFieldList(){
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    const dataFirms = ["10","18"];
    this.field_types = [];
    this.types.sort((a,b)=>{
      return a.group - b.group;
    }).forEach(element => {
      if (user_data['permission'].includes(61)) {
        this.field_types.push(element);
      }else if( !dataFirms.includes(element.field_type)){
        this.field_types.push(element);
      }
    });
    this.field_types = this.field_types.reduce(function (r, a) {
      r[a.group] = r[a.group] || [];
      r[a.group].push(a);
      return r;
    }, Object.create(null));
  }

  changeIdxCar(step){
    if (this.car_index + step >= 0 && this.car_index + step + 3 <= this.data.parentComponent.doc_list.length){
      this.car_index += step;
      this.setCarItems();
    }
  }

  setCarItems(){
    this.car_items = this.data.parentComponent.doc_list.slice(this.car_index, this.car_index+3);
    while (this.car_items.length < 3){
      this.car_items.push(false);
    }
  }

  close(save?){
    if (!save && !this.data.parentComponent.autosave) {
	    this.data.parentComponent.confirmDialog = this.dialogService.open(ConfirmDialogComponent, {
        context:{data:{title: 'Ventana de Confirmación', msg: 'Si sales de esta vista, perderas todo tu progreso. ¿Estas seguro de esto?', parent:this.data.parentComponent}},
        closeOnBackdropClick:false,
        closeOnEsc: false,
      });
      this.data.parentComponent.confirmDialog.onClose.subscribe((val)=>{
        if (val){
          this.data.parentComponent.dialogFieldRef.close();
        }
      });
    } else {
      this.data.parentComponent.dialogFieldRef.close();
    }
  }

  setWidthMove(field) {
    let newLeft = parseInt(field.left) + parseInt(field.size_image_x);
    let newTop = parseInt(field.top) + parseInt(field.size);
    if(field.field_type == '4' || field.field_type == '5') { // Campos tipo elemento gráfico y logo o imagen
      newTop = parseInt(field.top) + parseInt(field.size_image_x);
    } else {
      newLeft -= 3;
    }
    let zIndex = field.onEdit ? '101' : '1'
    return `z-index: ${zIndex}; left: ${newLeft}px; top: ${newTop}px`
  }

  mouseDragEnded(event, elementMoved, field) {
    let width = parseInt(field.size_image_x);
    let matrix = this.getTranslate(elementMoved);
    field.size_image_x = width + parseInt(matrix.groups.x);
    if(field.field_type == '4' || field.field_type == '5') {
      field.size_image_y = width + parseInt(matrix.groups.x);
    }
    event.source._dragRef.reset();
  }

  mouseDragMoved(event, elementMoved, field, i) {
    let matrix = this.getTranslate(elementMoved);
    let fieldInPdf = document.getElementById(`field-in-pdf-${i}`);
    if(fieldInPdf) {
      let size = parseInt(field.size_image_x) + parseInt(matrix.groups.x);
      fieldInPdf.style.width = `${size}px`;
      if(field.field_type == '4' || field.field_type == '5') {
        fieldInPdf.style.height = `${size}px`;
      }
    }
  }

  getTranslate(elementMoved) {
    let re = /translate3d\((?<x>.*?)px, (?<y>.*?)px, (?<z>.*?)px/
    return re.exec(elementMoved.style.transform);
  }

  setTopLeftZoom() {
    let left = this.onEdit.left;
    let top = this.onEdit.top;
    if(this.zoomOpt * 100 != 100) {
      if(this.zoomOpt * 100 > 100) {
        let per = (this.zoomOpt * 100) - 100;
        left += (left * per) / 100;
        top += (top * per) / 100;
      } else {
        let per = 100 - (this.zoomOpt * 100);
        left -= (left * per) / 100
        top -= (top * per) / 100;
      }
    }
    return 'top: ' + top + 'px; left: ' + left + 'px;';
  }

  zoom(action){
    let index = this.zoomOptions.findIndex((val, index) => val/100 == this.zoomOpt);
    // console.log('zoom', index);
    if (action == 'in' && index < this.zoomOptions.length - 1){
      this.zoomOpt = this.zoomOptions[index+1]/100;
    } else if (action == 'out' && index > 0){
      this.zoomOpt = this.zoomOptions[index-1]/100;
    }
  }

  changeVisibility($event, dragContainer){
    console.log($event, dragContainer);
  }

  // --- PDF ---

  // Cambios y actualización del elemento
  pageChange() {
    this.field = [];
    this.column_type = null;
    this.field_index = null;
    this.clone_index = null;
  }

  verifyPage($event){
    let prev_page = this.page;
    if ($event > this.pages){
      this.page = this.pages;
    }
    if ($event < 1 || $event == null){
      this.page = 1;
    }
    this.field = [];
    this.column_type = null;
    this.field_index = null;
    this.clone_index = null;
  }

  fieldChange(value) {
    this.field = value;

    if(!this.field['isConfig']) {
    if (this.field['field_type'] == '3' || this.field['field_type'] == '12' || this.field['field_type'] == '13') {
      this.option_value = this.field['data'].length > 0 ? this.field['data']['values'][0]['value'] : null;
    } else if (this.field['field_type'] == '4') {
      this.option = '0';
    } else if (this.field['field_type'] == '7' || this.field['field_type'] == '9' || this.field['field_type'] == '10' || this.field['field_type'] == '18' || this.field['field_type'] == '22') {
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
      // this.row_field = 1;
      // this.column_value = this.field['fields'][0]['field'];
    }
    }

    this.column_type = null;
    this.field_index = null;
    this.clone_index = null;
  }

  fontChange(value) {
    this.font = value;
    if (this.field_index != null && this.clone_index != null) {
      this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['font'] = this.font;
    } else if (this.field_index != null) {
      this.doc_select['fields_drag'][this.field_index]['font'] = this.font;
    }
  }

  colorCssFilter(field) {
    const cssFilter = hexToCSSFilter(field.color, this.configHexToCss);
    if(!field.hasOwnProperty('cssFilter')) {
      field['cssFilter'] = cssFilter.filter
    }
    if(cssFilter.loss < 2 && cssFilter.called > 15) {
      field['cssFilter'] = cssFilter.filter
    }
    return field['cssFilter'];
  }

  colorChange(value) {
    this.color = value;
    if (this.field_index != null && this.clone_index != null) {
      this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['color'] = this.color;
    } else if (this.field_index != null) {
      this.doc_select['fields_drag'][this.field_index]['color'] = this.color;
    }
  }

  sizeChange(value, max) {
    if (value < 7) {
      this.size = 7;
    } else if (value > max) {
      this.size = max;
    } else {
      this.size = value;
    }

    if (this.field_index != null && this.clone_index != null) {
      this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['size'] = this.size;
      this.setTopEditingField(this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]);
    } else if (this.field_index != null) {
      this.doc_select['fields_drag'][this.field_index]['size'] = this.size;
      this.setTopEditingField(this.doc_select['fields_drag'][this.field_index]);
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

    if (this.field_index != null && this.clone_index != null) {
      this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['line_height'] = this.line_height;
    } else if (this.field_index != null) {
      this.doc_select['fields_drag'][this.field_index]['line_height'] = this.line_height;
    }
  }

  toggleLine(checked: boolean) {
    this.line_check = checked;
    if (checked) {
      this.size_image_x = 100;
      this.line_height = 10;
      if (this.field_index != null && this.clone_index != null) {
        this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['size_image_x'] = this.size_image_x;
        this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['line_height'] = this.line_height;
      } else if (this.field_index != null) {
        this.doc_select['fields_drag'][this.field_index]['size_image_x'] = this.size_image_x;
        this.doc_select['fields_drag'][this.field_index]['line_height'] = this.line_height;
      }
    } else {
      if (this.field_index != null && this.clone_index != null) {
        this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['size_image_x'] = '';
        this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['line_height'] = '';
      } else if (this.field_index != null) {
        this.doc_select['fields_drag'][this.field_index]['line_height'] = '';
        this.doc_select['fields_drag'][this.field_index]['size_image_x'] = '';
      }
    }
  }

  toggleAssignNamePdf(checked: boolean) {
    this.assign_name_pdf = checked;
    this.data.parentComponent.doc_list.forEach((field_list) => {
      field_list['fields_drag'].forEach((field) => {
        field['assign_name_pdf'] = false;
      });
    })
    if (this.field_index != null && this.clone_index != null) {
      this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['assign_name_pdf'] = checked;
    } else if (this.field_index != null) {
      this.doc_select['fields_drag'][this.field_index]['assign_name_pdf'] = checked;
    }
  }

  sizeSignChange(value, field_type, isConfig = false) {
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
      if (['9', '10', '18', '22'].includes(field_type)) {
        this.size_image_y = this.size_image_x;
      } else {
        // Resize Para realizar
        this.size_image_y = 0;
      }
    }
    if(isConfig && (field_type == '4' || field_type == '5')) {
      this.size_image_y = this.size_image_x;
    }

    if (this.field_index != null && this.clone_index != null) {
      this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['size_image_x'] = this.size_image_x;
      this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['size_image_y'] = this.size_image_y;
    } else if (this.field_index != null) {
      this.doc_select['fields_drag'][this.field_index]['size_image_x'] = this.size_image_x;
      this.doc_select['fields_drag'][this.field_index]['size_image_y'] = this.size_image_y;
      if(isConfig && (field_type == '4' || field_type == '5')) {
        this.setTopEditingField(this.doc_select['fields_drag'][this.field_index])
      }
    }
  }

  boldChange() {
    this.bold = !this.bold;
    if (this.field_index != null && this.clone_index != null) {
      this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['bold'] = this.bold;
    } else if (this.field_index != null) {
      this.doc_select['fields_drag'][this.field_index]['bold'] = this.bold;
    }
    return this.bold;
  }

  italicChange() {
    this.italic = !this.italic;
    if (this.field_index != null && this.clone_index != null) {
      this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['italic'] = this.italic;
    } else if (this.field_index != null) {
      this.doc_select['fields_drag'][this.field_index]['italic'] = this.italic;
    }
    return this.italic;
  }

  underlineChange() {
    this.underline = !this.underline;
    if (this.field_index != null && this.clone_index != null) {
      this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['underline'] = this.underline;
    } else if (this.field_index != null) {
      this.doc_select['fields_drag'][this.field_index]['underline'] = this.underline;
    }
    return this.underline;
  }

  setStyleText(action) {
    switch (action) {
      case 'bold':
        this.bold = this.doc_select['fields_drag'][this.field_index]['bold'];
        return this.bold;
      case 'italic':
        this.italic = this.doc_select['fields_drag'][this.field_index]['italic'];
        return this.italic;
      case 'underline':
        this.underline = this.doc_select['fields_drag'][this.field_index]['underline'];
        return this.underline;
    }
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
    if (this.field_index != null && this.clone_index != null) {
      this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['option'] = this.option;
    } else if (this.field_index != null) {
      this.doc_select['fields_drag'][this.field_index]['option'] = this.option;
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
    if (this.field_index != null && this.clone_index != null) {
      this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['option'] = this.option;
    } else if (this.field_index != null) {
      this.doc_select['fields_drag'][this.field_index]['option'] = this.option;
    }
    this.cd.markForCheck();
  }
  optionValueChange(value): void {
    if (value.length > 0) {
      this.option_value = value[0] + "";
      if (this.field_index != null) {
        if (this.new_field) {
          this.field_index = null;
          this.clone_index = null;
        } else {
          if (this.clone_index != null) {
            this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['option_value'] = this.option_value;
          } else {
            this.doc_select['fields_drag'][this.field_index]['option_value'] = this.option_value;
          }
        }
      }
    }
    this.cd.markForCheck();
  }

  // Tabla
  rowChange(value) {
    this.row_field = value;
    if (this.field_index != null) {
      if (this.new_field) {
        this.field_index = null;
        this.clone_index = null;
      } else {
        if (this.clone_index != null) {
          this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['row_field'] = this.row_field;
        } else {
          this.doc_select['fields_drag'][this.field_index]['row_field'] = this.row_field;
        }
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
      } else if (this.column_type == '4') {
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
          this.clone_index = null;
        } else {
          if (this.clone_index != null) {
            this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['column_value'] = this.column_value;
            this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index]['size_image_y'] = this.size_image_y;
          } else {
            this.doc_select['fields_drag'][this.field_index]['column_value'] = this.column_value;
            this.doc_select['fields_drag'][this.field_index]['size_image_y'] = this.size_image_y;
          }
        }
      }
    }
    this.cd.markForCheck();
  }

  justifyChange(value) {
    this.doc_select['fields_drag'][this.field_index]['justify'] = value;
  }

  // Logica para cerrar el acordeon
  expandedItem = 0;
  getChildModulesList(event, i, item: string = null) {
    switch (item) {
      case 'field':
        i = Object.keys(this.field_types).length
        break;
      case 'config':
        i = Object.keys(this.field_types).length +1
        break;
    }
    this.expandedItem = i;
  }

  disableMove(item) {
    let disabled = false;
    if (item.field_type == '17' && this.partSelected?.type == 4) {
      this.doc_select['fields_drag'].forEach(field => {
        if (field.field_type == '17' && this.partSelected.answer_env_user_id == field.user.answer_env_user_id) {
          disabled = true;
        }
      });
    }
    return disabled;
  }

  moveToPDF(event, i, j, list, fa, pdf, field=false, config=false) {
    let list_fa = list.getBoundingClientRect();
    let children;
    if (field) {
      let index_type = 3;
      children = list.children[0].children[index_type].children[1].children[0].children[0].children[i].children[j+1].getBoundingClientRect();
    } else if(config) {
      i = Object.keys(this.field_types).length + 1;
      children = list.children[0].children[i].children[1].children[0].children[0].children[j].getBoundingClientRect();
    } else {
      children = list.children[0].children[i].children[1].children[0].children[0].children[j].getBoundingClientRect();
    }
    let pageContainer = pdf.element.nativeElement.children[0].children[0].children[0].getBoundingClientRect();
    let pdfCard = fa.getBoundingClientRect();

    let position_ref_x = list_fa.right;
    let position_ref_y = list_fa.top;

    let x = position_ref_x + position_ref_y;
    // let algotitmo = ((x^3+5*x^2-2)*2^2*x / (x^3+5*x^2-2)*2^2*x ) * pageContainer.right + pageContainer.left;
    // console.log(algotitmo);

    let last_pos = [children.x + event.distance.x, children.y + event.distance.y];
    this.inside = (last_pos[0] >= pageContainer.left*(this.zoomOpt >= 1 ? 1 : this.zoomOpt) && last_pos[1] >= pageContainer.top*(this.zoomOpt >= 1 ? 1 : this.zoomOpt))
                    && (last_pos[0] < pageContainer.right*this.zoomOpt - 40*this.zoomOpt && last_pos[1] < pageContainer.bottom*this.zoomOpt - 20*this.zoomOpt)
                    && (last_pos[0] >= pdfCard.left && last_pos[1] >= pdfCard.top)
                    && (last_pos[0] < pdfCard.right && last_pos[1] < pdfCard.bottom);
    let rel_pos = [0,0];
    if (this.zoomOpt >= 1)
      rel_pos = [(last_pos[0] - pageContainer.left *this.zoomOpt)/this.zoomOpt, (last_pos[1] - pageContainer.top *this.zoomOpt)/this.zoomOpt];
    else
      rel_pos = [(last_pos[0] - pageContainer.left *this.zoomOpt), (last_pos[1] - pageContainer.top *this.zoomOpt)];

    // console.log("relative x: ", rel_pos[0], "y: ", rel_pos[1]);
    if (this.inside && rel_pos[0] > 0 && rel_pos[1] > 0){
      this.last_pos = rel_pos;
      this.extra = [pageContainer, pdfCard, list_fa];
    }else{
      this.last_pos = null;
    }
  }
  extra:any;
  last_pos = null;
  inside: boolean;

  addClone(field_data, doc_index, field_index){

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

    field_data['clone'].push({
      'envelope_version_form_id': this.doc_select['id'],
      'page': this.page,
      'data': field_data['data'],
      'left': this.last_pos ? this.last_pos[0] : 0 ,
      'top': this.last_pos ? this.last_pos[1] : top,
      'font': field_data['font'],
      'color': field_data['color'],
      'size': field_data['size'],
      'bold': field_data['bold'],
      'italic': field_data['italic'],
      'underline': field_data['underline'],
      'line_height': field_data['line_height'],
      'size_image_x': field_data['size_image_x'],
      'size_image_y': field_data['size_image_y'],
      'option': field_data['option'],
      'option_value': field_data['option_value'],
      'fields': field_data['fields'],
      'row': field_data['row'],
      'row_field': field_data['row_field'],
      'column_value': field_data['column_value'],
    })

    let clone_index = field_data['clone'].length - 1;
    this.selectClone(field_data, doc_index, field_index, clone_index);
  }

  addField(type_data, isConfig = false){
    if (this.inside && (this.partSelected || isConfig)){
      let field_data = type_data;
      let create = true;

      if (this.doc_select['fields_drag'].length >= 70) {
        create = false;
        this.toastService.showToast('warning', 'Cantidad Máxima', '¡Solo se permiten 70 campos por documento!');
      } else if (field_data['field_type'] == '7') {
        let count_sign = 0;
        this.doc_select['fields_drag'].forEach(input => {
          if (input.field_type == '7') {
            count_sign += 1;
          }
        });
        if (count_sign >= 6) {
          create = false;
          this.toastService.showToast('warning', 'Campo Firma Digitalizada', '¡Solo se permiten 6 campos de este tipo!');
        }
      } else if (field_data['field_type'] == '10') {
        let count_bio = 0;
        this.form_field.forEach(input => {
          if (input.field_type == '10') {
            count_bio += 1;
          }
        });
        if (count_bio >= 4) {
          create = false;
          this.toastService.showToast('warning', 'Campo Firma Biométrica', '¡Solo se permiten 4 campos de este tipo!');
        }
      } else if (field_data['field_type'] == '15') {
        let count = 0;
        this.doc_select['fields_drag'].forEach(input => {
          if (input.field_type == '15') {
            count += 1;
          }
        });
        if (count >= 1) {
          create = false;
          this.toastService.showToast('warning', 'Campo Ubicación', '¡Solo se permite 1 campo de este tipo!');
        }
      } else if (field_data['field_type'] == '17') {
        let count_table = 0;
        this.doc_select['fields_drag'].forEach(input => {
          if (input.field_type == '17') {
            count_table += 1;
          }
        });
        if (count_table >= 4) {
          create = false;
          this.toastService.showToast('warning', 'Campo Tabla', '¡Solo se permiten 4 campos de este tipo!');
        }
      } else if (field_data['field_type'] == '18') {
          let count_firmDoc = 0;
          this.doc_select['fields_drag'].forEach(input => {
            if (input.field_type == '18') {
              count_firmDoc += 1;
            }
          });
          if (count_firmDoc >= 4) {
            create = false;
            this.toastService.showToast('warning', 'Campo Firma con documento', '¡Solo se permiten 4 campos de este tipo!');
          }
      }

      if (create) {
        let field = {
          field: 0,
          field_type: field_data['field_type'],
          data: [],
          label: field_data['label'],
          option: 1,
          fields: [],
          row: [0],
          isConfig: isConfig,
          config: field_data['config']
        }
        this.fieldChange(field);

        let x = 0;
        let y = 0;
        // Obtiene el tamaño para el campo firma
        let line_type = ['1','2','5','6'];
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
        } else if (this.field['field_type'] == '23'){
          x = this.size_image_x;
          y = this.size_image_x;
        }
         else {
          this.column_type = null;
        }
        if(isConfig && (this.field['field_type'] == '4' || this.field['field_type'] == '5')) {
          x = 100;
          y = 100;
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
        this.doc_select['fields_drag'].push({
          'user': !isConfig ? this.partSelected : null,
          'page': this.page,
          'field': this.field['field'],
          'field_type': this.field['field_type'],
          'data': this.field['data'],
          'label': this.field['label'],
          'left': this.last_pos ? this.last_pos[0] : 0 ,
          'top': this.last_pos ? this.last_pos[1] : top,
          'font': this.font,
          'color': this.color,
          'size': this.size,
          'bold': this.bold,
          'italic': this.italic,
          'underline': this.underline,
          'justify': '',
          'line_height': this.line_height,
          'size_image_x': isConfig ? 100 : x,
          'size_image_y': y,
          'option': this.option,
          'option_value': this.option_value,
          'fields': this.field['fields'],
          'row': this.field['row'],
          'row_field': this.row_field,
          'column_value': this.column_value,
          'clone': [],
          'isConfig': isConfig,
          'config': isConfig ? this.field['config'] : '',
          'onEdit': false,
          'url_src': null,
          'assign_name_pdf': false
        });

        if(isConfig) {
          this.data.parentComponent.fieldsConfigCount++;
        }

        this.new_field = true;

        this.field_index = this.doc_select['fields_drag'].length - 1;
        this.clone_index = null;

        if (this.field['field_type'] == '17') {
          const dialogRef2 = this.dialogService.open(TableComponent, {closeOnBackdropClick: false, context:{data:{
            // index: event.currentIndex,
            fields_drag: this.doc_select['fields_drag'],
            index: this.field_index,
            field: '',
            field_type: this.field['field_type'],
            label: this.field['label'],
            description: '',
            required: false,
            parentComponent: this.data.parentComponent,
            approver:this.approver,
            fieldDialogComponent: this,
            isConfig: isConfig,
            config: this.field['config']
          }}});
        } else {
          const dialogRef = this.dialogService.open(FieldSettingDialogComponent, {closeOnBackdropClick: false, context:{data:{
            // index: event.currentIndex,
            fields_drag: this.doc_select['fields_drag'],
            index: this.field_index,
            field: '',
            field_type: this.field['field_type'],
            label: this.field['label'],
            description: '',
            required: false,
            parentComponent: this.data.parentComponent,
            approver:this.approver,
            fieldDialogComponent: this,
            isConfig: isConfig,
            config: this.field['config'],
            assign_name_pdf: false
          }}});
        }
      }
    } else {
      if (this.inside && this.partSelected == null) {
        this.data.parentComponent.toastService.duration = 5000;
        this.data.parentComponent.toastService.showToast("warning", 'Selecciona un Participante', 'Para poder incluir un campo en el documento primero debes seleccionar el participante al que se le asigna.')
        this.data.parentComponent.toastService.duration = 2000;
      }
    }
  }

  setColor(field, style) {
    switch (style) {
      case 'background':
        if (field.field_type == '17') {
          return 'none';
        }
        return field.isConfig ? 'white' : field.user.color;
      case 'table':
        return field.isConfig ? 'white' : field.user.color;
      case 'color':
        return field.isConfig ? field.color : 'white';
      default:
        return 'white';
    }

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
    if (field['field_type'] == '3' || field['field_type'] == '12' || field['field_type'] == '13') {
      // if (field['option'] == '1') {
      //   // Busca el nombre de la opción
      //   let position = field['data']['values'].map(function(e) { return e.value; }).indexOf(field['option_value']);
      //   return field['label'] + ' - ' + field['data']['values'][position]['label'];
      // }
      return 'Texto - ' + field['label'];
    } else if (field['field_type'] == '10' || field['field_type'] == '18' || field['field_type'] == '22') {
        return 'Comprobante - ' + field['label'];
    } else if (field['field_type'] == '17') {
      // Busca el nombre de la columna
      let position = field['fields'].map(function(e) { return e.field; }).indexOf(field['column_value']);
      if (position != -1) {
        return field['row_field'] + ' - ' + field['fields'][position]['label'] + ' - ' + field['label'];
      } else {
        return 'Columna - ' + field['row_field'];
      }
    } else if (field['field_type'] == '4') {
      let name_option = '';
      switch (field['option']) {
        case '0':
          name_option = 'Completa - '
          break;
        case '1':
          name_option = 'Día - '
          break;
        case '2':
          name_option = 'Mes - '
          break;
        case '3':
          name_option = 'Año - '
          break;

        default:
          break;
      }
      return name_option + field['label'];
    }
    return field['label'];
  }

  getLabel(field) {
    if (field['field_type'] == '3' || field['field_type'] == '12' || field['field_type'] == '13') {
      if (field['option'] == '1') {
        return 'x';
      }
    } else if (field['field_type'] == '10' || field['field_type'] == '18' || field['field_type'] == '22') {
      return 'QR-' + field['label'];
    } else if (field['field_type'] == '17') {
      // Busca el nombre de la columna
      let position = field['fields'].map(function(e) { return e.field; }).indexOf(field['column_value']);
      let option_type = ['3','12','13'];
      if (position != -1) {
        if (option_type.includes(field['fields'][position]['field_type'])) {
          if (field['option'] == '1') {
            return 'x-' + field['row_field'];
          }
        }
        return field['row_field'] + '-' + field['fields'][position]['label'] + '-' + field['label'];
      } else {
        return field['row_field'];
      }
    } else if (field['field_type'] == '4') {
      let name_tag = '';
      switch (field['option']) {
        case '0':
          name_tag = 'C-'
          break;
        case '1':
          name_tag = 'D-'
          break;
        case '2':
          name_tag = 'M-'
          break;
        case '3':
          name_tag = 'A-'
          break;

        default:
          break;
      }
      return name_tag + field['label'];
    }
    return field['label'];
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

  fieldConfig(field) {
    if(field.isConfig) {
      let textAlign = field.justify != '' ? `text-align: ${field.justify};` : '';
      return `width: 100%; ${textAlign}`;
    }
    return '';
  }

  getSizeSign(field, x, y) {
    // console.log('getSizeSign',field)
    if(field.isConfig && field.size_image_x) {
      if(field.field_type == '4'|| field.field_type == '5') {
        let w = parseInt(x) + 2;
        let h = parseInt(y) + 2;
        return 'width: ' + w + 'px; height: ' + h + 'px;';
      }
      return 'width: ' + x + 'px;';
    }
    if (!['1','2','5','6'].includes(field.field_type) && x != 0 && y != 0){
      return 'width: ' + x + 'px; height: ' + y + 'px;';
    }
    return '';
  }

  getClass(field_index, doc_index=null, clone_index=null) {
    // if (doc_index != null && clone_index != null) {
    //   if (doc_index == this.doc_index && field_index == this.field_index && clone_index == this.clone_index){
    //     return 'select-box';
    //   }
    // } else if (this.clone_index == null) {
    //   if (field_index == this.field_index){
    //     return 'select-box';
    //   }
    // }

    if (this.clone_index != null) {
      if (doc_index == this.doc_index && field_index == this.field_index && clone_index == this.clone_index){
        return 'select-box';
      }
    } else if (doc_index == null && clone_index == null) {
      if (field_index == this.field_index){
        return 'select-box';
      }
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
  moveField(event, el, index, cont_pdf:HTMLElement){

    this.field_index = index;
    this.clone_index = null;
    let father = el.offsetParent;
    let position_father = father.getBoundingClientRect();
    let position_children = el.getBoundingClientRect();
    // console.log(position_children.left - position_father.left);
    // console.log(position_children.top - position_father.top);

    event.source._dragRef.reset();
    this.doc_select['fields_drag'][index].left = (cont_pdf.scrollLeft/this.zoomOpt + position_children.left - position_father.left/this.zoomOpt).toString();
    this.doc_select['fields_drag'][index].top = (cont_pdf.scrollTop/this.zoomOpt + position_children.top - position_father.top/this.zoomOpt).toString();
    // console.log(position_children.left - position_father.left - 14.99554443359375);
    // console.log(position_children.top - position_father.top + 14.00445556640625);

    this.field = this.doc_select['fields_drag'][index];
    this.setElement();
    this.cdkDragStarted = false
    // console.log(this.field);
  }

  setTopEditingField(field) {
    let top = parseFloat(field['top']) + 6;
    let sizey = parseInt(field['size_image_y'])
    top += sizey == 0 ? field['size'] : sizey;
    this.onEdit.top = top;
  }

  // Guarda la posición del campo
  moveClone(event, el, index_doc, index_field, index_clone, cont_pdf:HTMLElement){

    this.doc_index = index_doc;
    this.field_index = index_field;
    this.clone_index = index_clone;

    let father = el.offsetParent.offsetParent;
    let position_father = father.getBoundingClientRect();
    let position_children = el.getBoundingClientRect();

    event.source._dragRef.reset();

    this.data.parentComponent.doc_list[index_doc]['fields_drag'][index_field]['clone'][index_clone].left = (cont_pdf.scrollLeft/this.zoomOpt + position_children.left - position_father.left/this.zoomOpt).toString();
    this.data.parentComponent.doc_list[index_doc]['fields_drag'][index_field]['clone'][index_clone].top = (cont_pdf.scrollTop/this.zoomOpt + position_children.top - position_father.top/this.zoomOpt).toString();

  }

  selectField(field, index, isNew = false) {
    this.field_current['doc_index'] = this.doc_index;
    this.field_current['field_index'] = isNew ? index : this.field_index;
    this.field_current['field'] = isNew ? field : this.field;

    this.data.parentComponent.doc_list.forEach(fields => {
      fields['fields_drag'].forEach((drag, i) => {
        let fieldInPdf = document.getElementById(`field-in-pdf-${i}`);
        if(fieldInPdf) {
          fieldInPdf.style.zIndex = null;
        }
        drag.onEdit = false;
      });
    });
    if(index != null) {
      field.onEdit = true
    }
    this.field_index = index;
    this.clone_index = null;
    this.field = field;
    if (field){
      if(index != null) {
        let fieldInPdf = document.getElementById(`field-in-pdf-${index}`);
        if(fieldInPdf) {
          fieldInPdf.style.zIndex = '100';
        }
      }
      if(field.hasOwnProperty('user') && field.hasOwnProperty('isConfig') && !field.isConfig) {
        if (field.user != this.partSelected) {
          this.setParticipant(field.user || null);
        }
      }
      this.setElement();
    }
    this.new_field = false;
  }

  selectClone(field, index_doc, index_field, index_clone) {
    this.doc_index = index_doc;
    this.field_index = index_field;
    this.clone_index = index_clone;
    this.field = field;

    if (field){
      this.partSelected = field.user;
      this.setElement();
    }
    this.new_field = false;
  }

  setElement() {
    let field = {};
    let field_type;
    if (this.field_index != null && this.clone_index != null) {
      field = this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'][this.clone_index];
      field_type = this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['field_type'];
    } else if (this.field_index != null) {
      field = this.doc_select['fields_drag'][this.field_index];
      field_type = field['field_type'];
    } else {
      field = this.defaul_values;
    }
    if(field.hasOwnProperty('top') && field.hasOwnProperty('left')) {
      this.setTopEditingField(field);
      this.onEdit.left = parseFloat(field['left']);
      this.onEdit.edit = true;
    } else {
      this.onEdit.edit = false;
    }

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
    this.row_field = this.field['row_field'];
    this.column_value = this.field['column_value'];
    this.assign_name_pdf = this.field['assign_name_pdf']

    if (field_type != '17') {
      this.column_type = null;
    }

    if (this.line_height+'' != '') {
      this.line_check = true;
    } else {
      this.line_check = false;
    }
    this.autoSaveField();
  }

  onEditFieldConfig(pos) {
    this.field_index = pos;
    this.onEditField();
  }

  onEditField() {
    if (this.field_index != null) {
      let field_data = this.doc_select['fields_drag'][this.field_index];
      if(field_data['isConfig'] && !field_data.hasOwnProperty('config') ) {
        let result = this.configGeneral.find(({ field_type }) => field_type == field_data['field_type']);
        field_data['config'] = result ? result.config : null
      }

      if (field_data['field_type'] == '17') {
        const dialogRef2 = this.dialogService.open(TableComponent, {closeOnBackdropClick: false, context:{data:{
          // index: event.currentIndex,
          fields_drag: this.doc_select['fields_drag'],
          index: this.field_index,
          field: field_data['field'],
          field_type: field_data['field_type'],
          label: field_data['label'],
          description: field_data['description'],
          required: false,
          row: field_data['row'],
          fields: field_data['fields'],
          parentComponent: this.data.parentComponent,
          approver:this.approver,
          fieldDialogComponent: this,
          config: field_data['config']
        }}});
      } else {
        const dialogRef = this.dialogService.open(FieldSettingDialogComponent, {closeOnBackdropClick: false, context:{data:{
          fields_drag: this.doc_select['fields_drag'],
          index: this.field_index,
          field: field_data['field'],
          field_type: field_data['field_type'],
          isConfig: field_data['isConfig'],
          config: field_data['config'],
          label: field_data['label'],
          description: field_data['description'],
          required: field_data['required'],
          values: field_data['values'],
          validate: field_data['validate'],
          optionDocuments: field_data['optionDocuments'],
          row: field_data['row'],
          fields: field_data['fields'],
          parentComponent: this.data.parentComponent,
          option: field_data['option'],
          edit: true,
          assign_name_pdf: field_data['assign_name_pdf']
        }}});
      }
    }
  }

  getTitleConfig(fieldType) {
    let result = this.configGeneral.find(({ field_type }) => field_type == fieldType);
    return result ? result.label : ''
  }

  onDeleteField(docIndex, fieldIndex, cloneIndex, field) {
    this.dialogInfoRef = this.dialogService.open(DialogInfoComponent, {
      closeOnBackdropClick: false,
      closeOnEsc: false,
      context: { isDelete: true },
    });
    this.dialogInfoRef.onClose.subscribe(result => {
      if(result) {
        this.doc_index = docIndex;
        this.field_index = fieldIndex;
        this.clone_index = cloneIndex;
        this.onEdit.edit = false;
        this.deleteField();
        if(this.data.parentComponent.autosave && field.hasOwnProperty('id')) {
          this.deleteServer('field', field['id']);
        }
      }
    });
  }

  deleteField() {
    if (this.clone_index != null) {
      this.data.parentComponent.doc_list[this.doc_index]['fields_drag'][this.field_index]['clone'].splice(this.clone_index, 1);
      this.field_index = null;
      this.clone_index = null;
    } else if (this.field_index != null) {
      this.doc_select['fields_drag'].splice(this.field_index, 1);
      this.field_index = null;
    }
    this.field = [];
  }

  deleteFieldConfig(pos, field) {
    this.dialogInfoRef = this.dialogService.open(DialogInfoComponent, {
      closeOnBackdropClick: false,
      closeOnEsc: false,
      context: { isDelete: true },
    });
    this.dialogInfoRef.onClose.subscribe(result => {
      if(result) {
        this.data.parentComponent.fieldsConfigCount--;
        this.doc_select['fields_drag'].splice(pos, 1);
        this.field_index = null;
        this.field = [];
        if(this.data.parentComponent.autosave && field.hasOwnProperty('id')) {
          this.deleteServer('element', field['id']);
        }
      }
    });
  }

  deleteServer(action: string, id: number) {
    this.data.parentComponent.envelopeService.deleteFieldOrElement(action, id).subscribe((result) => {
      // console.log('deleteFieldOrElement', result)
    })
  }

  changeSrc(doc_selected, pos){
    this.page = 1;
    this.doc_selected_index = pos;
    this.doc_select = doc_selected;
    this.pages = this.doc_select['extra']['max_pages'];
    this.width = this.doc_select['extra']['pages'][this.page-1]['width'];
    this.height = this.doc_select['extra']['pages'][this.page-1]['height'];
    this.src = this.doc_select['create'] ? this.doc_select['data']['src'] : this.doc_select['data'];
    this.pageChange();
  }

  setParticipant($event){
    this.partSelected = $event;
    this.onEdit.edit = false;
    if (this.field_index != null) {
      if ((this.partSelected.approver && this.doc_select['fields_drag'][this.field_index]['field_type'] == '23') || (this.doc_select['fields_drag'][this.field_index]['field_type'] != 23)) {
        // Realizar Ajuste
        // this.doc_select['fields_drag'][this.field_index]['user'] = this.partSelected;
      } else {
        this.field_index = null;
        this.clone_index = null;
        this.field = [];
      }
    }
    this.isApprover(this.partSelected && (this.partSelected.approver || this.data.parentComponent.checker_user == this.partSelected.version_id));
    if (this.partSelected && this.partSelected.type == 4) {
      this.isPublicOne();
    }
  }

  isApprover($event){
    this.approver = $event;
    this.loading = true;
    if(this.approver){
      this.field_types = [];
      this.types_names = {4:'Campos Aprobador'};
      setTimeout(()=>{
        this.loading = false;
        this.field_types = {4: [
          {
            label: 'Comprobante',
            field_type: '23',
            icon: '',
            validate: {},
            group: 4,
          }
        ]};
      }, 200);
    } else {
      this.types_names = { 1:'Campos Habituales', 2:'Campos Especiales', 3:'Firmas' };
      this.setFieldList();
      setTimeout(()=>{
        this.loading = false;
      }, 200);
    }
  }

  isPublicOne(){
    this.field_types = [];
    this.types_names = {5:'Campos Listado'};
    setTimeout(()=>{
      this.loading = false;
      this.field_types = {5: [
        {
          label: 'Listado',
          field_type: '17',
          icon: '',
          fields: [],
          group: 5,
        }
      ]};
    }, 200);
  }

  isHideType(){
    // console.log(this.doc_select['fields_drag']);
    if (this.partSelected && this.partSelected.type == 4) {
      this.doc_select['fields_drag'].forEach(element => {
        if (element.user && element.user.answer_env_user_id == this.partSelected.answer_env_user_id) {
          return true;
        }
      });
    }
    return false;
  }

  onPDFSubmit() {
    if (this.data.parentComponent.name_envelope != '') {
      this.loading = true;
      let forms = [];
      let fields_drag = 0;
      let save = true;
      let clone_id = [];

      this.data.parentComponent.doc_list.forEach(doc => {
        if (doc['fields_drag'].length != 0) {
          doc['fields_drag'].forEach(field => {
            if (field.hasOwnProperty('clone') && field['clone'].length != 0) {
              field['clone'].forEach(clone => {
                clone_id.push(clone['envelope_version_form_id']);
              });
            }
          });
        }
      });

      this.data.parentComponent.doc_list.forEach(doc => {
        if (doc['fields_drag'].length == 0) {
          if (clone_id.length != 0) {
            if (!clone_id.includes(doc['id'])) {
              save = false;
            }
          } else {
            save = false;
          }
        } else {
          let elementConfig = 0;
          doc['fields_drag'].forEach(field => {
            if(field.isConfig) {
              elementConfig++
            }
          })
          save = doc['fields_drag'].length > elementConfig;
        }
      });

      if (save) {
        this.data.parentComponent.doc_list.forEach(doc => {
          fields_drag += doc['fields_drag'].length;
          if (doc['fields_drag'].length != 0) {
            // en elements_drag se envia todos los campos de la configuración general del pdf
            // en fields_drag se envia todos los campos del pdf para ser diligenciados por un participante
            doc['elements_drag'] = [];
            doc['fields_drag'].forEach((field, index) => {
              if(field.isConfig) {
                doc['elements_drag'].push(field);
              }
            });
            let filter = doc['fields_drag'].filter(el => el.isConfig == false);
            doc['fields_drag'] = filter;
          }
        });
        this.data.parentComponent.doc_list.forEach(doc => {
          if (this.data.parentComponent.doc_list_original) {
            let docListOriginalAll = JSON.parse(this.data.parentComponent.doc_list_original);
            let docListOriginal = [];
            docListOriginalAll.forEach((docList) => {
              let filter = docList['fields_drag'].filter(el => el.isConfig == false);
              docList['fields_drag'] = filter;
              docListOriginal.push(docList);
            });
            let docFieldsDrag = doc['fields_drag'].filter(el => el.isConfig == false);
            let position = docListOriginal.map(function(e) { return e.id; }).indexOf(doc.id);
            if (position != -1) {
              if (JSON.stringify(docFieldsDrag.map((element) => { element['user'] = {'id': element['user']['version_id']}; return element; })) != JSON.stringify(docListOriginal[position]['fields_drag'].map((element) => { element['user'] = {'id': element['user']['version_id']}; return element; }))) {
                // Solo update
                // console.log(doc['fields_drag']);
                forms.push({
                  'id': doc.id,
                  'fields_drag': doc['fields_drag'],
                  'elements_drag': doc['elements_drag'],
                });
              }
            } else {
              // Solo para nuevo en el update
              // console.log(doc['fields_drag']);
              doc['fields_drag'].forEach(field => {
                field['user'] = {'id': field['user']['version_id']}
              });
              forms.push({
                'id': doc.id,
                'fields_drag': doc['fields_drag'],
                'elements_drag': doc['elements_drag'],
              });
            }
          } else {
            // Solo para create
            doc['fields_drag'].forEach(field => {
              field['user'] = {'id': field['user']['version_id']}
            });
            forms.push({
              'id': doc.id,
              'fields_drag': doc['fields_drag'],
              'elements_drag': doc['elements_drag'],
            });
          }
        });

        let form_data = {
          tab: 4,
          id: this.data.parentComponent.envelope_id,
          isNewEnvelope: this.data.parentComponent.isNewEnvelope,
          answer: this.data.parentComponent.answer_id,
          name: this.data.parentComponent.name_envelope,
          autosave: this.data.parentComponent.autosave,
          forms: forms
        }
        this.data.parentComponent.view_option = fields_drag < this.data.parentComponent.limit_fields_option ? 1 : 2;
        this.data.parentComponent.envelopeService.loading_form(form_data).subscribe(response => {
          if (response['status']) {
            this.data.parentComponent.tab_option = 5
            this.close(true);
            // this.toastService.showToast('success', 'Sobre', 'Sobre registrado con exito, En breve serás redireccionado a Mi Unidad');
            // setTimeout(()=> {
            //   this.data.parentComponent.router.navigate(['/pages/envelope/', {}]);
            //   this.close(true);
            // },
            //   3000
            // );
          }else{
            this.toastService.showToast('danger', 'Hubo un problema', response['detail'] ? response['detail'] : 'Tuvimos un problema con esta función, por favor intenta nuevamente o comunicate con nosotros.');
            this.loading = false;
          }
        });
      } else {
        this.toastService.showToast('warning', 'Fatan Datos', 'Debes de agregar mínimo un campo a cada documento del sobre');
        this.loading = false;
      }
    } else {
      this.toastService.showToast('warning', 'Fatan Datos', 'Debes de agregar el nombre del sobre');
    }
  }

  autoSaveField() {
    if(this.data.parentComponent.autosave && this.field_current['field'].hasOwnProperty('field_type') ) {
      let user = this.field_current['field']['user'];
      let userUpdate = this.field_current['field']['user'] ? { id: this.field_current['field']['user']['version_id'] } : null
      this.field_current['field']['user'] = userUpdate;
      let data = {
        id: this.data.parentComponent.envelope_id,
        field: this.field_current['field']
      }
      this.data.parentComponent.envelopeService.loading_form(data, 'auto_save/').subscribe((response) => {
        this.doc_select['fields_drag'][this.field_current['field_index']]['id'] = response['data']['id'];
        this.doc_select['fields_drag'][this.field_current['field_index']]['user'] = user
      })
    }
  }

  activeOptions(field) {
    let active = false;
    if(field && field.page == this.page && ['3', '12', '13'].includes(field['field_type']+'') && field.hasOwnProperty('values')) {
      active = true
    }
    return active;
  }

  moveOptionEnd(event, el, field, opt, cont_pdf:HTMLElement, title = false){
    let father = el.offsetParent.offsetParent;
    let position_father = father.getBoundingClientRect();
    let position_children = el.getBoundingClientRect();
    event.source._dragRef.reset();
    let left = (cont_pdf.scrollLeft/this.zoomOpt + position_children.left - position_father.left/this.zoomOpt).toString();
    let top = (cont_pdf.scrollTop/this.zoomOpt + position_children.top - position_father.top/this.zoomOpt).toString();
    if(title) {
      field.left = left
      field.top = top
    } else {
      field['values'][opt]['move'] = true;
      field['values'][opt]['left'] = left
      field['values'][opt]['top'] = top
    }
  }

  setPositionOption(fieldOption, option) {
    let top = parseInt(option.top)
    let left = parseInt(option.left)
    if(fieldOption == '0' && !option.hasOwnProperty('move')) {
      return `top: ${top+12}px; left: ${left}px;`
    } else {
      return `top: ${top}px; left: ${left}px;`
    }
  }

  setStyleLista(field, addClass) {
    if(field['field_type'] == '3') {
      return addClass ? 'input-box' : `background: ${field.user.color}`;
    }
    return ''
  }

}

@Component({
  selector: "ngx-dialog-info",
  templateUrl: "dialog-info.html",
  styleUrls: ["dialog-info.scss"],
})
export class DialogInfoComponent implements OnInit {

  public isDelete: boolean;

  constructor(
    public dialogRef: NbDialogRef<DialogInfoComponent>, ){
  }

  ngOnInit(): void { }

  onClose() {
    this.dialogRef.close();
  }

  onDelete(action: boolean) {
    this.dialogRef.close(action);
  }

}
