import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailVisitComponent } from './detail-visit.component';

describe('DetailVisitComponent', () => {
  let component: DetailVisitComponent;
  let fixture: ComponentFixture<DetailVisitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DetailVisitComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DetailVisitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
