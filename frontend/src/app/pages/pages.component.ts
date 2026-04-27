import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SiteService } from '../services/site.service';
import { ToastService } from '../usable/toast.service';
import { SwitchService } from '../services/switch.service';

import { MENU_ITEMS } from './pages-menu';

declare global {
  interface Window {
    intervalCheckLogged: NodeJS.Timeout;
  }
}

@Component({
    selector: 'ngx-pages',
    styleUrls: ['pages.component.scss'],
    template: `
    <ngx-one-column-layout>
      <nb-menu [items]="menu" (click)="onclick()"></nb-menu>
      <router-outlet></router-outlet>
    </ngx-one-column-layout>
  `,
    standalone: false
})
export class PagesComponent implements OnInit{

  menu = MENU_ITEMS;
  session_data;
  session_sock;

  constructor(
    private router: Router,
    private siteService: SiteService,
    private toastService: ToastService,
    private modalSS:SwitchService,
  ) {}

  ngOnInit(): void {
    const user_data = JSON.parse(localStorage.getItem('session')) || null;

    if (user_data){
      this.menu.forEach(element => {
        
        if (user_data['role'] == 1) {
          if (element.title != 'Inicio' && element.data != -1) {
            if (element.title == 'APIS'){
              element.hidden = false;
            } else {
              element.hidden = true;
            }
          } else {
            element.hidden = false;
          }
        } else {
          let hidden_element = 0;
          let num_element = 0;

          if (element.children) {
            element.children.forEach(child => {
              num_element++;

              let hidden_child = 0;
              let num_child = 0;

              if (child.children) {
                child.children.forEach(child_two => {
                  num_child++;
                  if (child_two.data != undefined && !user_data['permission'].includes(child_two.data)){
                    child_two.hidden = true;
                    hidden_child++;
                  } else {
                    child_two.hidden = false;
                  }
                });
              } else {
                hidden_child = -1;
              }

              if ((hidden_child == num_child) || (child.data != undefined && !user_data['permission'].includes(child.data))){
                child.hidden = true;
                hidden_element++;
              } else {
                child.hidden = false;
              }

            });
          } else {
            hidden_element = -1;
          }
          if (element.data && typeof element.data != 'number' && element.data.admin && user_data['role'] == 2){
            element.hidden = false;
          } else if ((hidden_element == num_element) || (element.data != undefined && !user_data['permission'].includes(element.data))){
            element.hidden = true;
          } else {
            element.hidden = false;
          }
        }
      });

    }
    
    if(window.intervalCheckLogged != undefined || window.intervalCheckLogged != null){
      window.clearInterval(window.intervalCheckLogged);
    }
    window.intervalCheckLogged = setInterval(() => {
      if (localStorage.getItem('session')){
        this.siteService.checkLogged().subscribe(response => {
        }, error => {
          localStorage.removeItem('session');
          this.router.navigate(['/login', {}]);
        });
      }
    }, 60000);

  }

  onclick(){
    let url_parts = this.router.url.split('/');
    if(url_parts[1]=="pages" && url_parts[2]=="inbox"){
      setTimeout(()=>{
          this.modalSS.$modalsing.emit(0)
      }, 300);
    }
  }
}
