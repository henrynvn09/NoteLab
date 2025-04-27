// voice-transcription.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { VoiceRecognitionService } from '../../services/voice-recognition.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LectureDataService, LectureUpdateResponse } from '../../services/lecture-data.service';
import { NoteService } from '../../services/note.service';


interface TranscriptEntry {
  text: string;
  start: number;
  end: number;
}

@Component({
  selector: 'app-chat-component',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})

export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatLogContainer') private chatLogContainer!: ElementRef;
  
  transcriptEntries: TranscriptEntry[] = [];
  chatLog: string[] = [];
  liveTranscript: string = '';
  isRecording = false;
  isPaused = false;
  hasLogs = false;
  isStoppedState = false;
  
  // Flag to track when new content is added
  private shouldScrollToBottom = false;
  
  // Course information
  courseId: string | null = null;
  courseName: string | null = null;
  lectureId: string | null = null;
  
  constructor(
    private voiceService: VoiceRecognitionService,
    private route: ActivatedRoute,
    private http: HttpClient,
    private lectureDataService: LectureDataService,
    private router: Router,
    private noteService: NoteService
  ) {}

  ngOnInit(): void {
    // Get course information from the route parameters
    this.route.paramMap.subscribe(params => {
      // Extract courseId from the URL path (first parameter after /courses/)
      const courseIdParam = params.get('courseId');
      const courseNameParam = params.get('courseName');
      const lectureIdParam = params.get('lectureId');
      
      if (courseIdParam) {
        this.courseId = courseIdParam;
      }
      
      if (courseNameParam) {
        this.courseName = courseNameParam.replace(/-/g, ' ');
      }
      
      if (lectureIdParam) {
        this.lectureId = lectureIdParam;
      }
    });
    
    // Also check query parameters (for backward compatibility)
    this.route.queryParamMap.subscribe(params => {
      const courseIdParam = params.get('courseId');
      const courseNameParam = params.get('courseName');
      const lectureIdParam = params.get('lectureId');
      
      if (courseIdParam && !this.courseId) {
        this.courseId = courseIdParam;
      }
      
      if (courseNameParam && !this.courseName) {
        this.courseName = courseNameParam;
      }
      
      if (lectureIdParam && !this.lectureId) {
        this.lectureId = lectureIdParam;
      }
    });
    
    // Subscribe to transcript events
    this.voiceService.setOnTranscriptHandlers({
      onPartial: (partial) => {
        this.liveTranscript = partial;
        this.shouldScrollToBottom = true;
      },
      onFinal: (text : string, start: number, end: number) => {
        this.chatLog.push(text);
        this.transcriptEntries.push({text, start, end});
        this.liveTranscript = ''; // Clear live partial on finalization
        this.shouldScrollToBottom = true;
      },
    });

    // Log the extracted parameters for debugging
    console.log('Extracted course ID:', this.courseId);
    console.log('Extracted lecture ID:', this.lectureId);
    console.log('Extracted course name:', this.courseName);
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    try {
      this.chatLogContainer.nativeElement.scrollTop = this.chatLogContainer.nativeElement.scrollHeight;
      this.shouldScrollToBottom = false;
    } catch(err) { }
  }

  start(): void {
    this.hasLogs = false;
    this.chatLog = [];
    this.transcriptEntries = [];
    this.liveTranscript = '';
    this.voiceService.startListening();
    this.isRecording = true;
    this.isStoppedState = false;
  }

  stop(): void {
    this.voiceService.stopListening();
    this.isRecording = false;
    this.isPaused = false;
    this.isStoppedState = true;
    this.hasLogs = true;
  }

  pause(): void {
    this.hasLogs = true;
    this.voiceService.pauseListening();
    this.isPaused = true;
  }

  resume(): void {
    this.hasLogs = false;
    this.voiceService.resumeListening();
    this.isPaused = false;
  }

  // New methods for Submit and Start Over buttons
  // Submit transcript and lecture materials to the server
  async submitTranscript(): Promise<void> {
    const currentNote = this.noteService.getCurrentNote();
    const noteTitle = this.noteService.getNoteTitle() || 'Untitled Lecture';
    
    console.log('Getting current note:', currentNote);
    console.log('Note title:', noteTitle);
    
    // Get PDF file directly from NoteService
    const pdfFile = this.noteService.getPdfFile();
    const isPdfLoaded = this.noteService.isPdfLoaded();
    
    // Generate VTT format
    const vttHeader = "WEBVTT\n\n";
    const vttBody = this.transcriptEntries.map((entry, index) => {
      return `${this.formatTime(entry.start)} --> ${this.formatTime(entry.end)}\n${entry.text}\n`;
    }).join('\n');
    const vttContent = vttHeader + vttBody;
    
    // Plain text format (chat log)
    const chatLogContent = this.chatLog.join('\n');
    
    try {
      // Prepare the data to be sent
      const lectureData = {
        title: noteTitle,
        transcript: chatLogContent,
        transcriptVTT: vttContent,
        // slides: isPdfLoaded && pdfFile ? pdfFile : null,
        slides:"",
        userNotes: currentNote,// Include user notes if available
        recording: "",
        ai_note:"",
      };

      console.log('Sending lecture data to endpoint:', lectureData);
      console.log('Course ID:', this.courseId);
      // Use the courseId from the component state instead of hardcoding
      if (!this.courseId) {
        throw new Error('Course ID is missing. Cannot submit lecture data.');
      }
      
      const endpoint = `http://localhost:8000/courses/${this.courseId}`;
      console.log('Submitting to endpoint:', endpoint);
      
      // Show loading indicator or message
      this.isStoppedState = false;
      this.hasLogs = true;
      
      // Send POST request to the endpoint
      const response = await firstValueFrom(
        this.http.post<LectureUpdateResponse>(endpoint, lectureData)
      );
      
      console.log('Received response from server:', response);
      
      // Process the response data and pass to saved-note component
      this.handleLectureResponse(response);
      
      // Keep the isStoppedState true to continue showing the submit/start over buttons
      this.isStoppedState = true;
      
    } catch (error) {
      console.error('Error submitting lecture materials:', error);
      alert('Failed to submit lecture materials. Please try again.');
      this.isStoppedState = true;
    }
  }
  
  // Handle the lecture update response
  private handleLectureResponse(response: LectureUpdateResponse): void {
    // Store the lecture data in the shared service
    this.lectureDataService.setLectureData(response);
    
    // Navigate to the saved-note component using the correct route path
    // The route is defined as 'courses/:courseId/:lectureId/generated-note'
    this.router.navigate(['/courses', this.courseId, this.lectureId, 'generated-note']);
  }

  startOver(): void {
    // Reset everything to initial state
    this.isStoppedState = false;
    this.hasLogs = false;
    this.chatLog = [];
    this.transcriptEntries = [];
    this.liveTranscript = '';
  }

  ngOnDestroy(): void {
    this.isRecording = false;
    this.isPaused = false;
    this.voiceService.stopListening();
  }

  downloadChatLog(): void {
    this.hasLogs = true;
    const chatContent = this.chatLog.join('\n');
    const blob = new Blob([chatContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // Use course name in the file name if available
    const fileName = this.courseName 
      ? `${this.courseName.toLowerCase().replace(/\s+/g, '_')}_chat_log.txt`
      : 'chat_log.txt';
      
    link.download = fileName;
    link.click();
  }

  downloadVTT(): void {
    const header = "WEBVTT\n\n";
    const body = this.transcriptEntries.map((entry, index) => {
      return `${this.formatTime(entry.start)} --> ${this.formatTime(entry.end)}\n${entry.text}\n`;
    }).join('\n');
  
    const blob = new Blob([header + body], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Use course name in the file name if available
    const fileName = this.courseName 
      ? `${this.courseName.toLowerCase().replace(/\s+/g, '_')}_transcript.vtt`
      : 'transcript.vtt';
      
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);    
  }

  formatTime(seconds : number): string {
    const date = new Date(seconds * 1000);
    const hh = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');
    const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
    return `${hh}:${mm}:${ss}.${ms}`;
  }
}
