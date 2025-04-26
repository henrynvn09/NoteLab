import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private recordingStartTime = 0;
  private totalPauseTime = 0;
  private pauseStart = 0;
  private recordingDuration = 0;
  private timerInterval: any;

  constructor() { }

  startRecording(): void {
    this.recordingStartTime = Date.now();
    this.recordingDuration = 0;
    this.totalPauseTime = 0;
    this.pauseStart = 0;
    this.startTimer();
  }
  
  startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.recordingDuration = Math.floor((Date.now() - this.recordingStartTime - this.totalPauseTime) / 1000);
    }, 1000);
  }

  pauseTimer(): void {
    this.pauseStart = Date.now();
    this.stopTimer();
  }

  resumeTimer(): void {
    if (this.pauseStart) {
      this.totalPauseTime += Date.now() - this.pauseStart;
      this.pauseStart = 0;
      this.startTimer();
    }
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  getCurrentTimestamp(): string {
    let minutes = Math.floor(this.recordingDuration / 60);
    let seconds = this.recordingDuration % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  getCurrentSeconds(): number {
    return this.recordingDuration;
  }
  
  formatTimestamp(timestamp: number): string {
    const minutes = Math.floor(timestamp / 60);
    const seconds = timestamp % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  cleanup(): void {
    this.stopTimer();
  }
}