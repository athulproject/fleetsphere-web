import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { StatusToastService } from '../commonComponents/status-toastify/status-toastify.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../commonComponents/breadcrumb/breadcrumb';
import { DropdownComponent, DropdownOption } from '../commonComponents/dropdown/dropdown';
import { ToggleComponent } from '../commonComponents/toggle/toggle';
import { LoadingComponent } from '../commonComponents/loading/loading';
import type { ApiResponse } from '../core/models/auth.models';
import {
  LucideUsers,
  LucideUserCheck,
  LucideUserX,
  LucidePlus,
  LucideSearch,
  LucideSlidersHorizontal,
  LucideRotateCcw,
  LucidePencil,
  LucideLock,
  LucideUnlock,
  LucideSettings,
  LucideX,
  LucideNetwork,
  LucideBuilding2,
  LucideClock,
} from '@lucide/angular';

export interface UserProfileItem {
  id: number;
  user_code: string;
  employee_id: number;
  employee_code: string;
  user_name: string;
  email: string;
  phone_number: string | null;
  designation_id: number | null;
  designation_name: string | null;
  dept_name: string | null;
  reporting_manager_id: number | null;
  manager_name: string | null;
  manager_code: string | null;
  region_id: number | null;
  region_name: string | null;
  area_id: number | null;
  area_name: string | null;
  branch_id: number | null;
  branch_name: string | null;
  shift_id: number | null;
  shift_name: string | null;
  role_code: string;
  user_status: 'ACTIVE' | 'CLOSED' | 'SUSPENDED';
  close_reason: string | null;
  closed_at: string | null;
  reopened_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  closed_users: number;
  reporting_managers: number;
}

export interface TenantUserConfig {
  id?: number;
  control_code?: string;
  is_auto_user_code: boolean;
  user_code_prefix: string;
  user_code_length: number;
  allow_manual_code_override: boolean;
  allow_closed_code_reuse: boolean;
  require_employee_validation: boolean;
  auto_fetch_employee_name: boolean;
  require_reporting_manager: boolean;
  require_region_assignment: boolean;
  default_role_code: string;
  description?: string;
}

@Component({
  selector: 'app-user-management-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
    DropdownComponent,
    ToggleComponent,
    LoadingComponent,
    LucideUsers,
    LucideUserCheck,
    LucideUserX,
    LucidePlus,
    LucideSearch,
    LucideSlidersHorizontal,
    LucideRotateCcw,
    LucidePencil,
    LucideLock,
    LucideUnlock,
    LucideSettings,
    LucideX,
    LucideNetwork,
    LucideBuilding2,
    LucideClock,
  ],
  templateUrl: './user-management-list.component.html',
})
export class UserManagementListComponent implements OnInit {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private toast = inject(StatusToastService);
  private router = inject(Router);

  role = computed(() => this.authService.primaryRole());

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Organization' },
    { label: 'User Provisioning & Management' },
  ];

  // Data signals
  users = signal<UserProfileItem[]>([]);
  stats = signal<UserStats>({
    total_users: 0,
    active_users: 0,
    closed_users: 0,
    reporting_managers: 0,
  });
  tenantConfig = signal<TenantUserConfig | null>(null);

  isLoading = signal<boolean>(false);
  isSavingConfig = signal<boolean>(false);
  isActionLoading = signal<boolean>(false);

  // Filters
  searchQuery = signal<string>('');
  filterStatus = signal<string>('ALL');
  filterDesignation = signal<string>('');
  filterRegion = signal<string>('');
  filterBranch = signal<string>('');

  // Dropdown options for filters
  designationOptions = signal<DropdownOption[]>([]);
  regionOptions = signal<DropdownOption[]>([]);
  branchOptions = signal<DropdownOption[]>([]);

  statusFilterOptions: DropdownOption[] = [
    { label: 'All Statuses', value: 'ALL' },
    { label: 'Active Users', value: 'ACTIVE' },
    { label: 'Closed Users', value: 'CLOSED' },
  ];

  // Modals & Drawers state
  showConfigDrawer = signal<boolean>(false);
  showCloseModal = signal<boolean>(false);
  showReopenModal = signal<boolean>(false);
  selectedUser = signal<UserProfileItem | null>(null);
  closeReason = signal<string>('Employee Resignation / Role Transition');

  // Config form edit buffer
  editableConfig = signal<TenantUserConfig>({
    is_auto_user_code: true,
    user_code_prefix: 'USR',
    user_code_length: 4,
    allow_manual_code_override: true,
    allow_closed_code_reuse: true,
    require_employee_validation: true,
    auto_fetch_employee_name: true,
    require_reporting_manager: false,
    require_region_assignment: false,
    default_role_code: 'OPERATOR',
  });

  // Filtered users computed
  filteredUsers = computed(() => {
    return this.users();
  });

  ngOnInit(): void {
    this.loadStats();
    this.loadTenantConfig();
    this.loadFilterDropdowns();
    this.loadUsers();
  }

  loadStats(): void {
    this.api.get<ApiResponse<UserStats>>('user-management/stats').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stats.set(res.data);
        }
      },
    });
  }

  loadTenantConfig(): void {
    this.api.get<ApiResponse<TenantUserConfig>>('user-management/config').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.tenantConfig.set(res.data);
          this.editableConfig.set({ ...res.data });
        }
      },
    });
  }

  loadFilterDropdowns(): void {
    this.api.get<ApiResponse<{ designations: any[]; regions: any[]; branches: any[] }>>('user-management/dropdowns').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.designationOptions.set([
            { label: 'All Designations', value: '' },
            ...res.data.designations.map((d) => ({ label: d.designation_name, value: String(d.id) })),
          ]);
          this.regionOptions.set([
            { label: 'All Regions', value: '' },
            ...res.data.regions.map((r) => ({ label: r.region_name, value: String(r.id) })),
          ]);
          this.branchOptions.set([
            { label: 'All Branches', value: '' },
            ...res.data.branches.map((b) => ({ label: b.branch_name, value: String(b.id) })),
          ]);
        }
      },
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    const params = new URLSearchParams();

    if (this.searchQuery().trim()) {
      params.set('search', this.searchQuery().trim());
    }
    if (this.filterStatus() && this.filterStatus() !== 'ALL') {
      params.set('status', this.filterStatus());
    }
    if (this.filterDesignation()) {
      params.set('designation_id', this.filterDesignation());
    }
    if (this.filterRegion()) {
      params.set('region_id', this.filterRegion());
    }
    if (this.filterBranch()) {
      params.set('branch_id', this.filterBranch());
    }

    const query = params.toString() ? `?${params.toString()}` : '';

    this.api.get<ApiResponse<UserProfileItem[]>>(`user-management${query}`).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.users.set(res.data);
        } else {
          this.toast.error(res.message || 'Failed to load users.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.error(err.error?.message || 'Error fetching user management list.');
      },
    });
  }

  applyFilters(): void {
    this.loadUsers();
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.filterStatus.set('ALL');
    this.filterDesignation.set('');
    this.filterRegion.set('');
    this.filterBranch.set('');
    this.loadUsers();
  }

  openCreatePage(): void {
    this.router.navigate([`/${this.role()}/user-management/create`]);
  }

  openEditPage(user: UserProfileItem): void {
    this.router.navigate([`/${this.role()}/user-management/edit/${user.id}`]);
  }

  // Close User Flow
  promptCloseUser(user: UserProfileItem): void {
    this.selectedUser.set(user);
    this.closeReason.set('Employee Resignation / Role Transition');
    this.showCloseModal.set(true);
  }

  confirmCloseUser(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.isActionLoading.set(true);
    this.api
      .post<ApiResponse<UserProfileItem>>(`user-management/${user.id}/close`, {
        close_reason: this.closeReason(),
      })
      .subscribe({
        next: (res) => {
          this.isActionLoading.set(false);
          this.showCloseModal.set(false);
          if (res.success) {
            this.toast.success(res.message || `User account ${user.user_code} closed successfully.`);
            this.loadStats();
            this.loadUsers();
          } else {
            this.toast.error(res.message || 'Failed to close user account.');
          }
        },
        error: (err) => {
          this.isActionLoading.set(false);
          this.toast.error(err.error?.message || 'Error closing user account.');
        },
      });
  }

  // Reopen User Flow
  promptReopenUser(user: UserProfileItem): void {
    this.selectedUser.set(user);
    this.showReopenModal.set(true);
  }

  confirmReopenUser(): void {
    const user = this.selectedUser();
    if (!user) return;

    this.isActionLoading.set(true);
    this.api.post<ApiResponse<UserProfileItem>>(`user-management/${user.id}/reopen`, {}).subscribe({
      next: (res) => {
        this.isActionLoading.set(false);
        this.showReopenModal.set(false);
        if (res.success) {
          this.toast.success(res.message || `User account ${user.user_code} re-opened successfully.`);
          this.loadStats();
          this.loadUsers();
        } else {
          this.toast.error(res.message || 'Failed to re-open user account.');
        }
      },
      error: (err) => {
        this.isActionLoading.set(false);
        this.toast.error(err.error?.message || 'Error re-opening user account.');
      },
    });
  }

  // Tenant Control Panel
  openConfigDrawer(): void {
    if (this.tenantConfig()) {
      this.editableConfig.set({ ...this.tenantConfig()! });
    }
    this.showConfigDrawer.set(true);
  }

  saveTenantConfig(): void {
    this.isSavingConfig.set(true);
    this.api
      .put<ApiResponse<TenantUserConfig>>('user-management/config', this.editableConfig())
      .subscribe({
        next: (res) => {
          this.isSavingConfig.set(false);
          if (res.success && res.data) {
            this.tenantConfig.set(res.data);
            this.toast.success('Tenant User Management controls saved successfully.');
            this.showConfigDrawer.set(false);
          } else {
            this.toast.error(res.message || 'Failed to save configuration.');
          }
        },
        error: (err) => {
          this.isSavingConfig.set(false);
          this.toast.error(err.error?.message || 'Error saving control settings.');
        },
      });
  }
}

