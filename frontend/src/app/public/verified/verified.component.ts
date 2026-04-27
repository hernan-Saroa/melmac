import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EnvelopeService } from '../../services/envelope.service';
import { NbDialogService } from '@nebular/theme';
import { SharedService } from '../shared.service';
import { ToastService } from '../../usable/toast.service';
import { ModalComponent } from "../modal/modal.component";

@Component({
    selector: 'ngx-verified',
    templateUrl: './verified.component.html',
    styleUrls: ['./verified.component.scss'],
    standalone: false
})
export class VerifiedComponent implements OnInit {

  token_answer = '';
  token_link = '';
  option;

  validation = false;
  token_response = {
    title: '',
    text: '',
  };

  loading = false;
  loading_data_user = false;
  checker_td = 0;
  finish = 0;
  ent_id;

  type_identification = [];
  // Data
  name;
  email;
  phone;
  type;
  doc;

  drag_front_class = "";
  drag_back_class = "";
  check_front = false;
  check_back = false;
  src_front = "/assets/images/icons/answer/DOC_FRONTAL.png";
  src_back = "/assets/images/icons/answer/DOC_TRASERA.png";

  // Checker
  check_list = [
    {id: 0, name: 'Seleccionar Participante'},
    {id: 1, name: 'ANI'},
    {id: 2, name: 'DataCrédito'},
    {id: 3, name: 'Listas Restrictivas'},
    {id: 4, name: 'Banco Mundial'},
  ];

  buttons_active = true;

  user_select;
  user_active;
  // user_list = [{
  //   name: 'Juan Hernandez',
  //   checker: [1,2],
  //   status: 0,
  //   verified: true,
  //   src_front: '',
  //   src_back: ''
  // },{
  //   name: 'Jose Cortecero',
  //   checker: [1,2],
  //   status: 0,
  //   verified: false,
  //   src_front: '',
  //   src_back: ''
  // }];
  user_list = [];

  file_pdf_list = [0];

  constructor(
    private activatedRoute: ActivatedRoute,
    public envelopeService: EnvelopeService,
    private dialogService: NbDialogService,
    private _sharedService: SharedService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.token_answer = this.activatedRoute.snapshot.paramMap.get('answer');
    this.token_link = this.activatedRoute.snapshot.paramMap.get('token');

    this.activatedRoute.data.subscribe(data => {
      this.option = data['option'];
      // Option
      // 3 - Verificados
      // 4 - Verificador
    });

    this.loading = true;
    this.getDataToken();
  }

  getDataToken() {
    this.loading = true;
    this.envelopeService.get_identification().subscribe(
      response => {
        if (response['status']) {
          this.type_identification = response['data'];
        }
      }
    );

    this.envelopeService.get_envelope_token(this.option, this.token_answer, this.token_link).subscribe(
      response => {
        if (response['status']){
          // Datos de la empresa.
          this.ent_id = response['enterprise']['id'];
          this._sharedService.emitChange(response['enterprise']);
          if (response['validation']) {
            this.validation = true;
            if (this.option == 3) {
              const dialogRef = this.dialogService.open(ModalComponent, {context:{data: {type:4}}, closeOnBackdropClick:false, closeOnEsc:false });
              dialogRef.onClose.subscribe(result => {
                this.saveVerifiedStep(result, 1);
              });
            } else if (this.option == 4) {
              this.loading = false;
              this.modalTokenChecker();
            }
          } else {
            this.token_response = response['message']
            this.loading = false;
          }
        } else {
          this.loading = false;
        }
      }, error => {
        console.log(error);
      }
    );
  }

  // Checker
  modalTokenChecker(){
    const dialogRef = this.dialogService.open(ModalComponent, {context:{data: {type:6}}, closeOnBackdropClick:false, closeOnEsc:false });
    dialogRef.onClose.subscribe(result => {
      this.validateTokenChecker(result);
    });
  }

  validateTokenChecker(token) {
    const formData = new FormData();
    formData.append('step', '1');
    formData.append('token', token);
    formData.append('answer_token', this.token_answer);
    formData.append('envelope_token', this.token_link);

    this.envelopeService.validate_checker(formData).subscribe(
      response => {
        if (response['status']){
          if (response['data']['validate']) {
            // Siguiente proceso
            this.getListVerified();

            const dialogRef = this.dialogService.open(ModalComponent, {context:{data: {type:7}}, closeOnBackdropClick:false, closeOnEsc:false });
            dialogRef.onClose.subscribe(result => {
              // Validar si ya se verificaron todos los participantes.
              this.validateFinish();
            });

          } else {
            // Se reanuda la validación
            this.toastService.showToast('warning', '¡Código Incorrecto!', 'Verifica tu correo e inténtalo de nuevo.');
            this.modalTokenChecker();
          }
        } else {
          this.toastService.showToast('danger', 'Error!', 'Intentalo mas tarde.');
        }
        setTimeout(() => {
          this.loading = false;
        }, 500);
      }
    );
  }

  getListVerified() {
    const formData = new FormData();
    formData.append('step', '2');
    formData.append('answer_token', this.token_answer);
    formData.append('envelope_token', this.token_link);

    this.envelopeService.validate_checker(formData).subscribe(
      response => {
        if (response['status']){
          this.user_list = response['data'];
        }
      }
    );
  }

  selectUser(user) {
    this.loading_data_user = true;
    this.user_select = user;
    this.user_active = user;

    setTimeout(() => {
      this.src_front = user.src_front;
      this.src_back = user.src_back;
      this.file_pdf_list = user.checker;

      this.loading_data_user = false;
    }, 1000);
  }

  getClassUser(user) {
    if (user == this.user_active) {
      return 'checked-select';
    } else {
      if (user.verified != null) {
        if (user.verified) {
          return 'checked-success';
        } else {
          return 'checked-warning';
        }
      }
    }
    return '';
  }

  // Verified
  saveVerifiedStep(result, step) {
    const formData = new FormData();
    if (result != true) {
      formData.append('checker_td', '0');
    } else {
      formData.append('checker_td', '1');
    }
    formData.append('step', step);
    formData.append('answer_token', this.token_answer);
    formData.append('envelope_token', this.token_link);

    this.envelopeService.save_verified(formData).subscribe(
      response => {
        if (response['status']){
          if (result == true) {
            if (step == 1) {
              this.checker_td = 1;
              this.name = response['data']['name'];
            }
          }
        } else {
          this.toastService.showToast('danger', 'Error!', 'Intentalo mas tarde.');
        }
        setTimeout(() => {
          this.loading = false;
        }, 500);
      }
    );
  }

  getLabelCheck(id) {
    let position = this.check_list.map(function(e) { return e.id; }).indexOf(id);
    return this.check_list[position].name;
  }

  viewFile(file) {
    if (this.user_select != null) {
      this.loading_data_user = true;
      const formData = new FormData();
      formData.append('answer_token', this.token_answer);
      formData.append('envelope_token', this.token_link);
      formData.append('id', this.user_select.id);
      formData.append('check', file);

      this.envelopeService.get_checker_file(formData).subscribe(
        response => {
          this.loading_data_user = false;
          this.downLoadFile(response, "application/pdf");
        }, error => {
          this.loading_data_user = false;
          this.toastService.showToast('warning', 'Archivo', 'No se puede ver este archivo en este momento.');
        }
      );
    } else {
      this.toastService.showToast('info', '¡Seleccionar!', 'Debes seleccionar un participante.');
    }
  }

  downLoadFile(data: any, type: string) {
    let blob = new Blob([data], { type: type});
    let url = window.URL.createObjectURL(blob);
    let pwa = window.open(url);
    if (!pwa || pwa.closed || typeof pwa.closed == 'undefined') {
      console.log('Error');
    }
  }

   // Acepta Verificación
   onApprove() {
    if (this.buttons_active) {
      if (this.user_select != null) {
        this.saveApprove(true);
      } else {
        this.toastService.showToast('info', '¡Seleccionar!', 'Debes seleccionar un participante.');
      }
    }
  }

  // Rechaza Verificación
  onDisapprove() {
    if (this.buttons_active) {
      if (this.user_select != null) {
        const dialogRef = this.dialogService.open(ModalComponent, {context:{data: {type:8}}, closeOnBackdropClick:false, closeOnEsc:false });
        dialogRef.onClose.subscribe(result => {
          if (result != false) {
            this.saveApprove(result);
          }
        });
      } else {
        this.toastService.showToast('info', '¡Seleccionar!', 'Debes seleccionar un participante.');
      }
    }
  }

  saveApprove(result) {
    this.loading_data_user = true;
    const formData = new FormData();
    if (result != true) {
      formData.append('verified', '0');
    } else {
      formData.append('verified', '1');
    }

    formData.append('step', '3');
    formData.append('answer_token', this.token_answer);
    formData.append('envelope_token', this.token_link);
    formData.append('id', this.user_select.id);

    if (result != true) {
      formData.append('comment', result);
    }

    this.envelopeService.validate_checker(formData).subscribe(
      response => {
        // console.log(response);
        if (response['status']){
          if (result != true) {
            this.user_select.verified = false;
          } else {
            this.user_select.verified = true;
          }
          this.user_active = null;
          this.toastService.showToast('success', 'Verificación', 'Información guardada correctamente.');

          this.buttons_active = false;
          setTimeout(() => {
            this.buttons_active = true;
          }, 1000);

          // Validar si ya se verificaron todos los participantes.
          this.validateFinish();
        }
        this.loading_data_user = false;
      }, error => {
        this.toastService.showToast('danger', 'Error!', 'Intentalo mas tarde.');
        this.loading_data_user = false;
      }
    );
  }

  validateFinish() {
    let finish_checker = true;
    this.user_list.forEach(user => {
      if (user.verified == null) {
        finish_checker = false;
      }
    });

    if (finish_checker) {
      this.onFinishChecker();
    }
  }

  onFinishChecker() {
    const dialogRef = this.dialogService.open(ModalComponent, {context:{data: {type:9}}, closeOnBackdropClick:false, closeOnEsc:false });
    dialogRef.onClose.subscribe(result => {
      if (result == true) {
        this.loading = true;
        const formData = new FormData();
        formData.append('step', '4');
        formData.append('answer_token', this.token_answer);
        formData.append('envelope_token', this.token_link);

        this.envelopeService.validate_checker(formData).subscribe(
          response => {
            if (response['status']){
              let complete = true;
              this.user_list.forEach(user => {
                if (user.verified == false) {
                  complete = false;
                }
              });

              if (complete) {
                this.finish = 3;
              } else {
                this.finish = 4;
              }
              this.loading = false;

            }
          }, error => {
            this.toastService.showToast('danger', 'Error!', 'Intentalo mas tarde.');
            this.loading = false;
          }
        );

      }
    });
  }

  @HostListener("dragover", ["$event"]) onDragOver(event: any) {
    if (event.target.id == "doc_front") {
      this.drag_front_class = "drop-area";
    } else if (event.target.id == "doc_back") {
      this.drag_back_class = "drop-area";
    }
    event.preventDefault();
  }
  @HostListener("dragenter", ["$event"]) onDragEnter(event: any) {
    if (event.target.id == "doc_front") {
      this.drag_front_class = "drop-area";
    } else if (event.target.id == "doc_back") {
      this.drag_back_class = "drop-area";
    }
    event.preventDefault();
  }
  @HostListener("dragend", ["$event"]) onDragEnd(event: any) {
    this.drag_front_class = "";
    this.drag_back_class = "";
    event.preventDefault();
  }
  @HostListener("dragleave", ["$event"]) onDragLeave(event: any) {
    this.drag_front_class = "";
    this.drag_back_class = "";
    event.preventDefault();
  }

  @HostListener("drop", ["$event"]) onDrop(event: any) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files) {
      let files: FileList = event.dataTransfer.files;
      if (event.target.id == "doc_front") {
        this.saveFiles(files, 1);
        this.drag_front_class = "";
      } else if (event.target.id == "doc_back") {
        this.saveFiles(files, 2);
        this.drag_back_class = "";
      }
    }
  }

  uploadFile(event: any, option) {
    this.saveFiles(event.target.files, option);
  }

  saveFiles(files: FileList, option) {
    let types_file = ["image/png", "image/jpeg", "image/jpg"];
    if (files.length == 1 && types_file.includes(files[0].type)) {
      if (typeof FileReader !== "undefined") {
        let reader = new FileReader();
        reader.onload = (e: any) => {
          let content = Buffer.from(e.target.result, "binary").toString(
            "base64"
          );
          if (option == 1) {
            this.src_front = "data:image/png;base64," + content;
            this.check_front = true;
          } else if (option == 2) {
            this.src_back = "data:image/png;base64," + content;
            this.check_back = true;
          }
        };
        reader.readAsArrayBuffer(files[0]);
      }
    } else {
      this.toastService.showToast('warning', 'Archivo!', 'Tipo de formato no es valido.');
    }
  }

  onValidate() {
    if (this.type != '' && this.type != null && this.doc != '' && this.doc != undefined && this.doc != null && this.check_front && this.check_back) {
      return false;
    }
    return true;
  }

  onVerifed() {
    this.loading = true;
    const formData = new FormData();
    formData.append('step', '2');
    formData.append('answer_token', this.token_answer);
    formData.append('envelope_token', this.token_link);
    formData.append('type', this.type);
    formData.append('doc', this.doc);
    formData.append('src_front', this.src_front);
    formData.append('src_back', this.src_back);
    this.envelopeService.save_verified(formData).subscribe(
      response => {
        if (response['status']){
          const dialogRef = this.dialogService.open(ModalComponent, {context:{data: {type:5}}, closeOnBackdropClick:false, closeOnEsc:false });
          dialogRef.onClose.subscribe(result => {
            this.finish = 1;
          });
        } else {
          this.toastService.showToast('danger', 'Error!', 'Intentalo mas tarde.');
        }
        this.loading = false;
      }, error => {
        this.toastService.showToast('danger', 'Error!', 'Intentalo mas tarde.');
        this.loading = false;
      }
    );
  }

}
