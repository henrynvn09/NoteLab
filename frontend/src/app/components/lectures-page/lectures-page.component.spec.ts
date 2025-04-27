import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LecturesPageComponent } from './lectures-page.component';

describe('LecturesPageComponent', () => {
  let component: LecturesPageComponent;
  let fixture: ComponentFixture<LecturesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LecturesPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LecturesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
