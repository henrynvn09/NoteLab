import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface LoginData {
  username: string;
  password: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginData: LoginData = {
    username: '',
    password: ''
  };
  
  isSubmitting = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {
    this.isSubmitting = true;
    this.errorMessage = '';
    
    this.authService.login(this.loginData)
      .subscribe({
        next: (response) => {
          localStorage.setItem('auth_token', response.access_token);
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.error?.detail || 'Login failed. Please check your credentials and try again.';
          console.error('Login error:', error);
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
  }
}
