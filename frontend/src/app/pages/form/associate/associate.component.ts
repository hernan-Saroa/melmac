import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormService } from '../../../services/form.service';
import { AssociateService } from '../../../services/associate.service';
import { AnswerService } from '../../../services/answer.service';
import { LocalDataSource } from 'ng2-smart-table';
import { NbDialogRef, NbDialogService } from '@nebular/theme';
import { ToastService } from '../../../usable/toast.service';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { NbTagComponent, NbTagInputAddEvent } from '@nebular/theme';
import { IShareDocument, IReturnData, ICkeckBox } from '../../../core/models/input-share-document.model';
import { EnumCheckBox, EnumOptionShared, EnumShareDocumentActions, EnumShareDocumentLabel, EnumShareDocumentType } from '../../../core/enums/input-share-document.enum';

@Component({
  selector: 'ngx-associate',
  templateUrl: './associate.component.html',
  styleUrls: ['./associate.component.scss']
})
export class AssociateComponent implements OnInit {
  id:string;
  name:string;
  description:string;

  btn_agregar: Boolean;
  view;
  token_link = '';
  card = true;
  cardH = true;

  max_date = '';
  date_state = false;
  max_send = null;
  send_state = false;
  modify_date = '';
  url_qr = '';

  access = '1';

  source_rol: LocalDataSource = new LocalDataSource();
  source_user: LocalDataSource = new LocalDataSource();
  source_load=0;

  loading = false;
  publicLink = false
  inputShareSelected = ''
  returnDataInputs: IReturnData = {} as IReturnData;
  inputShareDocumentDataList: IShareDocument[] = []

  data;
  settings = {
    mode: 'external',
    noDataMessage: 'No tiene historial en este documento.',
    pager: {
      display: true,
      perPage: 10,
    },
    actions:{
      columnTitle: "Acciones",
      add: false,
      edit: false,
      delete: false,
      custom: [
        {
          name: 'send',
          title: '<i title="Reenviar" class="nb-arrow-retweet"></i>',
        }
      ]
    },
    columns: {
      shared_media: {
        title: 'Medio de envió',
        type: 'string',
      },
      shared_to: {
        title: 'Destinatario(s)',
        type: 'string',
      },
      modify_date: {
        title: 'Fecha',
        type: 'string',
      },
      token_link: {
        title: 'Token del documento',
        type: 'string',
      },
      process_state__name: {
        title: 'Estado',
        type: 'string',
      }
    },
  };

  onCustom($event) {
    console.log($event)
    if($event.action == "send"){
      this.formService.share_forwarding($event.data.id).subscribe(
        response => {
          this.toastService.showToast('success', 'Listo', 'Enlace compartido con exito.');
        }
      );
    }
  }

  settings_rol = {
    mode: 'external',
    hideSubHeader: true,
    noDataMessage: 'Sin roles relacionados',
    actions:{
      columnTitle: "Acciones",
      add: false,
      edit: false,
      delete: this.onPermit(36),
    },
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },
    columns: {
      role__name: {
        title: 'Rol',
        type: 'string',
      },
    },
  };

  settings_user = {
    mode: 'external',
    hideSubHeader: true,
    noDataMessage: 'Sin usuarios relacionados',
    actions:{
      columnTitle: "Acciones",
      add: false,
      edit: false,
      delete: this.onPermit(36),
    },
    add: {
      addButtonContent: '<i class="nb-plus"></i>',
      createButtonContent: '<i class="nb-checkmark"></i>',
      cancelButtonContent: '<i class="nb-close"></i>',
    },
    delete: {
      deleteButtonContent: '<i class="nb-trash"></i>',
      confirmDelete: true,
    },
    columns: {
      user__first_name: {
        title: 'Nombre',
        type: 'string',
      },
      user__first_last_name: {
        title: 'Apellido',
        type: 'string',
      },
    },
  };

  onPermit(id:number): Boolean {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    if (user_data['permission'].includes(id)) {
      return true;
    }
    return false;
  }

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private formService: FormService,
    private associateService: AssociateService,
    private dialogService :NbDialogService,
    private toastService: ToastService,
    private _location: Location,
    private httpClient: HttpClient
  ) {
    this.id = this.activatedRoute.snapshot.paramMap.get('id');
    if (this.activatedRoute.snapshot.paramMap.get('option') == 'link') {
      this.card = false;
    }
    this.btn_agregar = this.onPermit(35);
    if (this.id != null) {
      this.getAllData();
      this.getRol();
      this.getUser();
    }

  }

  getAllData(){
    this.formService.get_detail(this.id).subscribe(
      response => {
        if (response['status']){
          this.name = response['data']['name'];
          this.description = response['data']['description'];
          this.token_link = response['data']['token_link'];
          this.access = response['data']['access'] + '';
          this.max_date = response['data']['max_date'];
          this.date_state = response['data']['date_state'];
          this.max_send = response['data']['max_send'];
          this.send_state = response['data']['send_state'];
          this.modify_date = response['data']['modify_date'];
          this.url_qr = response['data']['url_qr'];
          this.data = response['data']['form_link_val_share'];
          if (this.data.length>0){
            this.cardH=true
          }else{
            this.cardH=false
          }
        } else {
          this.router.navigate(['/pages/form/view', {}]);
        }
      }
    );
  }

  getRol(){
    this.associateService.view(this.id, '1').subscribe(
      response => {
        if (response['status']){
          this.source_load++;
          this.source_rol.load(response['data']);
        }
      }
    );
  }

  getUser(){
    this.associateService.view(this.id, '2').subscribe(
      response => {
        if (response['status']){
          this.source_load++;
          this.source_user.load(response['data']);
        }
      }
    );
  }

  ngOnInit(): void {
    this.initDefaultShareDocument();
  }

  onCreate(view):void {
    let open_dialog = true;
    if (view == 3) {
      if (this.send_state && (this.max_send == null || this.max_send <= 0)) {
        open_dialog = false;
        this.toastService.showToast('warning', 'Datos', 'El máximo de envíos no debe ser cero o estar vacío.');
      }
      if (this.date_state && (this.max_date == null || this.max_date == '')) {
        open_dialog = false;
        this.toastService.showToast('warning', 'Datos', 'La fecha de vencimiento no debe estar incompleta o vacía.');
      }
    }
    this.view = view;
    if (open_dialog) {
      const dialogRef = this.dialogService.open(AssociateDialogComponent, {context:{ parentComponent:this, view:this.view }});
    }
  }

  onDeleteRol(event): void {
    this.associateService.delete(event.data.role_id, this.id, '1').subscribe(
      response => {
        if (response['status']) {
          this.source_rol.remove(event.data);
          this.source_rol.refresh();
          this.toastService.showToast('success', 'Listo', 'Se ha eliminado correctamente.');
        } else {
          this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intentalo mas tarde.');
        }
      }
    );

  };

  onDeleteUser(event): void {
    this.associateService.delete(event.data.user_id, this.id, '2').subscribe(
      response => {
        if (response['status']) {
          this.source_user.remove(event.data);
          this.source_user.refresh();
          this.toastService.showToast('success', 'Listo', 'Se ha eliminado correctamente.');
        } else{
          this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intentalo mas tarde.');
        }
      }
    );
  };

  copy_message() {
    this.toastService.showToast('basic', 'Enlace copiado.', '');
  }

  onBack() {
    this._location.back();
  }

  download_qr(){
    const imgUrl = this.url_qr;
    const imgName = 'QR.png';
    this.httpClient.get(imgUrl, {responseType: 'blob' as 'json'})
      .subscribe((res: any) => {
        const file = new Blob([res], {type: res.type});

        // IE
        if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
          (window.navigator as any).msSaveOrOpenBlob(file);
          return;
        }

        const blob = window.URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = blob;
        link.download = imgName;

        // Version link.click() to work at firefox
        link.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        }));

        setTimeout(() => { // firefox
          window.URL.revokeObjectURL(blob);
          link.remove();
        }, 100);
      });
  }

  initDefaultShareDocument() {
    this.returnDataInputs = {
      phone: {
        listaContactos: [],
        checkBoxs: [],
        attachments: []
      },
      email: {
        listaContactos: [],
        checkBoxs: [],
        attachments: []
      },
      contact: {
        listaContactos: [],
        checkBoxs: [],
        attachments: []
      },
    }
    this.inputShareDocumentDataList = [
      {
        type: EnumShareDocumentType.PHONE,
        label: EnumShareDocumentLabel.PHONE,
        actions: [
          EnumShareDocumentActions.ADD,
          EnumShareDocumentActions.ATTACH,
          EnumShareDocumentActions.LIST
        ],
        checkBoxs: [
          {
            key: EnumCheckBox.WHATSAPP,
            value: true
          },{
            key: EnumCheckBox.SMS, 
            value: false
          }
        ]
      }, {
        type: EnumShareDocumentType.EMAIL,
        label: EnumShareDocumentLabel.EMAIL,
        actions: [
          EnumShareDocumentActions.ADD,
          EnumShareDocumentActions.ATTACH,
          EnumShareDocumentActions.LIST
        ],
        checkBoxs: [
          {
            key: EnumCheckBox.QR,
            value: false
          }
        ]
      }, {
        type: EnumShareDocumentType.CONTACT,
        label: EnumShareDocumentLabel.CONTACT,
        actions: [
          EnumShareDocumentActions.ADD,
          EnumShareDocumentActions.LIST
        ],
        checkBoxs: []
      }
    ]
  }

  onChangeList(type: string) {
    this.inputShareSelected = type;
  }

  onListData(data: IReturnData) {
    this.returnDataInputs = data;
  }

  onChangePublicLink(event: boolean) {
    if (!event) {
      this.date_state = false;
      this.send_state = false;
      this.max_date = '';
      this.max_send = null;
    }
  }

  validateShare() {
    return this.returnDataInputs[EnumShareDocumentType.PHONE].listaContactos.length > 0 ||
    this.returnDataInputs[EnumShareDocumentType.PHONE].attachments.length > 0 ||
    this.returnDataInputs[EnumShareDocumentType.EMAIL].listaContactos.length > 0 ||
    this.returnDataInputs[EnumShareDocumentType.EMAIL].attachments.length > 0 ||
    this.returnDataInputs[EnumShareDocumentType.CONTACT].listaContactos.length > 0 ||
    this.returnDataInputs[EnumShareDocumentType.CONTACT].attachments.length > 0;
  }

  async onShareNew() {
    if(!this.validatePublucLink()) {
      return;
    }
    this.loading = true;
    let form_data = {
      id: this.id,
      option: '',
      list: [],
      list_attempts: [],
      qr: false,
    }
    if (this.returnDataInputs[EnumShareDocumentType.EMAIL].listaContactos.length > 0 || 
      this.returnDataInputs[EnumShareDocumentType.EMAIL].attachments.length > 0) {
      let includeQR = this.returnDataInputs[EnumShareDocumentType.EMAIL].checkBoxs.filter(element => element.key == EnumCheckBox.QR)[0].value;
      form_data.qr = includeQR;
      form_data.option = EnumOptionShared.EMAIL;
      let newList = [];
      let newAttach = [];
      this.returnDataInputs[EnumShareDocumentType.EMAIL].listaContactos.forEach(email => {
        newList.push(email.value)
      });
      form_data.list = newList;
      this.returnDataInputs[EnumShareDocumentType.EMAIL].attachments.forEach(email => {
        newAttach.push(email.value)
      });
      form_data.list_attempts = newAttach;
      await this.shareLink(form_data);
    }
    form_data.qr = false;
    if (this.returnDataInputs[EnumShareDocumentType.PHONE].listaContactos.length > 0 || 
      this.returnDataInputs[EnumShareDocumentType.PHONE].attachments.length > 0) {
      let checkBoxs = this.returnDataInputs[EnumShareDocumentType.PHONE].checkBoxs
      let newList = [];
      let newAttach = [];
      this.returnDataInputs[EnumShareDocumentType.PHONE].listaContactos.forEach(contacto => {
        newList.push(contacto.value.replace(/\s+/g, "").trim())
      });
      this.returnDataInputs[EnumShareDocumentType.PHONE].attachments.forEach(contacto => {
        newAttach.push(contacto.value.replace(/\s+/g, "").trim())
      });
      checkBoxs.forEach(async(checkBox: ICkeckBox) => {
        if (checkBox.value) {
          if (checkBox.key == EnumCheckBox.SMS) {
            form_data.option = EnumOptionShared.SMS;
            form_data.list = newList;
            form_data.list_attempts = newAttach;
            await this.shareLink(form_data);
          } else if (checkBox.key == EnumCheckBox.WHATSAPP) {
            form_data.option = EnumOptionShared.WHATSAPP;
            form_data.list = newList;
            form_data.list_attempts = newAttach;
            await this.shareLink(form_data);
          }
        }
      });
    }
    if (this.returnDataInputs[EnumShareDocumentType.CONTACT].listaContactos.length > 0) {
      // TODO: Falta implementar el envio atraves de contactos
      console.log("TODO: Falta implementar el envio atraves de contactos")
    }
    if(this.publicLink) {
      await this.onLinkUpdateNew();
    }
    this.loading = false;
    this.toastService.showToast('success', 'Listo', 'Enlace compartido con exito.');
    this.initDefaultShareDocument();
    this.onChangePublicLink(false);
  }

  validatePublucLink() {
    if(this.publicLink) {
      if(!this.date_state && !this.send_state) {
        this.toastService.showToast('warning', 'Datos', 'Debes seleccionar al menos una opción para la fecha de vencimiento o el máximo de envíos.');
        return false;
      }
      if (this.date_state && (this.max_date == null || this.max_date == '')) {
        this.toastService.showToast('warning', 'Datos', 'La fecha de vencimiento no debe estar incompleta o vacía.');
        return false;
      }
      if (this.send_state && (this.max_send == null || this.max_send <= 0)) {
        this.toastService.showToast('warning', 'Datos', 'El máximo de envíos no debe ser cero o estar vacío.');
        return false;
      }
    }
    return true;
  }

  async shareLink(form_data): Promise<boolean> {
    console.log("shareLink",form_data)
    return new Promise(resolve => {
      this.formService.share_link(form_data).subscribe(
        response => {
          if (response['status']){
            // this.toastService.showToast('success', 'Listo', 'Enlace compartido con exito.');
            resolve(true);
          } else {
            this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intentalo mas tarde.');
            resolve(false);
          }
        }, error => {
          this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intentalo mas tarde.');
          resolve(false);
        }
      );
    });
  }

  async onLinkUpdateNew(): Promise<boolean> {
    let form_data = {
      id: this.id,
      access: this.access,
      date_state: this.date_state,
      max_date: this.max_date,
      send_state: this.send_state,
      max_send: this.max_send,
    }
    return new Promise(resolve => {
      this.formService.update_link(form_data).subscribe(
        response => {
          if (response['status']){
            this.modify_date = response['data']['modify_date'];
            this.toastService.showToast('success', 'Listo', 'Cambios guardados correctamente.');
            resolve(true);
          } else {
            this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intentalo mas tarde.');
            resolve(false);
          }
        }, error => {
          this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intentalo mas tarde.');
          console.error(error);
          resolve(false);
        }
      );
    });
  }

}

@Component({
  selector: 'confirm-dialog',
  templateUrl: 'dialog.html',
  //styles: ['nb-card-footer { text-align:end}', 'button {margin:5px}', 'nb-checkbox {margin:5px 0px}'],
  styleUrls: ['dialog.scss']
})
export class AssociateDialogComponent implements OnInit{
  @ViewChild('tagListContainer', { static: false }) tagListContainer: ElementRef;
  option;
  user_select;
  rol_select;

  filteredOptions$: Observable<any[]>;
  user_option;

  list_user = [];
  list_rol = [];

  qr_state = false;

  option_share = '';
  loading = false;
  showScroll = false;

  public parentComponent: AssociateComponent;
  public view:any;

  constructor(
    public dialogRef: NbDialogRef<AssociateDialogComponent>,
    private associateService: AssociateService,
    private answerService: AnswerService,
    private toastService: ToastService,
    private formService: FormService,
  ){
  }

  ngAfterViewInit() {
    this.checkHeight();
  }

  ngOnInit(): void {
    this.associateService.get_role().subscribe(
      response => {
        let data_list = response['data'];
        this.parentComponent.source_rol['data'].forEach(element => {
          let position = data_list.map(function(e) { return e.id; }).indexOf(element.role_id);
          data_list.splice(position, 1);
        });
        this.list_rol = data_list;

      }
    );
    this.associateService.get_user().subscribe(
      response => {
        let data_list = response['data'];
        this.parentComponent.source_user['data'].forEach(element => {
          let position = data_list.map(function(e) { return e.id; }).indexOf(element.user_id);
          data_list.splice(position, 1);
        });

        data_list.forEach(element => {
          this.list_user.push({
            'id': element.id,
            'name': element.first_name + ' ' + element.first_last_name,
            'first_name': element.first_name,
            'first_last_name': element.first_last_name,
          });
        });

        this.filteredOptions$ = of(this.list_user);
      }
    );
  }

  onChangeOption() {
    this.user_select = undefined;
    this.user_option = undefined;
    this.rol_select = undefined;
  }

  @ViewChild('autoInput') input;
  private filter(value){
    const filterValue = value.toLowerCase();
    let list_user_filer = this.list_user.filter(option => option.name.toLowerCase().includes(filterValue));
    return list_user_filer;
  }

  getFilteredOptions(value): Observable<any[]> {
    return of(value).pipe(
      map(filterString => this.filter(filterString)),
    );
  }

  onChange() {
    this.filteredOptions$ = this.getFilteredOptions(this.input.nativeElement.value);
  }

  onChangeAuto($event) {
    if ($event == '') {
      this.user_select = undefined;
    }
  }

  onSelectionChange($event) {
    this.user_option = $event.name;
    if ($event.id != undefined) {
      this.user_select = $event.id;
    }
  }

  close(){
    this.dialogRef.close();
  }

  onAccept(){
    if ((this.option == 1 && this.rol_select != undefined) || (this.option == 2 && this.user_select != undefined)){
      let id;
      if (this.option == 1) {
        id = this.rol_select;
      } else {
        id = this.user_select;
      }
      this.associateService.create(id, this.parentComponent.id, this.option).subscribe(
        response => {
          if (response['status']) {
            if (this.option == 1) {
              let position = this.list_rol.map(function(e) { return e.id; }).indexOf(this.rol_select);
              this.parentComponent.source_rol.add({
                'id': response['data']['id'],
                'role_id': this.rol_select,
                'role__name': this.list_rol[position]['name'],
              });
              this.parentComponent.source_rol.refresh();
              this.toastService.showToast('success', 'Listo', 'Rol asociado correctamente.');
            } else {
              let position = this.list_user.map(function(e) { return e.id; }).indexOf(this.user_select);
              this.parentComponent.source_user.add({
                'id': response['data']['id'],
                'user_id': this.user_select,
                'user__first_name': this.list_user[position]['first_name'],
                'user__first_last_name': this.list_user[position]['first_last_name'],
              });
              this.parentComponent.source_user.refresh();
              this.toastService.showToast('success', 'Listo', 'Usuario asociado correctamente.');
            }
            this.dialogRef.close();
          }
        }
      );
    } else {
      this.toastService.showToast('warning', 'Datos', 'Selecciona todos los campos.');
    }
  }

  onLinkUpdate() {
    let form_data = {
      id: this.parentComponent.id,
      access: this.parentComponent.access,
      date_state: this.parentComponent.date_state,
      max_date: this.parentComponent.max_date,
      send_state: this.parentComponent.send_state,
      max_send: this.parentComponent.max_send,
    }
    this.formService.update_link(form_data).subscribe(
      response => {
        if (response['status']){
          this.parentComponent.modify_date = response['data']['modify_date'];
          this.toastService.showToast('success', 'Listo', 'Cambios guardados correctamente.');
          this.dialogRef.close();
        } else {
          this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intentalo mas tarde.');
        }
      }
    );
  }

  onShare() {
    if (this.option_share != '') {
      let list = [];
      let list_validate = Array.from(this.trees);
      list_validate.forEach(element => {
        if (this.isValidate(element)) {
          list.push(element)
        }
      });
      if (list.length > 0) {
        let form_data = {
          id: this.parentComponent.id,
          option: this.option_share,
          list: list,
          qr: this.qr_state,
        }
        console.log("form_data")
        console.log(form_data)
        this.loading = true;
        this.formService.share_link(form_data).subscribe(
          response => {
            if (response['status']){
              this.toastService.showToast('success', 'Listo', 'Enlace compartido con exito.');
              this.dialogRef.close();
            } else {
              this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intentalo mas tarde.');
            }
            this.loading = false;
          }
        );
      } else {
        this.toastService.showToast('warning', 'Compartir', 'Especifica al menos un destinatario valido.');
      }
    } else {
      this.toastService.showToast('warning', 'Compartir', 'Selecciona el medio de envió.');
    }
  }

  optionMessages() {
    return this.option_share == '2' || this.option_share == '3' ? "El Número Telefónico"
    : this.option_share == '1' ? "El Correo Electrónico"
    : '';
  }

  trees: Set<string> = new Set([]);

  onTagRemove(tagToRemove: NbTagComponent): void {
    this.trees.delete(tagToRemove.text);
    this.checkHeight();
  }

  onTagAdd({ value, input }: NbTagInputAddEvent): void {    
    if (value) {
      this.addTree(value);
    }
    this.checkHeight();
    input.nativeElement.value = '';
  }

  onFocusAdd(input): void {
    if (input.value) {
      this.addTree(input.value);
    }
    input.value = '';
  }

  addTree(value) {
    if (value != '' && value.trim() != '') {
      value = value.replace(/,/g,' ');
      let list_split = value.trim().split(' ');
      if (list_split.length > 1) {
        list_split.forEach(element => {
          if (element != '') {
            this.trees.add(element.trim().toLowerCase());
          }
        });
      } else {
        this.trees.add(value.trim().toLowerCase());
      }
    }
  }

  onValidate(data) {
    if (!this.isValidate(data)) {
      return 'danger';
    }
    return '';
  }

  isValidate(data: string): boolean{
    switch (this.option_share) {
      // Email
      case '1':
        var REGEX = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-.]+[.][a-zA-Z0-9.-]{2,}$/;
        data = data.trim();
        break;
      // Numero
      case '2':
      case '3':
        var REGEX = /^3[0-9]{9}$/;
        break;
      default:
        return true;
    }

    return REGEX.test(data);
  }

  checkHeight() {
    if (Array.from(this.trees).length > 7) {
      this.tagListContainer.nativeElement.classList.add('scroll-form');
    } else {
      this.tagListContainer.nativeElement.classList.remove('scroll-form');
    }
  }
}
