import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AudioRecordingService } from '../../../services/audio-recording.service';
import { TimerService } from '../../../services/timer.service';

@Component({
  selector: 'app-recording-controls',
  templateUrl: './recording-controls.component.html',
  styleUrls: ['./recording-controls.component.scss']
})
export class RecordingControlsComponent {
  
  constructor(
    private audioRecordingService: AudioRecordingService,
    private timerService: TimerService
  ) {}
  
  // Getters to expose service properties to template
  get isRecording(): boolean {
    return this.audioRecordingService.isCurrentlyRecording();
  }
  
  get isPaused(): boolean {
    return this.audioRecordingService.isCurrentlyPaused();
  }
  
  startRecording() {
    this.audioRecordingService.startRecording()
      .catch(error => {
        console.error('Error accessing microphone:', error);
      });
  }

  togglePauseResume() {
    this.audioRecordingService.togglePauseResume();
  }

  stopRecording() {
    this.audioRecordingService.stopRecording();
  }

  getCurrentTimestamp(): string {
    return this.timerService.getCurrentTimestamp();
  }
}