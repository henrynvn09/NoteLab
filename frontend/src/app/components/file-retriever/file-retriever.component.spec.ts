import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileRetrieverComponent } from './file-retriever.component';

describe('FileRetrieverComponent', () => {
  let component: FileRetrieverComponent;
  let fixture: ComponentFixture<FileRetrieverComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileRetrieverComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileRetrieverComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
