// voice-transcription.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { VoiceRecognitionService } from '../../services/voice-recognition.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LectureDataService, LectureUpdateResponse } from '../../services/lecture-data.service';

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
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get course information from the route parameters
    this.route.paramMap.subscribe(params => {
      const courseNameParam = params.get('courseName');
      const lectureIdParam = params.get('lectureId');
      
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
      
      if (courseIdParam) {
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
    console.log('Submitting transcript and lecture materials...');
    
    try {
      // Get audio recording from voice service
      const audioData = this.voiceService.getAudioData();
      
      // Prepare form data with all materials
      const formData = new FormData();
      
      // Add audio recording if available
      if (audioData && audioData.blob) {
        const fileName = `lecture_${this.courseId || 'unknown'}_${Date.now()}.webm`;
        formData.append('audio', audioData.blob, fileName);
        console.log('Adding audio recording to request:', fileName);
      }
      
      // Add PDF if available (assuming there's a PDF property in the component)
      if ((this as any).pdfData && (this as any).pdfData.blob) {
        const pdfFileName = `lecture_${this.courseId || 'unknown'}_slides_${Date.now()}.pdf`;
        formData.append('slides', (this as any).pdfData.blob, pdfFileName);
        console.log('Adding slides to request:', pdfFileName);
      }
      
      // Add transcript and metadata
      formData.append('title', this.courseName || 'Untitled Lecture');
      formData.append('transcript', this.chatLog.join('\n'));
      formData.append('timestamps', JSON.stringify(this.transcriptEntries));
      
      // Optional course and lecture IDs if available
      if (this.courseId) formData.append('courseId', this.courseId);
      if (this.lectureId) formData.append('lectureId', this.lectureId);
      
      console.log('Sending lecture data to backend for processing and saving');
      
      // API base URL - In production you should use environment configuration
      const apiBaseUrl = 'http://localhost:8000';
      
      // Send to backend API endpoint
      const response = await firstValueFrom(
        this.http.post<{
          filePaths: { audio?: string; slides?: string },
          response: LectureUpdateResponse
        }>(
          `${apiBaseUrl}/api/lectures/save`,
          formData
        )
      );
      
      console.log('Received response from backend:', response);
      
      if (!response || !response.response) {
        throw new Error('Invalid response format from server');
      }
      
      // Create a full URL for the files using the base URL
      const baseUrl = apiBaseUrl;
      const audioUrl = response.filePaths?.audio ? 
          `${baseUrl}${response.response.recording}` : '';
      const slidesUrl = response.filePaths?.slides ? 
          `${baseUrl}${response.response.slides}` : '';
      
      console.log('Files accessible at:', {
        audio: audioUrl,
        slides: slidesUrl
      });
      
      // Process the lecture data for the frontend
      const lectureResponse: LectureUpdateResponse = {
        note: response.response.note || "",
        slides: slidesUrl,
        recording: audioUrl,
        transcript: this.chatLog.join('\n'),
        ai_note: response.response.ai_note || ""
      };
      
      // Handle the lecture response
      this.handleLectureResponse(lectureResponse);
      
      // Keep the isStoppedState true to continue showing the submit/start over buttons
      this.isStoppedState = true;
      
    } catch (error) {
      console.error('Error submitting lecture materials:', error);
      alert('Failed to submit lecture materials. Please try again.');
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
