import { Injectable } from '@angular/core';
import { TimerService } from './timer.service';

@Injectable({
  providedIn: 'root'
})
export class AudioRecordingService {
  private isRecording = false;
  private isPaused = false;
  private audioChunks: Blob[] = [];
  private mediaRecorder: MediaRecorder | null = null;
  private audioURL: string | null = null;

  constructor(private timerService: TimerService) { }

  startRecording(): Promise<void> {
    this.isRecording = true;
    this.audioChunks = [];
    this.isPaused = false;

    // Clear previous recording if exists
    if (this.audioURL) {
      URL.revokeObjectURL(this.audioURL);
      this.audioURL = null;
    }
    
    // Start the timer
    this.timerService.startRecording();
    
    return navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.mediaRecorder = new MediaRecorder(stream);
        
        this.mediaRecorder.addEventListener('dataavailable', event => {
          this.audioChunks.push(event.data);
        });
        
        this.mediaRecorder.addEventListener('stop', () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
          this.audioURL = URL.createObjectURL(audioBlob);
        });
        
        this.mediaRecorder.start();
      });
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.isRecording && !this.isPaused) {
      this.mediaRecorder.pause();
      this.isPaused = true;
      this.timerService.pauseTimer();
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder && this.isRecording && this.isPaused) {
      this.mediaRecorder.resume();
      this.isPaused = false;
      this.timerService.resumeTimer();
    }
  }

  togglePauseResume(): void {
    if (this.isPaused) {
      this.resumeRecording();
    } else {
      this.pauseRecording();
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.isRecording = false;
      this.mediaRecorder.stop();
      this.isPaused = false;
      
      // Stop all tracks to release the microphone
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      
      this.timerService.stopTimer();
    }
  }

  getAudioURL(): string | null {
    return this.audioURL;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  isCurrentlyPaused(): boolean {
    return this.isPaused;
  }

  cleanup(): void {
    if (this.audioURL) {
      URL.revokeObjectURL(this.audioURL);
    }

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }
}