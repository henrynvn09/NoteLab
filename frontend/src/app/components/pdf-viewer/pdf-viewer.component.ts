import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PdfService } from '../../services/pdf.service';
import { ActivatedRoute } from '@angular/router';
import { PdfStateService } from '../../services/pdf-state.service'; // Import the service

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss']
})
export class PdfViewerComponent {
  @Input() pdfSrc: string | null = null;
  @Input() pdfFileName: string | null = null;
  
  @Output() slideNumberChange = new EventEmitter<number>();
  @Output() pdfSelected = new EventEmitter<{file: File, url: string}>();
  
  safeUrl: SafeResourceUrl | null = null;
  currentSlideNumber = 1;
  currentFile: File | null = null;
  courseId: string | null = null;
  lectureId: string | null = null;
  isSaving: boolean = false;
  saveSuccess: boolean = false;
  saveError: string | null = null;
  
  constructor(
    private sanitizer: DomSanitizer,
    private pdfService: PdfService,
    private route: ActivatedRoute,
    private pdfStateService: PdfStateService // Add this line
  ) {
    // Try to get course and lecture IDs from the route
    this.route.paramMap.subscribe(params => {
      this.courseId = params.get('courseId');
      this.lectureId = params.get('lectureId');
    });
  }
  
  ngOnChanges() {
    // When pdfSrc changes, update the safe URL
    if (this.pdfSrc) {
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfSrc);
    } else {
      this.safeUrl = null;
    }
  }
  
  // Handle PDF file selection
  onPdfSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.currentFile = file;
      const url = URL.createObjectURL(file);
      this.pdfSelected.emit({file, url});
      this.savePdfToBackend();
    }
  }
  
  // Update the slide number and notify parent component
  updateSlideNumber(slideNumber: number) {
    this.currentSlideNumber = slideNumber;
    this.slideNumberChange.emit(slideNumber);
  }
  
  // Open PDF in a new browser tab
  openInNewTab() {
    if (this.pdfSrc) {
      window.open(this.pdfSrc, '_blank');
    }
  }

  // Save PDF to backend
  savePdfToBackend() {
    if (!this.currentFile) {
      return;
    }

    this.isSaving = true;
    this.saveError = null;
    this.saveSuccess = false;

    this.pdfService.uploadPdf(this.currentFile, this.courseId || undefined, this.lectureId || undefined)
      .subscribe({
        next: (response) => {
          console.log('PDF saved to backend:', response);
          this.isSaving = false;
          this.saveSuccess = true;
          
          // Broadcast the response through the service
          this.pdfStateService.updatePdfResponse(response);
          
          // Other code...
        },
        error: (error) => {
          console.error('Error saving PDF to backend:', error);
          this.isSaving = false;
          this.saveError = 'Failed to save PDF to server';
        }
      });
  }
}