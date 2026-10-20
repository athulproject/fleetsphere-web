import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import type { ApiResponse, Employee, TenantEmployeeData } from '../../core/models/auth.models';
import {
  LucideBuilding,
  LucideShield,
  LucideUsers,
  LucideDatabase,
  LucideRefreshCw,
  LucideCheckCircle,
  LucideKey,
} from '@lucide/angular';

@Component({
  selector: 'app-dashboard-handler',
  standalone: true,
  imports: [
    CommonModule,
    LucideBuilding,
    LucideShield,
    LucideUsers,
    LucideDatabase,
    LucideRefreshCw,
    LucideCheckCircle,
    LucideKey,
  ],
  templateUrl: './dashboard-handler.html',
  styleUrl: './dashboard-handler.css',
})
export class DashboardHandler implements OnInit {
  public authService = inject(AuthService);
  private http = inject(HttpClient);

  employees = signal<Employee[]>([]);
  isLoadingEmployees = signal<boolean>(false);
  employeeError = signal<string>('');
  tenantInfo = signal<{ company_code: string; company_name: string } | null>(null);

  ngOnInit(): void {
    this.loadEmployees();
  }

  loadEmployees(): void {
    this.isLoadingEmployees.set(true);
    this.employeeError.set('');

    this.http
      .get<ApiResponse<TenantEmployeeData>>('http://localhost:5000/api/employees')
      .subscribe({
        next: (res) => {
          this.isLoadingEmployees.set(false);
          if (res.success && res.data) {
            this.employees.set(res.data.employees);
            this.tenantInfo.set(res.data.tenant);
          }
        },
        error: (err) => {
          this.isLoadingEmployees.set(false);
          const msg =
            err.error?.message ||
            'Failed to load employees from tenant database. Check server logs.';
          this.employeeError.set(msg);
        },
      });
  }
}
