import { Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'ngx-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss']
})
export class ConfirmDialogComponent implements OnInit, OnDestroy {

  public data:{title:string, msg:string, yesMsg?:string, noMsg?:string, parent:any};

  yesMsg:string;
  noMsg:string;
  value:boolean = false;

  constructor() { }

  ngOnInit(): void {
    this.yesMsg = this.data.yesMsg || 'Aceptar';
    this.noMsg = this.data.noMsg || 'Cancelar';
  }

  onClick(value:boolean){
    this.value = value;
    this.data.parent.confirmDialog.close(value);
  }

  ngOnDestroy(): void {
    // console.log('cerrado');
  }

}
