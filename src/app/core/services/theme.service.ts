import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import type { ApiResponse } from '../models/auth.models';

export type HeaderColor = 'dark' | 'light';
export type MenuColor = 'dark' | 'light';
export type ColorMode = 'dark' | 'light';
export type WorkspaceLayout = 'sidebar' | 'top_menu' | 'dual_sidebar' | 'minimal';
export type SidebarWidth = 'expanded' | 'collapsed';

export interface UserThemeConfig {
  header_color: HeaderColor;
  menu_color: MenuColor;
  color_mode: ColorMode;
  layout: WorkspaceLayout;
  sidebar_width: SidebarWidth;
  font_family: string;
  accent_color: string;
}

export const DEFAULT_THEME_CONFIG: UserThemeConfig = {
  header_color: 'dark',
  menu_color: 'light',
  color_mode: 'light',
  layout: 'sidebar',
  sidebar_width: 'expanded',
  font_family: 'Plus Jakarta Sans',
  accent_color: '#187f65',
};

export const ACCENT_PALETTES = [
  { name: 'Fleet Emerald', hex: '#187f65' },
  { name: 'Royal Blue', hex: '#2563eb' },
  { name: 'Forest Green', hex: '#059669' },
  { name: 'Deep Violet', hex: '#7c3aed' },
  { name: 'Amber Sunset', hex: '#d97706' },
  { name: 'Crimson Rose', hex: '#e11d48' },
  { name: 'Ocean Cyan', hex: '#0891b2' },
  { name: 'Executive Slate', hex: '#0f172a' },
];

export const FONT_OPTIONS = [
  { label: 'Plus Jakarta Sans (default)', value: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif" },
  { label: 'Inter', value: 'Inter', family: "'Inter', sans-serif" },
  { label: 'Poppins', value: 'Poppins', family: "'Poppins', sans-serif" },
  { label: 'Roboto', value: 'Roboto', family: "'Roboto', sans-serif" },
  { label: 'Outfit', value: 'Outfit', family: "'Outfit', sans-serif" },
  { label: 'System font', value: 'System font', family: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
];

export const LAYOUT_OPTIONS = [
  {
    id: 'sidebar',
    name: 'Default Sidebar',
    description: 'Standard left navigation bar with top header. Applies to all workspace pages.',
  },
  {
    id: 'top_menu',
    name: 'Top menu',
    description: 'Horizontal top navigation bar for all menus. Drawer used on small screens.',
  },
  {
    id: 'dual_sidebar',
    name: 'Dual Sidebar',
    description: 'Icon dock sidebar with flyout sub-menu drawer for dense workspaces.',
  },
  {
    id: 'minimal',
    name: 'Minimal Header',
    description: 'Distraction-free frameless workspace focused on pure operational content.',
  },
];

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private api = inject(ApiService);
  private readonly STORAGE_KEY = 'fleetsphere_theme_preferences';

  // Signals for reactive state
  public headerColor = signal<HeaderColor>(DEFAULT_THEME_CONFIG.header_color);
  public menuColor = signal<MenuColor>(DEFAULT_THEME_CONFIG.menu_color);
  public colorMode = signal<ColorMode>(DEFAULT_THEME_CONFIG.color_mode);
  public layout = signal<WorkspaceLayout>(DEFAULT_THEME_CONFIG.layout);
  public sidebarWidth = signal<SidebarWidth>(DEFAULT_THEME_CONFIG.sidebar_width);
  public fontFamily = signal<string>(DEFAULT_THEME_CONFIG.font_family);
  public accentColor = signal<string>(DEFAULT_THEME_CONFIG.accent_color);

  // Backward compatibility signal for existing components
  public isDark = signal<boolean>(false);

  // Slide-over modal state
  public isPersonalizeModalOpen = signal<boolean>(false);
  public isSaving = signal<boolean>(false);

  constructor() {
    this.initFromStorage();
  }

  private initFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed: UserThemeConfig = JSON.parse(stored);
        this.headerColor.set(parsed.header_color || DEFAULT_THEME_CONFIG.header_color);
        this.menuColor.set(parsed.menu_color || DEFAULT_THEME_CONFIG.menu_color);
        this.colorMode.set(parsed.color_mode || DEFAULT_THEME_CONFIG.color_mode);
        this.layout.set(parsed.layout || DEFAULT_THEME_CONFIG.layout);
        this.sidebarWidth.set(parsed.sidebar_width || DEFAULT_THEME_CONFIG.sidebar_width);
        this.fontFamily.set(parsed.font_family || DEFAULT_THEME_CONFIG.font_family);
        this.accentColor.set(parsed.accent_color || DEFAULT_THEME_CONFIG.accent_color);
      }
    } catch {
      // Fallback to default
    }

    this.applyAllStyles();
  }

  public setHeaderColor(val: HeaderColor): void {
    this.headerColor.set(val);
    this.applyAllStyles();
    this.saveToStorage();
  }

  public setMenuColor(val: MenuColor): void {
    this.menuColor.set(val);
    this.applyAllStyles();
    this.saveToStorage();
  }

  public setColorMode(val: ColorMode): void {
    this.colorMode.set(val);
    this.isDark.set(val === 'dark');
    this.applyAllStyles();
    this.saveToStorage();
    this.saveToBackendQuietly();
  }

  public toggleTheme(): void {
    const next: ColorMode = this.colorMode() === 'dark' ? 'light' : 'dark';
    this.setColorMode(next);
  }

  public setLayout(val: WorkspaceLayout): void {
    this.layout.set(val);
    this.applyAllStyles();
    this.saveToStorage();
  }

  public setSidebarWidth(val: SidebarWidth): void {
    this.sidebarWidth.set(val);
    this.applyAllStyles();
    this.saveToStorage();
  }

  public setFontFamily(val: string): void {
    this.fontFamily.set(val);
    this.applyAllStyles();
    this.saveToStorage();
  }

  public setAccentColor(hex: string): void {
    if (!hex || !hex.startsWith('#') || hex.length < 4) return;
    this.accentColor.set(hex);
    this.applyAllStyles();
    this.saveToStorage();
  }

  public openPersonalizeModal(): void {
    this.isPersonalizeModalOpen.set(true);
  }

  public closePersonalizeModal(): void {
    this.isPersonalizeModalOpen.set(false);
  }

  public resetToDefaults(): void {
    this.headerColor.set(DEFAULT_THEME_CONFIG.header_color);
    this.menuColor.set(DEFAULT_THEME_CONFIG.menu_color);
    this.colorMode.set(DEFAULT_THEME_CONFIG.color_mode);
    this.layout.set(DEFAULT_THEME_CONFIG.layout);
    this.sidebarWidth.set(DEFAULT_THEME_CONFIG.sidebar_width);
    this.fontFamily.set(DEFAULT_THEME_CONFIG.font_family);
    this.accentColor.set(DEFAULT_THEME_CONFIG.accent_color);
    this.isDark.set(false);

    this.applyAllStyles();
    this.saveToStorage();

    // Reset on backend
    this.api.delete<ApiResponse>('user/theme-preferences').subscribe({
      next: () => {},
      error: () => {},
    });
  }

  public saveToBackend(): Promise<boolean> {
    this.isSaving.set(true);
    const payload: UserThemeConfig = {
      header_color: this.headerColor(),
      menu_color: this.menuColor(),
      color_mode: this.colorMode(),
      layout: this.layout(),
      sidebar_width: this.sidebarWidth(),
      font_family: this.fontFamily(),
      accent_color: this.accentColor(),
    };

    this.saveToStorage();

    return new Promise(resolve => {
      this.api.post<ApiResponse<UserThemeConfig>>('user/theme-preferences', payload).subscribe({
        next: () => {
          this.isSaving.set(false);
          resolve(true);
        },
        error: () => {
          this.isSaving.set(false);
          resolve(false);
        },
      });
    });
  }

  public loadFromBackend(): void {
    this.api.get<ApiResponse<UserThemeConfig>>('user/theme-preferences').subscribe({
      next: res => {
        if (res?.data) {
          const d = res.data;
          if (d.header_color) this.headerColor.set(d.header_color);
          if (d.menu_color) this.menuColor.set(d.menu_color);
          if (d.color_mode) {
            this.colorMode.set(d.color_mode);
            this.isDark.set(d.color_mode === 'dark');
          }
          if (d.layout) this.layout.set(d.layout);
          if (d.sidebar_width) this.sidebarWidth.set(d.sidebar_width);
          if (d.font_family) this.fontFamily.set(d.font_family);
          if (d.accent_color) this.accentColor.set(d.accent_color);

          this.applyAllStyles();
          this.saveToStorage();
        }
      },
      error: () => {
        // Fall back to storage
      },
    });
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const config: UserThemeConfig = {
        header_color: this.headerColor(),
        menu_color: this.menuColor(),
        color_mode: this.colorMode(),
        layout: this.layout(),
        sidebar_width: this.sidebarWidth(),
        font_family: this.fontFamily(),
        accent_color: this.accentColor(),
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch {}
  }

  public applyAllStyles(): void {
    if (typeof document === 'undefined') return;

    const docEl = document.documentElement;
    const body = document.body;
    const hex = this.accentColor() || DEFAULT_THEME_CONFIG.accent_color;

    // 1. Accent color CSS variables & shades
    const hover = this.adjustColor(hex, -15);
    const active = this.adjustColor(hex, -25);
    const shade900 = this.adjustColor(hex, -35);
    const shade950 = this.adjustColor(hex, -45);
    const light50 = this.hexToRgba(hex, 0.08);
    const light100 = this.hexToRgba(hex, 0.14);
    const light200 = this.hexToRgba(hex, 0.22);
    const light300 = this.hexToRgba(hex, 0.35);
    const light400 = this.adjustColor(hex, 12);
    const ringColor = this.hexToRgba(hex, 0.25);

    // Dynamic FleetSphere accent CSS variables
    docEl.style.setProperty('--fs-accent', hex);
    docEl.style.setProperty('--fs-accent-hover', hover);
    docEl.style.setProperty('--fs-accent-active', active);
    docEl.style.setProperty('--fs-accent-light', light50);
    docEl.style.setProperty('--fs-accent-light-border', light300);
    docEl.style.setProperty('--fs-accent-ring', ringColor);

    // Map all Tailwind CSS v4 blue variables so all standard Tailwind components
    // (buttons, badges, breadcrumbs, checkboxes, tables, dropdowns, active links)
    // seamlessly and immediately update to the user's custom accent color:
    docEl.style.setProperty('--color-blue-50', light50);
    docEl.style.setProperty('--color-blue-100', light100);
    docEl.style.setProperty('--color-blue-200', light200);
    docEl.style.setProperty('--color-blue-300', light300);
    docEl.style.setProperty('--color-blue-400', light400);
    docEl.style.setProperty('--color-blue-500', hex);
    docEl.style.setProperty('--color-blue-600', hex);
    docEl.style.setProperty('--color-blue-700', hover);
    docEl.style.setProperty('--color-blue-800', active);
    docEl.style.setProperty('--color-blue-900', shade900);
    docEl.style.setProperty('--color-blue-950', shade950);

    // 2. Font family CSS variable
    const fontObj = FONT_OPTIONS.find(f => f.value === this.fontFamily());
    const familyStr = fontObj ? fontObj.family : `'Plus Jakarta Sans', sans-serif`;
    docEl.style.setProperty('--fs-font-family', familyStr);
    body.style.fontFamily = familyStr;

    // 3. Page Dark Mode
    const isDarkMode = this.colorMode() === 'dark';
    this.isDark.set(isDarkMode);
    if (isDarkMode) {
      docEl.classList.add('dark');
      body.classList.add('dark');
      docEl.setAttribute('data-theme', 'dark');
      body.setAttribute('data-color-mode', 'dark');
    } else {
      docEl.classList.remove('dark');
      body.classList.remove('dark');
      docEl.setAttribute('data-theme', 'light');
      body.setAttribute('data-color-mode', 'light');
    }

    // 4. Data attributes for declarative styling
    body.setAttribute('data-header-color', this.headerColor());
    body.setAttribute('data-menu-color', this.menuColor());
    body.setAttribute('data-layout', this.layout());
    body.setAttribute('data-sidebar-width', this.sidebarWidth());
    body.setAttribute('data-font', this.fontFamily());
  }

  private saveToBackendQuietly(): void {
    const payload: UserThemeConfig = {
      header_color: this.headerColor(),
      menu_color: this.menuColor(),
      color_mode: this.colorMode(),
      layout: this.layout(),
      sidebar_width: this.sidebarWidth(),
      font_family: this.fontFamily(),
      accent_color: this.accentColor(),
    };
    this.api.post<ApiResponse<UserThemeConfig>>('user/theme-preferences', payload).subscribe({
      next: () => {},
      error: () => {},
    });
  }

  private adjustColor(hex: string, percent: number): string {
    if (!hex) return '#187f65';
    let cleanHex = hex.replace('#', '').trim();
    if (cleanHex.length === 3) {
      cleanHex = cleanHex.split('').map(c => c + c).join('');
    }
    if (cleanHex.length !== 6) return hex;

    const num = parseInt(cleanHex, 16);
    if (isNaN(num)) return hex;

    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000ff) + amt));

    return (
      '#' +
      (
        0x1000000 +
        R * 0x10000 +
        G * 0x100 +
        B
      )
        .toString(16)
        .slice(1)
    );
  }

  private hexToRgba(hex: string, alpha: number): string {
    if (!hex) return `rgba(24, 127, 101, ${alpha})`;
    let c = hex.replace('#', '').trim();
    if (c.length === 3) {
      c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    if (c.length !== 6) return `rgba(24, 127, 101, ${alpha})`;
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
