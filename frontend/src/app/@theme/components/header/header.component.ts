import { HttpHeaders, HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NbMediaBreakpointsService, NbMenuService, NbSidebarService, NbThemeService } from '@nebular/theme';

import { LayoutService } from '../../../@core/utils';
import { filter, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { BASE_URL } from '../../../services/site.service';
import { EnterpriseService } from '../../../services/enterprise.service';
import { WsSendService } from '../../../services/ws-send.service';
import { ToastService } from '../../../usable/toast.service';
import { UserService } from '../../../services/user.service';

export interface Notification_Scheme {
  icon: string,
  title: string,
  description : string,
  status: string,
  extra?:any,
  id?,
}

export const THEMES = [
  {
    value: 1,
    name: 'Light',
  },
  {
    value: 2,
    name: 'Dark',
  },
];


const USER_MENU = [
  {
    icon: 'person-outline',
    title: 'Perfil',
    link:'/pages/profile'
  },
  {
    title: 'Empresa',
    icon: 'pantone-outline',
    link: '/pages/enterprise/detail',
    data: {
      admin: true
    }
  },
  {
    title: 'Auditoria',
    icon: 'file-text-outline',
    link: '/pages/traceability',
    data: 58
  },
  {
    icon: 'log-out-outline',
    title: 'Cerrar Sesión'
  }
];

@Component({
  selector: 'ngx-header',
  styleUrls: ['./header.component.scss'],
  templateUrl: './header.component.html',
  standalone: false
})
export class HeaderComponent implements OnInit, OnDestroy {

  private destroy$: Subject<void> = new Subject<void>();
  userPictureOnly: boolean = false;
  user: any;
  notification_list: Notification_Scheme[] = [];

  themes = THEMES;

  time_now = new Date();

  currentTheme = 1;
  foundOtherObject

  userMenu = [
  ];

  image_theme;

  // Variables para Socket
  wsSendService:WsSendService;
  session_sock;
  notify_end = false;
  left_read = false;

  mainTitle = 'Melmac';

  dict_permissions = [
                    // Inicio
                    {id:71, root:'/pages/home'},
                    // Estadisticas
                    {id:62, root:'/pages/statistics'},
                    // Geoportal
                    {id:60, root:'/pages/geoportal'},
                    // Recibidos
                    {id:38, root:'/pages/inbox'},
                    // Mi Unidad
                    {id:68, root:'/pages/envelope'},
                    // Documentos
                    {id:14, root:'/pages/form/view'},
                    {id:15, root:'/pages/form/create'},
                    // Informes
                    {id:59, root:'/pages/answer/report'},
                    {id:69, root:'/pages/answer/report/zip'},
                    // Servicio en campo
                    //{id:60, root:'/pages/geoportal/point'},
                    {id:40, root:'/pages/route/view'},
                    //{id:40, root:'/pages/route/monitor'},
                    {id:45, root:'/pages/admin/project'},
                    {id:50, root:'/pages/admin/location'},
                    {id:63, root:'/pages/visits/programming/general'},
                    // Dispositivos
                    {id:19, root:'/pages/admin/device-category'},
                    {id:24, root:'/pages/device'},
                    {id:25, root:'/pages/massive/device'},
                    // Control
                    {id:6, root:'/pages/admin/permit'},
                    {id:9, root:'/pages/admin/role'},
                    {id:73, root:'/pages/contacts'},
                    {id:1, root:'/pages/user'},
                    {id:2, root:'/pages/massive/user'},
                    // Ajustes
                    {id:56, root:'/pages/admin/parameter'},
                    //Planes
                    {id:72, root:'/pages/planUser'},
                    ];

  constructor(private sidebarService: NbSidebarService,
              private menuService: NbMenuService,
              private themeService: NbThemeService,
              private userService: UserService,
              private enterpriseService: EnterpriseService,
              private layoutService: LayoutService,
              private breakpointService: NbMediaBreakpointsService,
              private router:Router,
              private http:HttpClient,
              private toastService:ToastService) {
  }

  ngOnInit() {
    // this.currentTheme = this.themeService.currentTheme;
    this.user = JSON.parse(localStorage.getItem('session'));
    // console.log(this.user.theme);
    this.changeTheme(this.user.theme);
    if (this.user.main_title != '')
      this.mainTitle = this.user.main_title
    if (this.user.role != 2){
      this.userMenu = USER_MENU.filter((e) => {
        if (e.data){
          if (e.data == 58) {
            if (!this.user['permission'].includes(58)) {
              return false;
            }
          }
        }
        return true;
      })
    } else {
      this.userMenu = USER_MENU;
    }
    // this.session_data = JSON.parse(localStorage.getItem('session'));

    // this.userService.getUsers()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe((users: any) => this.user = users.nick);

    const { xl } = this.breakpointService.getBreakpointsMap();
    this.themeService.onMediaQueryChange()
      .pipe(
        map(([, currentBreakpoint]) => currentBreakpoint.width < xl),
        takeUntil(this.destroy$),
      )
      .subscribe((isLessThanXl: boolean) => this.userPictureOnly = isLessThanXl);

    // this.themeService.onThemeChange()
    //   .pipe(
    //     map(({ name }) => name),
    //     takeUntil(this.destroy$),
    //   )
    //   .subscribe(themeName => this.currentTheme = themeName);

      this.menuService.onItemClick()
      .pipe(
        filter(({ tag }) => tag === 'profile-context-menu'),
        map(({ item: { title } }) => title),
      )
      .subscribe(title => {
        if (title == "Cerrar Sesión"){
          let user = JSON.parse(localStorage.getItem('session')) || null;
          let env = sessionStorage.getItem('environment');
          if (user){
            const reqHeader = new HttpHeaders({
              'Content-Type': 'application/json',
              'Authorization': 'Token ' + user.token
            });
            const path = BASE_URL + 'logout/';
            this.http.get<{}>(path, { headers: reqHeader }).toPromise().then(response => {
              // console.log(response)
            });

            localStorage.removeItem('session');
            localStorage.removeItem('colorbtnV');
            localStorage.removeItem('colorbtnV2');
            localStorage.removeItem('loglevel');
          }
          // console.log(env);
          if (env){
            env = env.split(';')[0];
            window.location.href = ('/site/'+env+'/');
          }else{
            this.router.navigate(['/login']);
          }
        }
      });

      this.loadNextNotify();

      this.wsSendService = new WsSendService();
      // Socket - Canal de usuario
      this.session_sock = this.wsSendService.recive_user().subscribe((response) => {
        let resp_data = JSON.parse(response.data)
        if (resp_data.action == 'Login' && resp_data.data != this.user.token) {
          localStorage.removeItem('session');
          localStorage.removeItem('colorbtnV');
          localStorage.removeItem('colorbtnV2');
          localStorage.removeItem('loglevel');
          this.toastService.showToast('info', 'Cerrado de Sesión', 'Se ha iniciado sesión desde otro dispositivo.');
          setTimeout(() => {
            this.router.navigate(['/login', {}]);
            }, 1000
          );
        } else if (resp_data.action == 'Notify'){
          let icon = 'radio-button-on-outline';
          let status = 'default';
          switch(resp_data.data.type){
            case 1:
              icon = 'alert-circle-outline'
              status = 'danger'
              break;
            case 2:
              icon = 'alert-triangle-outline'
              status = 'warning'
              break;
            case 3:
              icon = 'question-mark-circle-outline'
              status = 'info'
              break;
            case 4:
              icon = 'checkmark-circle-outline'
              status = 'success'
              break;
          }
          let notification:Notification_Scheme = {
            icon: icon,
            title: resp_data.data.title,
            description: resp_data.data.description,
            status: status,
            id: resp_data.data.id,
          };
          if (resp_data.data.extra){
            notification.extra = {};
            let extra = JSON.parse(resp_data.data.extra);
            if (extra['answer_id']){
              notification.extra['link'] = '/pages/answer/view/' + extra['answer_id'];
              notification.extra['item'] = 'respuesta';
            }
          }
          this.notification_list = [notification].concat(this.notification_list);
          this.left_read = true;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    this.session_sock.unsubscribe()
    this.session_sock = null;
    this.wsSendService = null;
  }

  onChangeTheme(theme: number) {
    let data = {
      'theme': theme
    }
    this.enterpriseService.updateTheme(data).subscribe(
      response => {
        if (response['status']) {
          this.changeTheme(theme);
          let UpdateFromLocalStorage = JSON.parse(localStorage.getItem("session"));
          UpdateFromLocalStorage.theme = theme;
          localStorage.setItem("session",JSON.stringify(UpdateFromLocalStorage));
        }
      }
    );
  }

  changeTheme(theme: number) {
    this.currentTheme = theme;
    let theme_name = ''
    switch (theme) {
      case 2:
        theme_name = 'dark';
        this.image_theme = './assets/images/Logo-Melmac-Blanco-III.png'
        break;
      // case 3:
      //   theme_name = 'cosmic';
      //   break;
      case 4:
        theme_name = 'corporate';
        this.image_theme = './assets/images/Logo-Melmac-Blanco-I.png'
        break;
      case 3:
        theme_name = 'material-light';
        this.image_theme = './assets/images/Logo-Melmac-Blanco-I.png'
        break;
      default:
        theme_name = 'default';
        this.image_theme = './assets/images/landing/logo_definitivo.png'
        break;
    }
    this.themeService.changeTheme(theme_name);
  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'menu-sidebar');
    this.layoutService.changeLayoutSize();

    return false;
  }

  navigateHome() {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;
    let permission = user_data['permission'].includes(62)  // Dashboard permission
    let not_geo_permission = user_data['permission']
    //const randomPermission = not_geo_permission[Math.floor(Math.random() * not_geo_permission.length)];
    if(permission) {
      const foundObject = this.dict_permissions.find(obj => obj.id === 62);
        this.router.navigate([foundObject.root, {}]);
    } else {
      let foundOtherObjects = false;
      let attempts = 0;
      const maxAttempts = 3;
      while (!foundOtherObjects && attempts < maxAttempts) {
        const randomPermission = not_geo_permission[Math.floor(Math.random() * not_geo_permission.length)];
        if(not_geo_permission.includes(randomPermission)){
          this.foundOtherObject = this.dict_permissions.find(obj => obj.id === randomPermission);
          foundOtherObjects = true;
          break;
        }
        attempts++;
      }
      if(this.foundOtherObject){
        this.router.navigate([this.foundOtherObject.root, {}]);
      }
    }
    // this.menuService.navigateHome();
    return false;
  }

  markAsReaded(){
    let ids = this.notification_list.map(value => value.id);
    this.userService.markAsReaded(ids).subscribe((response)=>{
      this.left_read = false;
    });
  }

  markAsDeleted(id){
    this.userService.markAsDeleted(id).subscribe((response)=>{
      if (response['status']){
        let data = [];
        this.notification_list = this.notification_list.filter((value)=>{
          return (value.id != id);
        });
      }
    }, (error)=>{
      this.toastService.showToast('danger', 'Hubo un problema', 'Parece que no hemos podido eliminar esta notificación, por favor intenta de nuevo mas tarde.');
    });
  }

  loadNextNotify(){
    let pos = Math.floor(this.notification_list.length / 10) ;
    this.userService.getNotifications(pos).subscribe((response)=>{
      if (response['status']){
        let data = [];
        response['data'].forEach(element => {
          let icon = 'radio-button-on-outline';
          let status = 'default';
          switch(element.type){
            case 1:
              icon = 'alert-circle-outline'
              status = 'danger'
              break;
            case 2:
              icon = 'alert-triangle-outline'
              status = 'warning'
              break;
            case 3:
              icon = 'question-mark-circle-outline'
              status = 'info'
              break;
            case 4:
              icon = 'checkmark-circle-outline'
              status = 'success'
              break;
          }
          let notification:Notification_Scheme = {
            icon: icon,
            title: element.title,
            description: element.description,
            status: status,
            id: element.id,
          };
          if (element.extra){
            notification.extra = {};
            let extra = JSON.parse(element.extra);
            if (extra['answer_id']){
              notification.extra['link'] = '/pages/answer/view/' + extra['answer_id'];
              notification.extra['item'] = 'respuesta';
            }
          }
          if (!this.notification_list.includes(notification))
            data.push(notification);
          if (element.status == 0){
            this.left_read = true;
          }
        })

        this.notification_list = this.notification_list.concat(data);
        if (response['data'].length < 10) {
          this.notify_end = true;
        }
      }
    }, null, null);
  }

}
