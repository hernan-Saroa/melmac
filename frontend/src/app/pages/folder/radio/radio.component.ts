import { Component, OnInit, Input, Output, EventEmitter, ElementRef } from '@angular/core';

interface RadioExtraOptions{
  disabled?:boolean,
  radioClass?:string,
  size?:'small'|'medium'|'large'|'giant';
}

@Component({
  selector: 'mel-radio',
  templateUrl: './radio.component.html',
  styleUrls: ['./radio.component.scss']
})
export class RadioComponent implements OnInit {

  @Input('checked') checked:boolean = false;
  @Input('containerClass') class:string = 'check-container';
  @Input('iconClass') iconClass:string = 'radio-icon';
  @Input('value') value:any = null;
  @Input('extra') extra:RadioExtraOptions = null;
  @Output('change') emiter: EventEmitter<boolean> = new EventEmitter();
  @Output('valueChange') valueEmiter: EventEmitter<number> = new EventEmitter();
  constructor() { }

  ngOnInit(): void {  }

  click(){
    let disabled = this.extra.disabled == undefined ? false : this.extra.disabled;
    if (!disabled) {
      if( (this.checked === false && this.value != null) || (this.value === null) ){
        this.checked = !this.checked;
        this.emiter.emit(this.checked);
      }
      if(this.checked){
        this.valueEmiter.emit(this.value);
      }
    }
  }

}
