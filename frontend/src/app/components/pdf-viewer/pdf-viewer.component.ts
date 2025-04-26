import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
  
  constructor(private sanitizer: DomSanitizer) {}
  
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
      const url = URL.createObjectURL(file);
      this.pdfSelected.emit({file, url});
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
}