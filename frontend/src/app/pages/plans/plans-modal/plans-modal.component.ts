import { Component, OnInit } from '@angular/core';
import { PlansService } from '../../../services/plans.service';
import { SwitchService } from './../../../services/switch.service';

@Component({
    selector: 'ngx-plans-modal',
    templateUrl: './plans-modal.component.html',
    styleUrls: ['./plans-modal.component.scss'],
    standalone: false
})
export class PlansModalComponent implements OnInit {
  indexField;
  indexItems;
  price;
  state: boolean = false;
  description;
  name;
  valor1;
  id_plan;
  colorB = "#4b1616";
  base64;

  // New SAROA Feature Modules
  feature_received: boolean = false;
  feature_documents: boolean = false;
  feature_roles: boolean = false;
  feature_reports: boolean = false;
  feature_statistics: boolean = false;
  feature_flows: boolean = false;
  feature_my_drive: boolean = false;
  feature_lists: boolean = false;
  feature_visits: boolean = false;
  feature_field_service: boolean = false;
  feature_db_segmented: boolean = false;

  constructor(private planService: PlansService, private modalSS: SwitchService) { }

  ngOnInit(): void {
    this.modalSS.$modalsing.subscribe((valor) => {
      this.valor1 = valor;
    });
    
    // Load general values
    if (this.indexField) {
      this.price = this.indexField.price;
      this.state = this.indexField.state;
      this.description = this.indexField.description;
      this.name = this.indexField.name;
      this.colorB = this.indexField.color;

      // Load feature toggles
      this.feature_received = this.indexField.feature_received || false;
      this.feature_documents = this.indexField.feature_documents || false;
      this.feature_roles = this.indexField.feature_roles || false;
      this.feature_reports = this.indexField.feature_reports || false;
      this.feature_statistics = this.indexField.feature_statistics || false;
      this.feature_flows = this.indexField.feature_flows || false;
      this.feature_my_drive = this.indexField.feature_my_drive || false;
      this.feature_lists = this.indexField.feature_lists || false;
      this.feature_visits = this.indexField.feature_visits || false;
      this.feature_field_service = this.indexField.feature_field_service || false;
      this.feature_db_segmented = this.indexField.feature_db_segmented || false;
    }
  }

  closeModal() {
    this.valor1.close();
  }

  changeValue(input, event) {
    switch (input) {
      case 0:
        this.name = ("" + event.target.value).trim();
        break;
      case 1:
        this.description = ("" + event.target.value).trim();
        break;
      case 2:
        this.price = ("" + event.target.value).trim();
        break;
      case 4:
        this.colorB = ("" + event.target.value).trim();
        break;
    }
  }

  toggleState(checked: boolean) {
    this.state = checked;
  }

  finish() {
    let data_req = {
      price: this.price,
      state: this.state,
      desc: this.description,
      name: this.name,
      image: this.base64 ? this.base64 : "",
      color: this.colorB,
      feature_received: this.feature_received,
      feature_documents: this.feature_documents,
      feature_roles: this.feature_roles,
      feature_reports: this.feature_reports,
      feature_statistics: this.feature_statistics,
      feature_flows: this.feature_flows,
      feature_my_drive: this.feature_my_drive,
      feature_lists: this.feature_lists,
      feature_visits: this.feature_visits,
      feature_field_service: this.feature_field_service,
      feature_db_segmented: this.feature_db_segmented
    };

    console.log("Saving SaaS Plan configuration:", data_req);

    this.planService.create_plan(data_req).subscribe(
      response => {
        console.log("Plan successfully saved:", response);
        this.closeModal();
        window.location.reload();
      }
    );
  }

  onFileSelected(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.base64 = reader.result;
    };
  }
}
