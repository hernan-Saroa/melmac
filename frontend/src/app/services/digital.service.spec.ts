import { TestBed } from '@angular/core/testing';

import { DigitalService } from './digital.service';

describe('DigitalService', () => {
  let service: DigitalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DigitalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
