import { Component, OnInit, ViewChild } from '@angular/core';
import { SwitchService } from '../../../../services/switch.service';
import { VisitsService } from '../../../../services/visits.service';
import { FormService } from '../../../../services/form.service';
import { ToastService } from '../../../../usable/toast.service';



@Component({
    selector: 'ngx-modals-proyect',
    templateUrl: './modals-proyect.component.html',
    styleUrls: ['./modals-proyect.component.scss'],
    standalone: false
})
export class ModalsProyectComponent implements OnInit {
  data;
  source;
  valor1;
  inputItemNgModelName='';
  textareaItemNgModel='';
  titleModal;
  btnModal;
  btnLoadingModal=false;
  btnDisabledModal=false;
  titleState;
  idProyect;
  toggleNgModelState = true;
  form_visit_form;
  cantData;

  constructor(private modalSS:SwitchService,private visitService:VisitsService,private toastService: ToastService,private formService:FormService) { }

  ngOnInit(): void {
    this.modalSS.$modalsing.subscribe((valor)=>{
      this.valor1=valor
    })

    console.log(this.data)
    console.log(this.cantData)
    console.log(this.source)



    if(this.data != undefined){
      this.titleModal="Actualizar "
      this.btnModal="Actualizar"
      this.inputItemNgModelName=this.data.name
      this.textareaItemNgModel=this.data.description
      this.idProyect=this.data.id
      if(this.data.state){
        this.titleState="Activo";
        this.toggleNgModelState=true
      }else{
        this.titleState="Inactivo";
        this.toggleNgModelState=false
      }

    }else{
      this.titleModal="Crear nuevo "
      this.btnModal="Crear"
      this.titleState="Activo"
    }

  }

  sendDataModal(){
    this.btnLoadingModal=true;
    this.btnDisabledModal=true;
    let form_data = {'clone': 1,'visit':1}

    if(this.cantData == 0){
      this.formService.clone(this.form_visit_form, form_data).subscribe(
        response => {
          if (response['status']){
            setTimeout(()=>{
              this.visitService.create_proyect_task(this.inputItemNgModelName,this.textareaItemNgModel,this.toggleNgModelState,this.idProyect).subscribe(
                response => {
                  console.log(response);
                  this.btnLoadingModal=false;
                  this.btnDisabledModal=false;
                  this.closeModal(response)
                }
              );
            }, 2000);
          }
        }, error => {
          this.toastService.showToast('danger', 'Error', '¡Ha ocurrido un error, inténtalo más tarde!');
        }
      );
    }else{
      if(this.inputItemNgModelName == '')
        this.inputItemNgModelName='Proyecto general'
      this.visitService.create_proyect_task(this.inputItemNgModelName,this.textareaItemNgModel,this.toggleNgModelState,this.idProyect).subscribe(
        response => {
          console.log(response);
          this.btnLoadingModal=false;
          this.btnDisabledModal=false;
          this.closeModal(response)
        }
      );
    }
  }

  closeModal(value){
    this.valor1.close()
    if(this.data != undefined){
      setTimeout(()=>{
          this.visitService.listProyect().subscribe(
            response => {
              this.source.source.data=response['data']
              this.source.source.refresh()
            }
          );
      }, 200);
    }else{
      setTimeout(()=>{
        this.modalSS.$modalsing.emit("crea proyecto")
      }, 200);
    }
  }

  toggleClick(event:boolean){
    if(event){
      this.titleState="Activo";
    }else{
      this.titleState="Inactivo";
    }
  }

}
