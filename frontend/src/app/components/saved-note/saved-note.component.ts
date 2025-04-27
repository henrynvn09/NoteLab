import { Component, OnDestroy, ViewChild, ElementRef, OnInit } from '@angular/core';
import { AudioRecordingService } from '../../services/audio-recording.service';
import { NoteService, TimestampedNote } from '../../services/note.service';
import { ActivatedRoute } from '@angular/router';
import { LectureDataService, LectureUpdateResponse } from '../../services/lecture-data.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface TranscriptLine {
  startTime: number;
  text: string;
}

@Component({
  selector: 'app-saved-note',
  templateUrl: './saved-note.component.html',
  styleUrls: ['./saved-note.component.scss']
})
export class SavedNoteComponent implements OnInit, OnDestroy {
  @ViewChild('notesTextarea') notesTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('audioPlayer') audioPlayerRef!: ElementRef<HTMLAudioElement>;
  
  // PDF-related properties
  pdfSrc: string | null = null;
  pdfFileName: string | null = null;
  currentSlideNumber = 1;
  
  audioElement: HTMLAudioElement | null = null;
  courseId: string | null = null;
  lectureId: string | null = null;
  
  // Audio player properties
  audioSrc: string = 'assets/demo-audio.mp3'; // Placeholder URL for now
  isPlaying: boolean = false;
  currentTime: number = 0;
  duration: number = 0;
  
  // Transcript properties
  transcript: TranscriptLine[] = [
    { startTime: 0, text: 'sa' },
    { startTime: 5, text: 'ads' },
    { startTime: 10, text: 'd' },
    { startTime: 15, text: 'sas' },
    { startTime: 20, text: 'd' },
  ];
  currentLineIndex: number = 0;

  // Properties to store lecture data
  lectureData: LectureUpdateResponse | null = null;
  lectureTitle: string = 'Untitled Note';
  private lectureDataSubscription: Subscription | null = null;

  // Tab navigation
  activeTab: 'notes' | 'ai-notes' = 'notes'; // Default to notes tab

  constructor(
    private audioRecordingService: AudioRecordingService,
    private noteService: NoteService,
    private route: ActivatedRoute,
    private lectureDataService: LectureDataService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.courseId = params.get('courseId');
      this.lectureId = params.get('lectureId');
      console.log('Saved note initialized with course:', this.courseId, 'and lecture:', this.lectureId);
      
      // If we have course and lecture IDs, fetch the data from API
      if (this.courseId && this.lectureId) {
        console.log('Fetching lecture data...', this.courseId, this.lectureId);
        this.fetchLectureData(this.courseId, this.lectureId);
      }
    });
    
    // Subscribe to lecture data
    this.lectureDataSubscription = this.lectureDataService.lectureData$.subscribe(data => {
      if (data) {
        console.log('Received lecture data:', data);
        this.lectureData = data;
        this.processLectureData(data);
      }
    });
  }
  
  /**
   * Fetch lecture data from the backend API
   * @param courseId The course ID
   * @param lectureId The lecture ID
   */
  private fetchLectureData(courseId: string, lectureId: string): void {
    const url = `http://localhost:8000/courses/${courseId}/${lectureId}`;
    
    console.log(`Fetching lecture data from ${url}`);
    
    this.http.get<LectureUpdateResponse>(url).subscribe({
      next: (response) => {
        console.log('API response received:', response);
        
        // Store the response data in the shared service
        this.lectureDataService.setLectureData(response);
        
        // Process the data directly as well
        this.lectureData = response;
        this.processLectureData(response);
        console.log('Lecture data processed finally:', this.lectureData);
      },
      error: (error) => {
        console.error('Error fetching lecture data:', error);
      }
    });
  }
  
  /**
   * Process the lecture data received from the lecture data service
   * @param data The lecture data to process
   */
  private processLectureData(data: LectureUpdateResponse): void {
    // For now, we'll just set the data in the note service
    console.log('Processing lecture data new function:', data);
    if (data.title) {
      console.log('Setting lecture title:', data.title);
      this.lectureTitle = data.title;
      this.noteService.setNoteTitle(data.title); // Also update the note service
    }
    if (data.note) {
      this.noteService.setCurrentNote(data.note);
    }
    
    // If there's transcript data, update our transcript array
    if (data.transcript) {
      // In a real implementation, you would parse the transcript into transcript lines
      // For now, we'll just add a simple entry
      this.transcript = data.transcript.split('\n').map((line, index) => ({
        startTime: index * 5, // Placeholder for start time
        text: line
      }));
    }
    
    // If there are slides, update the PDF viewer
    if (data.slides) {
      // Set the PDF source from the slides data in the response
      this.pdfSrc = data.slides;
      console.log('Set PDF source from response:', this.pdfSrc);
    }
    
    // Similarly for recording data
    if (data.recording) {
      // In a real implementation, you would set the audio source
      // For now, we'll just log it
      console.log('Received recording data:', data.recording);
      console.log('Set audio source from response:', data.recording);
    }
  }
  
  ngAfterViewInit() {
    if (this.audioPlayerRef && this.audioPlayerRef.nativeElement) {
      const player = this.audioPlayerRef.nativeElement;
      
      // Setup audio event listeners
      player.addEventListener('loadedmetadata', () => {
        this.duration = player.duration;
      });
      
      player.addEventListener('timeupdate', () => {
        this.currentTime = player.currentTime;
        this.updateCurrentLine();
      });
      
      player.addEventListener('play', () => {
        this.isPlaying = true;
      });
      
      player.addEventListener('pause', () => {
        this.isPlaying = false;
      });
    }
  }
  
  // Audio player methods
  playPause() {
    const player = this.audioPlayerRef.nativeElement;
    if (this.isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    this.isPlaying = !this.isPlaying;
  }
  
  onSliderChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const player = this.audioPlayerRef.nativeElement;
    player.currentTime = Number(value);
    this.currentTime = player.currentTime;
    this.updateCurrentLine();
  }
  
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Transcript methods
  updateCurrentLine() {
    for (let i = this.transcript.length - 1; i >= 0; i--) {
      if (this.currentTime >= this.transcript[i].startTime) {
        this.currentLineIndex = i;
        break;
      }
    }
  }
  
  isCurrentLine(line: TranscriptLine): boolean {
    return this.transcript.indexOf(line) === this.currentLineIndex;
  }
  
  seekToTimestamp(time: number) {
    const player = this.audioPlayerRef.nativeElement;
    player.currentTime = time;
    this.currentTime = time;
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

    // Unsubscribe from lecture data subscription
    if (this.lectureDataSubscription) {
      this.lectureDataSubscription.unsubscribe();
    }
  }
}