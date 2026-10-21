import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { Topheader } from '../topheader/topheader';
import { Sidebar } from '../sidebar/sidebar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, Topheader, Sidebar],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
})
export class MainLayout implements OnInit {
  private router = inject(Router);
  public authService = inject(AuthService);

  isCollapsed = signal<boolean>(false);
  isMobileOpen = signal<boolean>(false);
  isMobile = signal<boolean>(false);
  openMenu = signal<boolean>(false);
  unreadCount = signal<number>(3);
  notifOpen = signal<boolean>(false);

  ngOnInit(): void {
    this.checkScreenSize();
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
    if (this.isMobile()) {
      this.isMobileOpen.update(prev => !prev);
    } else {
      this.isCollapsed.update(prev => !prev);
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
