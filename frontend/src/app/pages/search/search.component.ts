import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { SearchService } from '../../services/search.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { CustomDataSource } from '../../usable/custom.dataSource';
import { BASE_URL } from '../../services/site.service';
import { EnvelopeService } from '../../services/envelope.service';
import { HttpHeaders, HttpClient } from '@angular/common/http';
import { NbDialogRef, NbDialogService } from '@nebular/theme';
import { FormService } from '../../services/form.service';
import { ToastService } from '../../usable/toast.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'ngx-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  standalone: false
})

export class SearchComponent implements OnInit, OnDestroy {
  private clickListener!: () => void;
  query: string = ''; // Término de búsqueda
  suggestions: any[] = []; // Sugerencias para autocompletado
  results: any[] = []; // Resultados completos
  isLoading: boolean = false; // Indicador de carga para búsqueda completa
  private searchSubject = new Subject<string>();
  menuOpen: boolean = false;
  list_answer;
  list_form;
  general_list;
  page=1;
  page2=1;
  page3=1;
  limit=0;
  limit2=0;
  limit3=0;
  state_view_1 = 1;
  state_view_2 = 1;
  state_view_3 = 1;
  flechaF =  "▾"
  count_tdocument;
  count_ttemplate;
  data1T = false
  data2T = false
  templates = [];
  data_filter = {}
  limitBtnAll=20
  offsetBtnAll=0
  view_search = true
  total_all;
  state_total_all: boolean = false
  total_all_partial=0;
  activeIndex: number | null = 2; // Índice del ícono activo
  folders = [
    'Proyecto 1111111111111111111111111111111111111111111111111111111', 'Contrato 1', 'Proyecto 2', 'Documentos',
    'Proyecto 3', 'Contrato 2', 'Proyecto 4', 'Documentos II',
    'Documentos 3', 'Contrato 3', 'Proyecto 6', 'Flujos y Contactos',
    'Flujos I'
  ];
  documents = [];
  documents_all = [];

  sections = {
    templates: true,
    folders: true,
    documents: true,
    nuevo: true,
    subir: true,
    crear: true,
    busqueda: true,
  };

  icon_template = {
    document : '📄',
    document2 : '💩',
    template : '🪢',
  }

  sections_flecha = {
    templates: "▾",
    folders: "▾",
    documents: "▾",
    nuevo: "▾",
    subir: "▾",
    crear: "▾",
    busqueda: "▾",
  };


  constructor(private searchService: SearchService,private renderer: Renderer2,private http: HttpClient,public envelopeService:EnvelopeService,private formService:FormService,
      private dialogService :NbDialogService, private toastService: ToastService, private router: Router) {
   }

  ngOnInit(): void {
    const suggestionsList = document.getElementById("suggestions-list") as HTMLDivElement;
    this.initializeSearchFunctionality();
    this.clickListener = this.renderer.listen('document', 'click', (event) => {
      console.log('Click detectado:', event);
      const target = event.target as HTMLElement;
      console.log(target)
      if (!target.closest('.menu-button1') && !target.closest('.menu') && !target.closest('.menu2') && !target.closest('.menu3') && !target.closest('.menu-button3') && !target.closest('.suggestion-item') && !target.closest('.suggestion-all')) { // Si el clic NO es dentro del menú, lo cierra
        console.log("ingresa")
        this.closeMenu();
        suggestionsList.classList.remove("show");
      }
    });
    this.conexion(1,14,1)
    this.conexion(1,10,2)
    this.conexion2(1,10)
  }

  setActive(index: number) {
    this.activeIndex = index; // Al hacer clic, se activa solo ese ícono
  }

  conexion(page=0,limit=0,opt=0){
    let user = JSON.parse(localStorage.getItem('session')) || null;
    const reqHeader = new HttpHeaders({
                  'Content-Type': 'application/json',
                  'Authorization': 'Token ' + user.token
                });
    let path;
    let value;
    let arrayPrinc;
    switch (opt) {
      case 1:
        path = BASE_URL + 'inbox/?_page='+page+'&_limit='+limit;
        value = this.list_answer
        break;
      case 2:
        path = BASE_URL + 'form/?_page='+page+'&_limit='+limit;
        value = this.list_form
        break;
      default:
        break;
    }

    this.http.get<{}>(path, { headers: reqHeader }).toPromise().then(response => {
        console.log(response);
        if (!response || !response['status']) return;
        value = response;
        let tam = 0;
        if (opt == 1 && value.data) tam = value.data.length;
        if (opt == 2 && value.data_unidad) tam = value.data_unidad.length;
        
        for (let index = 0; index < tam; index++) {
          if(opt == 1){
            const element = value.data[index];
            this.documents.push(element)
            this.limit +=1
            if(value['x-total-count'] == this.limit){
              this.state_view_1 = 0
            }
          }else{
            const element1 = value.data_unidad[index];
            this.templates.push(element1)
            console.log(this.templates)
            this.limit2 +=1
            if(value['x-total-count'] == this.limit2){
              this.data1T = true
              if(this.data1T && this.data2T){
                this.state_view_2 = 0
              }
            }
          }
        }
    });
  }

  conexion2(page, limit){
    this.data_filter = {case: 1};
    this.data_filter['_page_u'] = page
    this.data_filter['_limit_u'] = limit;
    this.envelopeService.list_answer(this.data_filter).subscribe((response) => {
      console.log(response)
      if(response["status"]) {
        for (let index = 0; index < response['data_unidad'].length; index++) {
          const element = response['data_unidad'][index];
          let aux = {
            'name' : element.envelope_name,
            'id' :  element.envelope_id,
            'creation_date' :  element.envelope_date,
            'modify_date' :  element.modify_date,
            'version':  element.version,
            'type': 'template'
          };
          this.limit3 +=1
          this.templates.push(aux)
        }
        if(response['x-total-count'] == this.limit3){
          this.data2T = true
          if(this.data1T && this.data2T){
            this.state_view_2 = 0
          }
        }
      }
    },
    (error) => {

    })
  }

  ngOnDestroy() {
    if (this.clickListener) {
      this.clickListener();
    }
  }

  // Método para inicializar la funcionalidad de búsqueda
  private initializeSearchFunctionality(): void {
    const searchInput = document.getElementById("search-input") as HTMLInputElement;
    const suggestionsList = document.getElementById("suggestions-list") as HTMLDivElement;

    // Evento que muestra la lista de sugerencias cuando se escribe algo
    searchInput.addEventListener("input", () => {
      if (searchInput.value.length > 2) {
        this.onSearch();
        this.general_list = suggestionsList;
      } else {
        suggestionsList.classList.remove("show"); // Oculta la lista si no hay texto
      }
    });

    // Agregar eventos a las sugerencias para que cuando se haga clic en ellas, se complete el input
    const suggestionItems = suggestionsList.getElementsByClassName("suggestion-item");

    Array.from(suggestionItems).forEach((item) => {
      item.addEventListener("click", () => {
        searchInput.value = (item as HTMLElement).textContent || ''; // Completa el input con la sugerencia
        suggestionsList.classList.remove("show"); // Oculta la lista
      });
    });
  }
  onInputChange(query: string): void {
    this.searchSubject.next(query);
    //this.onSearch();// Envía el término al Subject
  }

  // Método para realizar búsqueda completa
  onSearch(): void {
    if (!this.query.trim()) {
      return;
    }
    if(this.state_total_all){
      this.state_total_all = false
    }
    this.isLoading = true; // Mostrar indicador de carga
    this.searchService.search(this.query).subscribe({
      next: (data) => {
        if(data.results != 'Menos de 3 caracteres'){
          this.results = data.results; // Asigna los resultados completos
          this.isLoading = false; // Ocultar indicador de carga
          this.general_list.classList.add("show"); // Muestra la lista
        }
      },
      error: (error) => {
        console.error('Error en la búsqueda completa:', error);
        this.isLoading = false; // Ocultar indicador de carga
      },
    });
  }

  // Método para realizar búsqueda completa de todos los campos
  search_all(){
    console.log(this.limitBtnAll)
    console.log(this.offsetBtnAll)
    if(!this.state_total_all){
      this.state_total_all = true
      this.clear_content()
    }
    this.searchService.search_all(this.query, this.limitBtnAll, this.offsetBtnAll).subscribe({
      next: (data) => {
        if(data.results != 'Menos de 3 caracteres'){
          console.log(data.results)
          console.log(data)
          const suggestionsList = document.getElementById("suggestions-list") as HTMLDivElement;
          suggestionsList.classList.remove("show");
          for (let index = 0; index < data.results.length; index++) {
            const element = data.results[index];
            this.documents_all.push(element)
            console.log(this.documents_all)
          }
          this.total_all_partial = this.total_all_partial + data.results.length
          this.total_all = data.total
          if(this.total_all <= this.total_all_partial){
            this.state_view_3 = 0
          }
          this.view_search=false
        }
      },
      error: (error) => {
        console.error('Error en la búsqueda completa:', error);
        this.isLoading = false; // Ocultar indicador de carga
      },
    });
  }

  more_view(opt){
    if(opt == 1){
      this.page +=1
      this.conexion(this.page,14,1)
    }else if(opt == 2){
      this.page2 +=1
      this.page3 +=1

      console.log("documentos",this.count_tdocument,"-",this.limit2)
      if(!this.data1T){
        this.conexion(this.page2,10,2)
      }

      console.log("plantillas",this.count_ttemplate,"-",this.limit3)
      if(!this.data2T){
        this.conexion2(this.page3,10)
      }
    }else{
      this.offsetBtnAll = this.offsetBtnAll + 20
      this.search_all()
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  onClickOption(content): void {
    console.log("ingreso click", content)
    this.searchService.traceability_search("variable","word").subscribe({
      next: (data) => {
        console.log(data)
      },
      error: (error) => {
        console.error('Error en el almacenamiento:', error);
        this.isLoading = false; // Ocultar indicador de carga
      },
    });
  }

  activeMenu: string | null = null;
  activeMenu1: string | null = null;

  toggleSection(section: string) {
    this.sections[section] = !this.sections[section];
    if (!this.sections[section]){
      this.sections_flecha[section] =  "▴"
    }else{
      this.sections_flecha[section] =  "▾"
    }
  }

  toggleMenu1(item: string) {
    this.activeMenu1 = null;
    this.activeMenu = this.activeMenu === item ? null : item;
    this.list_icon_section(item,2)
  }
  toggleMenu2(item: string) {
    this.activeMenu1 = this.activeMenu1 === item ? null : item;
    this.list_icon_section(item,2)
  }

  closeMenu() {
    this.activeMenu = null;
    this.activeMenu1 = null;
    this.sections_flecha['nuevo'] =  "▾"
    this.sections['nuevo'] = true
  }

  closeSection(){
    this.view_search=true
    this.query = "";
    this.clear_content()
  }

  clear_content(){
    this.documents_all = []
    this.total_all = 0
    this.limitBtnAll = 20
    this.offsetBtnAll = 0
    this.total_all_partial = 0
    this.state_view_3 = 1
  }

  list_icon_section(item, opt){
    this.sections[item] = !this.sections[item];
    if (!this.sections[item]){
      this.sections_flecha[item] =  "◂"
    }else{
      this.sections_flecha[item] =  "▾"
    }
  }

  deleteForm(event) {
    console.log(event)
      const dialogRef = this.dialogService.open(ConfirmDialog,{
        context:{
          data: {
            option: 'delete',
            title: 'Eliminar - ' + event['name'],
            content: 'Estas seguro de eliminar este documento?'
          }
        }
      });
      dialogRef.onClose.subscribe(result => {
        if (result == true) {
          this.formService.delete(event['id']).subscribe(
            response => {
              if (response['status']){
                this.toastService.showToast('success', event['name'], 'Eliminado con exito.');
                this.router.navigateByUrl('/RefrshComponent', {skipLocationChange: true}).then(()=> this.router.navigate(["/pages/search"]));
              }
            }, error => {
              this.toastService.showToast('danger', 'Error', 'No tienes permiso para realizar esta acción.');
            }
          );
        }
      });
    }

    cloneForm(event) {
        let data_content = {
          option: 'clone',
          title: 'Clonar - ' + event['name'],
          content: 'Estas seguro de clonar este documento?',
          num_clone: 1,
        };
        const dialogRef = this.dialogService.open(ConfirmDialog, {
          context: {
            data: data_content
          }
        });
        dialogRef.onClose.subscribe(result => {
          if (result == true) {
            let form_data = {
              'clone': data_content.num_clone
            }
            this.formService.clone(event['id'], form_data).subscribe(
              response => {
                if (response['status']){
                  this.toastService.showToast('success', event['name'], 'Se empezó el proceso de clonado, espera unos minutos y recarga la página.');
                  this.router.navigateByUrl('/RefrshComponent', {skipLocationChange: true}).then(()=> this.router.navigate(["/pages/search"]));
                }
              }, error => {
                this.toastService.showToast('danger', 'Error', '¡Ha ocurrido un error, inténtalo más tarde!');
              }
            );
          }
        });
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
            this.router.navigateByUrl('/RefrshComponent', {skipLocationChange: true}).then(()=> this.router.navigate(["/pages/search"]));
          }
        })
      }

      onDoubleClick(event){
        console.log(event)
        if(event['type'] == 'document' || event['type'] == 2){
          if(event['type'] == 'document'){
            this.router.navigateByUrl('/RefrshComponent', {skipLocationChange: true}).then(()=> this.router.navigate(["pages/form/update/" + event['id']]));
          }else{
            this.router.navigateByUrl('/RefrshComponent', {skipLocationChange: true}).then(()=> this.router.navigate(["pages/form/update/" + event['id_doc']]));
          }
        }else if(event['type'] == 'template' || event['type'] == 3){
          console.log("abre la plantilla")
          console.log(event)
          if(event['type'] == 'template'){
            this.router.navigateByUrl('/Ref rshComponent', {skipLocationChange: true}).then(()=> this.router.navigate(["pages/folder/" + event['id']]));
          }else{
            this.router.navigateByUrl('/RefrshComponent', {skipLocationChange: true}).then(()=> this.router.navigate(["pages/folder/" + event['id_doc']]));
          }
        }else{
          if('subject' in event){
            console.log("abre la respuesta")
            this.router.navigateByUrl('/RefrshComponent', { skipLocationChange: true }).then(() =>
            this.router.navigate(["pages/inbox"], { queryParams: { param1: event['id']} }));
          }else{
            console.log("abre la respuesta")
            this.router.navigateByUrl('/RefrshComponent', { skipLocationChange: true }).then(() =>
            this.router.navigate(["pages/inbox"], { queryParams: { param1: Number(event['id_doc'])} }));
          }

        }
      }
      onClickEdit(event){
        this.router.navigate(['/pages/form/answer/update/' + event['id_form'] + '/' + event['id'], {}]);
      }
}

@Component({
  selector: 'confirm-dialog',
  standalone: false,
  template: `
    <nb-card>
      <nb-card-header>
        <h4>{{data.title}}</h4>
      </nb-card-header>
      <nb-card-body>
        <div *ngIf="data.option == 'clone'">
          <label class="label" for="input-clone">Cantidad</label>
          <input id="input-clone" type="number" min="1" max="10" nbInput fullWidth placeholder="Cantidad" [(ngModel)]="data.num_clone" style="margin: 5px 0;">
        </div>
        <div style="margin: 5px 0;">
          {{data.content}}
        </div>
      </nb-card-body>
      <nb-card-footer>
        <button nbButton (click)="close(false)">Cancelar</button>
        <button nbButton
          (click)="close(true)"
          status="primary">
          Aceptar
        </button>
      </nb-card-footer>
    </nb-card>`,
  styles: ['nb-card-footer { text-align:end}', 'button {margin:5px}']
})

export class ConfirmDialog {
  public data: {
    option:string,
    title:string,
    content:string,
    num_clone?
  }
  constructor(
   public dialogRef: NbDialogRef<ConfirmDialog>, ){
  }
  close(response:boolean){
    this.dialogRef.close(response);
  }
}
