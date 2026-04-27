import { Component, OnInit } from '@angular/core';
import { NbDialogService, NbThemeService } from '@nebular/theme';
import { THEMES } from '../@theme/components';
import { NgIf } from '@angular/common';
import { LandingformComponent } from './landingform/landingform.component';

@Component({
    selector: 'ngx-landing',
    templateUrl: './landing.component.html',
    styleUrls: ['./landing.component.scss'],
    standalone: false
})
export class LandingComponent implements OnInit {
  openFormModal = 0;
  
  constructor(
    private dialogService: NbDialogService,
    private themeService: NbThemeService
  ) {}

  ngOnInit(): void {
    localStorage.removeItem('colorbtnV');
    localStorage.removeItem('colorbtnV2');
    localStorage.removeItem('loglevel');
    sessionStorage.removeItem('environment');
    let that = this;
    window.onscroll = function() {
      var y = window.scrollY;
      let convert = Math.round(y)
      if (that.openFormModal == 0) {
        if (convert >= 500 && convert <= 676){
          that.openFormModal = 1;
          that.openModal();
        }
      }
    };
  }

  openModal() {
    const dialogRef = this.dialogService.open(LandingformComponent, {closeOnBackdropClick:false, closeOnEsc:false });
    dialogRef.onClose.subscribe(result => {
      //console.log(result);
    });
  }

}
