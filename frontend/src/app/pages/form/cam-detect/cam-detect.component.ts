import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AnswerService } from '../../../services/answer.service';

@Component({
  selector: 'ngx-cam-detect',
  templateUrl: './cam-detect.component.html',
  styleUrls: ['./cam-detect.component.scss']
})
export class CamDetectComponent implements OnInit {

  loading = false;
  @ViewChild('video') video!: ElementRef;
  @ViewChild('canvas') canvas!: ElementRef;
  // @ViewChild('canvas_result') canvas_result!: ElementRef;
  videoDevices: MediaDeviceInfo[] = [];
  selectedDeviceId: string | null = null;

  stream: MediaStream | null = null;
  isCameraOn: boolean = false;

  capturedImageBase64: string | null = null;
  interval_process = true;
  interval_func = null;
  interval_cam = true;
  capture_option_list = [];

  view_cam = true;
  // view_doc = false;

  constructor(
    private answerService:AnswerService
  ) {
    console.log('hola:::::::::::::::::')
  }

  ngOnInit(): void {
    this.loadAvailableCameras();
  }

  async loadAvailableCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      this.videoDevices = devices.filter(device => device.kind === 'videoinput');

      if (this.videoDevices.length > 0) {
        this.selectedDeviceId = this.videoDevices[0].deviceId;
        this.startCamera();
      }


    } catch (error) {
      console.error('Error al listar dispositivos de video:', error);
    }
  }

  async startCamera() {
    if (!this.selectedDeviceId) return;
    this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: this.selectedDeviceId }
    });
    this.video.nativeElement.srcObject = this.stream;
    this.video.nativeElement.play();
    this.isCameraOn = true;

    this.stopInterval();
    setTimeout(() => {
      this.startInterval();
    }, 1000);
  }

  startInterval() {
    console.log('startInterval');
    this.view_cam = true;
    this.capture_option_list = [];
    this.interval_process = true;
    this.interval_cam = true;
    this.interval_func = setInterval(() => {
      if (this.interval_process) {
        this.captureImage()
      }
    }, 500);
  }

  stopInterval() {
    console.log('stopInterval');
    if (this.interval_func) {
      this.interval_process = false;
      clearInterval(this.interval_func);
      this.interval_func = null;
    }
  }

  captureImage() {
    const video = this.video.nativeElement;
    const canvas = this.canvas.nativeElement;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    let img_data = {
      'img_base64': canvas.toDataURL('image/png')
    }

    if (this.interval_process) {
      this.answerService.camDetect(img_data).subscribe(
        response => {
          this.loading = false;
          console.log('response')
          console.log(response)
          let timer_interval = false;
          if (response['data'].length > 0) {
            response['data'].forEach(element => {
              this.capture_option_list.push(element)
              // this.capturedImageBase64 = 'data:image/png;base64,' + element['img'];
            });
            setTimeout(() => {
              if (this.interval_cam) {
                console.log('setTimeout de camara')
                this.interval_cam = false;
                this.stopInterval();
                this.bestCapture();
              }
            }, 3500);
          }

        }, error => {
          console.error(error);
          // this.toastService.showToast('danger', '¡Error!', 'Intentalo mas tarde.');
          // this.loading = false;
        }
      );
    }
  }

  bestCapture() {
    let img = "";
    let per = 0;
    console.log('this.capture_option_list')
    console.log(this.capture_option_list)

    setTimeout(() => {
      this.capture_option_list.forEach(element => {
        if (element['percentage'] > per) {
          per = element['percentage'];
          img = element['img'];
        }
      });
      this.capturedImageBase64 = 'data:image/png;base64,' + img;
      this.view_cam = false;
    }, 1000);

    this.stopCamera();
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.video.nativeElement.srcObject = null;
      this.isCameraOn = false;
    }
  }

  reloadProcess() {
    this.startCamera()
  }
}
