import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalsTaskComponent } from './modals-task.component';

describe('ModalsTaskComponent', () => {
  let component: ModalsTaskComponent;
  let fixture: ComponentFixture<ModalsTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ModalsTaskComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ModalsTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
