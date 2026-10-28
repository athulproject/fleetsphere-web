import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'fleetsphere_theme';
  public isDark = signal<boolean>(false);

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.THEME_KEY);
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDarkTheme = stored === 'dark' || (!stored && prefersDark);

      this.isDark.set(isDarkTheme);
      this.applyTheme(isDarkTheme);
    } catch {
      this.isDark.set(false);
    }
  }

  public toggleTheme(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    this.applyTheme(next);

    try {
      localStorage.setItem(this.THEME_KEY, next ? 'dark' : 'light');
    } catch {}
  }

  private applyTheme(dark: boolean): void {
    if (typeof document === 'undefined') return;
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

