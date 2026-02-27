
import { Component, OnInit,Inject } from '@angular/core';
import { AnswerService } from '../../../../services/answer.service';
import { SwitchService } from '../../../../services/switch.service';
import { ToastService } from '../../../../usable/toast.service';

@Component({
  selector: 'ngx-main-container',
  templateUrl: './main-container.component.html',
  styleUrls: ['./main-container.component.scss']
})
export class MainContainerComponent implements OnInit {
  massive_values=[];
  massive_values_pru=[];
  myInterval;
  idContVideo2;
  lengthTotal = 0;
  loading=false;
  subtitle = true; 
  showScroll = false;
  close_modal = false;
  finish_download = false;
  array_info = [];
  element;
  data = [];
  data_download = [];
  cont_error_zip = 0
  cont_error_excel = 0
  constructor(
    private answerService: AnswerService,
    private modalSS:SwitchService,
    private toastService: ToastService,) { }

  ngOnInit(): void {
    if(this.subtitle == true) {
      this.add();
    }
    //this.dropThread(0);
  }

  add(){
    this.subtitle = true;
    const idContVideo = document.getElementsByClassName('window-form-popup')
    const idContVideo1 = idContVideo[0].getElementsByTagName('button')
    this.idContVideo2 = idContVideo[0].getElementsByClassName('title')

    if(idContVideo1.length == 3){
      for (var i = 0; i < idContVideo1.length; i++) {
        idContVideo1[i].setAttribute("id","id_"+i)
      }
      const idContBtn = document.getElementById('id_1');
      idContBtn.click();
      //this.dataZip();
      this.myInterval = setInterval(() => {
        this.dataZip();
        
      }, 3000);
    }else{
      this.dataZip();
      // console.log("datazipfalse")
      /* setTimeout(() => {
        this.myInterval=this.dataZip();
      }, 3000); */
    }
  }
  
  dataZip() {
    this.subtitle = false;
    this.answerService.get_document_zip_pdf().subscribe(
      response => {
        if (response['status']) {
          this.massive_values = response['data'];
          this.modalSS.$taskSub.emit(this.myInterval + "-" + this.massive_values.length);
          if (this.massive_values.length > 0) {
            if (this.massive_values.length > 5) {
              this.showScroll = true;
            }else{
              this.showScroll = false;
            }
            if (this.massive_values.length == 1) {
              this.idContVideo2[0].textContent = "Descargando 1 informe";
            } else {
              this.idContVideo2[0].textContent = "Descargando " + this.massive_values.length + " informes";
            }
            for (let index = 0; index < this.massive_values.length; index++) {              
              if(this.massive_values[index].state != false) {
                this.element = this.massive_values[index];
                this.lengthTotal += 1;

                if (this.element.percentage == 100) {
                  if(!this.data_download.includes(this.element.id)){
                    this.containerData(this.element);
                  }
                  // if(this.lengthTotal > this.massive_values.length){
                  //   this.lengthTotal = 0;
                  // }else {
                  //   if(this.lengthTotal == this.massive_values.length){
                  //     this.containerData(this.element);
                  //   }
                  // }
                }
              }
            }
          } else {
            //console.log('NO HAY NINGUNO.');
            if (this.massive_values.length == 0 && this.data.length > 0) {
              this.idContVideo2[0].textContent = "Descargando 0 informe";
              clearInterval(this.myInterval);
              //this.data.length = 0
              const windowRef = this.answerService.getWindowRef();
              if (windowRef) {
                windowRef.close();
              }
            }
          }
        }
      },
      error => {
        console.log('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      }
    );
  }

  containerData(element){
    if (!element.automatic_download && element.percentage == 100 && element.status && element.type == 'zip') {
      // Elimina el intervalo para detener futuras llamadas a dataZip()
      this.answerService.get_pdf_to_zip_doc(element.id, 1).subscribe(
          response => {
            setTimeout(() => {              
              this.finish_download = true;
            },1000);
            this.data_download.push(element.id);
            this.downLoadFile(response, "application/zip", element.id, element.name);
          },
          error => {
            if(this.cont_error_zip == 0) {
              this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
              this.cont_error_zip +=1
            }

            console.log('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
          }
      );
    } else if (!element.automatic_download && element.percentage == 100 && element.status && element.type == 'excel') {
      this.answerService.get_pdf_to_zip_doc(element.id, 2).subscribe(
        response => {
          setTimeout(() => {              
            this.finish_download = true;
          },1000);
          this.data_download.push(element.id);
          this.downLoadFile(response, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", element.id, element.name);
        },
        error => {
          if(this.cont_error_excel == 0) {
            this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
            this.cont_error_excel +=1
          }
        }
      );
    }
  }
  // FLUJO PARA SABER CUANDO SE OPRIME EL BOTON X
  ngAfterViewInit() {
    const button = document.getElementById('id_2');
    if (button) {
        button.addEventListener('click', this.onButtonClick.bind(this));
    }
  }

  onButtonClick() {    
    this.dropThread(1);
  }

  dropThread(opt){
    if(opt == 1){
      this.loading = true; 
      this.data.length = 0
      this.data_download = [];
      clearInterval(this.myInterval); 
    }
    this.answerService.get_document_zip_pdf().subscribe(  response => {
        if (response['status']) {
          this.massive_values_pru = response['data'];
           // Servicio que detiene el hilo
          this.answerService.stop_threads_zip(this.massive_values_pru).subscribe( response => {
            // console.log("response::::::::::::");
            // console.log(response);
            if (response['status']) {
              if (opt == 1) {
                //  console.log("entro");
                  const windowRef = this.answerService.getWindowRef();
                    if (windowRef) {
                      windowRef.close(); // Cierra la ventana abierta anteriormente
                      //this.loading = false;
                      if (response['data'] > 0 && this.element.percentage < 100){
                        this.toastService.showToast('success', 'Exitoso', 'Procesos Cancelados: ' + response['data']);
                      }
                    }
                }
            }
          });
        }
    });
  }

  downLoadFile(data: any, type: string, id: any, name: string) {
    // Validacion para que no se dupliquen las descargas
    //this.finish_download = false;
    if(!this.data.includes(id)){
      this.data.push(id);
      let blob = new Blob([data], { type: type });
      let url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      if(name != ''){
        name = name.replace(".","_").replace(".","_").replace(".","_")
        a.download = name;
      }else{
        a.download = "Reporte de melmac";
      }
      a.click();
      URL.revokeObjectURL(a.href);
      console.log("DESCARGANDO....")
      setTimeout(() => {
        this.answerService.get_report_downloadFile(id).subscribe(
          response => {
            this.toastService.showToast('success', 'Exitoso', 'Descargado con Exito');
          },
          error => {
            this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
          }
        );
      }, 500);
    }else{      
      console.log("ya esta ese elemento");
    }
  }

}
