import { Component, ElementRef, HostListener, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-course-navbar',
  templateUrl: './coursenavbar.component.html',
  styleUrls: ['./coursenavbar.component.scss']
})
export class CourseNavbarComponent {
  @Input() showBreadcrumbs = false;
  @Input() courseName: string = '';
  @Input() courseId: string = '';
  @Input() size: 'default' | 'compact' = 'default';


  
  menuOpen = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private elementRef: ElementRef
  ) {}

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  goHome() {
    this.router.navigate(['/home']);
    this.menuOpen = false;
  }

  goBack() {
    this.router.navigate(['/courses']);
  }

  logout(event: Event) {
    event.preventDefault();
    this.authService.logout();
    this.router.navigate(['/login']);
    this.menuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.menuOpen = false;
    }
  }
}