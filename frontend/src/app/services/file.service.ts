import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface FileMetadata {
  fileName: string;
  filePath: string;
  fileType: 'audio' | 'pdf';
  courseId: string;
  lectureId: string;
  uploadDate: Date;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private apiBaseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) { }

  /**
   * Get all files associated with a course
   * @param courseId The ID of the course
   * @returns Observable of audio and PDF files
   */
  getFilesByCourse(courseId: string): Observable<{audioFiles: FileMetadata[], pdfFiles: FileMetadata[]}> {
    return this.http.get<{audioFiles: FileMetadata[], pdfFiles: FileMetadata[]}>(`${this.apiBaseUrl}/api/files/${courseId}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching files:', error);
          return of({audioFiles: [], pdfFiles: []});
        })
      );
  }

  /**
   * Download a file directly
   * @param filePath The path to the file on the server
   * @param fileName The name to give the downloaded file
   */
  downloadFile(filePath: string, fileName: string): void {
    const fullUrl = `${this.apiBaseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Get a full URL for a file path
   * @param filePath The relative path to the file
   * @returns The full URL to the file
   */
  getFileUrl(filePath: string): string {
    return `${this.apiBaseUrl}${filePath.startsWith('/') ? '' : '/'}${filePath}`;
  }

  /**
   * Get URL for audio file
   * @param fileName The name of the audio file
   * @returns The full URL to the audio file
   */
  getAudioUrl(fileName: string): string {
    return `${this.apiBaseUrl}/uploads/audio/${fileName}`;
  }

  /**
   * Get URL for PDF file
   * @param fileName The name of the PDF file
   * @returns The full URL to the PDF file
   */
  getPdfUrl(fileName: string): string {
    return `${this.apiBaseUrl}/uploads/slides/${fileName}`;
  }
}
