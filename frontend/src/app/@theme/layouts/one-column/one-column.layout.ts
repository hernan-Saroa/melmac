import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NbSidebarService } from '@nebular/theme';

@Component({
  selector: 'ngx-one-column-layout',
  styleUrls: ['./one-column.layout.scss'],
  template: `
    <nb-layout windowMode>
      <nb-layout-header fixed>
        <ngx-header></ngx-header>
      </nb-layout-header>

      <nb-sidebar (mouseover)="changeStyle($event)" (mouseout)="changeStyle($event)" class="menu-sidebar" tag="menu-sidebar" responsive>
        <ng-content select="nb-menu"></ng-content>
      </nb-sidebar>

      <nb-layout-column>
        <ng-content select="router-outlet"></ng-content>
      </nb-layout-column>

      <nb-layout-footer fixed [hidden]="footer_view">
        <ngx-footer></ngx-footer>
      </nb-layout-footer>
    </nb-layout>
  `,
})
export class OneColumnLayoutComponent {

  footer_view;

  constructor(
    private sidebarService: NbSidebarService,
    private router: Router,
  ) {
    const user = JSON.parse(localStorage.getItem('session')) || null;
    if(user.footer_view){
      this.footer_view=false
    }else{
      this.footer_view=true
    }

    // this.sidebarService.onToggle().subscribe(info => {
    //   console.log('info');
    //   console.log(info);
    // });
  }

  changeStyle($event) {
    if (this.router.url == '/pages/geoportal' || this.router.url == '/pages/geoportal/answer') {
      if ($event.type == 'mouseover') {
        this.sidebarService.expand('menu-sidebar');
      } else {
        this.sidebarService.compact('menu-sidebar');
      }
    }
  }
}
