import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalsSubComponent } from './modals-sub.component';

describe('ModalsSubComponent', () => {
  let component: ModalsSubComponent;
  let fixture: ComponentFixture<ModalsSubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalsSubComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalsSubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
