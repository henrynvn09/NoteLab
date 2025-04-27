import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// Interface for lecture data response
export interface LectureUpdateResponse {
  title?: string;
  note?: string;
  slides?: string;
  recording?: string;
  transcript?: string;
  transcriptvtt?: string;
  userNotes?: string;
  ai_note?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LectureDataService {
  // BehaviorSubject to hold the lecture data
  private lectureDataSubject = new BehaviorSubject<LectureUpdateResponse | null>(null);
  
  // Observable that components can subscribe to
  public lectureData$: Observable<LectureUpdateResponse | null> = this.lectureDataSubject.asObservable();
  
  constructor() { }
  
  /**
   * Updates the lecture data
   * @param data The new lecture data
   */
  setLectureData(data: LectureUpdateResponse): void {
    this.lectureDataSubject.next(data);
  }
  
  /**
   * Gets the current lecture data value
   * @returns The current lecture data
   */
  getCurrentLectureData(): LectureUpdateResponse | null {
    return this.lectureDataSubject.getValue();
  }
  
  /**
   * Clears the lecture data
   */
  clearLectureData(): void {
    this.lectureDataSubject.next(null);
  }
}