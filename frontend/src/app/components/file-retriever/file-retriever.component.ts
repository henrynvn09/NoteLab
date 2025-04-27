import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, catchError, of } from 'rxjs';

interface FileMetadata {
  fileName: string;
  filePath: string;
  fileType: 'audio' | 'pdf';
  courseId: string;
  lectureId: string;
  uploadDate: Date;
}

@Component({
  selector: 'app-file-retriever',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './file-retriever.component.html',
  styleUrl: './file-retriever.component.scss'
})
export class FileRetrieverComponent implements OnInit {
  courseId: string | null = null;
  lectureId: string | null = null;
  
  audioFiles: FileMetadata[] = [];
  pdfFiles: FileMetadata[] = [];
  
  isLoading: boolean = false;
  errorMessage: string | null = null;
  
  selectedAudioFile: string | null = null;
  selectedPdfFile: string | null = null;
  
  apiBaseUrl: string = 'http://localhost:8000';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.courseId = params.get('courseId');
      this.lectureId = params.get('lectureId');
      
      if (this.courseId) {
        this.fetchAvailableFiles(this.courseId);
      }
    });
  }

  fetchAvailableFiles(courseId: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    
    this.http.get<{audioFiles: FileMetadata[], pdfFiles: FileMetadata[]}>(`${this.apiBaseUrl}/api/files/${courseId}`)
      .pipe(
        catchError(error => {
          this.errorMessage = 'Failed to load files. Please try again later.';
          console.error('Error fetching files:', error);
          return of({audioFiles: [], pdfFiles: []});
        })
      )
      .subscribe(result => {
        this.isLoading = false;
        this.audioFiles = result.audioFiles || [];
        this.pdfFiles = result.pdfFiles || [];
      });
  }

  downloadFile(file: FileMetadata): void {
    const fileUrl = `${this.apiBaseUrl}/${file.filePath}`;
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = file.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  loadFile(file: FileMetadata): void {
    if (file.fileType === 'audio') {
      this.selectedAudioFile = file.filePath;
    } else {
      this.selectedPdfFile = file.filePath;
    }
    
    // Navigate to saved-note component with the selected files
    if (file.courseId && file.lectureId) {
      this.router.navigate(['/courses', file.courseId, file.lectureId], {
        queryParams: {
          audioFile: this.selectedAudioFile,
          pdfFile: this.selectedPdfFile
        }
      });
    }
  }

  fileTypeIcon(fileType: string): string {
    return fileType === 'audio' ? 'fa-file-audio' : 'fa-file-pdf';
  }
}
