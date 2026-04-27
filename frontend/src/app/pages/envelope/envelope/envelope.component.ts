import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbMenuService } from '@nebular/theme';
import { Router } from '@angular/router';
import { filter, map } from "rxjs/operators";
import { EnvelopeService } from '../../../services/envelope.service';
import { ToastService } from '../../../usable/toast.service';

@Component({
    selector: 'ngx-envelope',
    templateUrl: './envelope.component.html',
    styleUrls: ['./envelope.component.scss'],
    standalone: false
})
export class EnvelopeComponent implements OnInit, OnDestroy {
  searchTerm;

  envelope_index = 0;
  show_envelope = 4;
  total_envelope = 0;
  load_envelope = 0;
  offset_envelope = 0;
  envelope_list = [];
  envelope_data = [];

  loading = false;
  loading_page = true;
  menu_service;
  select_folder;

  dataw = []
  fileSelected = null;
  data = [];
  envelope_enterprise_ids = []
  listAnswerType = 'folder'
  path = ''
  openFile = ''
  breadcrumbs = []
  breadcrumbs_filter = [];
  breadcrumbsName = []
  statusEnvelope = {
    '1': 'Carga de Documento',
    '2': 'Definir participantes',
    '3': 'Configurar mensaje y envio',
    '4': 'Asignar campos',
    '5': 'Modo De Diligenciamiento',
    '6': 'Finalizado',
    '7': 'Eliminado',
  };

  count_load = 12;
  load_answer = 0;
  load_process = true;
  load_continue = true;
  data_filter = {}

  items = [{ title: 'Editar' }, { title: 'Compartir' }, { title: 'Eliminar' }];

  constructor(
    private nbMenuService: NbMenuService,
    private router:Router,
    public envelopeService:EnvelopeService,
    public toastService: ToastService,
  ) {}

  onScrollStart(ev) {
    // Carga las respuestas parcialmente con el scroll
    if ((ev.target.scrollTop + 100) >= (ev.target.scrollHeight - ev.target.clientHeight) && this.load_continue && this.load_process) {
      this.getEnvelopeAnswer()
    }
  }

  ngOnInit(): void {
    this.getEnvelopeList();

    this.data_filter = {case: 1};
    this.getEnvelopeAnswer()

    this.menu_service = this.nbMenuService.onItemClick().pipe(
      filter(({ tag }) => tag === this.select_folder),
      map(({ item: { title } }) => title),
    ).subscribe(
      title => {
        if (title == "Editar") {
          console.log('Editar');
          // this.stateEnvelope(1, this.select_folder.id);
          this.router.navigate(['/pages/folder/' + this.select_folder.id]);
        } else if (title == "Compartir") {
          console.log('Compartir');
          this.router.navigate([`/pages/folder/${this.select_folder.id}/share`]);
        } else if (title == "Eliminar") {
          this.stateEnvelope(7, this.select_folder.id);
        }
      }
    );

    // setTimeout(() => {
    //   let data_test = {id: 73}
    //   this.envelopeService.get_envelope_table_pdf(data_test).subscribe(
    //     (response) => {
    //       this.downLoadFile(response, "application/pdf");
    //     }
    //   );
    // }, 1000);

  }

  stateEnvelope(state: number, id: number){
    let data = {
      state: state,
      id: id,
    }
    this.envelopeService.stateEnvelope(data).subscribe(
    (response) => {
      if (response["data"].state && response["data"].status == 7) {
        this.toastService.showToast('success', 'Sobre', 'Sobre Eliminado con exito, En breve serás redireccionado a Mi Unidad');
        setTimeout(()=> {
          // Recargar la página actual
          window.location.reload();
        }, 3000 );
      }
    })
  }

  downLoadFile(data: any, type: string) {
    let blob = new Blob([data], { type: type});
    let url = window.URL.createObjectURL(blob);
    let pwa = window.open(url);
    if (!pwa || pwa.closed || typeof pwa.closed == 'undefined') {
      console.log('Error');
    }
  }

  getEnvelopeList(offset=0, limit=4) {
    this.envelopeService.list_offset(offset, limit).subscribe(
      (response) => {
        if (response["status"]) {
          this.total_envelope = response['x-total-count'];
          if (this.envelope_list.length == 0) {
            this.envelope_data = response['data'];
          } else {
            this.envelope_data.push(response['data'][0]);
          }
          this.envelope_list = this.envelope_data.slice(this.envelope_index, this.envelope_index + this.show_envelope);

          setTimeout(() => {
            this.loading_page = false;
          }, 1500);
        }
      },
      (error) => {
        setTimeout(() => {
          this.loading_page = false;
        }, 1500);
      }
    );
  }

  getEnvelopeAnswer() {
    this.loading = true;
    this.load_process = false;

    this.data_filter['_offset'] = this.load_answer * this.count_load;
    this.data_filter['_limit'] = this.count_load;

    this.envelopeService.list_answer(this.data_filter).subscribe((response) => {
      if(response["status"]) {

        if (this.load_answer == 0) {
          this.listAnswerType = response['type']
          this.breadcrumbs.push(response);
          this.breadcrumbs_filter.push(this.data_filter);
        }

        if (response['data'].length > 0) {
          this.data = this.data.concat(response['data']);
        }

        if (response['data'].length == this.count_load) {
          this.load_answer += 1;
        } else {
          this.load_continue = false;
        }

        setTimeout(() => {
          this.loading = false;
          this.load_process = true;
        }, 1000);
      }
    },
    (error) => {
      this.loading = false;
      this.load_process = true;
    })
  }

  floattingButton() {
    this.router.navigate(['/pages/folder/0/']);
  }

  getTag(item){
    let name_tag = 'folder-tag-' + item.id
    return name_tag
  }

  clickMenu(item) {
        this.select_folder = item;
  }

  changeIdxCar(step){
    this.envelope_index += step;
    if (step == -1) {
      this.envelope_list = this.envelope_data.slice(this.envelope_index, this.envelope_index + this.show_envelope);
    } else {
      if ((this.envelope_index + this.show_envelope - 1) < this.envelope_data.length) {
        this.envelope_list = this.envelope_data.slice(this.envelope_index, this.envelope_index + this.show_envelope);
      } else {
        this.getEnvelopeList(this.envelope_index + this.show_envelope - 1, 1);
      }
    }
  }

  ngOnDestroy() {
    this.menu_service.unsubscribe();
  }

  onBack() {
    this.breadcrumbs.pop(); //Elimina la utima posición del arreglo
    this.breadcrumbsName.pop();
    this.breadcrumbs_filter.pop();
    let newData = this.breadcrumbs[this.breadcrumbs.length - 1]
    this.data_filter = this.breadcrumbs_filter[this.breadcrumbs_filter.length - 1];
    this.listAnswerType = newData['type']
    this.data = newData['data']
    this.fileSelected = null;

    if (this.data.length < this.count_load) {
      this.load_answer = 0;
      this.load_continue = false;
    } else {
      this.load_answer = 1;
      this.load_continue = true;
    }
    this.load_process = true;
  }

  selectedFile(file) {
    if(file.answers == 0) return
    if(file.hasOwnProperty('envelope_name')) {
      let envelope_name = file['envelope_name'] ? file['envelope_name'] : 'Sin nombre';
      this.breadcrumbsName.push(envelope_name)
    } else if(file.hasOwnProperty('answer_envelope_id')) {
      this.breadcrumbsName.push(file['answer_envelope_id'])
    } else if (file.hasOwnProperty('answer_id')){
      this.breadcrumbsName.push(file['answer_id'])
    }

    if(file.hasOwnProperty('answer_id')) { // caso 5 para obtener todos los documentos asociados a una respuesta
      if(file.hasOwnProperty('files')) {
        this.path = file.hasOwnProperty('path') ? file.path : ''
        this.listAnswerType = 'files'
        this.data = file.files
        this.breadcrumbs.push(file.files)
      } else {
        this.load_answer = 0;
        this.load_process = true;
        this.load_continue = true;
        this.data = [];
        this.data_filter = {case: 5, answer_id: file.answer_id};
        this.getEnvelopeAnswer()
      }
    } else if(file.hasOwnProperty('answer_envelope_id')) {
      this.load_answer = 0;
      this.load_process = true;
      this.load_continue = true;
      this.data = [];
      this.data_filter = {case: 4, answer_envelope_id: file.answer_envelope_id};
      this.getEnvelopeAnswer()
    } else if(file.hasOwnProperty('version_id')) {
      this.load_answer = 0;
      this.load_process = true;
      this.load_continue = true;
      this.data = [];
      this.data_filter = {case: 3, version_id: file.version_id};
      this.getEnvelopeAnswer()
    } else if(file.hasOwnProperty('envelope_id')) {
      this.load_answer = 0;
      this.load_process = true;
      this.load_continue = true;
      this.data = [];
      this.data_filter = {case: 2, envelope_id: file.envelope_id};
      this.getEnvelopeAnswer()
    }
  }

  viewFile(file) {
    var routePath = `${this.path}${file.file}`
    this.envelopeService.list_answer({case: 6, path: routePath}).subscribe((response) => {
      if(response["status"]) {
        this.openFile = response["data"]
      }
    })
  }

  newDataLoad() {
    let newdata = []
    for (let i = 1; i <= 10; i++) {
      let answer = []
      for (let j = 1; j <= 10; j++) {
        answer.push({
          id: i+j,
          title: `Answer ${i}-${j}`,
          date: '01/03/2023',
          person: 'Administrador',
          status: '1',
          image: 'https://via.placeholder.com/150',
        })
      }
      let aja = {
        id: i,
        title: `Cotizaciones ${i}`,
        date: '01/03/2023',
        person: 'Administrador',
        status: '1',
        image: 'https://via.placeholder.com/150',
        answer: answer
      }
      newdata.push(aja);
    }
    return newdata;
  }

  setClassState(status) {
    return `i-s-${status}`
  }

  hideModifyDate(item) {
    console.log(item)
  }

}
