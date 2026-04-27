import { Component, OnInit } from '@angular/core';
import { SwitchService } from '../../../../../services/switch.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'ngx-modals',
    templateUrl: './modals.component.html',
    styleUrls: ['./modals.component.scss'],
    standalone: false
})
export class ModalsComponent implements OnInit {

  data;
  idSubproyect;
  valor1;
  nameSubProyectF;

  constructor(private modalSS:SwitchService, private router: Router,private nameSubProyect:SwitchService) { }

  ngOnInit(): void {
    this.modalSS.$modalsing.subscribe((valor)=>{
      this.valor1=valor
    })
  }

  closeModal(){
    this.valor1.close()
  }

  clickProgramming(valor){
    setTimeout(()=>{
      this.nameSubProyect.$nameSubp2.emit(this.nameSubProyectF);
    }, 500);
    this.router.navigate(['/pages/visits/programming/create/' + this.idSubproyect + "/"+ valor, {}]);
    this.valor1.close();

  }

}
