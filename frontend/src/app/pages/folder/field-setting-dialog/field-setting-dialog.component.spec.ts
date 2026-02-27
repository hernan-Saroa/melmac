import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldSettingDialogComponent } from './field-setting-dialog.component';

describe('FieldSettingDialogComponent', () => {
  let component: FieldSettingDialogComponent;
  let fixture: ComponentFixture<FieldSettingDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FieldSettingDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FieldSettingDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
