import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingformComponent } from './landingform.component';

describe('LandingformComponent', () => {
  let component: LandingformComponent;
  let fixture: ComponentFixture<LandingformComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LandingformComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LandingformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
