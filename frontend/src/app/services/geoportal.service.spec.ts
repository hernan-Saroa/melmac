import { TestBed } from '@angular/core/testing';

import { GeoportalService } from './geoportal.service';

describe('GeoportalService', () => {
  let service: GeoportalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoportalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
