import { TraceabilityService } from './../../services/traceability.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SharedService } from '../shared.service';

@Component({
    selector: 'ngx-trace',
    templateUrl: './trace.component.html',
    styleUrls: ['./trace.component.scss'],
    standalone: false
})
export class TraceComponent implements OnInit {

  token = '';
  load = false;
  doc_name;
  doc_id;
  doc_hash;
  doc_hashSha;
  doc_hashSha2;
  ubicacion;

  traceability = [
    // '1. Diligenciamiento Tiempo',
    // '2. Firma Tiempo',
    // '3. ....'
  ]

  sign_data = []

  constructor(
    private activatedRoute: ActivatedRoute,
    private _sharedService: SharedService,
    private traceService:TraceabilityService,
  ) {
    this.token = this.activatedRoute.snapshot.paramMap.get('token');

    this.traceService.get_public_trace_document(this.token).subscribe((response)=>{
      if (response['status']){
        console.log(response)
        this.doc_name = response['data']['form'].toUpperCase();
        this.doc_id = response['data']['form_id'].toString();
        this.doc_hash = response['data']['doc_hash'].toString();
        this.doc_hashSha = response['data']['doc_hash_sha'].toString();
        this.doc_hashSha2 = response['data']['doc_hash_sha2'].toString();
        this.ubicacion = response['data']['ubication'].toString();
        for(let i=0; i< 12-response['data']['form_id'].toString().length; i++){
          this.doc_id = '0'+this.doc_id;
        }
        this.traceability = response['data']['logs'].map((e)=>{
          e['creation_date'] = new Date(e['creation_date']);
          // console.log(e['creation_date'])
          e['creation_date'] = e['creation_date']
          switch(e['action']){
            case 1:
              e['description'] = response['data']['user'] + ' ha creado la respuestas para el documento: '+ this.doc_name +', el cúal quedara identificado en el sistema con la referencia '+this.doc_id+'.'
            break;
            case 12:
              e['description'] = response['data']['user'] + ' genero la Estampa de Tiempo del Instituto Nacional de Metrología de Colombia para el documento.'
            break;
            default:
          }
          if (e['extra'] != undefined && e['extra']){
            e['extra'] = JSON.parse(e['extra']);
            if (e['extra']['image'] && typeof e['extra']['image'] != typeof []){
              e['extra']['image'] = [e['extra']['image']];
            }
          }
          return e;
        });
        this.sign_data = response['data']['signs'];
        this._sharedService.emitChange(response['data']['enterprise']);

        this.load = true;
      }
    })

  }

  ngOnInit(): void {
  }

  downloadImage(base64){
    var image = new Image();
    image.src = "data:image/png;base64," + base64;

    var w = window.open("");
    w.document.write(image.outerHTML);
  }

}
