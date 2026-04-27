import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../../../usable/toast.service';
import { AnswerService } from '../../../../services/answer.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService } from '../../../../services/form.service';
@Component({
    selector: 'ngx-zip',
    templateUrl: './zip.component.html',
    styleUrls: ['./zip.component.scss'],
    standalone: false
})
export class ZipComponent implements OnInit {

  massive_values=[];
  formsList = [];
  loading = false;
  id:string;
  name:string;
  description:string;
  dato:string;
  constructor(
    private formService: FormService,
    private router: Router,
    private toastService: ToastService,
    private answerService: AnswerService,
  ) { }

  ngOnInit(): void {
    this.onGetDataPDF();
  }

  onGetDataPDF() {
    this.formService.list().subscribe(
      form => {
        if (form['status']){
          this.formsList = form['data']
        }
        this.loading = false;
      },
      error => {
        this.loading = false;
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      }
    );
    this.answerService.get_document_zip_pdf().subscribe(
      response => {
        if (response['status']) {
          console.log(response['data'])
          this.massive_values = response['data'];
        }
        this.loading = false;
      },
      error => {
        this.loading = false;
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      }
    );
  }

  getName(id){
    let position = this.formsList.map(function(e) { return e.id; }).indexOf(id);
    return this.formsList[position]['name']
  }

  downloadZip(id) {
    this.answerService.get_pdf_to_zip_doc(id,2).subscribe(
      response => {
        this.downLoadFile(response, "application/zip");
        this.loading = false;
      },
      error => {
        this.loading = false;
        this.toastService.showToast('danger', 'Error', 'Ha ocurrido un error, intenta mas tarde.');
      }
    );
  }

  downLoadFile(data: any, type: string) {
    let blob = new Blob([data], { type: type});
    let url = window.URL.createObjectURL(blob);
    let pwa = window.open(url);
    if (!pwa || pwa.closed || typeof pwa.closed == 'undefined') {
      console.log('Error');
    }
  }

  getStatus(value) {
    if (value <= 25) {
      return 'danger';
    } else if (value <= 50) {
      return 'warning';
    } else if (value <= 75) {
      return 'info';
    } else {
      return 'success';
    }
  }

}
