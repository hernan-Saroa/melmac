import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogMassiveComponent } from './dialog-massive.component';

describe('DialogMassiveComponent', () => {
  let component: DialogMassiveComponent;
  let fixture: ComponentFixture<DialogMassiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DialogMassiveComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogMassiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
