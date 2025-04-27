import { Injectable } from '@angular/core';
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import { environment } from '../environments/environment';

export interface TranscriptCallbacks {
  onPartial: (text: string) => void;
  onFinal: (text: string, start: number, end: number) => void;
}

export interface AudioData {
  blob: Blob;
  timestamp: number;
  duration?: number;
  mimeType: string;
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
  private audioChunks: Blob[] = []; // Array to store audio chunks
  
  constructor() {}

  public setOnTranscriptHandlers(callbacks: TranscriptCallbacks): void {
    this.callbacks = callbacks;
  }

  async startListening(): Promise<void> {
    try {
      // Clear previous audio chunks when starting
      this.audioChunks = [];
      
      if (!this.liveClient || this.liveClient.getReadyState() === WebSocket.CLOSED) {
        this.liveClient = this.deepgram.listen.live({ model: "nova-3", punctuate: true, diarize: true, smart_format: true});
        this.setupListeners();
      }
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.audioStream, { mimeType: 'audio/webm'});

      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          // Store the audio chunk for later access
          this.audioChunks.push(event.data);
          
          // Send to Deepgram if connection is open
          if (this.liveClient?.getReadyState() === WebSocket.OPEN) {
            event.data.arrayBuffer().then((buffer) => {
              this.liveClient?.send(buffer);
            });     
          }
        } 
      });

      this.mediaRecorder.start(80);
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
  getAudioStream(): MediaStream | undefined {
    return this.audioStream;
  }

  /**
   * Get the current timestamp in the transcript
   * @returns The current timestamp in seconds
   */
  getCurrentTranscriptTime(): number {
    console.log('Current transcript time:', this.prevEndTime);
    return this.prevEndTime;
  }
  
  /**
   * Get the recorded audio data as a Blob
   * @param type The MIME type for the resulting audio blob (default: 'audio/webm')
   * @returns Audio data as Blob or undefined if no audio has been recorded
   */
  getRecordedAudio(type: string = 'audio/webm'): Blob | undefined {
    if (this.audioChunks.length === 0) {
      return undefined;
    }
    return new Blob(this.audioChunks, { type });
  }
  
  /**
   * Get the complete audio data object including the blob and metadata
   * @param type The MIME type for the resulting audio blob (default: 'audio/webm')
   * @returns AudioData object containing the blob and metadata or undefined if no audio recorded
   */
  getAudioData(type: string = 'audio/webm'): AudioData | undefined {
    const blob = this.getRecordedAudio(type);
    if (!blob) {
      return undefined;
    }
    
    return {
      blob,
      timestamp: this.prevEndTime,
      mimeType: type,
      duration: undefined // Could be calculated if you track recording duration
    };
  }
  
  /**
   * Clear the stored audio chunks
   */
  clearRecordedAudio(): void {
    this.audioChunks = [];
  }
}
