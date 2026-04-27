import { Component, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';

@Component({
    selector: 'ngx-modal',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss'],
    standalone: false
})
export class ModalComponent implements OnInit {

  size;
  title;

  // Inputs
  value = '';
  confirm = '';

  public data: {
    field:any,
  }

  constructor(
    public dialogRef: NbDialogRef<ModalComponent>,
  ) { }

  ngOnInit(): void {
    this.title = 'Confirmación de Valor';
    this.size = '22.875rem';

    if (this.data.field.answer && this.data.field.answer != '') {
      this.value = this.data.field.answer;
      this.confirm = this.data.field.answer;
    }
  }

  typeField(type:number) {
    if (type == 2) {
      return 'number';
    } else {
      return 'text';
    }
  }

  patternField(type:number) {
    if (type == 1) {
      return '[a-zA-Z0-9 ]{2,254}';
    } else if (type == 2) {
      return '';
    } else if (type == 5) {
      return "[a-zA-Z ]{2,254}";
    }
    return "";
  }

  onKeydown(type:number, event){
    console.log(event.key);
    // if (event.key == "-") {
    //   event.preventDefault();
    // }
    if (type == 2 || type == 11){
      if(event.key === 'e' || event.key === '.' || event.key === 'E')
        event.preventDefault()
    } 
    else if (type == 5) {
      let char_code = event.keyCode;
      console.log(char_code);
      if (!(char_code == 32 || char_code == 192 || (char_code > 64 && char_code < 91) || (char_code > 96 && char_code < 123) || char_code == 8)) {
        event.preventDefault();
      }
    }
  }

  onValidate() {
    let invalid = false;
    if ((this.data.field.required && this.value.trim() == '') || this.value != this.confirm) {
      invalid = true;
    } else {
      if (this.value.trim() != '') {
        if(!this.isValidate(this.data.field.field_type, this.value) || !this.isValidate(this.data.field.field_type, this.confirm)){
          invalid = true;
        }
      }
    }
    return invalid;
  }

  isValidate(type: string, value: string): boolean{
    switch (type) {
      // Alphanumeric
      case '1':
        var REGEX = /^[\w\-\s@]*$/;
        value = value.trim();
        break;
      // Number
      case '2':
        var REGEX = /^[0-9]+$/;
        value = value.toString();
        break;
      // Letters
      case '5':
        // var REGEX = /^([a-zA-Z]{2,254})*$/;
        var REGEX = /[a-z]/gi;
        value = value.trim();
        break;
      default:
        return false;
    }
    if (value != '') {
      return REGEX.test(value);
    }
  }

  onAccept(event){
    this.dialogRef.close(this.value);
  }

  close(){
    this.dialogRef.close(false);
  }

}
