import { Component, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { InputShareDocumentComponent } from '../input-share-document/input-share-document.component';
import { IContextDialog, IResponseDialog, IResponseDialogData } from '../../../core/models/dialog.model';
import * as XLSX from 'xlsx';
import { EnumShareDocumentType } from '../../../core/enums/input-share-document.enum';
import { ToastService } from '../../../usable/toast.service';

@Component({
  selector: 'ngx-dialog-massive',
  templateUrl: './dialog-massive.component.html',
  styleUrls: ['./dialog-massive.component.scss']
})
export class DialogMassiveComponent implements OnInit {

  public inputData: IContextDialog = {} as IContextDialog
  excelData: IResponseDialogData[] = [];
  dataList: IResponseDialogData[] = [];
  pageSize = 30;
  page = 1;
  pageTotal = 0;

  constructor(
    private toastService: ToastService,
    public dialogRef: NbDialogRef<InputShareDocumentComponent>,
  ) { }

  ngOnInit(): void {
    if (this.inputData.data.length > 0) {
      this.dataList = this.inputData.data.slice(this.page-1, this.pageSize);
      this.pageTotal = Math.ceil(this.inputData.data.length / this.pageSize);
    }
  }

  changePage(next: boolean) {
    if(next) {
      if(this.page < this.pageTotal) {
        this.page++;
        this.dataList = this.inputData.data.slice((this.page-1)*this.pageSize, this.pageSize*this.page);
      }
    } else {
      if(this.page > 1) {
        this.page--;
        this.dataList = this.inputData.data.slice((this.page-1)*this.pageSize, this.pageSize*this.page);
      }
    }
  }

  close(response:boolean){
    let result: IResponseDialog = {
      status: false,
      data: []
    }
    if(!response) {
      this.dialogRef.close(result);
    } else {
      result.status = true
      result.data = this.excelData;
      this.dialogRef.close(result);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const workbook = XLSX.read(e.target.result, { type: 'binary' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const inputeExcelData: string[] = XLSX.utils.sheet_to_json(worksheet, { raw: false, header: 1 });
      let isValid = true
      for (let i = 4; i < inputeExcelData.length; i++) {
        let row = inputeExcelData[i];
        switch (this.inputData.type) {
          case EnumShareDocumentType.PHONE:
            if (row.length == 3 && row[0] != '' && row[1] != '' && row[2] != '') {
              isValid = row[1] == '57' ? this.isValidInput(row[2]) : true
              this.excelData.push({
                index: i-3,
                value: `+${row[1]} ${row[2]}`
              })
            } else {
              isValid = false;
            }
            break;
          case EnumShareDocumentType.EMAIL:
            if (row.length == 2 && row[0] != '' && row[1] != '') {
              isValid = this.isValidInput(row[1]);
              this.excelData.push({
                index: i-3,
                value: `${row[1]}`
              })
            } else {
              isValid = false;
            }
            break;
        }
        if (!isValid) {
          this.excelData = [];
          this.toastService.showToast('danger', 'Error', `Los datos para ${this.setMsjType(false)} no son válidos.`);
          event.target.value = '';
          i = inputeExcelData.length;
        }
      }
      if(isValid) {
        this.toastService.showToast('success', 'Listo', `Se han cargado ${this.excelData.length} ${this.setMsjType(true)} correctamente.`);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  isValidInput(input: string) {
    switch (this.inputData.type) {
      case EnumShareDocumentType.PHONE:
        return input.match(/^3[0-9]{9}$/) ? true : false;
      case EnumShareDocumentType.EMAIL:
        return input.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-.]+[.][a-zA-Z0-9.-]{2,}$/) ? true : false;
      default:
        return false;
    }
  }

  setMsjType(plural: boolean) {
    switch (this.inputData.type) {
      case EnumShareDocumentType.PHONE:
        return plural ? 'celulares' : 'celular';
      case EnumShareDocumentType.EMAIL:
        return plural ? 'correos' : 'correo';
      default:
        return '';
    }
  }

  downloadPlantilla() {
    const name = `PlantillaCompartirMasiva${this.inputData.type == EnumShareDocumentType.PHONE ? 'Celular' : 'Correo'}.xlsx`
    const anchor = document.createElement('a');
    anchor.href = `/assets/templates/${name}`;
    anchor.download = name;
    anchor.click();
  }

}
