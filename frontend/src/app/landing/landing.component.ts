import { Component, OnInit } from '@angular/core';
import { NbDialogService, NbThemeService } from '@nebular/theme';
import { THEMES } from '../@theme/components';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';
import { NgIf } from '@angular/common';
import { LandingformComponent } from './landingform/landingform.component';

@Component({
  selector: 'ngx-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  images = [944, 1011, 984].map((n) => `https://picsum.photos/id/${n}/1900/900`);
  pauseOnHover = true;
  showNavigationArrows = true;
	showNavigationIndicators = true;
  openFormModal = 0;
  constructor(
    private dialogService: NbDialogService,
    private themeService: NbThemeService,
    config: NgbCarouselConfig
  ) {config.showNavigationArrows = true;
		config.showNavigationIndicators = false;}

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
