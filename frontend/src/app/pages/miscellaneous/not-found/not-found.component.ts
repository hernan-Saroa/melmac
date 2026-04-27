import { NbMenuService } from '@nebular/theme';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'ngx-not-found',
    styleUrls: ['./not-found.component.scss'],
    templateUrl: './not-found.component.html',
    standalone: false
})
export class NotFoundComponent {

  btn_back = true;

  constructor(
    private menuService: NbMenuService,
    private activatedRoute: ActivatedRoute,
  ) {
    this.activatedRoute.data.subscribe(data => {
      if (data['option'] == 'public') {
        this.btn_back = false;
      }
    });
  }

  goToHome() {
    this.menuService.navigateHome();
  }
}
