import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AnswerService } from '../../../../services/answer.service';
import { DigitalService } from '../../../../services/digital.service';

@Component({
  selector: 'ngx-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent implements OnInit {

  id:string;
  name:string;
  description:string;
  form_list = [];

  btn_title = '';
  option_form;

  // Digital
  src;

  constructor(
    private router: Router,
    private answerService:AnswerService,
    private digitalService:DigitalService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.id = this.activatedRoute.snapshot.paramMap.get('id');

    if (this.id != null) {
      this.getAllData();
    }
  }

  getAllData(){
    this.activatedRoute.data.subscribe(data => {
      // console.log(data)
      if (data['form'] == 0) {
        this.option_form = 0;
        this.btn_title = 'Documento con Única Sección';
        this.answerService.get_detail(this.id).subscribe(
          response => {
            // console.log(response);
            if (response['status']){
              this.name = response['data']['name'];
              this.description = response['data']['description'];
            } else {
              this.router.navigate(['/pages/form/view', {}]);
            }
          }
        );
      } else if (data['form'] == 1) {
        this.option_form = 1;
        this.btn_title = 'Secuencia de Documentos';
        this.answerService.get_sequence(this.id).subscribe(
          response => {
            // console.log(response);
            if (response['status']){
              this.name = response['consecutive']['name'];
              this.description = response['consecutive']['description'];
              this.form_list = response['consecutive']['forms'];
            } else {
              this.router.navigate(['/pages/form/view', {}]);
            }
          }
        );
      } else if (data['form'] == 2) {
        this.option_form = 2;
        this.btn_title = 'Previsualización del documento';
        this.answerService.get_detail(this.id).subscribe(
          response => {
            if (response['status']){
              this.name = response['data']['name'];
              this.description = response['data']['description'];
            } else {
              this.router.navigate(['/pages/form/view', {}]);
            }
          }
        );

        this.digitalService.getPDF(this.id).subscribe(
          response => {
            this.src = {
              data: response
            }
          }
        );
      }
    });
  }

  onAnswer() {
    if (this.option_form == 0) {
      this.router.navigate(['/pages/form/answer/' + this.id, {}]);
    } else if (this.option_form == 1) {
      this.router.navigate(['/pages/form/consecutive/answer/' + this.id, {}]);
    } else if (this.option_form == 2) {
      this.router.navigate(['/pages/form/digital/answer/' + this.id, {}]);
    }
  }

  onBack() {
    this.router.navigate(['/pages/form/view', {}]);
  }

  ngOnInit(): void {
  }

}
