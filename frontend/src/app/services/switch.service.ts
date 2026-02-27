import { EventEmitter,Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SwitchService {

  constructor() {}

    $sing = new EventEmitter<any>();
    $nameSubp = new EventEmitter<any>();
    $nameSubp2 = new EventEmitter<any>();
    $modalsing = new EventEmitter<any>();
    $processSub = new EventEmitter<any>();
    $taskSub = new EventEmitter<any>();

}
