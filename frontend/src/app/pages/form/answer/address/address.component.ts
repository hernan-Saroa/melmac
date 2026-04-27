import { Component, OnInit, ViewChild } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { ContentObserver } from '@angular/cdk/observers';

@Component({
    selector: 'ngx-address',
    templateUrl: './address.component.html',
    styleUrls: ['./address.component.scss'],
    standalone: false
})
export class AddressComponent implements OnInit {

  loading = false;
  name_option_user;
  filteredRoad$: Observable<any[]>;
  list_road =[];
  list_user;
  user_select = [];
  user_select_id = [];
  name_option_address = "";
  main_road = "";
  letter_road= "";
  main_bis= "";
  second_letter_road= "";
  main_cardinal= "";
  three_letter_road= "";
  second_main_cardinal = "";
  three_main_cardinal = "";
  disable_street: boolean = true;
  acceptRoad:boolean=true;
  sec_letter_road;
  cardinal_road =[    
    {id: "BIS", name: "Bis"},
    {id: "ESTE", name: "Este"},
    {id: "NORTE", name: "Norte"},
    {id: "OESTE", name: "Oeste"},
    {id: "SUR", name: "Sur"}
  ];
  public data: {
    field:any,
  }

  constructor(
    public dialogRef: NbDialogRef<AddressComponent>,

  ) { }

  @ViewChild('autoRoad') input_address;

  ngOnInit(): void {
    if (this.data.field.answer_address && this.data.field.answer_address != '') {
      let data_address = this.data.field.answer_address.split('-');
      this.main_road = data_address[0] ? data_address[0]: '';
      this.letter_road = data_address[1] ? data_address[1]: '';
      this.main_cardinal  = data_address[2] ? data_address[2]: '';
      this.second_letter_road = data_address[3] ? data_address[3]: '';
      this.second_main_cardinal = data_address[4] ? data_address[4]: '';
      this.three_letter_road = data_address[5] ? data_address[5]: '';
      this.three_main_cardinal = data_address[6] ? data_address[6]: '';
      this.acceptRoad = data_address[7] ? data_address[7]: '';
      //this.confirm = this.data.field.answer;
    }else{
      // console.log("No entra las respuestas");
    }

    this.list_road = [
      {id: "AUTOPISTA", name: "Autopista"},
      {id: "AVENIDA", name: "Avenida"},
      {id: "AVENIDA CALLE", name: "Avenida Calle"},
      {id: "AVENIDA CARRERA", name: "Avenida Carrera"},
      {id: "BULEVAR", name: "Bulevar"},
      {id: "CALLE", name: "Calle"},
      {id: "CARRERA", name: "Carrera"},
      {id: "CARRETERA", name: "Carretera"},
      {id: "CIRCULAR", name: "Circular"},
      {id: "CIRCUNVALAR", name: "Circunvalar"},
      {id: "CUENTAS CORRIDAS", name: "Cuentas Corridas"},
      {id: "DIAGONAL", name: "Diagonal"},
      {id: "PASAJE", name: "Pasaje"},
      {id: "PASEO", name: "Paseo"},
      {id: "PEATONAL", name: "Peatonal"},
      {id: "TRANSVERSAL", name: "Transversal"},
      {id: "TRONCAL", name: "Troncal"},
      {id: "VARIANTE", name: "Variante"},
      {id: "VÍA", name: "Vía"}
    ];
    this.filteredRoad$ = of(this.list_road);

  }

  private filterRoad(value){
    const filterValue = value.toLowerCase();
    let list_main_road = this.list_road.filter(road => road.id.toLowerCase().includes(filterValue));
    return list_main_road;
  }

  getFilteredRoad(value): Observable<any[]> {
    return of(value).pipe(
      map(filterString => this.filterRoad(filterString)),
    );
    
  }

  onChangeAddress() {
    this.filteredRoad$ = this.getFilteredRoad(this.input_address.nativeElement.value);
    let position = this.list_road.map(function(e) { return e.id; }).indexOf(this.input_address.nativeElement.value.toUpperCase());
    if (position != -1) {
      this.main_road = this.list_road[position].id;
    }else{
      this.main_road = '';
      //this.acceptRoad = true;
    }
  }

  onSelectionAddressChange(event) {
    this.filteredRoad$ = this.getFilteredRoad(event)
    this.main_road = event;
  }

  onKeyNumber(event){
    if(event.key === 'e' || event.key === '.' || event.key === 'E' || event.key === '-' || event.key === '+'){
      event.preventDefault()
    }
  }

  onKeyWord(event){
    if ((event.keyCode >= 65 && event.keyCode <= 90) || (event.keyCode >= 48 && event.keyCode <=57) || (event.keyCode >= 96 && event.keyCode <=105) || event.keyCode === 8 || event.keyCode === 32){
      return true;
    }
    return false;
  }

  onAccept(event){
    let address_complete = (this.main_road ? this.main_road: '') +'-'+ 
    this.letter_road +'-'+ this.main_cardinal +'-'+ this.second_letter_road +'-'+
    this.second_main_cardinal +'-'+ this.three_letter_road  +'-'+ this.three_main_cardinal;

    this.dialogRef.close(address_complete);
  }

  close(){
    this.dialogRef.close(false);
  }
}
