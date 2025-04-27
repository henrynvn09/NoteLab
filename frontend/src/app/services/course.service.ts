import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Course {
  course_name: string;
  course_id: string;
}

export interface CourseResponse {
  courses: Course[];
}

export interface CreateCourseResponse {
  course_id: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = 'http://localhost:8000';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getAllCourses(): Observable<CourseResponse> {
    return this.http.get<CourseResponse>(`${this.apiUrl}/courses/`);
    // The auth interceptor will handle adding the authorization header
  }

  addCourse(courseName: string): Observable<CreateCourseResponse> {
    return this.http.post<CreateCourseResponse>(`${this.apiUrl}/courses`, { course_name: courseName });
  }
}