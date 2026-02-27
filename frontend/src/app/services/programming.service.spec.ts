import { TestBed } from '@angular/core/testing';

import { ProgrammingService } from './programming.service';

describe('UserService', () => {
  let service: ProgrammingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProgrammingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
