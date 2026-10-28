import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  inject,
  signal,
  computed,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideStar,
  LucideSearch,
  LucideX,
  LucideArrowRight,
  LucideTruck,
  LucideLayoutGrid,
} from '@lucide/angular';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { FavouritesService } from '../../core/services/favourites.service';
import type { ApiResponse } from '../../core/models/auth.models';

export interface MainMenuItem {
  sub_menu_id?: number | string;
  label: string;
  sub_menu_name?: string;
  routes: string;
  route_path?: string;
  description?: string;
  icon?: string;
  category?: string;
  display_order?: number;
  is_sidebar_visible?: boolean;
}

export interface MainMenuCategory {
  category: string;
  icon?: string;
  items: MainMenuItem[];
}

@Component({
  selector: 'app-main-menu',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideStar,
    LucideSearch,
    LucideX,
    LucideArrowRight,
    LucideTruck,
    LucideLayoutGrid,
  ],
  templateUrl: './main-menu.component.html',
  styleUrl: './main-menu.component.css',
})
export class MainMenuComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private api = inject(ApiService);
  public authService = inject(AuthService);
  public themeService = inject(ThemeService);
  public favService = inject(FavouritesService);

  public close = output<void>();

  public loading = signal<boolean>(false);
  public menuData = signal<MainMenuCategory[]>([]);
  public activeCategory = signal<string>('');
  public search = signal<string>('');
  public showFavs = signal<boolean>(false);

  public theme = computed(() => {
    return {
      overlay: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 40%,#3730a3 70%,#4338ca 100%)',
      sidebarBg: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.10)',
      cardBg: 'rgba(255,255,255,0.06)',
      cardHoverBg: 'rgba(255,255,255,0.13)',
      cardBorder: '1px solid rgba(255,255,255,0.08)',
      cardHoverBorder: '1px solid rgba(255,255,255,0.25)',
      text: 'rgba(255,255,255,0.93)',
      textSub: 'rgba(255,255,255,0.60)',
      textMuted: 'rgba(255,255,255,0.38)',
      searchBg: 'rgba(255,255,255,0.10)',
      searchBorder: '1px solid rgba(255,255,255,0.15)',
      pillActiveBg: '#fff',
      pillActiveTxt: '#3730a3',
      pillBg: 'rgba(255,255,255,0.10)',
      pillTxt: 'rgba(255,255,255,0.70)',
      catActiveBg: 'linear-gradient(135deg,#4f46e5,#6366f1)',
      catActiveTxt: '#fff',
      catHoverBg: 'rgba(255,255,255,0.09)',
      catTxt: 'rgba(255,255,255,0.58)',
      dot: 'rgba(165,180,252,0.70)',
      statBg: 'rgba(255,255,255,0.08)',
      favStatBg: 'rgba(245,158,11,0.12)',
      favStatTxt: '#fcd34d',
      footerBg: 'transparent',
      kbdBg: 'rgba(255,255,255,0.10)',
      kbdBorder: '1px solid rgba(255,255,255,0.15)',
      btnBg: 'rgba(255,255,255,0.10)',
      btnBorder: '1px solid rgba(255,255,255,0.15)',
      favBtnActiveBg: 'rgba(245,158,11,0.15)',
      catBadgeBg: 'rgba(129,140,248,0.20)',
      catBadgeTxt: 'rgba(165,180,252,0.90)',
    };
  });

  public allItems = computed<MainMenuItem[]>(() => {
    return this.menuData().flatMap((m) =>
      m.items.map((i) => ({ ...i, category: m.category }))
    );
  });

  public visibleItems = computed<MainMenuItem[]>(() => {
    const q = this.search().trim().toLowerCase();
    const favs = this.favService.favRoutes();
    const all = this.allItems();

    if (q) {
      return all.filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          (i.category && i.category.toLowerCase().includes(q)) ||
          (i.description && i.description.toLowerCase().includes(q))
      );
    }

    if (this.showFavs()) {
      return all.filter((i) => this.favService.isFavourite(i.routes));
    }

    const currentCat = this.activeCategory();
    const found = this.menuData().find((m) => m.category === currentCat);
    return found ? found.items.map((i) => ({ ...i, category: found.category })) : [];
  });

  public heading = computed<string>(() => {
    const q = this.search().trim();
    if (q) return `"${q}"`;
    if (this.showFavs()) return 'Favourites';
    return this.activeCategory() || 'Menu';
  });

  ngOnInit(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
    this.loadMenus();
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.handleClose();
    }
  }

  loadMenus(): void {
    this.loading.set(true);
    this.api.get<ApiResponse<MainMenuCategory[]>>('mainMenu').subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          this.menuData.set(res.data);
          this.activeCategory.set(res.data[0].category || '');
        } else {
          // Fallback defaults if empty
          this.loadFallbackMenus();
        }
      },
      error: (err) => {
        console.error('Main menu load error:', err);
        this.loading.set(false);
        this.loadFallbackMenus();
      },
    });
  }

  private loadFallbackMenus(): void {
    const fallback: MainMenuCategory[] = [
      {
        category: 'Main',
        items: [
          {
            label: 'Dashboard',
            routes: '/dashboard',
            description: 'Overview of key fleet metrics, operational status, and real-time summaries',
            icon: 'LayoutDashboard',
            display_order: 1,
          },
          {
            label: 'Employees',
            routes: '/employees',
            description: 'Manage workforce, drivers, staff profiles, and assignments',
            icon: 'Users',
            display_order: 2,
          },
          {
            label: 'Attendance',
            routes: '/attendance',
            description: 'Track driver and staff check-ins, shifts, and attendance logs',
            icon: 'Clock',
            display_order: 3,
          },
          {
            label: 'Payroll',
            routes: '/payroll',
            description: 'Manage compensation, salary structures, bonuses, and payslips',
            icon: 'DollarSign',
            display_order: 4,
          },
        ],
      },
      {
        category: 'Masters',
        items: [
          {
            label: 'Hierarchy Master',
            routes: '/master/hierarchy',
            description: 'Configure organizational units, branches, and departmental trees',
            icon: 'Layers',
            display_order: 1,
          },
          {
            label: 'Menu Master',
            routes: '/master/menus',
            description: 'Manage role and employee access permissions, sidebar visibility, and menu display order',
            icon: 'Grid3X3',
            display_order: 2,
          },
        ],
      },
      {
        category: 'Organization',
        items: [
          {
            label: 'Documents',
            routes: '/documents',
            description: 'Manage vehicle compliance, driver licenses, and company records',
            icon: 'FileText',
            display_order: 1,
          },
          {
            label: 'Calendar',
            routes: '/calendar',
            description: 'Schedule trips, vehicle maintenance, shifts, and holiday tracking',
            icon: 'Calendar',
            display_order: 2,
          },
          {
            label: 'Settings',
            routes: '/settings',
            description: 'Manage company configurations, system preferences, and security settings',
            icon: 'Settings',
            display_order: 3,
          },
        ],
      },
    ];

    this.menuData.set(fallback);
    this.activeCategory.set(fallback[0].category);
  }

  categoryHasFavourite(categoryName: string): boolean {
    const found = this.menuData().find((m) => m.category === categoryName);
    if (!found) return false;
    return found.items.some((it) => this.favService.isFavourite(it.routes));
  }

  handleCategorySelect(category: string): void {
    this.activeCategory.set(category);
    this.showFavs.set(false);
    this.search.set('');
  }

  handleFavsToggle(): void {
    this.showFavs.update((v) => !v);
    this.search.set('');
  }

  handleFavClick(item: MainMenuItem, event: MouseEvent): void {
    event.stopPropagation();
    this.favService.toggleFavourite(item.routes);
  }

  isItemFav(item: MainMenuItem): boolean {
    return this.favService.isFavourite(item.routes);
  }

  navigate(route: string): void {
    const role = this.authService.primaryRole() || 'admin';
    const cleanRoute = route.startsWith('/') ? route : `/${route}`;
    this.router.navigateByUrl(`/${role}${cleanRoute}`);
    this.handleClose();
  }

  handleClose(): void {
    this.close.emit();
  }
}
