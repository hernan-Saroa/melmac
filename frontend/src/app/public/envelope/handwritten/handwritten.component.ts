import { Component, OnInit } from '@angular/core';
import { SwitchService } from '../../../services/switch.service';
import { blobToURL, urlToBlob, fromBlob, fromURL } from 'image-resize-compress';


@Component({
    selector: 'ngx-handwritten',
    templateUrl: './handwritten.component.html',
    styleUrls: ['./handwritten.component.scss'],
    standalone: false
})
export class HandwrittenComponent implements OnInit {

  public signaturePadOptions1: Object = { // passed through to szimek/signature_pad constructor
    'minWidth': 0.5,
    'Width': 0.5,
    'canvasWidth': 860,
    'canvasHeight': 152
  };

  constructor(private singSS: SwitchService, private modalSS:SwitchService) {
    this.base64A = '/assets/images/cargar_firma_man.png'
    let contet_layput = document.getElementsByClassName('scrollable-container');
    if (contet_layput[0].parentElement.offsetWidth <= 540) {
      this.signaturePadOptions1['canvasWidth'] = 260;
      this.signaturePadOptions1['canvasHeight'] = 140;
    }
  }

  indexField;
  valor1;
  base64I;
  base64A;
  typebase64;
  nameFile;
  name_text:string;
  tab:string;
  base64Output : string;


  ngOnInit(): void {
    this.modalSS.$modalsing.subscribe((valor)=>{
      this.valor1=valor
    })
  }

  onSingHand(index){
    if(this.tab=="Escribir" && this.name_text){
      const { createCanvas, loadImage } = require('canvas')
      const canvas = createCanvas(480, 90)
      const ctx = canvas.getContext('2d')

      // Write "Awesome!"
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 480, 90);
      ctx.font = '35px serif';
      ctx.textAlign = "center";
      ctx.fillStyle = "#000";
      ctx.fillText(capitalize(this.name_text.toLowerCase()), 240, 50);
      this.singSS.$sing.emit(canvas.toDataURL()+"@"+index)
      this.valor1.close()
    }else{
      if (this.base64I != undefined){
        this.singSS.$sing.emit(this.base64I+"@"+index+"@"+this.typebase64)
        this.valor1.close()
      }
    }
  }

  onChangeTab(event){
    this.tab=event.tabTitle
  }

  closeSingHand(){
    this.singSS.$sing.emit("close")
    this.valor1.close()
  }

  drawClear(sign) {
    sign.clear()
  }

  drawComplete(sign) {
    // will be notified of szimek/signature_pad's onEnd event
    this.base64I=sign.toDataURL();
  }

  onFileSelected(event){
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.typebase64=file.type
      this.typebase64=this.typebase64.split("/")
      this.typebase64=this.typebase64[1]
       // note only the blobFile argument is required
       fromBlob(file, 80, 250, 250, this.typebase64).then((blob) => {
        // will generate a url to the converted file
        blobToURL(blob).then((url) => this.base64A= url);
        blobToURL(blob).then((url) => this.base64I= url);
      });
    };
  }
}

function capitalize(word) {
  return word.replace(/(^\w{1})|(\s+\w{1})/g, letra => letra.toUpperCase());
}


