import { Component, OnInit, Input, Output, EventEmitter, OnDestroy} from '@angular/core';
import { AdminService } from '../../../../services/admin.service';
import { Observable } from 'rxjs';
import { EnterpriseComponent } from '../../../enterprise/enterprise.component';
import { Subscription } from 'rxjs'



interface Permit {
  id:number,
  name: string,
  description: string,
  status: boolean,
}

@Component({
  selector: 'ngx-admin-permit',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  public data: {enterprise_id:string, parent:EnterpriseComponent};
  permitsList: any;
  permits: Permit[] = [];

  $sub: Subscription;

  constructor(
    private service:AdminService,
    ) { }

  ngOnInit(): void {
    try{
      let id = Number(this.data.enterprise_id);
      if (!this.data.enterprise_id && id) {
        this.finish();
      }
      this.$sub = this.service.getPermitsGrouped(id).subscribe(response => {
        console.log(response);
        this.permitsList = response['data'];
      });
    } catch {
      this.finish();
    }
  }

  update(): void {
    let selected: number[];
    selected = this.permits.filter( value => value.status ).map( value => value.id);
    this.$sub = this.service.updatePermitsEnterprise(this.data.enterprise_id, selected).subscribe((value)=>{
      if (value['status']){
        this.finish();
      } else {
        console.error(value['detail']);
      }
    });
  }

  finish(): void {
    this.data.parent.permitDialogRef.close()
  }

  onEvent($event){
    let index = this.permits.findIndex((value) => {
      return $event.item.id == value.id
    })
    switch($event.action){
      case 'init':
        if (index == -1){
          this.permits.push($event.item);
        }
        break;
      case 'change':
        if (index > -1){
          this.permits[index] = $event.item;
        }
        break;
    }
  }

  toggleParent(key, checked){
    let ids = [];
    this.permitsList[key].forEach(element => {
      element['status'] = checked;
      ids.push(element['id']);
    });
    this.permits.forEach((value)=>{
      if (ids.includes(value.id)){
        value.status = checked;
      }
    })
  }

  isChildChecked(key){
    for(let i = 0; i< this.permitsList[key].length; i++){
      if (!this.permitsList[key][i]['status'])
        return false;
    }
    return true;
  }

  OnDestroy(){
    this.$sub.unsubscribe();

  }
}

@Component({
  selector: 'permit-item',
  template: `
    <div class="row" style="border-bottom: 1px #363636;">
      <div class="col-12">
        <span style="font-weight: bold;"> {{name}} </span>
      </div>
      <div class="col-11">
        <span> {{description}} </span>
      </div>
      <div class="col-1">
        <nb-checkbox [checked]='status' (checkedChange)="toggle($event)"></nb-checkbox>
      </div>
    </div>
  `,
})
export class PermitItemComponent implements OnInit{
  @Input('id') id: number;
  @Input('name') name: string;
  @Input('desc') description: string;
  @Input('status') status: boolean;
  @Output('receive') eventEmitter = new EventEmitter<{action:string, item:Permit}>();

  item:Permit;

  ngOnInit(): void {
    this.item = {
      id: this.id,
      name: this.name,
      description: this.description,
      status: this.status
    };
    this.eventEmitter.emit({action: 'init', item:this.item});
  }

  toggle($event){
    this.item.status = $event;
    this.eventEmitter.emit({action: 'change', item:this.item});
  }
}
