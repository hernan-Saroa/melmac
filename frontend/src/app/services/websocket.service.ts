import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  constructor() { }

  private subject: Subject<MessageEvent>;

  public connect(url: string): Subject<MessageEvent> {
    if (!this.subject) {
      this.subject = this.create(url);
    }
    return this.subject;
  }

  protected create(url: string): Subject<MessageEvent> {
    const ws = new WebSocket(url);

    const observable = new Observable<MessageEvent>((subscriber) => {
      ws.onmessage = (event) => subscriber.next(event);
      ws.onerror = () => { /* WebSocket no disponible en modo local */ };
      ws.onclose = () => subscriber.complete();
      return () => ws.close();
    });

    const observer = {
      next: (data: Object) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
        }
      }
    };

    const subject = new Subject<MessageEvent>();
    observable.subscribe(subject);
    return subject;
  }

}
