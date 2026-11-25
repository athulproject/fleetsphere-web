import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of, map } from 'rxjs';
import type {
  AuthCompany,
  AuthUser,
  LoginRequest,
  LoginResponseData,
  ApiResponse,
} from '../models/auth.models';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // Backend API URL
  private readonly apiUrl = 'http://localhost:5000/api';

  // Pure in-memory reactive state signals
  // Security Architecture:
  // - ZERO sensitive tokens or permission lists are written to sessionStorage/localStorage.
  // - The authentication token is held exclusively in the browser's HttpOnly cookie jar.
  // - User details and permissions live strictly in memory (JavaScript heap) and are validated
  //   directly against the server database on boot and on every API request.
  public currentUser = signal<AuthUser | null>(null);
  public currentTenant = signal<AuthCompany | null>(null);
  public isVerifyingSession = signal<boolean>(false);

  // Computed state - authenticated when user profile is loaded in memory
  public isAuthenticated = computed(() => !!this.currentUser());
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
  public primaryRole = computed(() => {
    const r = this.roles();
    if (r && r.length > 0) {
      return r[0].toLowerCase();
    }
    return 'admin';
  });

  constructor() {
    this.cleanLegacyStorage();
    this.loadSession();
  }

  /**
   * Cleans any legacy tokens or user items left in sessionStorage/localStorage
   */
  private cleanLegacyStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem('fleetsphere_auth_token');
      sessionStorage.removeItem('fleetsphere_auth_user');
      sessionStorage.removeItem('fleetsphere_auth_tenant');
      localStorage.removeItem('fleetsphere_auth_token');
    } catch {}
  }

  /**
   * Loads/verifies session on app startup via the HttpOnly cookie
   */
  public loadSession(): void {
    this.verifySessionWithBackend().subscribe();
  }

  /**
   * Ensures the user is authenticated.
   * If already loaded in memory, returns true.
   * Otherwise, calls GET /api/auth/me to check the HttpOnly cookie with the server.
   */
  public ensureAuthenticated(): Observable<boolean> {
    if (this.currentUser()) {
      return of(true);
    }
    return this.verifySessionWithBackend();
  }

  /**
   * Verifies the HttpOnly cookie against the backend /api/auth/me endpoint.
   * Server validates the cryptographic signature and queries Postgres for active permissions.
   */
  public verifySessionWithBackend(): Observable<boolean> {
    this.isVerifyingSession.set(true);

    return this.http
      .get<ApiResponse<{ user: AuthUser; company: AuthCompany }>>(`${this.apiUrl}/auth/me`, {
        withCredentials: true,
      })
      .pipe(
        map((res) => {
          this.isVerifyingSession.set(false);
          if (res.success && res.data) {
            this.currentUser.set(res.data.user);
            this.currentTenant.set(res.data.company);
            return true;
          }
          this.clearSession();
          return false;
        }),
        catchError(() => {
          this.isVerifyingSession.set(false);
          this.clearSession();
          return of(false);
        })
      );
  }

  /**
   * Authenticates user against POST /api/auth/login.
   * The server responds with Set-Cookie: fleetsphere_token=... (HttpOnly, Secure, SameSite=Lax).
   */
  public login(req: LoginRequest): Observable<ApiResponse<LoginResponseData>> {
    return this.http
      .post<ApiResponse<LoginResponseData>>(`${this.apiUrl}/auth/login`, req, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          if (res.success && res.data) {
            const { user, company } = res.data;
            this.setSession(user, company);
          }
        }),
        catchError((err) => {
          return throwError(() => err);
        })
      );
  }

  /**
   * Sets authenticated session state strictly in memory (Signals)
   */
  private setSession(user: AuthUser, company: AuthCompany): void {
    this.currentUser.set(user);
    this.currentTenant.set(company);
  }

  /**
   * Clears session from memory
   */
  private clearSession(): void {
    this.currentUser.set(null);
    this.currentTenant.set(null);
  }

  /**
   * Logs out user: tells backend to clear HttpOnly cookies, clears memory and redirects
   */
  public logout(): void {
    this.http
      .post(
        `${this.apiUrl}/auth/logout`,
        {},
        { withCredentials: true }
      )
      .pipe(catchError(() => []))
      .subscribe();

    this.clearSession();
    this.router.navigate(['/']);
  }

  /**
   * Helper to study cookies in client-side JavaScript.
   * Reads a cookie value by name from document.cookie.
   * Note: HttpOnly cookies (like fleetsphere_token) CANNOT be read by this function (by design for security).
   * Client-accessible cookies (like fleetsphere_logged_in) CAN be read.
   */
  public getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
    return match ? decodeURIComponent(match[3]) : null;
  }

  /**
   * Checks if the client-accessible logged_in cookie hint is set
   */
  public hasLoggedInCookie(): boolean {
    return this.getCookie('fleetsphere_logged_in') === 'true';
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
   * Compatibility method - returns null because token is now in HttpOnly cookie
   */
  public getToken(): string | null {
    return null;
  }
}
