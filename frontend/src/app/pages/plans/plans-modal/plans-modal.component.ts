import { Component, OnInit } from '@angular/core';
import { PlansService } from '../../../services/plans.service';
import { SwitchService } from './../../../services/switch.service';
@Component({
  selector: 'ngx-plans-modal',
  templateUrl: './plans-modal.component.html',
  styleUrls: ['./plans-modal.component.scss']
})
export class PlansModalComponent implements OnInit {
  indexField;
  indexItems;
  price;
  state = false;
  description;
  name;
  valor1;
  array_items = [];
  array_value = [];
  array_id = [];
  id_plan;
  colorB = "#4b1616";
  base64;

  constructor(private planService:PlansService,private modalSS:SwitchService,) {
  }
  ngOnInit(): void {
    this.modalSS.$modalsing.subscribe((valor)=>{
      this.valor1=valor
    })
    this.indexField.items.forEach(element => {
      if(element.state){
        this.array_items.push(element.service_id);
      }
    });
    console.log(this.array_items)
    this.price = this.indexField.price
    this.state = this.indexField.state
    this.description = this.indexField.description
    this.name = this.indexField.name
    this.colorB = this.indexField.color
  }
  closeModal(){
    this.valor1.close()
  }

  changeValue(input, event){
    switch (input){
      case 0:
        this.name = (""+event.target.value).trim();
      break;
      case 1:
        this.description = (""+event.target.value).trim();
      break;
      case 2:
        this.price = (""+event.target.value).trim();
      break;
      case 4:
        this.colorB = (""+event.target.value).trim();
      break;
    }
  }
  toggle(checked: boolean, id=false) {
    if(!id){
      this.state = checked
    }else{
      let index = this.array_id.indexOf(id)
      if (index !== -1) {
        this.array_value[index] = checked
      }else{
        this.array_id.push(id);
        this.array_value.push(checked);
      }
    }

  }
  finish(){
    let data = {}
    if(this.base64 != undefined){
      data = {price:this.price, state:this.state, desc:this.description, name: this.name, image: this.base64, color: this.colorB};
    }else{
      data = {price:this.price, state:this.state, desc:this.description, name: this.name, image: "", color: this.colorB};
    }
    console.log(data)
    this.planService.create_plan(data).subscribe(
      response => {
        this.id_plan = response['id']
        console.log(response)
        console.log(this.array_id)
        console.log(this.array_value)
        if(this.array_id.length > 0){
          for (let index = 0; index < this.array_id.length; index++) {
            let data = {plan_id:this.id_plan, state:this.array_value[index], service_id:this.array_id[index]};
            this.planService.create_service_plan(data).subscribe(
              response => {
                console.log(response)
                if(index+1 == this.array_id.length){
                  this.closeModal()
                  window.location.reload()
                }
              }
            );
          }
        }else{
          this.closeModal()
          window.location.reload()
        }
      }
    );
  }
  enable_checked(id){
    if (this.array_items.indexOf(id) !== -1) {
      return true;
    }
  }
  onFileSelected(event){
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.base64 = reader.result;
    };
  }
}
