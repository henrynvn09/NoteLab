import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimestampedNotesComponent } from './timestamped-notes.component';

describe('TimestampedNotesComponent', () => {
  let component: TimestampedNotesComponent;
  let fixture: ComponentFixture<TimestampedNotesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TimestampedNotesComponent]
    });
    fixture = TestBed.createComponent(TimestampedNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
