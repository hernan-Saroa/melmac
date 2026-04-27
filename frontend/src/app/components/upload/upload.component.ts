import { Component } from '@angular/core';
import { SearchService } from '../../services/search.service';

@Component({
    selector: 'app-upload',
    templateUrl: './upload.component.html',
    styleUrls: ['./upload.component.scss'],
    standalone: false
})
export class UploadComponent {
  constructor(private searchService: SearchService) {}

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    this.searchService.uploadDocument(formData).subscribe(() => {
      alert('Documento subido correctamente.');
    });
  }
}
