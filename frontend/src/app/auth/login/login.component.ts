import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
export class LoginComponent implements OnInit {
  loginData: LoginData = {
    username: '',
    password: ''
  };
  
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if redirected after successful registration
    this.route.queryParams.subscribe(params => {
      if (params['registered'] === 'true') {
        this.successMessage = 'Registration successful! Please login with your new account.';
      }
    });
  }

  onLogin(): void {
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.authService.login(this.loginData)
      .subscribe({
        next: (response) => {
          localStorage.setItem('auth_token', response.access_token);
          this.router.navigate(['/courses']);
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
