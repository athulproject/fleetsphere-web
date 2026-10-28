import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import type { ApiResponse } from '../../core/models/auth.models';
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
  LucideTruck,
  LucideLayers,
} from '@lucide/angular';

import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { FavouritesService } from '../../core/services/favourites.service';

export interface MenuItem {
  sub_menu_id?: number | string;
  sub_menu_name: string;
  route_path: string;
  icon_name?: string;
  sub_icon?: string;
  display_order?: number;
  is_sidebar_visible?: boolean;
  description?: string;
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
    LucideTruck,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {
  private router = inject(Router);
  public authService = inject(AuthService);
  public themeService = inject(ThemeService);
  public favService = inject(FavouritesService);
  private api = inject(ApiService);

  isCollapsed = input<boolean>(false);
  isMobileOpen = input<boolean>(false);
  isMobile = input<boolean>(false);
  openMenu = input<boolean>(false);
  basePath = input<string>('/');

  toggle = output<void>();
  mobileOpenChange = output<boolean>();
  openMenuChange = output<boolean>();
  logout = output<void>();

  isDark = computed(() => this.themeService.isDark());
  isLogoHovered = signal<boolean>(false);

  // Dynamic role prefix (e.g. /admin, /manager)
  rolePrefix = computed(() => `/${this.authService.primaryRole()}`);
  currentBasePath = computed(() => `${this.rolePrefix()}/dashboard`);

  getRoleRoute(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.rolePrefix()}${cleanPath}`;
  }

  groupedMenus = signal<Record<string, MenuItem[]>>({
    Main: [
      {
        sub_menu_id: 1,
        sub_menu_name: 'Dashboard',
        route_path: '/dashboard',
        sub_icon: 'LayoutDashboard',
        display_order: 1,
        is_sidebar_visible: true,
      },
      {
        sub_menu_id: 2,
        sub_menu_name: 'Employees',
        route_path: '/employees',
        sub_icon: 'Users',
        display_order: 2,
        is_sidebar_visible: true,
      },
      {
        sub_menu_id: 3,
        sub_menu_name: 'Attendance',
        route_path: '/attendance',
        sub_icon: 'Clock',
        display_order: 3,
        is_sidebar_visible: true,
      },
      {
        sub_menu_id: 4,
        sub_menu_name: 'Payroll',
        route_path: '/payroll',
        sub_icon: 'DollarSign',
        display_order: 4,
        is_sidebar_visible: true,
      },
    ],
    Masters: [
      {
        sub_menu_id: 5,
        sub_menu_name: 'Hierarchy Master',
        route_path: '/master/hierarchy',
        sub_icon: 'Layers',
        display_order: 5,
        is_sidebar_visible: true,
      },
      {
        sub_menu_id: 6,
        sub_menu_name: 'Menu Master',
        route_path: '/master/menus',
        sub_icon: 'Grid3X3',
        display_order: 9,
        is_sidebar_visible: false,
      },
    ],
    Organization: [
      {
        sub_menu_id: 7,
        sub_menu_name: 'Documents',
        route_path: '/documents',
        sub_icon: 'FileText',
        display_order: 6,
        is_sidebar_visible: true,
      },
      {
        sub_menu_id: 8,
        sub_menu_name: 'Calendar',
        route_path: '/calendar',
        sub_icon: 'Calendar',
        display_order: 7,
        is_sidebar_visible: true,
      },
      {
        sub_menu_id: 9,
        sub_menu_name: 'Settings',
        route_path: '/settings',
        sub_icon: 'Settings',
        display_order: 8,
        is_sidebar_visible: true,
      },
    ],
  });

  ngOnInit(): void {
    this.loadUserMenus();
  }

  loadUserMenus(): void {
    if (!this.authService.isAuthenticated()) return;

    this.api
      .get<ApiResponse<{ groupedMenus: Record<string, MenuItem[]> }>>('menus/user-menu')
      .subscribe({
        next: (res) => {
          if (res.success && res.data?.groupedMenus && Object.keys(res.data.groupedMenus).length > 0) {
            this.groupedMenus.set(res.data.groupedMenus);
          }
        },
        error: () => {
          // Keep defaults if error
        },
      });
  }

  allFlattenedMenuItems = computed<MenuItem[]>(() => {
    const groups = this.groupedMenus();
    const list: MenuItem[] = [];
    for (const items of Object.values(groups)) {
      list.push(...items);
    }
    return list;
  });

  // Favourites mapped to menu metadata
  displayedFavourites = computed<MenuItem[]>(() => {
    const favRoutes = this.favService.favRoutes();
    if (!favRoutes || favRoutes.length === 0) return [];
    const all = this.allFlattenedMenuItems();

    return favRoutes
      .map((route) => {
        const found = all.find((item) => item.route_path === route);
        if (found) return found;
        const cleanName = route.replace(/^\//, '').split('/').pop() || 'Page';
        const formatted = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        return {
          sub_menu_name: formatted,
          route_path: route,
          sub_icon: 'Star',
          icon_name: 'Star',
          is_sidebar_visible: true,
        };
      })
      .filter(Boolean);
  });

  // Regular sidebar menus: filter by is_sidebar_visible !== false, sort by display_order
  groupedMenuEntries = computed(() => {
    const groups = this.groupedMenus();
    return Object.entries(groups)
      .map(([main, items]) => {
        const visibleItems = items
          .filter((it) => it.is_sidebar_visible !== false)
          .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
        return {
          main,
          items: visibleItems,
        };
      })
      .filter((group) => group.items.length > 0);
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
      Truck: LucideTruck,
      Layers: LucideLayers,
      Grid3X3: LucideGrid3X3,
    };
    return iconMap[iconName] || LucideLayoutDashboard;
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
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
    return this.router.url === this.getRoleRoute(path);
  }
}
