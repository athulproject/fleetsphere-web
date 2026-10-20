import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import type {
  AuthCompany,
  AuthUser,
  LoginRequest,
  LoginResponseData,
  ApiResponse,
} from '../models/auth.models';

const TOKEN_KEY = 'fleetsphere_auth_token';
const USER_KEY = 'fleetsphere_auth_user';
const TENANT_KEY = 'fleetsphere_auth_tenant';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Backend API URL
  private readonly apiUrl = 'http://localhost:5000/api';

  // Reactive state signals
  public token = signal<string | null>(null);
  public currentUser = signal<AuthUser | null>(null);
  public currentTenant = signal<AuthCompany | null>(null);

  // Computed state
  public isAuthenticated = computed(() => !!this.token());
  public permissions = computed(() => this.currentUser()?.permissions ?? []);
  public roles = computed(() => this.currentUser()?.roles ?? []);
  public userDisplayName = computed(() => {
    const user = this.currentUser();
    if (!user) return '';
    return user.email.split('@')[0];
  });
  public companyName = computed(() => this.currentTenant()?.name ?? 'FleetSphere');
  public designationName = computed(
    () => this.currentUser()?.designation?.name ?? 'Client Member'
  );

  constructor() {
    this.loadSession();
  }

  /**
   * Restores session state from sessionStorage
   */
  public loadSession(): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;

    try {
      const storedToken = sessionStorage.getItem(TOKEN_KEY);
      const storedUser = sessionStorage.getItem(USER_KEY);
      const storedTenant = sessionStorage.getItem(TENANT_KEY);

      if (storedToken && storedUser && storedTenant) {
        this.token.set(storedToken);
        this.currentUser.set(JSON.parse(storedUser));
        this.currentTenant.set(JSON.parse(storedTenant));
      }
    } catch (e) {
      console.error('[AuthService] Error restoring session:', e);
      this.clearSession();
    }
  }

  /**
   * Authenticates user against POST /api/auth/login
   */
  public login(req: LoginRequest): Observable<ApiResponse<LoginResponseData>> {
    return this.http
      .post<ApiResponse<LoginResponseData>>(`${this.apiUrl}/auth/login`, req)
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            const { token, user, company } = res.data;
            this.setSession(token, user, company);
          }
        }),
        catchError((err) => {
          return throwError(() => err);
        })
      );
  }

  /**
   * Sets authenticated session
   */
  private setSession(token: string, user: AuthUser, company: AuthCompany): void {
    this.token.set(token);
    this.currentUser.set(user);
    this.currentTenant.set(company);

    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(TOKEN_KEY, token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
      sessionStorage.setItem(TENANT_KEY, JSON.stringify(company));
    }
  }

  /**
   * Clears session from memory and sessionStorage
   */
  private clearSession(): void {
    this.token.set(null);
    this.currentUser.set(null);
    this.currentTenant.set(null);

    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TENANT_KEY);
    }
  }

  /**
   * Logs out user, invokes backend logout, clears state and redirects to login
   */
  public logout(): void {
    if (this.token()) {
      this.http
        .post(`${this.apiUrl}/auth/logout`, {})
        .pipe(catchError(() => []))
        .subscribe();
    }

    this.clearSession();
    this.router.navigate(['/']);
  }

  /**
   * Check if current user has a specific permission
   */
  public hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  /**
   * Check if current user has a specific role
   */
  public hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  /**
   * Get current auth token for interceptor
   */
  public getToken(): string | null {
    return this.token();
  }
}
