import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { SharedService } from './shared.service';
import { NbThemeService } from '@nebular/theme';
import { THEMES } from '../@theme/components';

@Component({
    selector: 'ngx-public',
    templateUrl: './public.component.html',
    styleUrls: ['./public.component.scss'],
    standalone: false
})
export class PublicComponent implements OnInit {
@ViewChild('pdfViewer', { static: false }) pdfViewer: ElementRef;

  title = '';
  logo = '';
  footer = '© Saroa SAS 2022';
  background ='';
  color ='';
  count=0;
  header_class = '';
  envelope = '';
  button_form = false;
  option_select = 1;
  zoomLevel = 1;
  zoomLIn = true;
  zoomLOut = true;
  zoom_view = false;
  footer_view;

  constructor(
    private _sharedService: SharedService,
    private themeService: NbThemeService,
  ) {
    //
    _sharedService.changeEmitted$.subscribe(data => {
      //console.log(data)

      const divTabset = document.querySelector(".tabset");
      if (divTabset) {
        divTabset.classList.add('d-none');
      }

      if(data['footer_view']){
        this.footer_view=false
      }else{
        this.footer_view=true
      }

      if (data['envelope']) {
        this.header_class = 'color_base';
        this.envelope = data['envelope'];
      }

      if (data['button']) {
        this.button_form = data['button'];
      }

      if (data['name'] != '') {
        this.title = data['name'];
      } else {
        this.title = 'Documentos';
      }
      if (data['footer']) {
        this.footer = data['footer'];
      }
      if (data['logo'][1] != '') {
        this.logo = data['logo'][0] + data['logo'][1];
      }

      if (data['zoom_view'] != undefined && data['zoom_view']) {
        this.zoom_view = true;
      }

      // setTimeout(() => {
      //   // Footer
      //   const box_foother = document.getElementById('footerT');
      //   box_foother.classList.add('headerT');

      //   if (data['colorBF']  && data['colorBF'] != 'None'){
      //     box_foother.style.setProperty("--my-var5", data['colorBF']);
      //   }

      //   if (data['colorBFT']  && data['colorBFT'] != 'None'){
      //     box_foother.style.setProperty("--my-var6", data['colorBFT']);
      //   }
      // },500);



      // if (data['theme']){
      //   this.themeService.changeTheme(THEMES.filter((val) => data['theme'] == val.value).map((val) => val.value === 1 ? 'default' : val.name )[0].toLowerCase());
      //   const divEnvelope = document.getElementById('divEnvelope');
      //   if(data['theme'] == 1){
      //     divEnvelope.style.setProperty("--my-var8", "#edf1f7");
      //   }else if (data['theme'] == 2){
      //     divEnvelope.style.setProperty("--my-var8", "#151a30");
      //   }else{
      //     divEnvelope.style.setProperty("--my-var8", "#fafafa");
      //   }
      // }

      // if (data['colorB'] && data['colorB'] != 'None'){
      //   this.background = data['colorB']
      //   const box0 = document.getElementById('headerT');
      //   box0.classList.add('headerT');
      //   box0.style.setProperty("--my-var", this.background);
      // }


    // setTimeout(() => {
    //   const box_foother = document.getElementById('footerT');
    //   box_foother.classList.add('headerT');
    //   const boxHeaderTitle = document.getElementById('contdiv2');
    //   boxHeaderTitle.classList.add('color_base_2');

    //   if (data['colorBTPH'] && data['colorBTPH'] != 'None'){
    //     boxHeaderTitle.style.setProperty("--my-var7", data['colorBTPH']);
    //   }
    //   if (data['colorBTP']  && data['colorBTP'] != 'None'){
    //     boxHeaderTitle.style.setProperty("--my-var6", data['colorBTP']);
    //   }

    //   if (data['colorBF']  && data['colorBF'] != 'None'){
    //     box_foother.style.setProperty("--my-var5", data['colorBF']);
    //   }

    //   if (data['colorBFT']  && data['colorBFT'] != 'None'){
    //     box_foother.style.setProperty("--my-var6", data['colorBFT']);
    //   }


    //   if (data['colorBT']  && data['colorBT'] != 'None'){
    //     this.color = data['colorBT']

    //       console.log(this.color)
    //       const box22 = document.getElementById('btn-external1');
    //       box22.classList.add('btn-external1');
    //       box22.style.setProperty("--my-var4", this.color);
    //       const box222 = document.getElementById('btn-external2');
    //       box222.classList.add('btn-external2');
    //       box222.style.setProperty("--my-var4", this.color);

    //       const box31 = document.getElementById('btn-external1Sm');
    //       box31.classList.add('btn-externalSm');
    //       box31.style.setProperty("--my-var4", this.color);

    //       for (let index = 0; index < 50; index++) {
    //         const box = document.getElementById("btnF_"+index);
    //         if(box != null){
    //           box.style.setProperty("--my-var3", this.color);
    //         }
    //       }

    //       const div0 = document.querySelector("ul");
    //       let count1=0
    //       for (let x = 1; x < div0.childNodes.length; x++) {
    //         count1=x
    //       }
    //           this.count=0
    //           while (this.count < count1){
    //             const div = document.querySelector(".tab-link");
    //             div.setAttribute("id","tab"+this.count)
    //             div.removeAttribute('class')
    //             const box = document.getElementById("tab"+this.count);
    //             box.style.color = this.color;
    //             this.count +=1;
    //           }

    //           if(count1 == 1){
    //             const box0 = document.getElementById('tab0');
    //             box0.classList.add('tab-link');
    //             box0.classList.add('link');
    //             box0.style.setProperty("--my-var", this.color);
    //             const box2 = document.getElementById('btnFP');
    //             box2.classList.add('btnFP');
    //             box2.style.setProperty("--my-var2", this.color);
    //           }else{
    //             const box2 = document.getElementById('btnFP');
    //             box2.classList.add('btnFP');
    //             box2.style.setProperty("--my-var2", this.color);

    //             const boxText1 = document.getElementById('color_text_public');
    //             boxText1.classList.add('color_base_3');
    //             boxText1.style.setProperty("--my-var2", this.color);

    //             const box3 = document.getElementById('btnFP1');
    //             box3.classList.add('btnFP');
    //             box3.style.setProperty("--my-var2", this.color);
    //             const box0 = document.getElementById('tab0');
    //             box0.classList.add('tab-link');
    //             box0.style.setProperty("--my-var", this.color);
    //             const box1 = document.getElementById('tab1');
    //             box1.classList.add('tab-link');
    //             box1.style.setProperty("--my-var", this.color);
    //           }
    //   }
    // },500);

  });
  }

  private applyZoom(): void {
    const pdfViewerElement = this.pdfViewer.nativeElement;
    pdfViewerElement.style.transform = `scale(${this.zoomLevel})`;
  }

  zoomIn(): void {
    this.zoomLevel += 0.2;
    this.applyZoom();
    if(this.zoomLevel > 1){
      this.zoomLOut = false;
    }
  }

  zoomOut(): void {
    if(this.zoomLevel === 1){
      this.zoomLOut = true;
    }else{
      this.zoomLevel -= 0.2;
      this.zoomLOut = false;
      this.applyZoom();
    }
  }

  clickBtnUl(option){
    this.option_select = option;
    const box = document.getElementById('tab1');
    if(box == null){
      const div0 = document.querySelector("ul");
      let count1=0
      for (let x = 1; x < div0.childNodes.length; x++) {
        count1=x
      }
      this.count=0
      while (this.count < count1){
        const div = document.querySelector(".tab-link");
        div.setAttribute("id","tab"+this.count)
        div.removeAttribute('class')
        const box = document.getElementById("tab"+this.count);
        box.style.color = this.color;
        this.count +=1;
      }
    }

    if (option ==1){
      const box0 = document.getElementById('tab0');
      box0.click();
    }else{
      const box0 = document.getElementById('tab1');
      box0.click();
      const box32 = document.getElementById('btn-external2Sm');
      box32.classList.add('btn-externalSm');
      box32.style.setProperty("--my-var4", this.color);
    }
  }

  ngOnInit(): void {
  }

}
