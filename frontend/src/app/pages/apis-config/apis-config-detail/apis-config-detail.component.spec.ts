import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApisConfigDetailComponent } from './apis-config-detail.component';

describe('ApisConfigDetailComponent', () => {
  let component: ApisConfigDetailComponent;
  let fixture: ComponentFixture<ApisConfigDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApisConfigDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApisConfigDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
