import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { IShareDocument, IReturnData, IEditSelected, IPhoneNumber } from '../../../core/models/input-share-document.model';
import { EnumShareDocumentActions, EnumShareDocumentOther, EnumShareDocumentType } from '../../../core/enums/input-share-document.enum';
import { ToastService } from '../../../usable/toast.service';
import { NbDialogService } from '@nebular/theme';
import { DialogMassiveComponent } from '../dialog-massive/dialog-massive.component';
import { IContextDialog, IResponseDialog, IResponseDialogData } from '../../../core/models/dialog.model';

@Component({
  selector: 'ng-input-share-document',
  templateUrl: './input-share-document.component.html',
  styleUrls: ['./input-share-document.component.scss']
})
export class InputShareDocumentComponent implements OnInit {

  @Input() inputData: IShareDocument
  @Input() inputShareSelected: string
  @Input() returnDataInputs: IReturnData
  @Output() eventChangeList = new EventEmitter<string>();
  @Output() eventListData = new EventEmitter<IReturnData>();

  telOptions = { 
    initialCountry: EnumShareDocumentOther.INITIAL_COUNTRY, 
    preferredCountries: [EnumShareDocumentOther.INITIAL_COUNTRY]
  };

  inputObject: any = null;
  inputContact: string = EnumShareDocumentOther.EMPTY
  inputEmail: string = EnumShareDocumentOther.EMPTY
  error = false
  errorMessage: string = EnumShareDocumentOther.EMPTY

  phone: IPhoneNumber = { phoneInd: '', phoneNumber: '', iso2: ''}
  editSelected: IEditSelected = { index: -1, type: '' }

  listaContactos: IResponseDialogData[] = []

  constructor(
    private toastService: ToastService,
    private dialogService :NbDialogService
  ) { }

  get shareType(){
    return EnumShareDocumentType
  }
  
  get shareOther(){
    return EnumShareDocumentOther
  }

  ngOnInit(): void {
    this.inputData.checkBoxs.forEach(element => {
      this.returnDataInputs[this.inputData.type].checkBoxs.push(element);
    });
  }

  onClick(type: EnumShareDocumentType, action: EnumShareDocumentActions) {
    if (action == EnumShareDocumentActions.LIST) {
      this.viewList(type);
      return
    }
    this.error = false
    this.errorMessage = EnumShareDocumentOther.EMPTY
    switch (type) {
      case EnumShareDocumentType.PHONE:
        if (action == EnumShareDocumentActions.ADD) {
          if (this.phone.phoneNumber != EnumShareDocumentOther.EMPTY && this.inputObject.isValidNumber()) {
            let phone = `${this.phone.phoneInd} ${this.phone.phoneNumber}`;
            this.addData(type, phone)
            this.phone.phoneNumber = EnumShareDocumentOther.EMPTY;
          } else {
            this.setError('El celular no es válido')
          }
        } else if (action == EnumShareDocumentActions.ATTACH) {
          let data: IContextDialog = {
            type: type,
            icon: 'attach-2-outline',
            title: 'Carga masiva',
            listName: 'números de celular',
            descriptionButton: '#Celulares',
            data: []
          }
          this.openDialogMassive(data, type);
        }
        break;
      case EnumShareDocumentType.EMAIL:
        if (action == EnumShareDocumentActions.ADD) {
          if(this.inputEmail != EnumShareDocumentOther.EMPTY && this.isEmail()) {
            this.addData(type, this.inputEmail)
            this.inputEmail = EnumShareDocumentOther.EMPTY;
          } else {
            this.setError('El correo electrónico no es válido')
          }
        } else if (action == EnumShareDocumentActions.ATTACH) {
          let data: IContextDialog = {
            type: type,
            icon: 'attach-2-outline',
            title: 'Carga masiva',
            listName: 'correos',
            descriptionButton: ' - Correos',
            data: []
          }
          this.openDialogMassive(data, type);
        }
        break;
      case EnumShareDocumentType.CONTACT:
        if (action == EnumShareDocumentActions.ADD && this.inputContact != EnumShareDocumentOther.EMPTY) {
          this.addData(type, this.inputContact)
          this.inputContact = EnumShareDocumentOther.EMPTY;
        } else {
          this.setError('El contacto no es válido')
        }
        break;
      default:
        break;
    }
  }

  addData(type: EnumShareDocumentType, data: string) {
    if (this.editSelected.index >= 0 && this.editSelected.type == type) {
      this.returnDataInputs[type].listaContactos[this.editSelected.index] = { index: this.editSelected.index, value: data };
    } else {
      let idx = this.returnDataInputs[type].listaContactos.filter(element => element.value == data).length;
      if (idx > 0) {
        this.toastService.showToast('warning', 'Error', 'Ya existe en la lista.');
        return
      }
      this.returnDataInputs[type].listaContactos.push({ index: this.returnDataInputs[type].listaContactos.length+1, value: data });
    }
    if (this.inputShareSelected == EnumShareDocumentOther.EMPTY || this.inputShareSelected != type) {
      this.viewList(type);
    } else {
      this.maxList(type);
    }
    this.editSelected.index = -1;
    this.editSelected.type = EnumShareDocumentOther.EMPTY;
    this.eventListData.emit(this.returnDataInputs);
  }

  maxList(type: EnumShareDocumentType) {
    let contacts = this.returnDataInputs[type].listaContactos;
    let max = contacts.slice(0, EnumShareDocumentOther.LIST_MAX);
    this.listaContactos = max;
  }

  viewList(type: EnumShareDocumentType) {
    if (this.inputShareSelected != EnumShareDocumentOther.EMPTY && this.inputShareSelected != type) {
      this.inputShareSelected = EnumShareDocumentOther.EMPTY
    }
    this.maxList(type);
    let inputShareSelected = this.inputShareSelected == EnumShareDocumentOther.EMPTY ? type : EnumShareDocumentOther.EMPTY;
    this.eventChangeList.emit(inputShareSelected);
  }

  viewAll(type: EnumShareDocumentType) {
    return this.returnDataInputs[type].listaContactos.length > EnumShareDocumentOther.LIST_MAX
  }

  viewAttachments(type: EnumShareDocumentType) {
    return this.returnDataInputs[type].attachments.length > 0
  }

  isEmail() {
    return this.inputEmail.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-.]+[.][a-zA-Z0-9.-]{2,}$/)
  }

  setError(msj: string) {
    this.inputShareSelected = EnumShareDocumentOther.EMPTY
    this.eventChangeList.emit(EnumShareDocumentOther.EMPTY);
    this.error = true
    this.errorMessage = msj
  }

  setIcon(type: EnumShareDocumentActions) {
    switch (type) {
      case EnumShareDocumentActions.ADD:
        return this.editSelected.index >= 0 ? 'checkmark-outline' : 'plus-outline';
      case EnumShareDocumentActions.ATTACH:
        return 'attach-2-outline';
      case EnumShareDocumentActions.LIST:
        return this.inputShareSelected == this.inputData.type ? 'arrow-ios-downward-outline' : 'arrow-ios-back-outline';
      default:
        return '';
    }
  }

  setTooltip(action: EnumShareDocumentActions) {
    switch (action) {
      case EnumShareDocumentActions.ADD:
        return this.editSelected.index >= 0 ? 'Guardar' : 'Agregar';
      case EnumShareDocumentActions.ATTACH:
        return 'Adjuntar';
      case EnumShareDocumentActions.LIST:
        return 'Ver lista';
      default:
        return EnumShareDocumentOther.EMPTY;
    }
  }

  onBlur(type: EnumShareDocumentType, event) {
    if(type == EnumShareDocumentType.PHONE) {
      this.phone.phoneInd = this.inputObject ? `+${this.inputObject.s.dialCode}` : null;
    }
    this.error = false
    this.errorMessage = EnumShareDocumentOther.EMPTY
  }

  telInputObject(event) {
    this.inputObject = event;
    this.phone.phoneInd = this.inputObject ? `+${this.inputObject.s.dialCode}` : EnumShareDocumentOther.EMPTY;
    this.phone.iso2 = this.inputObject ? `${this.inputObject.s.iso2}` : EnumShareDocumentOther.EMPTY;
  }

  onEdit(type: EnumShareDocumentType, index: number) {
    this.editSelected.index = index;
    this.editSelected.type = type;
    switch (type) {
      case EnumShareDocumentType.PHONE:
        this.phone.phoneNumber = this.listaContactos[index].value.split(' ')[1];
        break;
      case EnumShareDocumentType.EMAIL:
        this.inputEmail = this.listaContactos[index].value;
        break;
      case EnumShareDocumentType.CONTACT:
        this.inputContact = this.listaContactos[index].value;
        break;
      default:
        break;
    }
    this.eventChangeList.emit(EnumShareDocumentOther.EMPTY);
  }

  onDelete(type: EnumShareDocumentType, index: number) {
    if (index == -1) {
      this.returnDataInputs[type].attachments = [];
    } else {
      const contacts = this.returnDataInputs[type].listaContactos;
      contacts.splice(index, 1);
      this.returnDataInputs[type].listaContactos = contacts;
      this.returnDataInputs[type].listaContactos.forEach((element, index) => {
        element.index = index + 1;
      });
    }
    this.eventListData.emit(this.returnDataInputs);
    this.maxList(type);
  }

  viewListAll(type: EnumShareDocumentType) {
    let data: IContextDialog = {
      type: type,
      icon: '',
      title: 'Listado Plantilla #Celulares - Carga Masiva',
      listName: '',
      descriptionButton: '',
      data: this.returnDataInputs[type].listaContactos
    }
    this.openDialogMassive(data, type);
  }

  openDialogMassive(inputData: IContextDialog, type: EnumShareDocumentType){
    const dialogRef = this.dialogService.open(DialogMassiveComponent, { context: { inputData } });
    dialogRef.onClose.subscribe((response: IResponseDialog) => {
      console.log(response)
      if (response.status) {
        this.returnDataInputs[type].attachments = response.data;
        this.eventListData.emit(this.returnDataInputs);
      }
    });
  }

  viewListDialog(type: EnumShareDocumentType) {
    let data: IContextDialog = {
      type: type,
      icon: '',
      title: 'Listado Plantilla #Celulares - Carga Masiva',
      listName: '',
      descriptionButton: '',
      data: this.returnDataInputs[type].attachments
    }
    this.openDialogMassive(data, type);
  }

}
