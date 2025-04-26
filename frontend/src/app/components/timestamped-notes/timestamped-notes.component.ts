import { Component, OnInit, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy, HostListener } from '@angular/core';
import { NoteService } from '../../services/note.service';
import { Editor, Toolbar } from 'ngx-editor';

@Component({
  selector: 'app-timestamped-notes',
  templateUrl: './timestamped-notes.component.html',
  styleUrls: ['./timestamped-notes.component.scss']
})
export class TimestampedNotesComponent implements OnInit, OnDestroy {
  @ViewChild('notesTextarea') notesTextarea!: ElementRef<HTMLTextAreaElement>;
  @Input() isRecording: boolean = false;
  
  constructor(private noteService: NoteService) {}
  editor!: Editor;
  toolbar: Toolbar = [
    ['bold', 'italic'],
    ['underline', 'strike'],
    ['code', 'blockquote'],
    ['ordered_list', 'bullet_list'],
    [{ heading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] }],
    ['link', 'image'],
    ['text_color', 'background_color'],
    ['align_left', 'align_center', 'align_right', 'align_justify'],
  ];
  
  ngOnInit(): void {
    this.editor = new Editor({
      keyboardShortcuts: true // Enable keyboard shortcuts
    });
  }
  
  ngOnDestroy(): void {
    this.editor.destroy();
  }
  
  // Add a host listener for keyboard shortcuts
  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent) {
    const isMac = navigator.platform.toLowerCase().includes('mac');
    const ctrlOrCmd = isMac ? event.metaKey : event.ctrlKey;

    if (ctrlOrCmd && event.shiftKey && event.key === '8') {
      event.preventDefault();
      this.toggleBulletList();
    }
  }

  
  toggleBulletList() {
    this.editor.commands.toggleBulletList().focus().exec();
    console.log('Bullet list toggled');
  }

  
  get currentNote(): string {
    return this.noteService.getCurrentNote();
  }
  
  set currentNote(value: string) {
    this.noteService.setCurrentNote(value);
  }
  
  onKeyDown(event: KeyboardEvent) {
    // Insert timestamp on Enter key
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent default to handle line breaks ourselves
      
      // Add a newline and timestamp
      this.noteService.appendToCurrentNote('\n');
      this.insertTimestamp();
      
      // Auto-scroll to bottom after adding a new line
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }
  
  // Auto-scroll to bottom of textarea
  scrollToBottom(): void {
    if (this.notesTextarea && this.notesTextarea.nativeElement) {
      const textarea = this.notesTextarea.nativeElement;
      textarea.scrollTop = textarea.scrollHeight;
    }
  }
  
  insertTimestamp() {
    this.noteService.insertTimestamp(this.isRecording);
    // Auto-scroll to bottom after adding timestamp
    setTimeout(() => this.scrollToBottom(), 0);
  }
}
