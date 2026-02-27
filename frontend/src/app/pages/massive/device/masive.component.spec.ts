import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceMassiveComponent } from './massive.component';

describe('MasiveComponent', () => {
  let component: DeviceMassiveComponent;
  let fixture: ComponentFixture<DeviceMassiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeviceMassiveComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceMassiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
