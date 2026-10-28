import { Injectable, computed, inject, signal, effect } from '@angular/core';
import { AuthService } from './auth.service';

export interface FavouriteMenuItem {
  sub_menu_id?: number | string;
  label?: string;
  sub_menu_name?: string;
  routes: string;
  route_path?: string;
  icon?: string;
  icon_name?: string;
  category?: string;
  description?: string;
  display_order?: number;
}

@Injectable({
  providedIn: 'root',
})
export class FavouritesService {
  private authService = inject(AuthService);

  public favRoutes = signal<string[]>([]);
  public favCount = computed(() => this.favRoutes().length);

  constructor() {
    // Reactively reload favorites whenever current logged in user changes
    effect(() => {
      const user = this.authService.currentUser();
      this.loadFavourites();
    });
  }

  private getStorageKey(): string {
    const user = this.authService.currentUser();
    const email = user?.email ? user.email.replace(/[^a-zA-Z0-9]/g, '_') : 'guest';
    return `fleetsphere_fav_routes_${email}`;
  }

  public loadFavourites(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      this.favRoutes.set([]);
      return;
    }

    try {
      const key = this.getStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.favRoutes.set(parsed);
          return;
        }
      }
    } catch (e) {
      console.warn('[FavouritesService] Error loading user favourites:', e);
    }

    // Default is empty for any user until they explicitly star an item
    this.favRoutes.set([]);
  }

  public isFavourite(route: string): boolean {
    if (!route) return false;
    const cleanRoute = route.startsWith('/') ? route : `/${route}`;
    return this.favRoutes().some((r) => r === cleanRoute || r === route);
  }

  public toggleFavourite(itemOrRoute: FavouriteMenuItem | string): void {
    let route = typeof itemOrRoute === 'string' ? itemOrRoute : itemOrRoute.routes || itemOrRoute.route_path || '';
    if (!route) return;

    if (!route.startsWith('/')) {
      route = `/${route}`;
    }

    const current = this.favRoutes();
    let updated: string[];

    if (current.includes(route)) {
      updated = current.filter((r) => r !== route);
    } else {
      updated = [...current, route];
    }

    this.favRoutes.set(updated);
    this.persist(updated);
  }

  private persist(routes: string[]): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const key = this.getStorageKey();
      localStorage.setItem(key, JSON.stringify(routes));
    } catch (e) {
      console.error('[FavouritesService] Failed to persist favourites:', e);
    }
  }
}
