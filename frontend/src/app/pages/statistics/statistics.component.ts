import { Component, OnInit } from '@angular/core';
import { NbThemeService } from '@nebular/theme';
import { StatisticsService } from '../../services/statistics.service';
import { EnterpriseService } from '../../services/enterprise.service';
import { FormService } from '../../services/form.service';
import * as moment from 'moment';

@Component({
  selector: 'ngx-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
  standalone: false
})
export class StatisticsComponent implements OnInit {

  // Filters
  enterprises: any[] = [];
  selectedEnterprise: string = '';
  forms: any[] = [];
  selectedForm: string = 'all';
  endDate: any = moment();
  startDate: any = moment().startOf('month');

  // Data
  summaryData: any = null;
  
  // Charts
  optionsTimeline: any = {};
  optionsTopEnterprises: any = {};
  optionsServices: any = {};
  optionsActivePlans: any = {};
  optionsUserTypes: any = {};
  optionsDocumentTypes: any = {};
  optionsSharedDocs: any = {};
  optionsTemplateMetrics: any = {};
  optionsBillables: any = {};
  optionsSignedDocs: any = {};
  optionsSignatures: any = {};
  optionsTransactions: any = {};
  themeSubscription: any;

  userRole: number;

  constructor(
    private statisticsService: StatisticsService,
    private enterpriseService: EnterpriseService,
    private formService: FormService,
    private themeService: NbThemeService
  ) { 
    const session = JSON.parse(localStorage.getItem('session')) || null;
    if (session) {
      this.userRole = session.role;
    }
  }

  ngOnInit(): void {
    if (this.userRole === 1) {
      this.enterpriseService.view().subscribe((res: any) => {
        if (res.status !== false) {
          const rawList = res.data ? res.data : (Array.isArray(res) ? res : []);
          
          const uniqueEnts = {};
          rawList.forEach((item: any) => {
            if (item.enterprise_id && !uniqueEnts[item.enterprise_id]) {
              uniqueEnts[item.enterprise_id] = {
                id: item.enterprise_id,
                name: item.enterprise__name || 'Empresa ' + item.enterprise_id
              };
            }
          });
          
          this.enterprises = Object.values(uniqueEnts);
        }
      });
    }

    this.formService.list().subscribe((res: any) => {
      if (res.status !== false) {
        this.forms = res.data ? res.data : (Array.isArray(res) ? res : []);
      }
    });

    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  loadData(): void {
    const sDate = this.startDate ? this.formatDate(this.startDate) : '';
    const eDate = this.endDate ? this.formatDate(this.endDate) : '';
    const entId = this.selectedEnterprise !== 'all' ? this.selectedEnterprise : '';
    const formId = this.selectedForm !== 'all' ? this.selectedForm : '';

    this.statisticsService.getSummary(entId, sDate, eDate, formId).subscribe({
      next: (res) => {
        if (res.status) {
          this.summaryData = res.data;
          this.buildSignedDocsChart(this.summaryData.signed_documents, this.summaryData.unsigned_documents);
          this.buildSignaturesChart(this.summaryData.signatures);
          this.buildTransactionsChart(this.summaryData.transactions);
        }
      }
    });

    this.statisticsService.getTimeline(entId, sDate, eDate, formId).subscribe({
      next: (res) => {
        if (res.status) this.buildTimelineChart(res.data);
      }
    });

    if (this.userRole === 1) {
      this.statisticsService.getTopEnterprises(sDate, eDate).subscribe({
        next: (res) => {
          if (res.status) this.buildTopEnterprisesChart(res.data);
        }
      });
    }

    this.statisticsService.getServices(entId, sDate, eDate, formId).subscribe({
      next: (res) => {
        if (res.status) this.buildServicesChart(res.data);
      }
    });

    if (this.userRole === 1) {
      this.statisticsService.getActivePlans().subscribe({
        next: (res) => { if (res.status) this.buildActivePlansChart(res.data); }
      });
      // Ranking Top Enterprises was missing. If it doesn't exist, we skip.
    }

    this.statisticsService.getUserTypes(entId, sDate, eDate).subscribe({
      next: (res) => { if (res.status) this.buildUserTypesChart(res.data); }
    });
    this.statisticsService.getTemplateMetrics(entId, sDate, eDate, formId).subscribe({
      next: (res) => { if (res.status) this.buildTemplateMetricsChart(res.data); }
    });

    this.statisticsService.getDocumentTypes(entId, sDate, eDate, formId).subscribe({
      next: (res) => { if (res.status) this.buildDocumentTypesChart(res.data); }
    });
    this.statisticsService.getSharedDocuments(entId, sDate, eDate, formId).subscribe({
      next: (res) => { if (res.status) this.buildSharedDocsChart(res.data); }
    });
    this.statisticsService.getBillableTransactions(entId, sDate, eDate, formId).subscribe({
      next: (res) => { if (res.status) this.buildBillablesChart(res.data); }
    });
  }

  exportData(): void {
    const sDate = this.startDate ? this.formatDate(this.startDate) : '';
    const eDate = this.endDate ? this.formatDate(this.endDate) : '';
    const entId = this.selectedEnterprise !== 'all' ? this.selectedEnterprise : '';
    
    this.statisticsService.exportAuditTrail(entId, sDate, eDate).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_trail_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      },
      error: (err) => {
        console.error('Error al exportar los datos:', err);
      }
    });
  }

  clearDates() {
    this.startDate = null;
    this.endDate = null;
    this.selectedEnterprise = 'all';
    this.selectedForm = 'all';
    this.loadData();
  }

  formatDate(date: any): string {
    if (moment.isMoment(date)) {
      return date.format('YYYY-MM-DD');
    }
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  buildTimelineChart(data: any[]) {
    this.themeSubscription = this.themeService.getJsTheme().subscribe(config => {
      const _colors: any = config.variables; const colors = { primary: "#79b3a5", success: "#509180", info: "#a5d1c6", warning: "#366e60", danger: "#c2dcd5", primaryLight: "#e0f0ec" };
      const echarts: any = config.variables.echarts;

      this.optionsTimeline = {
        backgroundColor: echarts.bg,
        color: [colors.primary],
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' }
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: [
          {
            type: 'category',
            boundaryGap: false,
            data: data.map(d => d.date),
            axisTick: { alignWithLabel: true },
            axisLine: { lineStyle: { color: echarts.axisLineColor } },
            axisLabel: { textStyle: { color: echarts.textColor } }
          }
        ],
        yAxis: [
          {
            type: 'value',
            axisLine: { lineStyle: { color: echarts.axisLineColor } },
            splitLine: { lineStyle: { color: echarts.splitLineColor } },
            axisLabel: { textStyle: { color: echarts.textColor } }
          }
        ],
        series: [
          {
            name: 'Documentos Creados',
            type: 'line',
            smooth: true,
            areaStyle: { opacity: 0.3 },
            label: { show: true, position: 'top', fontWeight: 'bold' },
            data: data.map(d => d.count)
          }
        ]
      };
    });
  }

  buildTopEnterprisesChart(data: any[]) {
    this.themeSubscription = this.themeService.getJsTheme().subscribe(config => {
      const _colors: any = config.variables; const colors = { primary: "#79b3a5", success: "#509180", info: "#a5d1c6", warning: "#366e60", danger: "#c2dcd5", primaryLight: "#e0f0ec" };
      const echarts: any = config.variables.echarts;

      // Reverse to show highest at the top in horizontal bar chart
      const reversedData = [...data].reverse();

      this.optionsTopEnterprises = {
        backgroundColor: echarts.bg,
        color: [colors.info],
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: echarts.axisLineColor } },
          splitLine: { lineStyle: { color: echarts.splitLineColor } },
          axisLabel: { textStyle: { color: echarts.textColor } }
        },
        yAxis: {
          type: 'category',
          data: reversedData.map(d => d.enterprise.substring(0, 15) + (d.enterprise.length > 15 ? '...' : '')),
          axisTick: { alignWithLabel: true },
          axisLine: { lineStyle: { color: echarts.axisLineColor } },
          axisLabel: { textStyle: { color: echarts.textColor } }
        },
        series: [
          {
            name: 'Documentos Creados',
            type: 'bar',
            barWidth: '50%',
            label: { show: true, position: 'right', fontWeight: 'bold' },
            data: reversedData.map(d => d.docs_count),
            itemStyle: { borderRadius: [0, 4, 4, 0] }
          }
        ]
      };
    });
  }

  buildServicesChart(data: any[]) {
    this.themeSubscription = this.themeService.getJsTheme().subscribe(config => {
      const _colors: any = config.variables; const colors = { primary: "#79b3a5", success: "#509180", info: "#a5d1c6", warning: "#366e60", danger: "#c2dcd5", primaryLight: "#e0f0ec" };
      const echarts: any = config.variables.echarts;

      this.optionsServices = {
        backgroundColor: echarts.bg,
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: [
          {
            type: 'category',
            data: data.map(d => d.name),
            axisTick: { alignWithLabel: true },
            axisLine: { lineStyle: { color: echarts.axisLineColor } },
            axisLabel: { textStyle: { color: echarts.textColor } }
          }
        ],
        yAxis: [
          {
            type: 'value',
            axisLine: { lineStyle: { color: echarts.axisLineColor } },
            splitLine: { lineStyle: { color: echarts.splitLineColor } },
            axisLabel: { textStyle: { color: echarts.textColor } }
          }
        ],
        series: [
          {
            name: 'Transacciones',
            type: 'bar',
            barWidth: '40%',
            label: { show: true, position: 'top', fontWeight: 'bold' },
            data: data.map((d, i) => {
              const pallete = [colors.primary, colors.success, colors.warning, colors.danger];
              return { value: d.value, itemStyle: { color: pallete[i % pallete.length] } };
            }),
            itemStyle: { borderRadius: [4, 4, 0, 0] }
          }
        ]
      };
    });
  }

  buildActivePlansChart(data: any[]) {
    const validData = data && data.length ? data.filter(d => d.value > 0) : [];
    this.themeSubscription = this.themeService.getJsTheme().subscribe(config => {
      const _colors: any = config.variables; const colors = { primary: "#79b3a5", success: "#509180", info: "#a5d1c6", warning: "#366e60", danger: "#c2dcd5", primaryLight: "#e0f0ec" };
      const echarts: any = config.variables.echarts;
      this.optionsActivePlans = {
        backgroundColor: echarts.bg,
        color: [colors.primary, colors.info, colors.success, colors.warning, colors.danger],
        tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
        legend: { orient: 'vertical', left: 'left', textStyle: { color: echarts.textColor } },
        series: [
          {
            name: 'Planes Activos',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: true,
            label: { show: true, formatter: '{b}\n{c} ({d}%)', fontWeight: 'bold' },
            emphasis: { label: { show: true, fontSize: '16', fontWeight: 'bold' } },
            labelLine: { show: true },
            data: validData
          }
        ]
      };
    });
  }

  buildUserTypesChart(data: any[]) {
    const validData = data && data.length ? data.filter(d => d.value > 0) : [];
    this.themeSubscription = this.themeService.getJsTheme().subscribe(config => {
      const _colors: any = config.variables; const colors = { primary: "#79b3a5", success: "#509180", info: "#a5d1c6", warning: "#366e60", danger: "#c2dcd5", primaryLight: "#e0f0ec" };
      const echarts: any = config.variables.echarts;
      this.optionsUserTypes = {
        backgroundColor: echarts.bg,
        color: [colors.info, colors.success, colors.warning, colors.danger, colors.primaryLight],
        tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
        legend: { orient: 'horizontal', bottom: '0', textStyle: { color: echarts.textColor } },
        series: [
          {
            name: 'Tipos de Usuarios',
            type: 'pie',
            radius: '50%',
            label: { show: true, formatter: '{b}\n{c} ({d}%)', fontWeight: 'bold' },
            data: validData,
            emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
          }
        ]
      };
    });
  }

  buildDocumentTypesChart(data: any[]) {
    const validData = data && data.length ? data.filter(d => d.value > 0) : [];
    this.themeSubscription = this.themeService.getJsTheme().subscribe(config => {
      const _colors: any = config.variables; const colors = { primary: "#79b3a5", success: "#509180", info: "#a5d1c6", warning: "#366e60", danger: "#c2dcd5", primaryLight: "#e0f0ec" };
      const echarts: any = config.variables.echarts;
      this.optionsDocumentTypes = {
        backgroundColor: echarts.bg,
        color: [colors.warning, colors.info],
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [
          {
            name: 'Públicos vs Privados',
            type: 'pie',
            radius: ['40%', '70%'],
            label: { show: true, formatter: '{b}\n{c} ({d}%)', fontWeight: 'bold' },
            data: validData,
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 }
          }
        ]
      };
    });
  }

  buildSharedDocsChart(data: any[]) {
    this.themeSubscription = this.themeService.getJsTheme().subscribe(config => {
      const _colors: any = config.variables; const colors = { primary: "#79b3a5", success: "#509180", info: "#a5d1c6", warning: "#366e60", danger: "#c2dcd5", primaryLight: "#e0f0ec" };
      const echarts: any = config.variables.echarts;
      this.optionsSharedDocs = {
        backgroundColor: echarts.bg,
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: [
          {
            type: 'category',
            data: data.map(d => d.name),
            axisLine: { lineStyle: { color: echarts.axisLineColor } },
            axisLabel: { textStyle: { color: echarts.textColor } }
          }
        ],
        yAxis: [
          {
            type: 'value',
            axisLine: { lineStyle: { color: echarts.axisLineColor } },
            splitLine: { lineStyle: { color: echarts.splitLineColor } },
            axisLabel: { textStyle: { color: echarts.textColor } }
          }
        ],
        series: [
          {
            name: 'Compartidos por',
            type: 'bar',
            barWidth: '50%',
            label: { show: true, position: 'top', fontWeight: 'bold' },
            data: data.map((d, i) => {
              const pallete = [colors.success, colors.primary, colors.danger];
              return { value: d.value, itemStyle: { color: pallete[i % pallete.length] } };
            })
          }
        ]
      };
    });
  }

  buildTemplateMetricsChart(data: any) {
    this.themeSubscription = this.themeService.getJsTheme().subscribe(config => {
      const _colors: any = config.variables; const colors = { primary: "#79b3a5", success: "#509180", info: "#a5d1c6", warning: "#366e60", danger: "#c2dcd5", primaryLight: "#e0f0ec" };
      const echarts: any = config.variables.echarts;
      
      const topFields = data.top_fields;
      
      this.optionsTemplateMetrics = {
        backgroundColor: echarts.bg,
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: echarts.axisLineColor } },
          splitLine: { lineStyle: { color: echarts.splitLineColor } },
          axisLabel: { textStyle: { color: echarts.textColor } }
        },
        yAxis: {
          type: 'category',
          data: topFields.map((d: any) => d.name),
          axisTick: { alignWithLabel: true },
          axisLine: { lineStyle: { color: echarts.axisLineColor } },
          axisLabel: { textStyle: { color: echarts.textColor } }
        },
        series: [
          {
            name: 'Usos',
            type: 'bar',
            label: { show: true, position: 'right', fontWeight: 'bold' },
            data: topFields.map((d: any) => d.value),
            itemStyle: { color: colors.warning, borderRadius: [0, 4, 4, 0] }
          }
        ]
      };
    });
  }

  buildBillablesChart(data: any) {
    this.themeSubscription = this.themeService.getJsTheme().subscribe(config => {
      const _colors: any = config.variables; const colors = { primary: "#79b3a5", success: "#509180", info: "#a5d1c6", warning: "#366e60", danger: "#c2dcd5", primaryLight: "#e0f0ec" };
      const echarts: any = config.variables.echarts;
      this.optionsBillables = {
        backgroundColor: echarts.bg,
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        legend: { textStyle: { color: echarts.textColor } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: [
          {
            type: 'category',
            data: data.categories,
            axisTick: { alignWithLabel: true },
            axisLine: { lineStyle: { color: echarts.axisLineColor } },
            axisLabel: { textStyle: { color: echarts.textColor }, interval: 0, rotate: 30 }
          }
        ],
        yAxis: [
          {
            type: 'value',
            axisLine: { lineStyle: { color: echarts.axisLineColor } },
            splitLine: { lineStyle: { color: echarts.splitLineColor } },
            axisLabel: { textStyle: { color: echarts.textColor } }
          }
        ],
        series: [
          {
            name: 'Éxitos',
            type: 'bar',
            stack: 'Total',
            label: { 
              show: true, 
              position: 'inside', 
              fontWeight: 'bold', 
              color: '#fff',
              formatter: (params) => params.value > 0 ? params.value : ''
            },
            itemStyle: { color: colors.success },
            emphasis: { focus: 'series' },
            data: data.success
          },
          {
            name: 'Fallos / Rechazos (Fraude)',
            type: 'bar',
            stack: 'Total',
            label: { 
              show: true, 
              position: 'inside', 
              fontWeight: 'bold', 
              color: '#fff',
              formatter: (params) => params.value > 0 ? params.value : ''
            },
            itemStyle: { color: colors.danger },
            emphasis: { focus: 'series' },
            data: data.fail
          }
        ]
      };
    });
  }

  buildTransactionsChart(transactions: any) {
    this.themeSubscription = this.themeService.getJsTheme().subscribe(config => {
      const _colors: any = config.variables; const colors = { primary: "#79b3a5", success: "#509180", info: "#a5d1c6", warning: "#366e60", danger: "#c2dcd5", primaryLight: "#e0f0ec" };
      const echarts: any = config.variables.echarts;
      this.optionsTransactions = {
        backgroundColor: echarts.bg,
        color: [colors.primary, colors.warning],
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [
          {
            name: 'Consultas Operativas',
            type: 'pie',
            radius: ['40%', '70%'],
            label: { show: true, formatter: '{b}\n{c} ({d}%)', fontWeight: 'bold' },
            data: [
              { value: transactions.registraduria, name: 'Registraduría (ANI)' },
              { value: transactions.restrictive_lists, name: 'Listas Restrictivas' }
            ].filter(i => i.value > 0),
            itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 }
          }
        ]
      };
    });
  }

  buildSignedDocsChart(signed: number, unsigned: number) {
    this.themeSubscription = this.themeService.getJsTheme().subscribe(config => {
      const _colors: any = config.variables; const colors = { primary: "#79b3a5", success: "#509180", info: "#a5d1c6", warning: "#366e60", danger: "#c2dcd5", primaryLight: "#e0f0ec" };
      const echarts: any = config.variables.echarts;
      this.optionsSignedDocs = {
        backgroundColor: echarts.bg,
        color: [colors.success, colors.danger],
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        series: [
          {
            name: 'Estado de Documentos',
            type: 'pie',
            radius: '50%',
            label: { show: true, formatter: '{b}\n{c} ({d}%)', fontWeight: 'bold' },
            data: [
              { value: signed, name: 'Con Firmas' },
              { value: unsigned, name: 'Sin Firmas' }
            ].filter(i => i.value > 0),
            emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
          }
        ]
      };
    });
  }

  buildSignaturesChart(sig_data: any) {
    this.themeSubscription = this.themeService.getJsTheme().subscribe(config => {
      const _colors: any = config.variables; const colors = { primary: "#79b3a5", success: "#509180", info: "#a5d1c6", warning: "#366e60", danger: "#c2dcd5", primaryLight: "#e0f0ec" };
      const echarts: any = config.variables.echarts;
      this.optionsSignatures = {
        backgroundColor: echarts.bg,
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: [
          {
            type: 'category',
            data: ['Grafo', 'Facial', 'Cédula', 'OTP'],
            axisLine: { lineStyle: { color: echarts.axisLineColor } },
            axisLabel: { textStyle: { color: echarts.textColor } }
          }
        ],
        yAxis: [
          {
            type: 'value',
            axisLine: { lineStyle: { color: echarts.axisLineColor } },
            splitLine: { lineStyle: { color: echarts.splitLineColor } },
            axisLabel: { textStyle: { color: echarts.textColor } }
          }
        ],
        series: [
          {
            name: 'Tipo de Firma',
            type: 'bar',
            barWidth: '50%',
            label: { show: true, position: 'top', fontWeight: 'bold' },
            data: [
              { value: sig_data.grafo, itemStyle: { color: colors.warning } },
              { value: sig_data.facial, itemStyle: { color: colors.info } },
              { value: sig_data.cedula, itemStyle: { color: colors.success } },
              { value: sig_data.otp, itemStyle: { color: colors.primary } }
            ]
          }
        ]
      };
    });
  }
}
