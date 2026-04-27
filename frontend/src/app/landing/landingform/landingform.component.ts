import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { ToastService } from '../../usable/toast.service';
import { LandingService } from '../../services/landing.service';

@Component({
    selector: 'ngx-landingform',
    templateUrl: './landingform.component.html',
    styleUrls: ['./landingform.component.scss'],
    standalone: false
})
export class LandingformComponent implements OnInit {

  ipAddress;
  selectedOption:boolean=false;
  selectNew:boolean=false;
  value;
  number_id: string;
  name="";
  lastname="";
  corporate="";
  email="";
  phone;
  main_city = "";
  city = [
    {id: "Barranquilla", name: "Barranquilla"},
    {id: "Bogotá", name: "Bogotá"},
    {id: "Bucaramanga", name: "Bucaramanga"},
    {id: "Cali", name: "Cali"},
    {id: "Cartagena", name: "Cartagena"},
    {id: "Medellín", name: "Medellín"},
    {id: "Tolima", name: "Tolima"},
    {id: "Otro", name: "Otro"}
  ];
  
  constructor(
    private toastService: ToastService,    
    private landingService: LandingService,
    private http:HttpClient,
    public dialogRef: NbDialogRef<LandingformComponent>,
  ) { }

  ngOnInit(): void {
    this.getIPAddress();
  }

  getIPAddress()
  {
    this.http.get("https://api.ipify.org/?format=json").subscribe((res:any)=>{
      this.ipAddress = res.ip;
      // console.log(this.ipAddress);
    });
  }

  toggleTerms(checked: boolean) {
    this.selectedOption = checked;
  }

  toggleNews(checked: boolean) {
    this.selectNew = checked;
  }

  onKeyNumber(e){
    if((e.keyCode >= 48 && e.keyCode <=57) || (e.keyCode >= 96 && e.keyCode <=105) || e.keyCode === 8 ){
      return true;
    }
    return false;
  }

  onKeyWord(event){
    if ((event.keyCode >= 65 && event.keyCode <= 90) || event.keyCode === 8){
      return true;
    }
    return false;
  }

  close(){
    this.dialogRef.close(false);
  }

  onSunmit(name, lastname, corporate, email, phone, city) {
    // this.loading = true;
    if (this.name != '' && this.lastname != '' && this.corporate != '' && this.email != '' && this.city != undefined) {
      if(this.email  && this.email.match(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+[.][a-zA-Z0-9.]{2,}$/)) {
        if (name != true && lastname != true && corporate != true && email != true && phone != true && city != true ) {
            if (this.selectedOption) {
              let data = {
                name: this.name,
                last_name: this.lastname,
                corporate: this.corporate,
                email: this.email,
                phone: this.phone,
                city: this.main_city,            
                ip_address: this.ipAddress,
                terms: this.selectedOption,
                newslet: this.selectNew
              }
              this.landingService.landingFormData(data).subscribe(response => {
                if (response['status']) {
                    this.toastService.showToast('success', 'Envío exitoso', 'El formulario se ha enviado con éxito.');
                    console.log(response)
                    this.dialogRef.close(false);                 
                } else {
                  //this.toastService.showToast('danger', 'Error', 'El formulario No se envió con éxito');
                  this.toastService.showToast('danger', 'Error', response['message']);
                  
                }
            })
            }else{
            this.toastService.showToast('info', 'Condiciones de Formulario', 'Para continuar debes aceptar las condiciones de Políticas de Privacidad ');
          }
        }else{
          this.toastService.showToast('info', 'Datos', 'Campos Inválidos');
        }
      } else {
        this.toastService.showToast('warning', 'Correo electrónico incorrecto.', 'Verifica tu correo e inténtalo de nuevo.');
      }
    } else {
      this.toastService.showToast('info', 'Datos', 'Todos los campos deben ser diligenciados');
    }

  }

}
