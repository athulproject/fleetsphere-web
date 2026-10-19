import { Component, inject } from '@angular/core';
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
  LucideCircleAlert
} from '@lucide/angular';

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
    LucideCircleAlert
  ],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private router = inject(Router);

  companyCode = 'NORTHSTAR';
  email = 'admin@fleetsphere.com';
  password = '••••••••';
  rememberMe = true;
  showPassword = false;
  isSigningIn = false;
  loginError = '';
  toastMessage = '';

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
      this.loginError = 'Please fill in all required fields.';
      return;
    }

    this.isSigningIn = true;
    setTimeout(() => {
      this.isSigningIn = false;
      this.router.navigate(['/dashboard']);
    }, 800);
  }
}
