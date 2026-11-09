import { Component, HostListener, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Topheader } from '../topheader/topheader';
import { Sidebar } from '../sidebar/sidebar';
import { MainMenuComponent } from '../main-menu/main-menu.component';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, Topheader, Sidebar, MainMenuComponent],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout implements OnInit {
  private router = inject(Router);
  public authService = inject(AuthService);
  public themeService = inject(ThemeService);

  isCollapsed = signal<boolean>(false);
  isMobileOpen = signal<boolean>(false);
  isMobile = signal<boolean>(false);
  openMenu = signal<boolean>(false);
  unreadCount = signal<number>(3);
  notifOpen = signal<boolean>(false);

  // Compute margin class based on layout mode and collapse state
  contentMarginClass = computed(() => {
    if (this.isMobile()) {
      return 'ml-0';
    }
    const layout = this.themeService.layout();
    if (layout === 'top_menu' || layout === 'minimal') {
      return 'ml-0';
    }
    return this.isCollapsed() ? 'ml-20' : 'ml-64';
  });

  // Determines if the desktop sidebar should be rendered
  showDesktopSidebar = computed(() => {
    const layout = this.themeService.layout();
    return layout !== 'top_menu' && layout !== 'minimal';
  });

  ngOnInit(): void {
    this.checkScreenSize();
    // Initialize collapsed state from theme preferences
    this.isCollapsed.set(this.themeService.sidebarWidth() === 'collapsed');
    // Load backend preferences for current user
    this.themeService.loadFromBackend();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    if (typeof window !== 'undefined') {
      const mobile = window.innerWidth < 1024;
      this.isMobile.set(mobile);
      if (!mobile) {
        this.isMobileOpen.set(false);
      }
    }
  }

  handleToggle(): void {
    if (this.isMobile() || !this.showDesktopSidebar()) {
      this.isMobileOpen.update(prev => !prev);
    } else {
      this.isCollapsed.update(prev => {
        const next = !prev;
        this.themeService.setSidebarWidth(next ? 'collapsed' : 'expanded');
        return next;
      });
    }
  }

  setIsMobileOpen(open: boolean): void {
    this.isMobileOpen.set(open);
  }

  setOpenMenu(open: boolean): void {
    this.openMenu.set(open);
  }

  setNotifOpen(open: boolean): void {
    this.notifOpen.set(open);
  }

  handleLogout(): void {
    this.authService.logout();
  }
}
