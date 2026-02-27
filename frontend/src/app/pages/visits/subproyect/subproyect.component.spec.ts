import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubproyectComponent } from './subproyect.component';

describe('SubproyectComponent', () => {
  let component: SubproyectComponent;
  let fixture: ComponentFixture<SubproyectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubproyectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubproyectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
