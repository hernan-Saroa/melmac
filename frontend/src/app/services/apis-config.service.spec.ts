import { TestBed } from '@angular/core/testing';

import { ApisConfigService } from './apis-config.service';

describe('ApisConfigService', () => {
  let service: ApisConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApisConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
