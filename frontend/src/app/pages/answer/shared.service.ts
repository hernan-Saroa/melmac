import { Injectable } from "@angular/core";
import { Subject } from "rxjs/Subject";

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  // Observable string sources
  private emitChangeSource = new Subject<any>();
  public changeEmitted$;

  constructor() {
    // Observable string streams
    this.changeEmitted$ = this.emitChangeSource.asObservable();
  }

  // ngOnDestroy(): void {
  //   console.log('service destroyed');
  //   this.emitChangeSource.unsubscribe();
  // }

  // Service message commands
  emitChange(change: any) {
      // console.log('change');
      // console.log(change);
      this.emitChangeSource.next(change);
      // this.emitChangeSource;
  }

}
