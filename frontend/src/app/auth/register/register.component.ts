import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface RegisterData {
  full_name: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerData: RegisterData = {
    full_name: '',
    email: '',
    password: ''
  };
  
  confirmPassword: string = '';
  isSubmitting = false;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  passwordsNotMatching(): boolean {
    return this.registerData.password !== this.confirmPassword;
  }

  onRegister(): void {
    // Double check password matching
    if (this.passwordsNotMatching()) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    
    this.authService.register(this.registerData)
      .subscribe({
        next: (response) => {
          // Redirect to login on successful registration
          this.router.navigate(['/login'], { 
            queryParams: { 
              registered: 'true' 
            }
          });
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.error?.detail || 'Registration failed. Please check your information and try again.';
          console.error('Registration error:', error);
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
  }
}
