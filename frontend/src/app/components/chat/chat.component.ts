// voice-transcription.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { VoiceRecognitionService } from '../../services/voice-recognition.service';
import { CommonModule } from '@angular/common';

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

export class ChatComponent implements OnInit, OnDestroy {
  transcriptEntries: TranscriptEntry[] = [];
  chatLog: string[] = [];
  liveTranscript: string = '';
  isRecording = false;
  isPaused = false;
  hasLogs = false;
  constructor(private voiceService: VoiceRecognitionService) {}

  ngOnInit(): void {
    // Subscribe to transcript events
    this.voiceService.setOnTranscriptHandlers({
      onPartial: (partial) => {
        this.liveTranscript = partial;
      },
      onFinal: (text : string, start: number, end: number) => {
        this.chatLog.push(text);
        this.transcriptEntries.push({text, start, end});
        this.liveTranscript = ''; // Clear live partial on finalization
      },
    });
  }

  start(): void {
    this.hasLogs = false;
    this.chatLog = [];
    this.transcriptEntries = [];
    this.liveTranscript = '';
    this.voiceService.startListening();
    this.isRecording = true;
  }

  stop(): void {
    this.voiceService.stopListening();
    this.isRecording = false;
    this.isPaused = false;
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
    link.download = 'chat_log.txt';
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
    a.download = 'transcript.vtt';
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
