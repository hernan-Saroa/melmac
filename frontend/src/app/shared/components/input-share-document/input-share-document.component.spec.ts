import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputShareDocumentComponent } from './input-share-document.component';

describe('InputShareDocumentComponent', () => {
  let component: InputShareDocumentComponent;
  let fixture: ComponentFixture<InputShareDocumentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InputShareDocumentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InputShareDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
