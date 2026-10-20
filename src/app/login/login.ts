import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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

  companyCode = 'CLIENTA';
  email = 'admin@client001.com';
  password = 'Admin@123';
  rememberMe = true;
  showPassword = false;
  isSigningIn = false;
  loginError = '';
  toastMessage = '';

  ngOnInit(): void {
    // If already authenticated, redirect to dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  notify(message: string): void {
    this.toastMessage = message;
    setTimeout(() => {
      if (this.toastMessage === message) {
        this.toastMessage = '';
      }
    }, 4000);
  }

  signIn(): void {
    this.loginError = '';
    if (!this.companyCode.trim() || !this.email.trim() || !this.password.trim()) {
      this.loginError = 'Please fill in all required fields (Company Code, Email, and Password).';
      return;
    }

    this.isSigningIn = true;

    this.authService
      .login({
        company_code: this.companyCode.trim(),
        email: this.email.trim(),
        password: this.password,
      })
      .subscribe({
        next: (res) => {
          this.isSigningIn = false;
          if (res.success) {
            this.router.navigate(['/dashboard']);
          } else {
            this.loginError = res.message || 'Login failed';
          }
        },
        error: (err) => {
          this.isSigningIn = false;
          const msg =
            err.error?.message ||
            (err.status === 0
              ? 'Unable to connect to FleetSphere backend server. Please verify the API is running on http://localhost:5000'
              : 'Authentication failed. Please verify your company code, email, and password.');
          this.loginError = msg;
        },
      });
  }
}
