import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PdfStateService {
  private pdfResponseSubject = new BehaviorSubject<any>(null);
  public pdfResponse$ = this.pdfResponseSubject.asObservable();

  updatePdfResponse(response: any): void {
    this.pdfResponseSubject.next(response);
  }
    getPdfResponse(): any {
        return this.pdfResponseSubject.getValue();
    }
}