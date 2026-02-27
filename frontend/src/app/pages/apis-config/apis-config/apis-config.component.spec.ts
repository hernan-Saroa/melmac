import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApisConfigComponent } from './apis-config.component';

describe('ApisConfigComponent', () => {
  let component: ApisConfigComponent;
  let fixture: ComponentFixture<ApisConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ApisConfigComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApisConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
