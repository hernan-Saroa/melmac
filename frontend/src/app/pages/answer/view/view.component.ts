import { Component, OnInit } from '@angular/core';
import { AnswerService } from '../../../services/answer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../usable/toast.service';

import { country } from '../../form/data';

@Component({
  selector: 'ngx-view',
  templateUrl: './view.component.html',
  styleUrls: ['./view.component.scss']
})
export class AnswerViewComponent implements OnInit {

  id:string;

  list_form = []// Consecutivo
  form_check = []

  consecutive = false;
  name:string;
  description:string;
  ani = false;
  nit = false;
  form_list = [];

  // País - Departamento/Estado - Ciudad
  public country: any;

  constructor(
    private router: Router,
    private answerService: AnswerService,
    private activatedRoute: ActivatedRoute,
    private toastService: ToastService,
  ) {
    this.id = this.activatedRoute.snapshot.paramMap.get('id');

    if (this.id != null) {
      this.getAllData();
    }
  }

  getAllData() {
    this.activatedRoute.data.subscribe(data => {
      this.answerService.list_field(data['form'], this.id).subscribe(
        response => {
          if (response['status']){
            response['data']['list_form'].forEach(element => {
              element['fields'].forEach(value => {
                  if (value['type'] == 11) {
                    this.ani = true;
                  }
                  if (value['type'] == 20 ) {
                    this.nit = true;
                  }
              });
            });
            if (data['form'] == 1) {
              response['data']['list_form'].forEach(element => {
                this.form_check.push(element['id']);
              });
              this.getSequence(response['data']['consecutive'], response['data']['list_form']);
            } else {
              this.list_form = response['data']['list_form'];
            }
          }
        }
      );
    });
  }

  onBack() {
    this.router.navigate(['/pages/answer', {}]);
  }

  ngOnInit(): void {
    this.country = country;
  }

  getSequence(id, list_form){
    this.answerService.get_sequence(id).subscribe(
      response => {
        if (response['status']){
          this.form_list = response['consecutive']['forms'];
          this.name = response['consecutive']['name'];
          this.description = response['consecutive']['description'];
          this.consecutive = true;
          this.list_form = list_form;
        } else {
          this.router.navigate(['/pages/form/view', {}]);
        }
      }
    );
  }

  getTableData(field, body) {
    let position = body.map(function(e) { return e.field; }).indexOf(field + '');
    if (position != -1) {
      return body[position]['answer'];
    }
    return '';
  }

  getCountryData(answer) {
    let response = '';

    if (answer != '') {
      let answer_data = JSON.parse(answer.replace(/'/g, '"'));
      // País
      if (answer_data[0] && answer_data[0] != '') {
        let position_p = this.country.map(function(e) { return e.value; }).indexOf(answer_data[0]);
        if (position_p != -1) {
          response += this.country[position_p]['label'];

          // Departamento
          if (answer_data[1] && answer_data[1] != '') {
            let position_s = this.country[position_p]['state'].map(function(e) { return e.value; }).indexOf(answer_data[1]);
            if (position_s != -1) {
              response += ' - ' + this.country[position_p]['state'][position_s]['label'];

              // Ciudad
              if (answer_data[2] && answer_data[2] != '') {
                let position_c = this.country[position_p]['state'][position_s]['cities'].map(function(e) { return e.value; }).indexOf(answer_data[2]);
                if (position_c != -1) {
                  response += ' - ' + this.country[position_p]['state'][position_s]['cities'][position_c]['label'];
                }
              }
            }
          }
        }
      }
    }
    return response;
  }

  downLoadFile(data: any, type: string) {
    let blob = new Blob([data], { type: type});
    let url = window.URL.createObjectURL(blob);
    let pwa = window.open(url);
    if (!pwa || pwa.closed || typeof pwa.closed == 'undefined') {
      console.log('Error');
    }
  }

  getPDF() {
    let consecutive = 0;
    if (this.consecutive) {
      consecutive = 1;
    }
    this.answerService.get_pdf(consecutive, this.id).subscribe(
      response => {
        this.downLoadFile(response, "application/pdf");
      },
      error => {
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      }
    );
  }

  getPdfDocument(type) {
    let consecutive = 0;
    if (this.consecutive) {
      consecutive = 1;
    }
    this.answerService.get_pdf_document(consecutive, this.id, type).subscribe(
      response => {
        this.downLoadFile(response, "application/pdf");
      },
      error => {
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      }
    );
  }

}
