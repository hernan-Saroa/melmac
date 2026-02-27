import { TestBed } from '@angular/core/testing';

import { WsSendService } from './ws-send.service';

describe('WsSendService', () => {
  let service: WsSendService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WsSendService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
