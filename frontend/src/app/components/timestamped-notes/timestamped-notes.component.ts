import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  Input,
  ViewChild,
  ElementRef,
  HostListener
} from '@angular/core';
import { NoteService } from '../../services/note.service';
import { Editor, Toolbar, NgxEditorComponent } from 'ngx-editor';

@Component({
  selector: 'app-timestamped-notes',
  templateUrl: './timestamped-notes.component.html',
  styleUrls: ['./timestamped-notes.component.scss']
})
export class TimestampedNotesComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() isRecording = false;
  @ViewChild('ngxEditorComp') ngxEditorComp!: NgxEditorComponent;

  editor!: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify']
  ];

  constructor(private noteService: NoteService) {}

  ngOnInit(): void {
    this.editor = new Editor({ keyboardShortcuts: true });
  }

  ngAfterViewInit(): void {
    console.log('Editor is ready:', this.editor);
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }
@HostListener('document:keydown', ['$event'])
handleKeyDown(event: KeyboardEvent) {
  const activeElement = document.activeElement;
  const isEditorFocused = activeElement?.classList.contains('NgxEditor__Content');

  if (!isEditorFocused) return;

  const isMac = navigator.platform.toLowerCase().includes('mac');
  const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

  if (event.key === 'Tab') {
    event.preventDefault();
    this.editor.commands.insertText('    ').exec(); // 4 spaces
    console.log('Inserted 4 spaces (Tab)');
  } else if (event.key === 'Enter') {
    event.preventDefault();
    this.noteService.appendToCurrentNote('\n');
    this.insertTimestamp();
    console.log('Inserted timestamp (Enter)');
  } else if (ctrlOrCmd && event.shiftKey && event.key === '8') {
    event.preventDefault();
    this.editor.commands.toggleBulletList().focus().exec();
    console.log('Toggled bullet list (Cmd/Ctrl + Shift + 8)');
  }
}


  toggleBulletList() {
    this.editor.commands.toggleBulletList().focus().exec();
  }

  get currentNote(): string {
    return this.noteService.getCurrentNote();
  }

  set currentNote(value: string) {
    this.noteService.setCurrentNote(value);
  }

  insertTimestamp() {
    this.noteService.insertTimestamp(this.isRecording);
  }
}
