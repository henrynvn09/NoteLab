import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AudioRecorderComponent } from './components/audio-recorder/audio-recorder.component';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component';
import { RecordingControlsComponent } from './components/audio-recorder/recording-controls/recording-controls.component';
import { AudioPlaybackComponent } from './components/audio-recorder/audio-playback/audio-playback.component';
import { TimestampedNotesComponent } from './components/timestamped-notes/timestamped-notes.component';
import { NgxEditorModule } from 'ngx-editor';


@NgModule({
  declarations: [
    AppComponent,
    AudioRecorderComponent,
    PdfViewerComponent,
    RecordingControlsComponent,
    AudioPlaybackComponent,
    TimestampedNotesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    NgxEditorModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }