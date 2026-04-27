import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService } from '../../services/form.service';
import { SharedService } from '../shared.service';
import { NbThemeService } from '@nebular/theme';
import { THEMES } from '../../@theme/components';

@Component({
    selector: 'ngx-info',
    templateUrl: './info.component.html',
    styleUrls: ['./info.component.scss'],
    standalone: false
})
export class InfoComponent implements OnInit {

  token_link = '';
  option = '';

  title = '';
  sub_title = '';
  btn_disabled = true;
  message = '';
  footer = '';
  logo = '';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private _sharedService: SharedService,
    private formService:FormService,
    private themeService: NbThemeService,
  ) {
    this.token_link = this.activatedRoute.snapshot.paramMap.get('token');
    this.option = this.activatedRoute.snapshot.paramMap.get('option');
    this.getDataToken();
    this.getDataEnterprise();
  }

  ngOnInit(): void {
  }

  getDataEnterprise(name_form='Cargando...') {
    this.formService.get_enterprise_token(this.token_link).subscribe(
      response => {
        console.log("response:");
        console.log(response);
        if (response['status']){
          this._sharedService.emitChange(response['data']);
        }
        this.footer = response['data']['footer']

        if (response['data']['logo'][1] != '') {
          this.logo = response['data']['logo'][0] + response['data']['logo'][1];
        }

        if (response['data']['theme']){
          this.themeService.changeTheme(THEMES.filter((val) => response['data']['theme'] == val.value).map((val) => val.value === 1 ? 'default' : val.name )[0].toLowerCase());
        }
        setTimeout(() => {

          // Box Header
          const boxHeader = document.getElementById('headerT');
          if (response['data']['colorB'] && response['data']['colorB'] != 'None'){  
            boxHeader.classList.add('boxHeader');
            boxHeader.style.setProperty("--my-var", response['data']['colorB']);
          }else{
            boxHeader.classList.add('boxHeaderN');
            boxHeader.style.setProperty("--my-var", response['data']['colorB']);
          }

          // Box Footer
          const boxFooter = document.getElementById('footerT');
          if (response['data']['colorBF'] && response['data']['colorBF'] != 'None'){  
            boxFooter.classList.add('boxHeader');
            boxFooter.style.setProperty("--my-var", response['data']['colorBF']);
          }else{
            boxFooter.classList.add('boxHeaderN');
            boxFooter.style.setProperty("--my-var", response['data']['colorBF']);
          }

          // Footer Text
          const footerText = document.getElementById('footerText');
          if (response['data']['colorBFF'] && response['data']['colorBFF'] != 'None'){  
            footerText.classList.add('footerText');
            footerText.style.setProperty("--my-var", response['data']['colorBFF']);
          }else{
            footerText.classList.add('footerTextN');
            footerText.style.setProperty("--my-var", response['data']['colorBFF']);
          }

          // Títle
          const colorTitle = document.getElementById('contdiv2');
          if (response['data']['colorBFT']  && response['data']['colorBFT'] != 'None'){
            colorTitle.classList.add('colorTitle');
            colorTitle.style.setProperty("--my-var", response['data']['colorBFT']);
          }else{
            colorTitle.classList.add('colorTitleN');
            colorTitle.style.setProperty("--my-var", response['data']['colorBFT']);
          }

          // Description
          const colorDesc = document.getElementById('contdivdesc');
          if (response['data']['colorBFD']  && response['data']['colorBFD'] != 'None'){
            colorDesc.classList.add('colorDesc');
            colorDesc.style.setProperty("--my-var", response['data']['colorBFD']);
          }else{
            colorDesc.classList.add('colorDescN');
            colorDesc.style.setProperty("--my-var", response['data']['colorBFD']);
          }

          // Button Send
          const buttonSend = document.getElementById('btnSendForm') as HTMLElement;
          const colorHex = response['data']['colorBPB']; // Asumiendo que colorBPB tiene un valor hexadecimal
          const myVarRgb = this.hexToRgb(colorHex,0.75);
          const myVarRgbs = this.hexToRgb(colorHex,0.1);

          if (buttonSend) {
            const colorButtonSendText = buttonSend.querySelector('span#colorButtonSendText') as HTMLElement;
        
            if (response['data']['colorBPB'] && response['data']['colorBPB'] !== 'None') {
                buttonSend.classList.add('appearanceButtonSend');
                buttonSend.style.setProperty("--my-var", myVarRgb);
            }else{
              buttonSend.classList.add('appearanceButtonSendN');
              buttonSend.style.setProperty("--my-var3", response['data']['colorBPB']);
            }
        
            if (colorButtonSendText) {
              if (response['data']['colorBPT'] && response['data']['colorBPT'] !== 'None') {
                  colorButtonSendText.classList.add('buttonText');
                  colorButtonSendText.style.setProperty("--my-var", response['data']['colorBPT']);
              } else {
                  colorButtonSendText.classList.add('buttonTextN');
                  colorButtonSendText.style.setProperty("--my-var6", response['data']['colorBPT']);
              }
            }
          }

        });
      }
    );
  }

  hexToRgb(hex, to) {
    // Remover el símbolo '#' si está presente
      hex = hex.replace(/^#/, '');
      
      // Convertir a RGB
      let bigint = parseInt(hex, 16);
      let r = (bigint >> 16) & 255;
      let g = (bigint >> 8) & 255;
      let b = bigint & 255;
      let t = to

      return `rgb(${r}, ${g}, ${b}, ${t})`;
  }

  getDataToken() {
    this.formService.get_form_token(this.token_link).subscribe(
     // <!-- ESTO SE DEBE MODIFICAR -->
      response => {
        this.title = response['form']['name'];
        if (this.option == 'success') {
          this.sub_title = 'Documento enviado correctamente.';
        }
        if (response['status']) {
          this.btn_disabled = false;
        } else {
          this.message = response['info'];
        }
      }, error => {
        this.router.navigate(['/public', {}]);
      }
    );
  }

  goNew() {
    this.router.navigate(['/public/' + this.token_link, {}]);
  }

}
