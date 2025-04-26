import { Injectable } from '@angular/core';
import { TimerService } from './timer.service';

export interface TimestampedNote {
  timestamp: number;
  text: string;
  slideNumber: number;
}

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private notes: TimestampedNote[] = [];
  private currentNote = '';
  private currentSlideNumber = 1;
  private pdfLoaded = false;
  private audioElement: HTMLAudioElement | null = null;
  private firstTyped = false; // 🆕 Track if first typing happened


  constructor(private timerService: TimerService) { }

  setAudioElement(audio: HTMLAudioElement | null): void {
    this.audioElement = audio;
  }

  getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }

  setCurrentSlideNumber(slideNumber: number): void {
    this.currentSlideNumber = slideNumber;
  }

  setPdfStatus(isLoaded: boolean): void {
    this.pdfLoaded = isLoaded;
  }

  getCurrentNote(): string {
    return this.currentNote;
  }

  setCurrentNote(note: string): void {
    this.currentNote = note;
  }

  appendToCurrentNote(text: string): void {
    this.currentNote += text;
  }

  getAllNotes(): TimestampedNote[] {
    return this.notes;
  }

  insertTimestamp(isRecording: boolean): void {
    if (this.audioElement && !isRecording) {
      console.log('Inserting timestamp');
      const currentTime = Math.floor(this.audioElement.currentTime);
      const minutes = Math.floor(currentTime / 60);
      const seconds = currentTime % 60;
      let timestamp = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      // Only include slide number if a PDF is uploaded
      if (this.pdfLoaded) {
        timestamp += ` | Slide ${this.currentSlideNumber}`;
      }
      timestamp += `] `;
      
      // Insert timestamp at current position
      this.currentNote += timestamp;
    } else if (isRecording) {
      // If we're recording, use the current recording time
      let timestamp = `[${this.timerService.getCurrentTimestamp()}`;
      
      // Only include slide number if a PDF is uploaded
      if (this.pdfLoaded) {
        timestamp += ` | Slide ${this.currentSlideNumber}`;
      }
      timestamp += `] `;
      
      this.currentNote += timestamp;
    }
  }
  
  // Handle newlines and add timestamps at the end of each line
  handleNewline(isRecording: boolean): void {
    // Add a newline character
    this.currentNote += '\n';
    
    // Insert timestamp after the newline
    this.insertTimestamp(isRecording);
  }

  sasaveNote(isRecording: boolean): void {
  if (this.currentNote.trim()) {
    const currentTimestamp = isRecording 
      ? this.timerService.getCurrentSeconds()
      : (this.audioElement ? Math.floor(this.audioElement.currentTime) : 0);

    const note: TimestampedNote = {
      timestamp: currentTimestamp,
      text: this.currentNote.trim(),
      slideNumber: this.pdfLoaded ? this.currentSlideNumber : 0
    };

    this.notes.push(note);
    this.currentNote = '';
    this.firstTyped = false; // 🆕 Reset for next note
  }
}
formatTimestamp(timestamp: number): string {
    let formattedTime = this.timerService.formatTimestamp(timestamp);
    if (this.pdfLoaded) {
      formattedTime += ` | Slide ${this.notes.find(note => note.timestamp === timestamp)?.slideNumber || this.currentSlideNumber}`;
    }
    return formattedTime;
  }
}
