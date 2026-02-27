import { Injectable } from '@angular/core';
import { waitForAsync } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { of, Observable } from 'rxjs';
import { EnterpriseService } from '../services/enterprise.service';

@Injectable({
  providedIn: 'root',
})
export class CheckLoginGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot){
    const user = JSON.parse(localStorage.getItem('session')) || null;
    const env = sessionStorage.getItem('environment');
    if (user) {
      if (user['change_password']) {
        localStorage.removeItem('session');
        this.router.navigateByUrl('/login');
      }
      return of(true);
    } else {
      let ent_loaded = sessionStorage.getItem('environment');
      if (ent_loaded){
        let ent = ent_loaded.split(';')[0];
        this.router.navigateByUrl('/login/'+ent);
      } else {
        this.router.navigateByUrl('/login');
      }
      return of(false);
    }
  }
}

@Injectable({
  providedIn: 'root',
})
export class CheckEnterpriseGuard implements CanActivate {
  constructor(private router: Router, private service: EnterpriseService) {}

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot){
    let ent = next.paramMap.get('ent').toLowerCase();
    return new Promise<boolean>((resolve, reject)=> {
      if (this.service.acronyms != null) {
        let value = this.service.acronyms[ent];
        if (value != undefined){
          sessionStorage.setItem('environment', ent + ';' + value);
        } else {
          this.router.navigateByUrl('/login');
        }
        return of(value != undefined);
      } else {
        this.service.getAcronyms().subscribe((response) => {
          this.service.acronyms = response['data'];
          // console.log('done', response['data'])
        }, null, ()=>{
          // console.log(this.service.acronyms);
          if (this.service.acronyms != null) {
            // console.log(this.service.acronyms != null, 'value', this.service.acronyms);
            let value = this.service.acronyms[ent];
            if (value != undefined){
              sessionStorage.setItem('environment', ent + ';' + value);
            } else {
              this.router.navigateByUrl('/login');
            }
            resolve(value != undefined);
          }
        });
      }


    });
  }


}
