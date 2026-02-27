import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnswerHistoricalComponent } from './historical.component';

describe('AnswerHistoricalComponent', () => {
  let component: AnswerHistoricalComponent;
  let fixture: ComponentFixture<AnswerHistoricalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnswerHistoricalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnswerHistoricalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
