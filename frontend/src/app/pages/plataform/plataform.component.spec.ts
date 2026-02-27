import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlataformComponent } from './plataform.component';

describe('PlataformComponent', () => {
  let component: PlataformComponent;
  let fixture: ComponentFixture<PlataformComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlataformComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlataformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
