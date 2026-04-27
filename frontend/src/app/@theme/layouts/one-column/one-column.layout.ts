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
        <nb-sidebar-footer>
          <div class="sidebar-footer-wrapper">
            <div class="copyright-box">
              <span class="p-brand">Melmac ©</span>
              <span class="p-version">v2.0.0</span>
            </div>
            <button class="sidebar-toggle-btn" (click)="toggleManual()" title="Colapsar / Expandir Panel">
              <i class="fa" [ngClass]="isExpanded ? 'fa-chevron-left' : 'fa-chevron-right'"></i>
            </button>
          </div>
        </nb-sidebar-footer>
      </nb-sidebar>

      <nb-layout-column>
        <ng-content select="router-outlet"></ng-content>
      </nb-layout-column>

      <nb-layout-footer fixed [hidden]="footer_view">
        <ngx-footer></ngx-footer>
      </nb-layout-footer>
    </nb-layout>
  `,
    standalone: false
})
export class OneColumnLayoutComponent {

  footer_view;
  isExpanded: boolean = true;
  manualToggle: boolean = false;

  constructor(
    private sidebarService: NbSidebarService,
    private router: Router,
  ) {
    const user = JSON.parse(localStorage.getItem('session')) || null;
    if(user && user.footer_view){
      this.footer_view=false
    }else{
      this.footer_view=true
    }

    // Subscribe to state to keep our variable updated automatically
    this.sidebarService.onToggle().subscribe((data) => {
       // if responsive changes happen, keep in sync if possible
    });
  }

  toggleManual() {
    this.manualToggle = true; // Lock manual override
    this.isExpanded = !this.isExpanded;
    if (this.isExpanded) {
      this.sidebarService.expand('menu-sidebar');
    } else {
      this.sidebarService.compact('menu-sidebar');
    }
  }

  changeStyle($event) {
    // If the user manually toggled it, don't let hover break their preference!
    if (this.manualToggle) return;

    if (this.router.url == '/pages/geoportal' || this.router.url == '/pages/geoportal/answer') {
      if ($event.type == 'mouseover') {
        this.sidebarService.expand('menu-sidebar');
        this.isExpanded = true;
      } else {
        this.sidebarService.compact('menu-sidebar');
        this.isExpanded = false;
      }
    }
  }
}
