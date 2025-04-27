import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-left-navbar',
  templateUrl: './left-navbar.component.html',
  styleUrls: ['./left-navbar.component.scss']
})
export class LeftNavbarComponent implements OnInit {
  courseId: string = '';
  currentCourseName: string = 'Loading...';
  menuOpen: boolean = false; // Added property for menu toggle

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router, // Added Router for navigation
    private authService: AuthService // Added AuthService for logout
  ) {}

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('courseId');
    if (courseId) {
      this.fetchCourseName(courseId);
    }
  }

  private fetchCourseName(courseId: string): void {
    const url = 'http://localhost:8000/courses';
    this.http.get<{ courses: { course_name: string; course_id: string }[] }>(url).subscribe({
      next: (response) => {
        const course = response.courses.find((c) => c.course_id === courseId);
        this.currentCourseName = course ? course.course_name : 'Unknown Course';
      },
      error: (error) => {
        console.error('Error fetching course name:', error);
        this.currentCourseName = 'Error Loading Course';
      }
    });
  }

  goToChat(): void {
    // Navigate back to the /courses page
    window.location.href = '/courses';
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  goHome(): void {
    this.router.navigate(['/course']); // Navigate to the course page
  }

  logout(event: Event): void {
    this.authService.logout(); // Call the logout method from AuthService
    this.router.navigate(['/login']); // Navigate to the login page
  }
}

