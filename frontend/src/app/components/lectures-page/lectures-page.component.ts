import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

interface Lecture {
  lecture_name: string;
  lecture_id: string;
}

interface LecturesResponse {
  lectures: Lecture[];
}

@Component({
  selector: 'app-lectures-page',
  templateUrl: './lectures-page.component.html',
  styleUrls: ['./lectures-page.component.scss']
})
export class LecturesPageComponent implements OnInit {
  courseId: string = '';
  courseName: string = '';
  lectures: Lecture[] = [];
  isLoading: boolean = true;
  error: string | null = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('courseId');
      if (id) {
        this.courseId = id;
        this.loadLectures(id);
      } else {
        this.error = 'Course ID not found';
        this.isLoading = false;
      }
    });
  }

  loadLectures(courseId: string): void {
    this.isLoading = true;
    this.http.get<LecturesResponse>(`http://localhost:8000/courses/${courseId}`)
      .subscribe({
        next: (response) => {
          this.lectures = response.lectures;
          this.isLoading = false;
          // If there's course name info in the API response, you could set it here
        },
        error: (error) => {
          console.error('Error loading lectures:', error);
          this.error = 'Failed to load lecture notes. Please try again.';
          this.isLoading = false;
        }
      });
  }

  viewLecture(lectureId: string, lectureName: string): void {
    console.log('View lecture:', lectureId, lectureName);
    this.router.navigate(['/courses', this.courseId, lectureId]);
  }

  goBackToCourses(): void {
    this.router.navigate(['/courses']);
  }

  createNewLecture(): void {
    console.log('Creating new lecture for course:', this.courseId);
    const lectureName = prompt('Enter a name for the new lecture:');
    
    if (lectureName) {
      const dummyData = {
        title: lectureName,
        user_note: "These are my notes for the lecture",
        recording: "https://storage.example.com/recordings/lecture-123.mp3",
        transcript: "This is the transcript of the lecture content..."
      };
      
      this.http.post<{lecture_id: string}>(`http://localhost:8000/courses/${this.courseId}`, dummyData)
        .subscribe({
          next: (response) => {
            console.log('New lecture created with ID:', response.lecture_id);
            // Navigate to the audio recorder component with courseId and lectureId
            this.router.navigate(['/courses', this.courseId, response.lecture_id]);
          },
          error: (error) => {
            console.error('Error creating new lecture:', error);
            alert('Failed to create new lecture. Please try again.');
          }
        });
    }
  }
}
