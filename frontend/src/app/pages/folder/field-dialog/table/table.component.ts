import { Component, OnInit, ViewChild } from '@angular/core';
import { FolderComponent } from '../../folder.component';
import { FieldDialogComponent } from '../field-dialog.component';
import { NbDialogRef } from '@nebular/theme';
import { NbPopoverDirective, NbPosition, NbTrigger } from '@nebular/theme';
import { ToastService } from '../../../../usable/toast.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
    selector: 'ngx-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.scss'],
    standalone: false
})
export class TableComponent implements OnInit {

  label;
  description;

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
  }

  loading;

  list_fields = [
    {
      field: '',
      label: 'Nombre',
      field_type: '1',
      edit: false,
      values: [
        {
          value: '',
          label: ''
        }],
    },
    {
      field: '',
      label: 'Correo',
      field_type: '1',
      edit: false,
      values: [
        {
          value: '',
          label: ''
        }],
    },
    {
      field: '',
      label: 'Teléfono',
      field_type: '2',
      edit: false,
      values: [
        {
          value: '',
          label: ''
        }],
    }
  ];

  options = [
    {
      value: '',
      label: '',
    }
  ];

  num_list = 2;

  // Template
  trigger = NbTrigger.CLICK;
  position = NbPosition.TOP;

  @ViewChild(NbPopoverDirective) popover: NbPopoverDirective;

  constructor(
    public dialogRef: NbDialogRef<FieldDialogComponent>,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.description = this.data.description != '' ? this.data.description : '0';

    if (this.data.fields != undefined){
      let fields = JSON.stringify(this.data.fields);
      this.list_fields = Object.assign([], JSON.parse(fields));
      this.num_list = this.data.fields_drag[this.data.index].user.limit_public;
    }

  }

  onAccept(event){
    this.loading = true;

    let field = this.data['fields_drag'][this.data.index]

    field['field'] = this.data.field;
    field['label'] = 'Listado Público',
    field['description'] = this.description;
    field['required'] = false;
    field['values'] = [];
    field['valuesDocuments'] = [];
    field['valuesNit'] = [];
    field['optionDocuments'] = [];
    field['fields'] = this.list_fields;
    field['row'] = this.num_list;
    field['validate'] = {};

    console.log(field);

    if (this.data.fieldDialogComponent) {
      this.data.fieldDialogComponent.selectField(field, this.data.index);
    }
    this.dialogRef.close(true);
  }

  onAddField(){
    let index = this.options.length + 1;
    this.list_fields.push(
      {
        field: '',
        label: 'Columna',
        field_type: '1',
        edit: false,
        values: [
          {
            value: '',
            label: ''
          }]
      },
    );
  }

  editDoc(i, editDoc) {
    if (!this.list_fields[i].edit) {
      this.list_fields[i].edit = true;
    }
    setTimeout(() => {
      editDoc.focus();
    }, 200);
  }

  saveEditDoc(i) {
    setTimeout(() => {
      this.list_fields[i].edit = false;
    }, 200);
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

  dropField(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.list_fields, event.previousIndex, event.currentIndex);
  }

  onDeleteField(index){
    // console.log(index);
    if (this.list_fields.length > 1) {
      this.list_fields.splice(index, 1);
    }
  }

  openOption(index) {
    this.options = this.list_fields[index]['values'];
    this.popover.show();
  }

  onCloseOption() {
    this.popover.hide();
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
    this.options[index]['label'] = value;
    inputS.value = value;
  }

  onDeleteOption(index){
    this.options.splice(index, 1);
  }

  dropSelect(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.options, event.previousIndex, event.currentIndex);
  }

  close(){
    this.dialogRef.close();
    if (!this.data.edit) {
      this.data.parentComponent.fieldsConfigCount--;
      this.data.fields_drag.splice(this.data.index, 1);
    }
  }

  timePeriods = [
    'Bronze age',
    'Iron age',
    'Middle ages',
    'Early modern period',
    'Long nineteenth century'
  ];

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.timePeriods, event.previousIndex, event.currentIndex);
  }

}
