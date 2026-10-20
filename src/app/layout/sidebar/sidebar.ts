import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideDynamicIcon,
  LucideSun,
  LucideMoon,
  LucideGrid3X3,
  LucideChevronRight,
  LucideChevronLeft,
  LucideX,
  LucideRows3,
  LucideLayoutDashboard,
  LucideStar,
  LucideLogOut,
  LucideUsers,
  LucideCalendar,
  LucideFileText,
  LucideSettings,
  LucideCreditCard,
  LucideBriefcase,
  LucideClock,
  LucideShield,
  LucideDollarSign,
  LucideBarChart,
  LucideTruck
} from '@lucide/angular';

import { AuthService } from '../../core/services/auth.service';

export interface MenuItem {
  sub_menu_id?: number | string;
  sub_menu_name: string;
  route_path: string;
  icon_name?: string;
  sub_icon?: string;
  display_order?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    LucideDynamicIcon,
    LucideSun,
    LucideMoon,
    LucideGrid3X3,
    LucideChevronRight,
    LucideChevronLeft,
    LucideX,
    LucideRows3,
    LucideLayoutDashboard,
    LucideStar,
    LucideLogOut,
    LucideTruck
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private router = inject(Router);
  public authService = inject(AuthService);

  isCollapsed = input<boolean>(false);
  isMobileOpen = input<boolean>(false);
  isMobile = input<boolean>(false);
  openMenu = input<boolean>(false);
  basePath = input<string>('/');

  toggle = output<void>();
  mobileOpenChange = output<boolean>();
  openMenuChange = output<boolean>();
  logout = output<void>();

  isDark = signal<boolean>(false);
  isLogoHovered = signal<boolean>(false);

  readonly quickApps = [
    { name: 'Dashboard', icon: LucideLayoutDashboard, route: '/' },
    { name: 'Employees', icon: LucideUsers, route: '/employees' },
    { name: 'Attendance', icon: LucideClock, route: '/attendance' },
    { name: 'Payroll', icon: LucideDollarSign, route: '/payroll' },
    { name: 'Documents', icon: LucideFileText, route: '/documents' },
    { name: 'Calendar', icon: LucideCalendar, route: '/calendar' },
    { name: 'Analytics', icon: LucideBarChart, route: '/analytics' },
    { name: 'Settings', icon: LucideSettings, route: '/settings' },
  ];

  displayedFavourites = signal<MenuItem[]>([]);

  groupedMenus = signal<Record<string, MenuItem[]>>({
    Main: [
      {
        sub_menu_id: 'm-1',
        sub_menu_name: 'Employees',
        route_path: '/employees',
        sub_icon: 'Users',
        display_order: 1,
      },
      {
        sub_menu_id: 'm-2',
        sub_menu_name: 'Attendance',
        route_path: '/attendance',
        sub_icon: 'Clock',
        display_order: 2,
      },
      {
        sub_menu_id: 'm-3',
        sub_menu_name: 'Payroll',
        route_path: '/payroll',
        sub_icon: 'DollarSign',
        display_order: 3,
      },
    ],
    Organization: [
      {
        sub_menu_id: 'o-1',
        sub_menu_name: 'Documents',
        route_path: '/documents',
        sub_icon: 'FileText',
        display_order: 1,
      },
      {
        sub_menu_id: 'o-2',
        sub_menu_name: 'Calendar',
        route_path: '/calendar',
        sub_icon: 'Calendar',
        display_order: 2,
      },
      {
        sub_menu_id: 'o-3',
        sub_menu_name: 'Settings',
        route_path: '/settings',
        sub_icon: 'Settings',
        display_order: 3,
      },
    ],
  });

  groupedMenuEntries = computed(() => {
    const groups = this.groupedMenus();
    return Object.entries(groups)
      .filter(([main]) => main !== 'Dashboard')
      .map(([main, items]) => ({
        main,
        items: [...items].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)),
      }));
  });

  getIcon(iconName?: string): any {
    if (!iconName) return LucideLayoutDashboard;
    const iconMap: Record<string, any> = {
      LayoutDashboard: LucideLayoutDashboard,
      Users: LucideUsers,
      Clock: LucideClock,
      DollarSign: LucideDollarSign,
      FileText: LucideFileText,
      Calendar: LucideCalendar,
      Settings: LucideSettings,
      CreditCard: LucideCreditCard,
      Briefcase: LucideBriefcase,
      Shield: LucideShield,
      Star: LucideStar,
      BarChart: LucideBarChart,
      Truck: LucideTruck
    };
    return iconMap[iconName] || LucideLayoutDashboard;
  }

  toggleTheme(): void {
    this.isDark.update(v => !v);
    if (typeof document !== 'undefined') {
      if (this.isDark()) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }

  handleToggle(): void {
    this.toggle.emit();
  }

  setIsMobileOpen(isOpen: boolean): void {
    this.mobileOpenChange.emit(isOpen);
  }

  setOpenMenu(isOpen: boolean): void {
    this.openMenuChange.emit(isOpen);
  }

  handleLogout(): void {
    this.logout.emit();
  }

  isActivePath(path: string): boolean {
    return this.router.url === path;
  }
}
