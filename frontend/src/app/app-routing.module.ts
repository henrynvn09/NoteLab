import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AudioRecorderComponent } from './components/audio-recorder/audio-recorder.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { authGuard } from './guards/auth.guard';
import { ChatComponent } from './components/chat/chat.component';
import { CoursePageComponent } from './components/CoursePage/coursepage.component';
import { LecturesPageComponent } from './components/lectures-page/lectures-page.component';
import { SavedNoteComponent } from './components/saved-note/saved-note.component';

const routes: Routes = [
  { path: '', component: LoginComponent, canActivate: [authGuard] },
  { path: 'courses', component: CoursePageComponent, canActivate: [authGuard] },
  { path: 'courses/:courseId', component: LecturesPageComponent, canActivate: [authGuard] },
  { path: 'courses/:courseId/:lectureId', component: AudioRecorderComponent, canActivate: [authGuard] },
  { path: 'courses/:courseId/:lectureId/generated-note', component: SavedNoteComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }