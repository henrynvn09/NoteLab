import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CourseService, Course, CreateCourseResponse } from '../../services/course.service';

@Component({
  selector: 'app-course-page',
  templateUrl: './coursepage.component.html',
  styleUrls: ['./coursepage.component.scss']
})
export class CoursePageComponent implements OnInit {
  courses: Course[] = [];
  isLoading = true;
  isCreatingCourse = false;

  constructor(
    private router: Router,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading = true;
    this.courseService.getAllCourses().subscribe({
      next: (response) => {
        this.courses = response.courses;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching courses:', error);
        this.isLoading = false;
      }
    });
  }

  openCourse(courseId: string, courseName: string): void {
    console.log('Opening course:', courseName, 'ID:', courseId);
    // Navigate to the lectures page with the courseId
    this.router.navigate(['/courses', courseId]);
  }

  // Format course name for URL (replace spaces with hyphens)
  formatCourseNameForUrl(courseName: string): string {
    return courseName.toLowerCase().replace(/\s+/g, '-');
  }

  addNewCourse(): void {
    // This could be enhanced with a modal dialog
    const courseName = prompt('Enter new course name:');
    if (courseName) {
      this.isCreatingCourse = true;
      this.courseService.addCourse(courseName).subscribe({
        next: (response: CreateCourseResponse) => {
          console.log('Course created:', response);
          this.isCreatingCourse = false;
          // After successful creation, navigate to the new lectures page
          this.router.navigate(['/courses', response.course_id]);
        },
        error: (error) => {
          console.error('Error adding course:', error);
          this.isCreatingCourse = false;
          alert('Failed to create course. Please try again.');
        }
      });
    }
  }
}
