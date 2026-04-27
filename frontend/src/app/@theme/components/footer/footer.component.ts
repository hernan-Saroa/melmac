import { Component } from '@angular/core';

@Component({
    selector: 'ngx-footer',
    styleUrls: ['./footer.component.scss'],
    template: `
    <span class="created-by">
      {{ footer }}
    </span>
    <div class="socials">
      <a href="https://www.facebook.com/people/Hernan-Saroa/100074470931177/" target="_blank" class="ion ion-social-facebook"></a>
    </div>
  `,
    standalone: false
})
export class FooterComponent {
  footer = '© Saroa SAS 2021';
  constructor() {
    let user = JSON.parse(localStorage.getItem('session'));
    let footer_position = user.variable_plataform.map(function(e) { return e.name; }).indexOf('footer');
    if (footer_position != -1) {
      this.footer = user.variable_plataform[footer_position].value;
    }
  }
}
