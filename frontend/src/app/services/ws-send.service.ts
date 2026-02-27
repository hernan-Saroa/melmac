import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { WebsocketService } from './websocket.service';

const WEBSOCKET_URL = 'ws://localhost:9001';

@Injectable({
  providedIn: 'root'
})
export class WsSendService {

  user_data;
  private websocketService: WebsocketService;
  messages:Subject<any>;
  constructor() {
    this.websocketService = new WebsocketService();
    this.user_data = JSON.parse(localStorage.getItem('session')) || null;
  }

  public recive_enterprise():Subject<any> {
    const channel = WEBSOCKET_URL + '/ws/enterprise/' + this.user_data.token + '/'
    return this.connect(channel);
  }

  public recive_user():Subject<any> {
    const channel = WEBSOCKET_URL + '/ws/user/' + this.user_data.token + '/'
    return this.connect(channel);
  }

  public lp_user():Subject<any> {
    const channel = WEBSOCKET_URL + '/ws/lp_user/' + this.user_data.token + '/'
    return this.connect(channel);
  }

  private connect(channel) {
    if (this.user_data) {
      this.messages = this.websocketService
      .connect(channel);
      return this.messages;
    }
  }


}
