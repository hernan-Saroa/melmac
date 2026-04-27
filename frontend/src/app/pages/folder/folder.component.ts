import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  HostListener,
  ElementRef,
  ViewChildren,
  QueryList
} from "@angular/core";
import {
  NbDialogRef,
  NbDialogService,
  NbPopoverDirective,
} from "@nebular/theme";
import { ToastService } from "../../usable/toast.service";
import { gcp } from "../../usable/envVariables";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { EnvelopeService } from "../../services/envelope.service";
import { HttpClient } from "@angular/common/http";
import { ConfirmDialogComponent } from "../common/confirm-dialog/confirm-dialog.component";
import { ActivatedRoute, Router } from "@angular/router";
import { UserDialogComponent } from "./user/user.component";
import { FieldDialogComponent } from "./field-dialog/field-dialog.component";
import { MatTableDataSource } from "@angular/material/table";
import { CustomDataSource } from "../../usable/custom.dataSource";

declare let gapi: any;
declare let google: any;
let that: UploadDialogComponent;
export interface User {
  name: string;
  email?: string;
  phone_ind?: string;
  phone?: string | any;
  type: number;
  extra?: any;
  color: string;
  approver: boolean;
  limit_time?: string;
  limit_opt?: string;
  limit_public?: number;
  subject?: string;
  msg?: string;
  id?: string;
  answer_env_user_id?: number;
  version_id?: string;
  reload?: boolean;
  errorColor: boolean;
}

@Component({
    selector: "ngx-folder",
    templateUrl: "./folder.component.html",
    styleUrls: ["./folder.component.scss"],
    standalone: false
})
export class FolderComponent implements OnInit, OnDestroy {
  id = null;
  version = null;

  tab_option = 0;
  tab_enable = 0;
  doc_list = [];
  doc_list_original = "";
  loading = false;
  loadingTraza = false;
  fieldsConfigCount = 0;

  // Variables Google Drive API
  pickerApiLoaded = false;
  gScope: string = gcp.scope.drive;
  private gKey: string = gcp.gKey;
  private gId: string = gcp.gClientId;
  private oauthToken?: any;
  // Llamado de ventana Dialog
  dialogUploadRef: NbDialogRef<UploadDialogComponent>;
  dialogUserRef: NbDialogRef<UserDialogComponent>;
  dialogFieldRef: NbDialogRef<FieldDialogComponent>;
  confirmDialog: NbDialogRef<ConfirmDialogComponent>;

  // Variables de mensaje
  messageOptions: {
    title: string;
    icon: string;
    msg: string;
    active?: boolean;
  }[];
  msgSelected: string;
  msgText: string;
  msgSubject: string;
  msgOpt: number;
  sms: boolean = false;
  whatsapp: boolean = false;
  name_envelope: string = "";

  // Variables de Participantes
  partOpt: number = -1;
  user_list: User[] = [];
  order: boolean = false;
  respect_participant: boolean = false;
  public_two_main_index;

  alert: boolean = false;
  alert_time = '30';
  checker: boolean = false;
  checker_user;
  expiration_date = new Date();
  expiration_hour = new Date();
  expiration_hour_text = 'hh:mm a';

  user_id: number;
  envelope_id;
  answer_id;
  isShare: boolean = false
  idShare: number = 0
  changeParticipate: boolean = false

  @ViewChildren(NbPopoverDirective) popover_list: QueryList<NbPopoverDirective>;
  sel_time = [null, null];
  hour_options:string[] = [];
  min_options:string[] = [];
  view_option = 0
  limit_fields_option = 30

  // Variables de Participantes
  checker_select;
  check_list = [
    {id: 1, name: 'ANI'},
    {id: 2, name: 'DataCrédito'},
    {id: 3, name: 'Listas Restrictivas'},
    {id: 4, name: 'Banco Mundial'},
  ];
  check_select = [];
  checked_list = [];

  // Variables Campos
  autosave = false;
  isNewEnvelope = false;
  actionTrace = false;
  dataTraceability = CustomDataSource;

  settings = {
    mode: 'external',
    noDataMessage: 'No se ha encontrado trazabilidad del sobre',
    pager: {
      display: true,
      perPage: 20,
    },
    actions: false,
    columns: {
      action: {
        title: 'Sección',
        sort: false,
        valuePrepareFunction: function(cell, row) {
          switch (cell) {
            case 1:
              return 'Crear Sobre'
            case 2:
              return 'Eliminar Sobre'
            case 3:
              return 'Cargar documento'
            case 4:
              return 'Definir Participantes'
            case 5:
              return 'Definir Verificador'
            case 6:
              return 'Configurar Notificaciones'
            case 7:
              return 'Asignar Campos'
            case 8:
              return 'Modo de diligenciamiento'
            case 9:
              return 'Compartir sobre'
            case 10:
              return 'Diligenciamiento'
            default:
              return '';
          }
        },
        filter: false
      },
      description: {
        title: 'Mensaje',
        sort: false,
        type: 'string',
        filter: false
      },
      creation_date: {
        title: 'Fecha',
        valuePrepareFunction: function(cell, row) {
          let date = new Date(cell);
          let text = date.toLocaleString("es-CO", {hour12: false});
          let text_parts = text.split(',')
          let date_text = text_parts[0].split('/')
          return (date_text[2].length == 1 ?  '0': '') + date_text[2] + '-' +
          (date_text[1].length == 1 ? '0': '') + date_text[1] + '-' +
          (date_text[0].length == 1 ?  '0': '') + date_text[0] +
          text_parts[1];
        },
        filter: false
      }
    }
  };

  constructor(
    private activatedRoute: ActivatedRoute,
    private dialogService: NbDialogService,
    public toastService: ToastService,
    public envelopeService: EnvelopeService,
    public router: Router
  ) {
    this.messageOptions = [
      {
        title: "Predeterminado",
        icon: "message",
        msg: "Así se vera tu mensaje Predeterminado",
      },
      {
        title: "Mensaje personalizado para todos los participantes",
        icon: "group-message",
        msg: "Redacta el mensaje que quieres enviar a Tus Participantes",
      },
      {
        title: "Mensaje personalizado para cada participante",
        icon: "user-message",
        msg: "Redacta el mensaje que quieres enviar a Tus Participantes",
      },
    ];

    this.hour_options = [...Array(24).keys()].map(val=> (''+val).length > 1 ? ''+val : '0' + val);
    this.min_options = [...Array(60).keys()].map(val=> (''+val).length > 1 ? ''+val : '0' + val);;
  }

  ngOnInit(): void {
    this.envelope_id = this.activatedRoute.snapshot.paramMap.get("id");
    let answer = this.activatedRoute.snapshot.paramMap.get("answer");
    this.answer_id = answer == 'share' ? null : answer;
    this.isShare = answer == 'share';
    if (this.envelope_id != null && this.envelope_id != 0) {
      this.getFormData();
    }else if(this.envelope_id == 0){
      this.isNewEnvelope = true;
      setTimeout(()=>{
        this.openUpload();
      }, 100)
      this.msgOpt = 1;
      this.setMsgOpt(this.msgOpt);
    }

    this.user_id = JSON.parse(localStorage.getItem("session")).id;
    if(this.isShare) this.tab_option = 1;
    // this.activatedRoute.queryParamMap.subscribe((params)=>{
    //   console.log(params)
    // })

  }

  ngOnDestroy(): void {
    that = undefined;
  }

  getFormData() {
    this.loading = true;

    let form_data = { id: this.envelope_id, answer: this.answer_id, edit: true };
    this.envelopeService.list_form(form_data).subscribe(
      (response) => {
        if (response["status"]) {
          // console.log(response);
          let data = response["data"];
          this.name_envelope = data["name"];
          let fields_drag = 0;
          this.doc_list = data["form"];
          this.doc_list.forEach((form) => {
            form["fields_drag"] = data["fields"]
              .filter((field) => {
                return form.id == field.form_id;
              })
              .map((field) => {
                if(!field["isConfig"]) {
                  field["user"] = data["user_list"].find(
                    (user) => user.version_id == field["user"]["id"]
                  );
                } else {
                  this.fieldsConfigCount++;
                }
                return field;
              });
            fields_drag += form["fields_drag"].length;
            form["extra"] = {
              max_pages: form["pages_count"],
              pages: form["pages"],
            };
            delete form["pages_count"];
            delete form["pages"];
          });
          if(data.hasOwnProperty('view_option') && !this.isNewEnvelope) {
            this.view_option = data['view_option']
          } else {
            this.view_option = fields_drag < this.limit_fields_option ? 1 : 2;
          }
          this.doc_list_original = JSON.stringify(
            Object.assign([], this.doc_list)
          );

          if (data["user_list"].length > 0) {
            this.partOpt = data["partOpt"];
          }

          this.order = data["order"];
          this.respect_participant = data["respect_participant"];
          this.alert = data["alert"];
          this.alert_time = data["alert_time"];
          this.checker = data["checker"];

          if (data["limit_date"] != "") {
            let limit_date = new Date(data["limit_date"]);
            this.expiration_date = limit_date;
            this.expiration_hour = limit_date;
            this.setFormatExpirationHour(limit_date);
          }

          this.answer_id = data["answer_id"];

          this.checked_list = data["checked_list"];
          this.user_list = data["user_list"].map((val)=>{
            let value = val['limit_time'];
            if (value){
              val['limit_time'] = value.split(',')[1] || '';
              val['limit_opt'] = value.split(',')[0] || '';
            } else {
              val['limit_time'] = '';
              val['limit_opt'] = '';
            }
            return val;
          });

          if (data["checker"]) {
            this.user_list.forEach((element, index) => {
              if (this.public_two_main_index == undefined && element.type == 5) {
                this.public_two_main_index = index;
              }
            });

            if (this.public_two_main_index == undefined) {
              if (data["checker_user"] == null) {
                if (![4,5].includes(this.user_list[0].type)) {
                  this.checker_user = this.user_list[0].version_id || null;
                } else {
                  this.checker_user = null;
                }
              } else {
                this.checker_user = data["checker_user"];
              }
            } else {
              if (data["checker_user"] != null) {
                this.checker_user = data["checker_user"];
              } else {
                this.checker_user = null;
              }
            }
          }

          this.msgOpt = data["msgOpt"];
          this.messageOptions.forEach((val, index) => {
            val.active = index + 1 == this.msgOpt;
            if (val.active) this.msgSelected = val.msg;
          });
          this.msgSubject = data["msgSubject"];
          this.msgText = data["msgText"];
          this.sms = data["sms"];
          this.whatsapp = data["whatsapp"];
          this.autosave = data["autosave"];

          // Validación del paso donde va el proceso de creación del sobre
          if (data["fields"].length > 0) {
            this.tab_enable = 5;
          } else if (data["user_list"].length > 0) {
            if (data["checker"] && data["checker_user"] == null) {
              this.tab_enable = 2;
            } else {
              this.tab_enable = 3;
            }
          } else if (data["form"].length > 0) {
            this.tab_enable = 1;
          }

          if(this.isShare) this.validateShare();

          this.loading = false;
        }
      },
      (error) => {
        // this.toastService.showToast('danger', 'Error!', 'Intentalo mas tarde.');
        this.loading = false;
      }
    );
  }

  getTraceability() {
    this.envelopeService.get_envelope_traceability(this.envelope_id).subscribe(
      (response) => {
        if(response['status']) {
          this.dataTraceability = response['data']
        }
        this.loadingTraza = false;
      },
      (error) => {
        this.loadingTraza = false;
        console.error(error)
      }
    );
  }

  optionTabChange(option) {
    if(this.isShare && !this.validateParticipateShare()) return
    if(option == this.tab_option) {
      this.tab_option = -1;
      return;
    }
    if (option <= this.tab_enable) {
      this.tab_option = option;
      if (option == 4) {
        this.openFieldsView();
      }
    } else {
      console.log('Falta guardar.');
    }
  }

  validateShare() {
    if(!this.respect_participant) {
      this.user_list.forEach((user) => {
        if(user.type != 1) {
          user.id = "";
          user.name = "";
          user.email = "";
          user.phone = "";
        }
      });
      if(this.checker) {
        this.checked_list = []
      }
    }
  }

  validateParticipateShare(isBtnSave = false) {
    let isValid = true
    this.user_list.forEach((user) => {
      if(user.name == "" || user.email == "" || user.phone == "") {
        isValid = false
      }
    });
    if(!isValid) {
      this.toastService.showToast('danger', 'Error', 'Debes definir todos los participantes');
    }
    if(this.changeParticipate && !isBtnSave) {
      isValid = false
      this.toastService.showToast('danger', 'Error', 'Guarda la información de los participantes');
    }
    return isValid
  }

  // UploadMethods
  deleteDoc(i) {
    this.doc_list.splice(i, 1);
  }

  editDoc(i, editDoc) {
    if (!this.doc_list[i].edit) {
      this.doc_list[i].edit = true;
    }
    setTimeout(() => {
      editDoc.focus();
    }, 200);
  }

  saveEditDoc(i) {
    setTimeout(() => {
      this.doc_list[i].edit = false;
    }, 200);
  }

  @ViewChild("tabdoc") doc_clic: ElementRef;
  docClic() {
    setTimeout(() => {
      this.doc_clic.nativeElement.click();
    }, 500);
  }

  openUpload() {
    this.dialogUploadRef = this.dialogService.open(UploadDialogComponent, {
      closeOnBackdropClick: false,
      context: {
        data: {
          parentComponent: this,
        },
      },
    });
  }

  changeUpload(index) {
    this.dialogUploadRef = this.dialogService.open(UploadDialogComponent, {
      closeOnBackdropClick: false,
      context: {
        data: {
          parentComponent: this,
          index,
        },
      },
    });
  }

  loadingUpload() {
    this.loading = true;
    let form_data = { tab: 0, forms: [], isNewEnvelope: this.isNewEnvelope };
    // Verificación de los archivos para la actualización.
    if (this.envelope_id != null && this.envelope_id != 0) {
      if (
        JSON.stringify(
          this.doc_list.map((element) => {
            element["fields_drag"].forEach((field) => {
              if(field["user"]) {
                delete field["user"]["extra"];
              }
            });
            return element;
          })
        ) != this.doc_list_original
      ) {
        this.doc_list.forEach((doc) => {
          let form = JSON.parse(JSON.stringify(Object.assign({}, doc)));
          form.fields_drag = null;
          if (doc.id) {
            let position = JSON.parse(this.doc_list_original)
              .map(function (e) {
                return e.id;
              })
              .indexOf(doc.id);
            if (position != -1) {
              if (
                JSON.stringify(doc.data) ==
                JSON.stringify(
                  JSON.parse(this.doc_list_original)[position]["data"]
                )
              ) {
                form.data = null;
              } else {
                doc.fields_drag = [];
              }
            }
          }
          form_data.forms.push(form);
        });
      } else {
        this.doc_list.forEach((doc) => {
          form_data.forms.push({
            id: doc.id,
            name: doc.name,
          });
        });
      }
    } else {
      // form_data = { tab: 0, forms:this.doc_list };
      form_data["forms"] = this.doc_list;
    }
    // console.log("form_data");
    // console.log(form_data);
    // console.log("this.doc_list");
    // console.log(this.doc_list);

    // let form_data = { tab: 0, forms:this.doc_list };
    if (this.envelope_id != null && this.envelope_id != 0) {
      form_data["id"] = this.envelope_id;
    }
    this.envelopeService.loading_form(form_data).subscribe(
      (response) => {
        if (response["status"]) {
          let jsonNewDoc = []
          this.envelope_id = response["id"];
          response["forms"].forEach((val, i) => {
            this.doc_list[i]["id"] = val["id"];
            this.doc_list[i]["extra"] = {
              pages: val["pages"],
              max_pages: val["pages_count"],
            };
            if (this.doc_list[i]["create"]) {
              this.doc_list[i]["data"]["src"] =
                "data:application/pdf;base64," + val["src"];
            }
            jsonNewDoc.push(this.doc_list[i])
          });
          if (jsonNewDoc.length > 0) {
            this.doc_list_original = JSON.stringify(
              Object.assign([], jsonNewDoc)
            );
          }
          // console.log(this.doc_list);
          setTimeout(() => {
            this.tab_option = 1;
            if (this.tab_enable < this.tab_option) {
              this.tab_enable = this.tab_option;
            }
            this.loading = false;
          }, 1000);
        }
      },
      (error) => {
        this.toastService.showToast("danger", "Error!", "Intentalo mas tarde.");
        this.loading = false;
      }
    );
  }

  // UserMethods

  openUser(index) {
    this.dialogUserRef = this.dialogService.open(UserDialogComponent, {
      closeOnBackdropClick: false,
      context: {
        data: {
          parentComponent: this,
          index,
        },
      },
    });
  }

  randomHexColor() {
    let random = (Math.random() * 0xfffff * 1000000).toString(16);
    return `#${random.slice(0, 6)}`;
  }

  addUser() {
    this.user_list.push({
      name: "",
      color: this.randomHexColor(),
      approver: false,
      limit_time: "",
      email: "",
      phone_ind: "+57-co",
      phone: "",
      type: 3,
      id: "",
      reload: false,
      errorColor: false
    });
  }

  changeApprover(index) {
    this.user_list[index].approver = !this.user_list[index].approver;
  }

  removeUser(index) {
    this.user_list.splice(index, 1);
    if (this.user_list.length <= 1) {
      this.checker = false;
    }
  }

  drop(event: CdkDragDrop<string[]>) {
    if (this.checker && this.publicTwoValidate()) {
      this.tab_enable = 1;
      this.checker_user = null;
      this.checked_list = [];
    }
    moveItemInArray(this.user_list, event.previousIndex, event.currentIndex);
  }

  getGId() {
    return this.gId;
  }
  getGKey() {
    return this.gKey;
  }
  getOauthToken() {
    return this.oauthToken;
  }

  setMsgOpt(i: number) {
    this.msgOpt = i;
    this.messageOptions.forEach((val, index) => {
      val.active = index + 1 == i;
      if (val.active) this.msgSelected = val.msg;
    });
    // if (i == 3) {
    //   this.user_list.forEach((user) => {
    //     user.subject = "";
    //     user.msg = "";
    //   });
    // }
    // this.msgSubject = "";
    // this.msgText = "";
  }

  telInputObject(item, i) {
    this.user_list[i].extra = {
      input: item,
    };
    let ind = this.user_list[i]["phone_ind"];
    if(ind && ind.includes("-")) {
      let arrayPhone = ind.split('-');
      let country = arrayPhone.length == 2 ? arrayPhone[1] : 'co'
      item.setCountry(country);
    }
    // if (ind !== "") {
    //   let country = item.p.filter((val) => {
    //     let isCountry = false;
    //     if (ind && ind.includes("-")) {
    //       for (
    //         let index = 0;
    //         index < val.areaCodes ? val.areaCodes.length : 0;
    //         index++
    //       ) {
    //         const area = val.areaCodes[index];
    //         if (val.dialCode + "-" + area == ind) {
    //           isCountry = true;
    //           break;
    //         }
    //       }
    //     } else {
    //       isCountry = val.dialCode == ind && val.areaCodes === null;
    //     }
    //     return isCountry;
    //   })[0];
    //   if (country) item.setCountry(country.iso2);
    // }
  }

  onCountryChange(val, i) {
    let countrySelected = this.user_list[i].extra.input.s;
    this.user_list[i].phone_ind = `+${countrySelected.dialCode}-${countrySelected.iso2}`;
    // this.user_list[i].phone_ind =
    //   countrySelected.dialCode +
    //   (countrySelected.areaCodes ? "-" + countrySelected.areaCodes[0] : "");
  }

  changePartMode($event) {
    this.checker = false;
    this.partOpt = $event;
    switch (this.partOpt) {
      case 0:
      case 1:
        const user = JSON.parse(localStorage.getItem("session"));
        this.user_list = [
          {
            color: "#000000",
            approver: false,
            limit_time: '',
            name: user.first_name + " " + user.first_last_name,
            type: 1,
            id: user.id,
            email: user.email,
            phone_ind: "+57-co",
            phone: user.phone,
            errorColor: false
          },
        ];
        break;
      case 2:
        this.user_list = [];
        break;
    }
  }

  publicTwoValidate() {
    let public_two = false;
    this.user_list.forEach(element => {
      if (element.type == 5) {
        public_two = true;
      }
    });
    return public_two;
  }

  changeOrder() {
    if (!this.publicTwoValidate()){
      this.order = !this.order;
    } else {
      this.toastService.showToast("info", "Respetar orden!", "Esta opción es obligatoria con participante público 'Dos'");
    }
  }

  changeRespectParticipant() {
    this.respect_participant = !this.respect_participant;
  }

  changeAlert() {
    this.alert = !this.alert;
  }

  changeChecker() {
    this.checker = !this.checker;
  }

  changeColor(i) {
    this.user_list[i]["errorColor"] = false;
  }

  selectedColor(i){
    let selColorInput = document.getElementById(`sel-color-input-${i}`);
    if(selColorInput) selColorInput.click();
  }

  validateColors() {
    let colorSelected = []
    let isValid = true;
    this.user_list.forEach((user: User) => {
      if(colorSelected.includes(user.color)) {
        isValid = false;
        user.errorColor = true;
      } else {
        user.errorColor = false;
        colorSelected.push(user.color)
      }
    })
    return isValid;
  }

  onSelectTime(hour) {
    this.expiration_hour = hour.time
    this.setFormatExpirationHour(hour.time);
  }

  setFormatExpirationHour(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? (hours < 10 ? `0${hours}` : hours) : 12;
    minutes = minutes < 10 ? `0${minutes}` : minutes;
    this.expiration_hour_text = `${hours}:${minutes} ${ampm}`;
  }

  setParticipants() {
    if(this.isShare && !this.validateParticipateShare(true)) return
    this.loading = true;
    if(!this.validateColors()) {
      this.loading = false;
      this.toastService.showToast("danger", "Error!", "Los colores de los participantes no se pueden repetir");
      return;
    }
    let users = this.user_list.map((val) => {
      let item = Object.assign({}, val);
      delete item["extra"];
      delete item["reload"];
      delete item["errorColor"];
      if (item.limit_opt)
        item.limit_time = item.limit_opt + ',' + item.limit_time;
      else
        item.limit_time = null;
      return item;
    });

    let text_date = this.expiration_date ? this.expiration_date.toDateString() || '' : '';
    let text_time = this.expiration_hour ? this.expiration_hour.toTimeString() || '' : '';

    let limit_date;
    if (text_date == "" && text_time == "") {
      limit_date = null;
    } else if (text_date == "") {
      limit_date = this.expiration_hour;
    } else if (text_time == "") {
      limit_date = this.expiration_date;
    } else {
      limit_date = new Date(text_date + ' ' + text_time);
    }

    let form_data = {
      id: this.envelope_id,
      tab: 1,
      isNewEnvelope: this.isNewEnvelope,
      users: users,
      partOpt: this.partOpt,
      order: this.order,
      respect_participant: this.respect_participant,
      alert: this.alert,
      alert_time: this.alert_time,
      checker: this.checker,
      limit_date: limit_date,
    };

    if(this.isShare) {
      form_data['id_share'] = this.idShare
      this.changeParticipate = false
    }
    this.envelopeService.loading_form(form_data).subscribe(
      (response) => {
        if (response["status"]) {
          let checked_list = [];
          response["data"].forEach((id, index) => {
            this.user_list[index]["version_id"] = id;
            let position = this.checked_list.map(function(e) { return e.id; }).indexOf(id);
            if (position == -1) {
              checked_list.push({
                id: this.user_list[index]["version_id"],
                name: this.user_list[index]["name"],
                type: this.user_list[index]["type"],
                checker: [],
              });
            } else {
              checked_list.push({
                id: this.user_list[index]["version_id"],
                name: this.user_list[index]["name"],
                type: this.user_list[index]["type"],
                checker: this.checked_list[position]['checker'],
              });
            }
          });

          this.public_two_main_index = undefined;
          this.user_list.forEach((element, index) => {
            if (this.public_two_main_index == undefined && element.type == 5) {
              this.public_two_main_index = index;
            }
          });

          this.checked_list = checked_list;
          if (this.checker) {
            if (this.public_two_main_index == undefined) {
              if (this.checker_user == undefined) {
                if (![4,5].includes(this.user_list[0].type)) {
                  this.checker_user = this.user_list[0].version_id || null;
                } else {
                  this.checker_user = null;
                }
              }
            } else {
              this.checker_user = null;
            }
          }
          this.answer_id = response["answer_id"];

          setTimeout(() => {
            if (this.checker) {
              this.tab_option = 2;
            } else {
              this.tab_option = 3;
            }
            if (this.tab_enable < this.tab_option || (this.tab_enable == 3 && this.tab_option == 2)) {
              this.tab_enable = this.tab_option;
            }
            this.loading = false;
          }, 1000);
        }
      },
      (error) => {
        // console.log(error);
        this.toastService.showToast("danger", "Error!", "Intentalo mas tarde.");
        this.loading = false;
      }
    );
  }

  // Checker Methods
  checkerChange(user) {
    this.checker_select = user;
    this.check_select = user.checker;
  }

  onChangeChecker(event){
    this.checker_select = undefined;
    this.check_select = [];

    let position = this.checked_list.map(function(e) { return e.id; }).indexOf(event);
    if (position != -1) {
      this.checked_list[position].checker = [];
    }
  }

  checkChange(check) {
    if (this.checker_select) {
      if (this.check_select.includes(check.id)) {
        let position = this.check_select.map(function(e) { return e; }).indexOf(check.id);
        this.check_select.splice(position, 1);
      } else {
        this.check_select.push(check.id);
      }
    } else {
      this.toastService.showToast("info", "Verificador", "Selecciona un participante");
    }
  }

  getLabelCheck(id) {
    let position = this.check_list.map(function(e) { return e.id; }).indexOf(id);
    return this.check_list[position].name;
  }

  validateChecker() {
    let validate = false;
    if (this.checker_user != null) {
      this.checked_list.forEach(user => {
        if (user.checker.length > 0) {
          validate = true;
        }
      });
    }
    return validate;
  }

  setCheckers () {
    this.loading = true;
    let form_data = {
      id: this.envelope_id,
      answer: this.answer_id,
      tab: 2,
      isNewEnvelope: this.isNewEnvelope,
      users: this.checked_list,
      checker_user: this.checker_user,
    };

    this.envelopeService.loading_form(form_data).subscribe(
      (response) => {
        if (response["status"]) {
          setTimeout(() => {
            this.tab_option = 3;
            if (this.tab_enable < this.tab_option) {
              this.tab_enable = this.tab_option;
            }
            this.optionTabChange(3);
            this.loading = false;
          }, 1000);
        }
      },
      (error) => {
        // console.log(error);
        this.toastService.showToast("danger", "Error!", "Intentalo mas tarde.");
        this.loading = false;
      }
    );
  }

  // Menssge Methods
  setMessageConfig() {
    this.loading = true;
    let users = this.user_list.map((val) => {
      let item = Object.assign({}, val);
      delete item["extra"];
      return item;
    });
    let form_data = {
      id: this.envelope_id,
      answer: this.answer_id,
      tab: 3,
      isNewEnvelope: this.isNewEnvelope,
      users: users,
      msgOpt: this.msgOpt,
      msgText: this.msgText,
      msgSubject: this.msgSubject,
      sms: this.sms,
      whatsapp: this.whatsapp,
    };
    this.envelopeService.loading_form(form_data).subscribe(
      (response) => {
        if (response["status"]) {
          setTimeout(() => {
            this.tab_option = 4;
            if (this.tab_enable < this.tab_option) {
              this.tab_enable = this.tab_option;
            }
            //this.optionTabChange(4);
            this.openFieldsView();
            this.loading = false;
          }, 1000);
        }
      },
      (error) => {
        // console.log(error);
        this.toastService.showToast("danger", "Error!", "Intentalo mas tarde.");
        this.loading = false;
      }
    );
  }

  envelopeShare() {
    if(!this.validateParticipateShare()) return
    this.loading = true;
    let form_data = {
      id: this.envelope_id,
      answer: this.answer_id,
      tab: 6,
      isNewEnvelope: this.isNewEnvelope,
    };
    this.envelopeService.loading_form(form_data).subscribe(
      (response) => {
        if (response["status"]) {
          this.toastService.showToast('success', 'Sobre', 'Sobre compartido con exito, En breve serás redireccionado a Mi Unidad');
          setTimeout(()=> {
            this.router.navigate(['/pages/envelope/', {}]);
          }, 3000 );
        }
      },
      (error) => {
        // console.log(error);
        this.toastService.showToast("danger", "Error!", "Intentalo mas tarde.");
        this.loading = false;
      }
    );
  }

  openFieldsView() {
    this.dialogFieldRef = this.dialogService.open(FieldDialogComponent, {
      closeOnBackdropClick: false,
      closeOnEsc: false,
      context: {
        data: {
          parentComponent: this,
        },
      },
    });
  }

  openPopup(i){
    this.popover_list.forEach((item,index)=>{
      if (index != i){
        item.hide();
      }
    });
    let user_time = this.user_list[i].limit_time;
    this.sel_time = user_time && user_time.includes(':') ? user_time.split(':') : [null, null];

    this.popover_list.get(i).show();
  }

  closePopup(apply, data){
    if (apply){
      this.user_list[data.index].limit_opt = data.opt;

      if (data.opt == '1'){
        if (this.sel_time[0] == null && this.sel_time[1] == null){
          this.toastService.showToast("warning", 'Faltan Datos', 'Por favor ingresa una hora valida')
          return;
        }
        let hour_val = this.sel_time[0] ? this.sel_time[0] : '00';
        let time_val = this.sel_time[1] ? this.sel_time[1] : '00';

        let time_limit = hour_val != '00' || time_val != '00' ? hour_val + ':' + time_val : null;
        this.user_list[data.index].limit_time = time_limit;
      }
      if (data.opt == '2'){
        this.user_list[data.index].limit_time = null;
      }
    }
    this.popover_list.get(data.index).hide();
  }

  disable($event:Event){
    $event.preventDefault();
  }

  toggleMsgType(i, value){
    console.log(i, value);
    if (i == 0)
      this.whatsapp = value;
    else
      this.sms = value;
  }

  diligenceType(type) {
    this.view_option = type
  }

  saveDiligenceMode() {
    let form_data = {
      tab: 5,
      isNewEnvelope: this.isNewEnvelope,
      id: this.envelope_id,
      answer: this.answer_id,
      view_option: this.view_option
    }
    this.envelopeService.loading_form(form_data).subscribe(response => {
      if (response["status"]) {
        this.toastService.showToast('success', 'Sobre', 'Sobre registrado con exito, En breve serás redireccionado a Mi Unidad');
        setTimeout(()=> {
          this.router.navigate(['/pages/envelope/', {}]);
        }, 3000);
      }
    },
    (error) => {
      console.error('saveDiligenceMode', error)
      this.toastService.showToast("danger", "Error!", "Intentalo mas tarde.");
      this.loading = false;
    })
  }

  traceAction(action) {
    this.actionTrace = action
    if (action) {
      this.loadingTraza = true;
      this.getTraceability();
    }
  }
}

@Component({
    selector: "ngx-upload-dialog",
    templateUrl: "dialog-upload.html",
    styles: [
        "nb-card-footer { text-align:end}",
        "button {margin:5px}",
        "nb-checkbox {margin:5px 0px}",
        "nb-select {width:100%;}",
    ],
    standalone: false
})
export class UploadDialogComponent implements OnInit {
  loading;
  drag_class = "";

  template_list = [
    { name: "Prueba 1", file: "/assets/templates/test.pdf" },
    { name: "Prueba 2", file: "/assets/templates/base_a4.pdf" },
  ];

  page_num = 1;
  page_format = "a4";

  format_select = {
    x: "210mm",
    y: "297mm",
    orientation: "v",
  };

  formats = [
    { label: "A3", value: "a3", x: "297mm", y: "420mm", orientation: "v" },
    { label: "A4", value: "a4", x: "210mm", y: "297mm", orientation: "v" },
    { label: "A5", value: "a5", x: "148mm", y: "210mm", orientation: "v" },
    { label: "B4", value: "b4", x: "257mm", y: "364mm", orientation: "v" },
    { label: "B5", value: "b5", x: "182mm", y: "257mm", orientation: "v" },
    {
      label: "Landspace",
      value: "landscape",
      x: "297mm",
      y: "210mm",
      orientation: "h",
    },
    {
      label: "Ledger",
      value: "ledger",
      x: "431.8mm",
      y: "279.4mm",
      orientation: "h",
    },
    {
      label: "Legal",
      value: "legal",
      x: "215.9mm",
      y: "355.6",
      orientation: "v",
    },
    {
      label: "Letter",
      value: "letter",
      x: "215.9mm",
      y: "279.4mm",
      orientation: "v",
    },
  ];

  @ViewChild(NbPopoverDirective) popover: NbPopoverDirective;

  public data: {
    parentComponent: FolderComponent;
    index?: any;
  };

  constructor(private toastService: ToastService, private http: HttpClient) {
    that = this;
  }

  ngOnInit(): void {}

  @HostListener("dragover", ["$event"]) onDragOver(event: any) {
    this.drag_class = "drop-area";
    event.preventDefault();
  }
  @HostListener("dragenter", ["$event"]) onDragEnter(event: any) {
    this.drag_class = "drop-area";
    event.preventDefault();
  }
  @HostListener("dragend", ["$event"]) onDragEnd(event: any) {
    this.drag_class = "";
    event.preventDefault();
  }
  @HostListener("dragleave", ["$event"]) onDragLeave(event: any) {
    this.drag_class = "";
    event.preventDefault();
  }

  @HostListener("drop", ["$event"]) onDrop(event: any) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files) {
      let files: FileList = event.dataTransfer.files;
      this.saveFiles(files);
    }
  }

  uploadFile(event: any) {
    this.saveFiles(event.target.files);
  }

  selectTemplate(i) {
    this.requestPdf(this.template_list[i].file).subscribe((response: Blob) => {
      let reader = new FileReader();
      reader.readAsDataURL(response);
      reader.onload = (e: any) => {
        if (this.data.index != undefined) {
          this.data.parentComponent.doc_list[this.data.index]["create"] = false;
          this.data.parentComponent.doc_list[this.data.index]["data"] =
            e.target.result;
        } else {
          this.data.parentComponent.doc_list.push({
            create: false,
            data: e.target.result,
            name: "Documento",
            edit: false,
            fields_drag: [],
          });
        }
      };
      this.loading = true;
      setTimeout(() => {
        this.data.parentComponent.dialogUploadRef.close(true);
      }, 600);
    });
  }

  requestPdf(file) {
    const httpOptions = { responseType: "blob" as "json" };
    return this.http.get(file, httpOptions);
  }

  saveFiles(files: FileList) {
    if (files.length == 1 && files[0].type == "application/pdf") {
      if (typeof FileReader !== "undefined") {
        let reader = new FileReader();
        reader.onload = (e: any) => {
          let content = Buffer.from(e.target.result, "binary").toString(
            "base64"
          );
          if (this.data.index != undefined) {
            this.data.parentComponent.doc_list[this.data.index]["create"] =
              false;
            this.data.parentComponent.doc_list[this.data.index]["data"] =
              "data:application/pdf;base64," + content;
          } else {
            this.data.parentComponent.doc_list.push({
              create: false,
              data: "data:application/pdf;base64," + content,
              name: "Documento",
              edit: false,
              fields_drag: [],
            });
          }
        };
        reader.readAsArrayBuffer(files[0]);
        this.loading = true;
        setTimeout(() => {
          this.data.parentComponent.dialogUploadRef.close(true);
        }, 600);
      }
    }
  }

  formatChange(value) {
    let position = this.formats
      .map(function (e) {
        return e.value;
      })
      .indexOf(value);
    this.format_select = {
      x: this.formats[position].x,
      y: this.formats[position].y,
      orientation: this.formats[position].orientation,
    };
  }

  createDocWhite() {
    this.loading = true;
    let data = {
      format: this.page_format,
      pages: this.page_num,
    };

    setTimeout(() => {
      if (this.data.index != undefined) {
        this.data.parentComponent.doc_list[this.data.index]["create"] = true;
        this.data.parentComponent.doc_list[this.data.index]["data"] = data;
      } else {
        this.data.parentComponent.doc_list.push({
          create: true,
          data: data,
          name: "Documento",
          edit: false,
          fields_drag: [],
        });
      }
      this.data.parentComponent.dialogUploadRef.close(true);
    }, 500);
  }

  onAccept(event) {
    this.loading = true;
    this.data.parentComponent.dialogUploadRef.close(true);
  }

  close() {
    this.data.parentComponent.docClic();
    this.data.parentComponent.dialogUploadRef.close();
  }

  // Carga de librerias de Google y asignación de comportamientos post carga
  uploadFromDrive() {
    this.loading = true;
    gapi.load("auth", { callback: this.onAuthApiLoad.bind(this) });
    gapi.load("picker", { callback: this.onPickerApiLoad.bind(this) });
    gapi.load("client", {
      callback: () => {
        gapi.client.load(
          "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
        );
      },
    });
  }

  onAuthApiLoad() {
    // Ventana de seleccion de cuenta y Autorizacion
    gapi.auth.authorize(
      {
        client_id: this.data.parentComponent.getGId(),
        scope: this.data.parentComponent.gScope,
        immediate: false,
      },
      this.handleAuthResult
    );
  }

  onPickerApiLoad() {
    // Ventana emergente de Google Drive para seleccionar el archivo PDF
    this.data.parentComponent.pickerApiLoaded = true;
    this.createPicker();
  }

  createPicker() {
    // Constructor de ventana de seleccion de archivo
    if (
      this.data.parentComponent.pickerApiLoaded &&
      this.data.parentComponent.getOauthToken()
    ) {
      let picker = new google.picker.PickerBuilder()
        .addView(google.picker.ViewId.DOCS)
        .setOAuthToken(this.data.parentComponent.getOauthToken())
        .setDeveloperKey(this.data.parentComponent.getGKey())
        .setCallback(this.pickerCallback.bind(this))
        .build();
      picker.setVisible(true);
    }
  }

  pickerCallback(data: any) {
    // Captura de Eventos de Seleccionador de Archivo
    let url = "nothing";
    if (data[google.picker.Response.ACTION] == google.picker.Action.PICKED) {
      let doc = data[google.picker.Response.DOCUMENTS][0];
      url = doc[google.picker.Document.URL];
    }
    let message = "You picked: " + url;
    alert(message);
  }

  async handleAuthResult(authResult: any) {
    // Captura de Resultado en Ventana de Autorizacion
    let content: string;
    let src;
    let loda_file = false;
    if (authResult && !authResult.error) {
      if (authResult.access_token) {
        // Asignación de Tipos de Archivo a ser visibles en el seleccionador
        let view = new google.picker.View(google.picker.ViewId.DOCS);
        view.setMimeTypes("application/pdf");
        // Crear el elemento de Seleccion
        let pickerBuilder = new google.picker.PickerBuilder();
        // Asignacion de parametros y eventos
        let picker = pickerBuilder
          .enableFeature(google.picker.Feature.NAV_HIDDEN)
          .setOAuthToken(authResult.access_token)
          .addView(view)
          .addView(new google.picker.DocsUploadView())
          .setCallback(async (e: any) => {
            // console.log(e, this);
            if (
              e[google.picker.Response.ACTION] == google.picker.Action.PICKED
            ) {
              // Captura de evento seleccionado
              let doc = e[google.picker.Response.DOCUMENTS][0];
              src = doc[google.picker.Document.URL];
              let name: string = doc[google.picker.Document.NAME];
              // let name_parts:string[] = name.split('.');
              // name_parts = name_parts.slice(0, name_parts.length-1);
              // name = name_parts.join('.');

              // Envio de peticion de descarga de archivo
              let res = await gapi.client.drive.files.get({
                fileId: doc[google.picker.Document.ID],
                fields: "*",
                alt: "media",
              });

              if (res && res.body) {
                content = await Buffer.from(res.body, "binary").toString(
                  "base64"
                );
                // Agregar este condicional a drive
                if (that.data.index != undefined) {
                  that.data.parentComponent.doc_list[that.data.index][
                    "create"
                  ] = false;
                  that.data.parentComponent.doc_list[that.data.index]["data"] =
                    "data:application/pdf;base64," + content;
                  that.data.parentComponent.doc_list[that.data.index]["name"] =
                    "GDRIVE-" + name;
                } else {
                  await that.data.parentComponent.doc_list.push({
                    create: false,
                    data: "data:application/pdf;base64," + content,
                    name: "GDRIVE-" + name,
                    edit: false,
                    fields_drag: [],
                  });
                }
                await Object.assign(
                  that.data.parentComponent.doc_list,
                  that.data.parentComponent.doc_list
                );
                setTimeout(() => {
                  that.close();
                }, 1000);
              }
              loda_file = true;
              that.loading = false;
            }
          })
          .build();
        picker.setVisible(true);
      }
    }
    if (!loda_file) {
      that.loading = false;
    }
  }
}
