import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfService {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  /**
   * Uploads a PDF file to the backend
   * @param file The PDF file to upload
   * @param courseId Optional course ID if attaching to a specific course
   * @param lectureId Optional lecture ID if attaching to a specific lecture
   * @returns Observable with the upload response
   */
  uploadPdf(file: File, courseId?: string, lectureId?: string): Observable<any> {
    const formData = new FormData();
    const fileName = `lecture_${courseId || 'unknown'}_slides_${Date.now()}.pdf`;
    
    // Add PDF file to the form data
    formData.append('slides', file, fileName);
    
    // Add metadata
    formData.append('title', file.name);
    formData.append('transcript', ''); // No transcript for PDF-only uploads
    
    // Add course and lecture IDs if available
    if (courseId) formData.append('courseId', courseId);
    if (lectureId) formData.append('lectureId', lectureId);
    
    // Send to backend API endpoint
    return this.http.post<any>(`${this.apiUrl}/api/lectures/save`, formData);
  }
}