import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AudioRecorderComponent } from './components/audio-recorder/audio-recorder.component';
import { PdfViewerComponent } from './components/pdf-viewer/pdf-viewer.component';
import { RecordingControlsComponent } from './components/audio-recorder/recording-controls/recording-controls.component';
import { AudioPlaybackComponent } from './components/audio-recorder/audio-playback/audio-playback.component';
import { TimestampedNotesComponent } from './components/timestamped-notes/timestamped-notes.component';
import { NgxEditorModule } from 'ngx-editor';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ChatComponent } from './components/chat/chat.component';
import { LeftNavbarComponent } from './components/LeftNavBar/left-navbar.component';
import { CourseNavbarComponent } from './components/CourseNavBar/coursenavbar.component';
import { CoursePageComponent } from './components/CoursePage/coursepage.component';
import { LecturesPageComponent } from './components/lectures-page/lectures-page.component';
import { SavedNoteComponent } from './components/saved-note/saved-note.component';


@NgModule({
  declarations: [
    AppComponent,
    AudioRecorderComponent,
    PdfViewerComponent,
    RecordingControlsComponent,
    AudioPlaybackComponent,
    TimestampedNotesComponent,
    LoginComponent,
    RegisterComponent,
    ChatComponent,
    LeftNavbarComponent,
    CourseNavbarComponent,
    CoursePageComponent,
    LecturesPageComponent,
    SavedNoteComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    NgxEditorModule,
    HttpClientModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }