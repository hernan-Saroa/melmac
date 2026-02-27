import { LocalDataSource } from 'ng2-smart-table';
import { DeviceService } from './../../../services/device.service';
import { NbDialogRef } from '@nebular/theme';
import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'ngx-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss']
})
export class ErrorComponent implements OnInit {

  data;

  data_errors = [];
  source: LocalDataSource = new LocalDataSource();

  settings = {
    mode: 'external',
    pager: {
      display: true,
      perPage: 4,
    },
    actions:{
      add: false,
      delete: false,
      edit: false,
    },
    columns: {
      row: {
        title: 'Fila',
        filter:false,
      },
      data: {
        filter:false,
        title: 'Error',
      },
    },
    hideSubHeader:true,
  };

  constructor(protected dialogRef: NbDialogRef<ErrorComponent>, private serviceDevice:DeviceService, private serviceUser: UserService) {

  }

  close(){
    this.dialogRef.close();
  }

  ngOnInit(): void {
    let service;
    if (this.data['type'] != undefined){
      service = this.serviceUser;
    } else {
      service = this.serviceDevice;
    }

    service.getMassiveError(this.data['id']).subscribe(response => {
      if (response['status']){
        this.data_errors = response['data'];
        this.source.load(this.data_errors);
      }
    });
  }

}
