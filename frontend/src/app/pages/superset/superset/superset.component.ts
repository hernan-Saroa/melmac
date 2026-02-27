import { Component, ElementRef, OnInit } from '@angular/core';
import { ActivatedRoute, Resolve } from '@angular/router';

/** rxjs Imports */
import { Observable } from 'rxjs';

/** Import EmbedDashboard SDK */
import { embedDashboard } from "@superset-ui/embedded-sdk";
import { SupersetService } from '../superset.service';

@Component({
  selector: 'ngx-superset',
  templateUrl: './superset.component.html',
  styleUrls: ['./superset.component.scss']
})
export class SupersetComponent implements OnInit {

  loading = true;
  error = ''
  displayDashboard = 'display: none'

  /**
   * 
   * @param { ElementRef } elementRef 
   * @param { SupersetServiceService } embedService 
   */
  constructor(private elementRef: ElementRef,
    private embedService: SupersetService) { }

  ngOnInit(): void {
    this.embedSupersetDashboard();
  }

  embedSupersetDashboard(): void {
    const dashboardElement = this.elementRef.nativeElement.querySelector('#dashboard');

    if (dashboardElement) {
      let idDashboard = '319fb820-033d-4d74-896b-fbc22fe74ede'
      this.embedService.embedDashboard(idDashboard).subscribe(
        (resultIframe) => {
          this.displayDashboard = 'display: block'
          this.error = ''
          this.loading = false;
          // Adjust the size of the embedded iframe
          const iframe = dashboardElement.querySelector('iframe');
          if (iframe) {
            iframe.style.width = '100%'; // Set the width as needed
            iframe.style.height = '1000px'; // Set the height as needed
          }
        },
        (error) => {
          this.loading = false
          this.error = 'Supertset no response, por favor revisa tu configuración'
          console.error(error);
        }
      );
    }
  }
}
