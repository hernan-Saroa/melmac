import { Component, OnInit } from '@angular/core';
import { PlansService } from '../../services/plans.service';
@Component({
    selector: 'ngx-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
    standalone: false
})
export class HomeComponent implements OnInit {

  data;
  constructor(private homeItemServices: PlansService) {
    this.homeItemServices.list_home_item_user().subscribe(
      response => {
        this.data = response['data'];
        console.log(this.data)
      }
    );
   }

  ngOnInit(): void {
    this.add_class()
  }

  add_class(){
    setTimeout(() => {
      let index = 0
      let index_1 = 1
      if(this.data) {
        this.data.forEach(element => {
          if(index == 1){
            this.container_class(index,"text-rigth","span_left")
          }else if(index>1){
            if(index_1 == 1){
              this.container_class(index,"right","span_right")
            }else if(index_1 ==3){
              index_1 = 0;
              this.container_class(index,"text-rigth","span_left")
            }else if(index_1 ==2){
              this.container_class(index,"center","span_left")
            }
            index_1++;
          }
          index++;
        });
      }
    }, 300);
  }

  container_class(index,b,c){
    const box0 = document.getElementById('d_'+index);
    if(box0){
        box0.classList.remove('center');
        box0.classList.add(b);
    }
    const box1 = document.getElementById('d2_'+index);
    if(box1) {
        box1.classList.remove('center');
        box1.classList.add(b);
    }
    const box2 = document.getElementById('s_'+index);
    if(box2) {
        box2.classList.add(c);
    }
  }
}
