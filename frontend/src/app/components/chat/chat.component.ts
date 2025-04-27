// voice-transcription.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { VoiceRecognitionService } from '../../services/voice-recognition.service';
import { ActivatedRoute } from '@angular/router';

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
  
  constructor(
    private voiceService: VoiceRecognitionService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get course information from the route parameters
    this.route.paramMap.subscribe(params => {
      const courseNameParam = params.get('courseName');
      if (courseNameParam) {
        this.courseName = courseNameParam.replace(/-/g, ' ');
      }
    });
    
    // Also check query parameters (for backward compatibility)
    this.route.queryParamMap.subscribe(params => {
      const courseIdParam = params.get('courseId');
      const courseNameParam = params.get('courseName');
      
      if (courseIdParam) {
        this.courseId = courseIdParam;
      }
      
      if (courseNameParam && !this.courseName) {
        this.courseName = courseNameParam;
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
  submitTranscript(): void {
    // For now, this is a null submit as requested
    // This is where you would implement the submission logic in the future
    console.log('Transcript submitted:', this.chatLog);
    
    // Keep the isStoppedState true to continue showing the submit/start over buttons
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
