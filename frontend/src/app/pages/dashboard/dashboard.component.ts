import { Component, OnInit } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { takeWhile } from 'rxjs/operators' ;
import { DashboardService } from '../../services/dashboard.service';

export interface CardSettings {
  title: string;
  value: string;
  iconClass: string;
  type: string;
}

@Component({
  selector: 'ngx-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  private alive = true;

  statusCards: string;

  commonStatusCardsSet: CardSettings[] = [];

  statusCardsByThemes: {
    default: CardSettings[];
    cosmic: CardSettings[];
    corporate: CardSettings[];
    dark: CardSettings[];
    material_light:  CardSettings[];
  } = {
    default: this.commonStatusCardsSet,
    cosmic: this.commonStatusCardsSet,
    corporate: this.commonStatusCardsSet,
    dark: this.commonStatusCardsSet,
    material_light: this.commonStatusCardsSet,
  };

  type_user:number;
  statistics = [];

  constructor(
    private themeService: NbThemeService,
    private dashboardService:DashboardService,
  ) {

    const user = JSON.parse(localStorage.getItem('session')) || null;
    if (user) {
      this.type_user = user.role;
      if (this.type_user == 1) {
        this.statistics = [
          {
            'option': '1',
            'name': 'Cantidad de Usuarios',
            'icon': 'nb-person',
            'type': 'success',
          },
          {
            'option': '5',
            'name': 'Cantidad de Empresas',
            'icon': 'nb-home',
            'type': 'info',
          },
          {
            'option': '6',
            'name': 'Documentos Totales',
            'icon': 'nb-bar-chart',
            'type': 'primary',
          },
          {
            'option': '3',
            'name': 'Documentos Diligenciados',
            'icon': 'nb-compose',
            'type': 'danger',
          },
        ]
      } else if (this.type_user == 2) {
        this.statistics = [
          {
            'option': '1',
            'name': 'Cantidad de Usuarios',
            'icon': 'nb-person',
            'type': 'success',
          },
          {
            'option': '2',
            'name': 'Documentos',
            'icon': 'nb-bar-chart',
            'type': 'primary',
          },
          {
            'option': '3',
            'name': 'Documentos Diligenciados',
            'icon': 'nb-compose',
            'type': 'danger',
          },
          {
            'option': '4',
            'name': 'Cantidad de Dispositivos',
            'icon': 'nb-audio',
            'type': 'warning',
          },
        ]
      } else if (this.type_user == 3) {
        this.statistics = [
          {
            'option': '2',
            'name': 'Documentos Asociados',
            'icon': 'nb-bar-chart',
            'type': 'primary',
          },
          {
            'option': '3',
            'name': 'Documentos Diligenciados',
            'icon': 'nb-compose',
            'type': 'danger',
          },
        ]
      }

      this.statistics.forEach(element => {
        this.dashboardService.get_indicator(element['option']).subscribe(
          response => {
            if (response['status']){
              let dataCard: CardSettings = {
                title: element['name'],
                value: response['data'],
                iconClass: element['icon'],
                type: element['type'],
              };
              this.commonStatusCardsSet.push(dataCard);
            }
          }
        );
      });
    }


    this.themeService.getJsTheme()
      .pipe(takeWhile(() => this.alive))
      .subscribe(theme => {
        let name = theme.name
        if ( theme.name=='material-light')
          name='material_light'
        this.statusCards = this.statusCardsByThemes[name];
    });
  }

  ngOnInit(): void {
  }

}
