import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserMassiveComponent } from './massive.component';

describe('UserMassiveComponent', () => {
  let component: UserMassiveComponent;
  let fixture: ComponentFixture<UserMassiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserMassiveComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserMassiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
