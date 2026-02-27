import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HandwrittenComponent } from './handwritten.component';

describe('HandwrittenComponent', () => {
  let component: HandwrittenComponent;
  let fixture: ComponentFixture<HandwrittenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HandwrittenComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HandwrittenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
