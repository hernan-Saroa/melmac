import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailAnswerComponent } from './detail-answer.component';

describe('DetailAnswerComponent', () => {
  let component: DetailAnswerComponent;
  let fixture: ComponentFixture<DetailAnswerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailAnswerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailAnswerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
