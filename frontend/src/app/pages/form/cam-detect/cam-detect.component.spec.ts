import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CamDetectComponent } from './cam-detect.component';

describe('CamDetectComponent', () => {
  let component: CamDetectComponent;
  let fixture: ComponentFixture<CamDetectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CamDetectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CamDetectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
