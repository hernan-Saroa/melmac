import { Component, OnInit } from '@angular/core';
import { PlansService } from '../../../services/plans.service';
@Component({
    selector: 'ngx-plan-user',
    templateUrl: './plan-user.component.html',
    styleUrls: ['./plan-user.component.scss'],
    standalone: false
})
export class PlanUserComponent implements OnInit {
  data;
  url ="";
  constructor(private planService:PlansService) {
    this.planService.list().subscribe(
      response => {
        this.data = response['data'];
        this.url = response['url']
        console.log(this.data)
      }
    );
  }
  ngOnInit(): void {
  }
}
