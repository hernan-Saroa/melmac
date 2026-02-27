import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { DashboardService } from '../../../services/dashboard.service';

@Component({
  selector: 'ngx-echarts-bar',
  template: `
    <h6 *ngIf="data_graph.values.length == 0" >No hay formularios diligenciados.</h6>
    <div id="bar" echarts *ngIf="data_graph.values.length != 0" [options]="options" class="echart"></div>
  `,
})
export class EchartsBarComponent implements AfterViewInit, OnDestroy {

  data_graph = {
    'names': [],
    'values': [],
  };

  options: any = {};
  themeSubscription: any;

  constructor(
    private theme: NbThemeService,
    private dashboardService:DashboardService
  ) {

  }

  ngAfterViewInit() {

    this.dashboardService.get_graph('2').subscribe(
      response => {
        if (response['status']){
          let data = response['data'];

          data.forEach((value, key) => {
              this.data_graph['names'].push(value.name);
              this.data_graph['values'].push(value.value);
          });

          this.themeSubscription = this.theme.getJsTheme().subscribe(config => {

            const colors: any = config.variables;
            const echarts: any = config.variables.echarts;

            this.options = {
              backgroundColor: echarts.bg,
              color: [colors.primaryLight],
              tooltip: {
                trigger: 'axis',
                axisPointer: {
                  type: 'shadow',
                },
              },
              grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true,
              },
              xAxis: [
                {
                  type: 'category',
                  data: this.data_graph['names'],
                  axisTick: {
                    alignWithLabel: true,
                  },
                  axisLine: {
                    lineStyle: {
                      color: echarts.axisLineColor,
                    },
                  },
                  axisLabel: {
                    textStyle: {
                      color: echarts.textColor,
                    },
                  },
                },
              ],
              yAxis: [
                {
                  type: 'value',
                  axisLine: {
                    lineStyle: {
                      color: echarts.axisLineColor,
                    },
                  },
                  splitLine: {
                    lineStyle: {
                      color: echarts.splitLineColor,
                    },
                  },
                  axisLabel: {
                    textStyle: {
                      color: echarts.textColor,
                    },
                  },
                },
              ],
              series: [
                {
                  name: 'Diligenciados',
                  type: 'bar',
                  barWidth: '60%',
                  data: this.data_graph['values'],
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
