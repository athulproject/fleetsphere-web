import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideChevronRight, LucideLayoutDashboard } from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideChevronRight, LucideLayoutDashboard],
  templateUrl: './breadcrumb.html',
})
export class BreadcrumbComponent {
  private authService = inject(AuthService);

  items = input<BreadcrumbItem[]>([]);
  title = input<string>('');
  description = input<string>('');
  loading = input<boolean>(false);

  dashboardRoute = computed(() => `/${this.authService.primaryRole()}/dashboard`);
}
