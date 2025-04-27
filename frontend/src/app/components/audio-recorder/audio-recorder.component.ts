import { Component, OnDestroy, ViewChild, ElementRef, OnInit } from '@angular/core';
import { AudioRecordingService } from '../../services/audio-recording.service';
import { NoteService, TimestampedNote } from '../../services/note.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-audio-recorder',
  templateUrl: './audio-recorder.component.html',
  styleUrls: ['./audio-recorder.component.scss']
})
export class AudioRecorderComponent implements OnInit, OnDestroy {
  @ViewChild('notesTextarea') notesTextarea!: ElementRef<HTMLTextAreaElement>;
  
  // PDF-related properties
  pdfSrc: string | null = null;
  pdfFileName: string | null = null;
  currentSlideNumber = 1;
  
  audioElement: HTMLAudioElement | null = null;
  courseId: string | null = null;
  lectureId: string | null = null;

  constructor(
    private audioRecordingService: AudioRecordingService,
    private noteService: NoteService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.courseId = params.get('courseId');
      this.lectureId = params.get('lectureId');
      console.log('Audio recorder initialized with course:', this.courseId, 'and lecture:', this.lectureId);
    });
  }
  
  // Getter to expose service property to template
  get audioURL(): string | null {
    return this.audioRecordingService.getAudioURL();
  }
  
  get currentNote(): string {
    return this.noteService.getCurrentNote();
  }
  
  set currentNote(value: string) {
    this.noteService.setCurrentNote(value);
  }
  
  get notes(): TimestampedNote[] {
    return this.noteService.getAllNotes();
  }
  
  get isRecording(): boolean {
    return this.audioRecordingService.isCurrentlyRecording();
  }
  
  // Handle slide number changes from PDF viewer
  onSlideNumberChange(slideNumber: number) {
    this.currentSlideNumber = slideNumber;
    this.noteService.setCurrentSlideNumber(slideNumber);
  }

  // Handle PDF selection from PDF viewer
  onPdfSelected(pdfData: {file: File, url: string}) {
    this.pdfFileName = pdfData.file.name;
    this.pdfSrc = pdfData.url;
    
    // Update note service about PDF status
    this.noteService.setPdfStatus(true);
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

  saveNote() {
    this.noteService.saveNote(this.isRecording);
  }

  onAudioLoaded(audioElement: HTMLAudioElement) {
    this.audioElement = audioElement;
    this.noteService.setAudioElement(this.audioElement);
  }

  formatTimestamp(timestamp: number): string {
    return this.noteService.formatTimestamp(timestamp);
  }

  ngOnDestroy(): void {
    this.audioRecordingService.cleanup();
    
    // Clean up PDF URL if it exists
    if (this.pdfSrc) {
      URL.revokeObjectURL(this.pdfSrc);
    }
  }
}