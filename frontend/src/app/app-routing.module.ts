import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AudioRecorderComponent } from './components/audio-recorder/audio-recorder.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { authGuard } from './guards/auth.guard';
import { ChatComponent } from './components/chat/chat.component';

const routes: Routes = [
  // { path: '', component: AudioRecorderComponent, canActivate: [authGuard] },
  { path: '', component: AudioRecorderComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'chat', component: ChatComponent },
  // { path: '**', redirectTo: '' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }