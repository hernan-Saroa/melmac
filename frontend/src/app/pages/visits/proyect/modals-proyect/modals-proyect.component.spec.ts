import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalsProyectComponent } from './modals-proyect.component';

describe('ModalsProyectComponent', () => {
  let component: ModalsProyectComponent;
  let fixture: ComponentFixture<ModalsProyectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalsProyectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalsProyectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
