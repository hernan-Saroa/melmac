import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService } from '../../services/form.service';
import { SharedService } from '../shared.service';

@Component({
  selector: 'ngx-file',
  templateUrl: './file.component.html',
  styleUrls: ['./file.component.scss']
})
export class FileComponent implements OnInit {

  token_link = '';
  idUser = '0';
   // Digital - PDF
   src;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private formService:FormService,
    private _sharedService: SharedService,
  ) {
    this.token_link = this.activatedRoute.snapshot.paramMap.get('token');
    if(this.activatedRoute.snapshot.paramMap.get('id') != null){
      this.idUser = this.activatedRoute.snapshot.paramMap.get('id');
    }
    this.getDataEnterprise();
    this.getPDFToken();
  }

  ngOnInit(): void {
  }

  getDataEnterprise() {
    this.formService.get_enterprise_token(this.token_link).subscribe(
      response => {
        if (response['status']){
          response['data']['zoom_view'] = true;
          this._sharedService.emitChange(response['data']);
        }
      }
    );
  }

  getPDFToken() {
    this.formService.get_pdf_token(this.token_link,this.idUser).subscribe(
      response => {
        this.src = {
          data: response
        }
      }, error => {
        this.router.navigate(['/public', {}]);
      }
    );
  }

}
