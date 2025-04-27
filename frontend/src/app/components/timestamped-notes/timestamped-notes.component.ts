import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  Input,
  ViewChild,
  HostListener,
  Injector
} from '@angular/core';
import { NoteService } from '../../services/note.service';
import { Editor, Toolbar, NgxEditorComponent } from 'ngx-editor';
import { TimerService } from '../../services/timer.service';
import { VoiceRecognitionService } from '../../services/voice-recognition.service';

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

  private timerService: TimerService;

  constructor(
    private noteService: NoteService,
    private injector: Injector,
    private voiceService: VoiceRecognitionService
  ) {
    this.timerService = this.injector.get(TimerService);
  }

  ngOnInit(): void {
    this.editor = new Editor({ keyboardShortcuts: true });
  }

  ngAfterViewInit(): void {
    console.log('Editor ready:', this.editor);
  }

  ngOnDestroy(): void {
    this.editor.destroy();
  }
noteTitle: string = 'Timestamped Notes';
isEditingTitle: boolean = false; // Start in text mode

editTitle() {
  this.isEditingTitle = true;
}

saveTitle() {
  this.isEditingTitle = false;
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
      this.editor.commands.insertText('          ').exec();
      console.log('Inserted 4 spaces (Tab)');
    } else if (event.key === 'Enter') {
      // Prevent default behavior to handle it ourselves
      event.preventDefault();
      
      // Get the timestamp first
      const timestamp = this.getCurrentFormattedTimestamp();
      
      // Insert a newline and then the timestamp
      this.editor.commands.insertText(timestamp).exec();
      
      // Make sure editor stays focused
      setTimeout(() => {
        const editorElement = document.querySelector('.NgxEditor__Content');
        if (editorElement) {
          (editorElement as HTMLElement).focus();
        }
        console.log('Inserted newline with timestamp');
      }, 100);
    } else if (ctrlOrCmd && event.shiftKey && event.key === '8') {
      event.preventDefault();
      this.editor.commands.toggleBulletList().focus().exec();
      console.log('Toggled bullet list');
    }
  }

  get currentNote(): string {
    return this.noteService.getCurrentNote();
  }

  set currentNote(value: string) {
    this.noteService.setCurrentNote(value);
  }
  
  // Checks if voice recognition service has an active transcript
  isVoiceRecognitionActive(): boolean {
    // Try to get transcript time from voice service
    const transcriptTime = this.voiceService.getCurrentTranscriptTime();
    // If transcript time is greater than 0, voice recognition is active
    return transcriptTime > 0;
  }
  
  getCurrentFormattedTimestamp(): string {
    // Get the current time from either the audio player, voice recognition service, or recording timer
    let timestamp = 0;
    const audioElement = this.noteService.getAudioElement();
    
    if (audioElement) {
      timestamp = audioElement.currentTime;
    } else if (this.isVoiceRecognitionActive()) {
      // Get time from voice recognition service if it's active
      timestamp = this.voiceService.getCurrentTranscriptTime();
      console.log('Using voice recognition timestamp:', timestamp);
    } else if (this.isRecording) {
      // Fall back to timer service if no transcript time is available
      timestamp = this.timerService.getCurrentSeconds();
      console.log('Using timer service timestamp:', timestamp);
    }
    
    // Format time using VTT format
    let formattedTime = `[${this.formatTime(timestamp)}`;
    
    // Try to determine if PDF is loaded by checking the note service
    try {
      // Access private field using indexer notation as a workaround
      const pdfLoaded = (this.noteService as any).pdfLoaded;
      if (pdfLoaded) {
        const slideNumber = (this.noteService as any).currentSlideNumber;
        formattedTime += ` | Slide ${slideNumber}`;
      }
    } catch (e) {
      // If we can't access it, just use the basic format
    }
    
    formattedTime += `] `;
    return formattedTime;
  }

  formatTime(seconds: number): string {
    const date = new Date(seconds * 1000);
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
    return `${hh}:${mm}:${ss}.${ms}`;
  }

  downloadNote() {
    const blob = new Blob([this.currentNote], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timestamped_notes.html';
    a.click();
    URL.revokeObjectURL(url);
  }
}
