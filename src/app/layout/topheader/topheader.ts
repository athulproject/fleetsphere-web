import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LucideSearch,
  LucideGrid3X3,
  LucideBell,
  LucidePalette,
  LucideSun,
  LucideMoon,
  LucideLogOut,
  LucideSlidersHorizontal,
} from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

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
    RouterLink,
    LucideSearch,
    LucideGrid3X3,
    LucideBell,
    LucidePalette,
    LucideSun,
    LucideMoon,
    LucideLogOut,
    LucideSlidersHorizontal,
  ],
  templateUrl: './topheader.html',
  styleUrl: './topheader.css',
})
export class Topheader {
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  public authService = inject(AuthService);
  public themeService = inject(ThemeService);

  openMenu = input<boolean>(false);
  notifCount = input<number>(0);

  openMenuChange = output<boolean>();
  openNotifications = output<void>();

  searchQuery = signal<string>('');
  isLoading = signal<boolean>(false);
  showResults = signal<boolean>(false);
  showMobileSearch = signal<boolean>(false);
  showProfileMenu = signal<boolean>(false);
  searchResults = signal<SearchResultItem[]>([]);

  themeStyleRoute = computed(() => `/${this.authService.primaryRole()}/theme-style`);

  noResults = computed(
    () =>
      this.searchQuery().trim().length > 0 &&
      this.searchResults().length === 0 &&
      !this.isLoading()
  );

  private readonly allPages: SearchResultItem[] = [
    { id: 1, title: 'Dashboard Overview', category: 'General', route: '/dashboard' },
    { id: 2, title: 'Theme Style & Personalize', category: 'Personalization', route: '/theme-style' },
    { id: 3, title: 'Hierarchy Master', category: 'Masters', route: '/master/hierarchy' },
    { id: 4, title: 'Employee Directory', category: 'Human Resources', route: '/employees' },
    { id: 5, title: 'User Management', category: 'Identity & Access', route: '/user-management' },
    { id: 6, title: 'Attendance Tracker', category: 'Human Resources', route: '/attendance' },
    { id: 7, title: 'Payroll Summary', category: 'Finance', route: '/payroll' },
    { id: 8, title: 'Company Documents', category: 'Administration', route: '/documents' },
    { id: 9, title: 'Calendar & Holidays', category: 'Organization', route: '/calendar' },
    { id: 10, title: 'Control Panel', category: 'Options', route: '/ctrl_panel' },
    { id: 11, title: 'Setup Module Options', category: 'Options', route: '/setupmodule' },
    { id: 12, title: 'System Settings', category: 'Configuration', route: '/settings' },
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

  handleResultClick(route: string): void {
    this.showResults.set(false);
    this.showMobileSearch.set(false);
    this.searchQuery.set('');
    const fullRoute = route.startsWith('/') ? `/${this.authService.primaryRole()}${route}` : `/${this.authService.primaryRole()}/${route}`;
    this.router.navigate([fullRoute]);
  }

  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.showResults.set(false);
      this.showMobileSearch.set(false);
    }
  }

  toggleMobileSearch(): void {
    this.showMobileSearch.update(prev => !prev);
  }

  setOpenMenu(open: boolean): void {
    this.openMenuChange.emit(open);
  }

  triggerNotifications(): void {
    this.openNotifications.emit();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  openPersonalize(): void {
    this.themeService.openPersonalizeModal();
  }

  toggleProfileMenu(): void {
    this.showProfileMenu.update(prev => !prev);
  }

  handleLogout(): void {
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showResults.set(false);
      this.showProfileMenu.set(false);
    }
  }
}
