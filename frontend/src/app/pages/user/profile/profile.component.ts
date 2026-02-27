import { UserService } from './../../../services/user.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ngx-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  title = "Tu Información"
  docTypeSelected;
  inputDocNumber;
  docTypes = []
  inputEmail;
  inputPhone;
  user_data;
  fileName;

  constructor(private service:UserService) {
    this.service.get_identification().subscribe(
      response => {
        response['data'].forEach(identification => {
          this.docTypes.push({value: identification['id'], title: identification['name']});
        });
      }
    );
    let user = JSON.parse(localStorage.getItem('session')) || null;
    this.user_data = {
      id_user:user.id,
      id_enterprise:user.enterprise,
      fname:user.first_name,
      sname:user.middle_name,
      lfname:user.first_last_name,
      lsname:user.second_last_name,
      // image:user.image != 'media/' ? user.image : '0',
    }
    this.docTypeSelected = user.type_doc;
    this.inputDocNumber = user.identification;
    this.inputEmail = user.email;
    this.inputPhone = user.phone;
  }

  ngOnInit(): void {
  }

  onAccept(event){
    let user = JSON.parse(localStorage.getItem('session')) || null;
    this.service.update_profile(this.user_data).subscribe(response => {
      if (response['status']){
        user.first_name = response['data']['parameters']['fname'];
        user.middle_name = response['data']['parameters']['sname'];
        user.first_last_name = response['data']['parameters']['flname'];
        user.second_last_name = response['data']['parameters']['slname'];
        localStorage.setItem('session', JSON.stringify(user));
        window.location.reload();
      }
    });
  }

  onFileSelected(event){

  }

}
