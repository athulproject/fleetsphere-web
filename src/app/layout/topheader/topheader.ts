import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideSearch,
  LucideGrid3X3,
  LucideBell,
  LucideX
} from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';

export interface SearchResultItem {
  id: string | number;
  title: string;
  category: string;
  route: string;
}

@Component({
  selector: 'app-topheader',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideSearch,
    LucideGrid3X3,
    LucideBell,
  ],
  templateUrl: './topheader.html',
  styleUrl: './topheader.css',
})
export class Topheader {
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  public authService = inject(AuthService);

  openMenu = input<boolean>(false);
  notifCount = input<number>(0);

  openMenuChange = output<boolean>();
  openNotifications = output<void>();

  searchQuery = signal<string>('');
  isLoading = signal<boolean>(false);
  showResults = signal<boolean>(false);
  showMobileSearch = signal<boolean>(false);
  searchResults = signal<SearchResultItem[]>([]);

  noResults = computed(
    () =>
      this.searchQuery().trim().length > 0 &&
      this.searchResults().length === 0 &&
      !this.isLoading()
  );

  private readonly allPages: SearchResultItem[] = [
    { id: 1, title: 'Dashboard Overview', category: 'General', route: '/' },
    { id: 2, title: 'Employee Directory', category: 'Human Resources', route: '/employees' },
    { id: 3, title: 'Attendance Tracker', category: 'Human Resources', route: '/attendance' },
    { id: 4, title: 'Leave Management', category: 'Human Resources', route: '/leaves' },
    { id: 5, title: 'Payroll Summary', category: 'Finance', route: '/payroll' },
    { id: 6, title: 'Salary Slips', category: 'Finance', route: '/salary-slips' },
    { id: 7, title: 'Company Documents', category: 'Administration', route: '/documents' },
    { id: 8, title: 'Calendar & Holidays', category: 'Organization', route: '/calendar' },
    { id: 9, title: 'Performance Reviews', category: 'Human Resources', route: '/performance' },
    { id: 10, title: 'System Settings', category: 'Configuration', route: '/settings' },
  ];

  handleSearch(query: string): void {
    this.searchQuery.set(query);
    const trimmed = query.trim().toLowerCase();

    if (!trimmed) {
      this.searchResults.set([]);
      this.showResults.set(false);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.showResults.set(true);

    // Simulate snappy search filtering
    setTimeout(() => {
      const filtered = this.allPages.filter(
        item =>
          item.title.toLowerCase().includes(trimmed) ||
          item.category.toLowerCase().includes(trimmed)
      );
      this.searchResults.set(filtered);
      this.isLoading.set(false);
    }, 120);
  }

  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      const results = this.searchResults();
      if (results.length > 0) {
        this.handleResultClick(results[0].route);
      }
    }
  }

  handleResultClick(route: string): void {
    this.showResults.set(false);
    this.showMobileSearch.set(false);
    this.searchQuery.set('');
    this.router.navigateByUrl(route);
  }

  setOpenMenu(open: boolean): void {
    this.openMenuChange.emit(open);
  }

  triggerNotifications(): void {
    this.openNotifications.emit();
  }

  toggleMobileSearch(): void {
    this.showMobileSearch.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const clickedInside = this.elementRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.showResults.set(false);
      this.showMobileSearch.set(false);
    }
  }
}
