import { Injectable } from '@angular/core';
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { environment } from '../environments/environment';

export interface TranscriptCallbacks {
  onPartial: (text: string) => void;
  onFinal: (text: string, start: number, end: number) => void;
}

@Injectable({
  providedIn: 'root',
})

export class VoiceRecognitionService {
  private deepgram = createClient(environment.deepgram_api_key);
  private liveClient ?: ReturnType<typeof this.deepgram.listen.live>; 
  private mediaRecorder?: MediaRecorder;
  private audioStream?: MediaStream;
  private callbacks?: TranscriptCallbacks;    
  private intervalID?: NodeJS.Timeout;
  private prevEndTime = 0;
  
  constructor() {}

  public setOnTranscriptHandlers(callbacks: TranscriptCallbacks): void {
    this.callbacks = callbacks;
  }

  async startListening(): Promise<void> {
    try {
      if (!this.liveClient || this.liveClient.getReadyState() === WebSocket.CLOSED) {
        this.liveClient = this.deepgram.listen.live({ model: "nova-3", punctuate: true, diarize: true, smart_format: true});
        this.setupListeners();
      }
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.audioStream, { mimeType: 'audio/webm'});

      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0 && this.liveClient?.getReadyState() === WebSocket.OPEN) {
          event.data.arrayBuffer().then((buffer) => {
            this.liveClient?.send(buffer);
          });     
        } 
      });

      this.mediaRecorder.start(250);
    } catch (error) {
      console.error('Microphone access error:', error);
    }
  }

  stopListening(): void {
    if (this.mediaRecorder?.state === 'recording' || this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder?.stop();
    }
    // also want to clear keep alives when stopping the recording
    clearInterval(this.intervalID);
    this.audioStream?.getTracks().forEach(track => track.stop());
    this.liveClient?.requestClose();
  }

  pauseListening(): void {
    //pause execution
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder?.pause();
      // send keep alive messages every 4 seconds to keep socket open
      this.intervalID = setInterval(() => {
        this.liveClient?.keepAlive()
        console.log("Sent Keep-Alive message");
      }, 4000);
    }
  }

  resumeListening(): void {
    if (this.mediaRecorder?.state === 'paused') {
      //resume execution
      this.mediaRecorder?.resume();
      // stop sending keep alive messages
      clearInterval(this.intervalID);
    }
  }

  private setupListeners(): void {
    this.liveClient?.on(LiveTranscriptionEvents.Open, () => {
      console.log('Connection opened');
    });

    this.liveClient?.on(LiveTranscriptionEvents.Close, () => {
      console.log('Connection closed');
    });

    this.liveClient?.on(LiveTranscriptionEvents.Transcript, (data) => {
      const transcript = data.channel.alternatives[0].transcript;
      if (transcript && !data.is_final) {
        // console.log('Partial:', transcript);
        this.callbacks?.onPartial(transcript);
      } else if (transcript && data.is_final) {
        // console.log('Final:', transcript);
        this.callbacks?.onFinal(transcript, this.prevEndTime, data.start);
        this.prevEndTime = data.start;
        console.log('Final:', transcript, 'Start:', data.start, 'End:', data.end);
      }
    });

    this.liveClient?.on(LiveTranscriptionEvents.Error, (err) => {
      console.error('Deepgram error:', err);
    });
  }

  /**
   * Get the current timestamp in the transcript
   * @returns The current timestamp in seconds
   */
  getCurrentTranscriptTime(): number {
    console.log('Current transcript time:', this.prevEndTime);
    return this.prevEndTime;
  }
}
