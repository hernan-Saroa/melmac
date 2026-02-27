import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { DashboardService } from '../../../services/dashboard.service';

@Component({
  selector: 'ngx-echarts-pie',
  template: `
    <h6 *ngIf="data_graph.length == 0" >No hay formularios diligenciados.</h6>
    <div id="graph" echarts *ngIf="data_graph.length != 0" [options]="options" class="echart"></div>
  `,
})
export class EchartsPieComponent implements AfterViewInit, OnDestroy {
  options: any = {};
  themeSubscription: any;

  data_graph = [];

  constructor(
    private theme: NbThemeService,
    private dashboardService:DashboardService
  ) {
  }

  ngAfterViewInit() {
    this.dashboardService.get_graph('1').subscribe(
      response => {
        if (response['status']){

          let data = response['data'];

          // Organiza de mayor a menor los formularios
          data.sort(function (a, b) {
            if (a.value < b.value) {
              return 1;
            }
            if (a.value > b.value) {
              return -1;
            }
            return 0;
          });

          // Toma los tres mas grandes
          data.forEach((value, key) => {
            if (key <= 2) {
              this.data_graph.push({
                'name': value.name,
                'value': value.value
              })
            }
          });

          this.themeSubscription = this.theme.getJsTheme().subscribe(config => {

            const colors = config.variables;
            const echarts: any = config.variables.echarts;

            this.options = {
              backgroundColor: echarts.bg,
              color: [colors.warningLight, colors.infoLight, colors.dangerLight, colors.successLight, colors.primaryLight],
              tooltip: {
                trigger: 'item',
                formatter: '{a} <br/>{b} : {c} ({d}%)',
              },
              legend: {
                orient: 'horizontal',
                left: 'left',
                data: this.data_graph,
                textStyle: {
                  color: echarts.textColor,
                },
              },
              series: [
                {
                  name: 'Documentos',
                  type: 'pie',
                  radius: '80%',
                  center: ['50%', '50%'],
                  data: this.data_graph,
                  itemStyle: {
                    emphasis: {
                      shadowBlur: 10,
                      shadowOffsetX: 0,
                      shadowColor: echarts.itemHoverShadowColor,
                    },
                  },
                  label: {
                    normal: {
                      textStyle: {
                        color: echarts.textColor,
                      },
                    },
                  },
                  labelLine: {
                    normal: {
                      lineStyle: {
                        color: echarts.axisLineColor,
                      },
                    },
                  },
                },
              ],
            };
          });
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.themeSubscription.unsubscribe();
  }
}
