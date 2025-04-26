import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-audio-playback',
  templateUrl: './audio-playback.component.html',
  styleUrls: ['./audio-playback.component.scss']
})
export class AudioPlaybackComponent {
  @Input() audioURL: string | null = null;
  @Output() audioLoaded = new EventEmitter<HTMLAudioElement>();
  
  onAudioLoaded(event: Event) {
    const audioElement = event.target as HTMLAudioElement;
    this.audioLoaded.emit(audioElement);
  }
}