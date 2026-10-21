import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { timeout, finalize } from 'rxjs';
import {
  LucideBuilding,
  LucideUser,
  LucideLock,
  LucideEye,
  LucideEyeOff,
  LucideArrowRight,
  LucideTruck,
  LucideShieldCheck,
  LucideCircleAlert,
} from '@lucide/angular';
import { AuthService } from '../core/services/auth.service';
import { StatusToastService } from '../commonComponents/status-toastify/status-toastify.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideBuilding,
    LucideUser,
    LucideLock,
    LucideEye,
    LucideEyeOff,
    LucideArrowRight,
    LucideTruck,
    LucideShieldCheck,
    LucideCircleAlert,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(StatusToastService);

  companyCode = 'CLIENTA';
  email = 'admin@client001.com';
  password = '1';
  rememberMe = true;
  showPassword = false;
  isSigningIn = false;
  loginError = '';

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      const role = this.authService.primaryRole();
      this.router.navigate([`/${role}/dashboard`]);
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  notify(message: string, title = 'Notice'): void {
    this.toastService.info(message, title);
  }

  signIn(): void {
    this.loginError = '';
    const cleanCompany = this.companyCode.trim();
    const cleanEmail = this.email.trim();

    if (!cleanCompany || !cleanEmail || !this.password.trim()) {
      const missingMsg = 'Please fill in all required fields (Company Code, Email, and Password).';
      this.loginError = missingMsg;
      this.toastService.warning(missingMsg, 'Missing Fields');
      return;
    }

    this.isSigningIn = true;

    this.authService.login({ company_code: cleanCompany, email: cleanEmail, password: this.password })
      .pipe(timeout(12000), finalize(() => { this.isSigningIn = false })).subscribe({
        next: (res) => {
          if (res.success) {
            const role = (res.data?.user?.roles?.[0] || 'admin').toLowerCase();
            this.toastService.success(`Signed in successfully as ${cleanEmail}`, 'Login Successful', 3000)
            this.router.navigate([`/${role}/dashboard`])
          } else {
            const msg = res.message || 'Login failed. Please verify your credentials.';
            this.loginError = msg;
            this.toastService.error(msg, 'Authentication Failed');
          }
        },
        error: (err) => {
          let errorTitle = 'Authentication Failed'
          let errorMessage = 'Invalid credentials or workspace code. Please try again.'

          if (err.name === 'TimeoutError') {
            errorTitle = 'Connection Timeout'
            errorMessage = 'The server or database took too long to respond (timeout). Please verify your database connection and try again.';
          } else if (err.status === 0) {
            errorTitle = 'Server Unreachable'
            errorMessage = 'Cannot connect to FleetSphere API server at http://localhost:5000. Please ensure the backend is running.';
          } else if (err.status === 500) {
            errorTitle = 'Database / Server Error'
            const serverMsg = err.error?.message || 'Internal Server Error'
            const detailError = err.error?.error ? ` (${err.error.error})` : ''
            errorMessage = `${serverMsg}${detailError}`
          } else if (err.error?.message) {
            errorMessage = err.error.message
            if (err.status === 403) {
              errorTitle = 'Access Forbidden'
            } else if (err.status === 401) {
              errorTitle = 'Invalid Credentials'
            }
          }

          this.loginError = errorMessage
          this.toastService.error(errorMessage, errorTitle, 8000)
        },
      })
  }
}
