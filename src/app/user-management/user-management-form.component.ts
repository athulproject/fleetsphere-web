import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { StatusToastService } from '../commonComponents/status-toastify/status-toastify.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../commonComponents/breadcrumb/breadcrumb';
import { DropdownComponent, DropdownOption } from '../commonComponents/dropdown/dropdown';
import { LoadingComponent } from '../commonComponents/loading/loading';
import type { ApiResponse } from '../core/models/auth.models';
import {
  LucideArrowLeft,
  LucideSave,
  LucideUserCheck,
  LucideShield,
  LucideNetwork,
  LucideSearch,
  LucideCheckCircle2,
  LucideAlertCircle,
  LucideSparkles,
  LucideRefreshCw,
} from '@lucide/angular';

export interface VerifiedEmployee {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  designation_id: number | null;
  designation_name: string | null;
  department_id: number | null;
  dept_name: string | null;
  branch_id: number | null;
  branch_name: string | null;
  region_id: number | null;
  region_name: string | null;
  area_id: number | null;
  area_name: string | null;
  shift_id: number | null;
  shift_name: string | null;
}

export interface UserFormData {
  id?: number;
  employee_id: number | null;
  employee_code: string;
  user_code: string;
  user_name: string;
  email: string;
  phone_number: string;
  reporting_manager_id: number | null;
  region_id: number | null;
  area_id: number | null;
  branch_id: number | null;
  shift_id: number | null;
  role_code: string;
  notes: string;
}

@Component({
  selector: 'app-user-management-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
    DropdownComponent,
    LoadingComponent,
    LucideArrowLeft,
    LucideSave,
    LucideUserCheck,
    LucideShield,
    LucideNetwork,
    LucideSearch,
    LucideCheckCircle2,
    LucideAlertCircle,
    LucideSparkles,
    LucideRefreshCw,
  ],
  templateUrl: './user-management-form.component.html',
})
export class UserManagementFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private toast = inject(StatusToastService);

  role = computed(() => this.authService.primaryRole());
  isEdit = signal<boolean>(false);
  userId = signal<string | null>(null);

  breadcrumbItems = computed<BreadcrumbItem[]>(() => [
    { label: 'Organization' },
    { label: 'User Provisioning & Management', to: `/${this.role()}/user-management` },
    { label: this.isEdit() ? 'Edit User Configuration' : 'Provision New User' },
  ]);

  // Form State
  formData = signal<UserFormData>({
    employee_id: null,
    employee_code: '',
    user_code: '',
    user_name: '',
    email: '',
    phone_number: '',
    reporting_manager_id: null,
    region_id: null,
    area_id: null,
    branch_id: null,
    shift_id: null,
    role_code: 'OPERATOR',
    notes: '',
  });

  formErrors = signal<Record<string, string>>({});

  // Employee Verification State
  isVerifyingEmp = signal<boolean>(false);
  verifiedEmp = signal<VerifiedEmployee | null>(null);
  empVerifyError = signal<string | null>(null);

  // User Code Generation State
  isAutoCode = signal<boolean>(true);
  isManualOverride = signal<boolean>(false);
  isGeneratingCode = signal<boolean>(false);
  codeReusedNote = signal<string | null>(null);

  // Tenant Config
  tenantConfig = signal<any>(null);

  // Dropdown options
  managerOptions = signal<DropdownOption[]>([]);
  regionOptions = signal<DropdownOption[]>([]);
  allAreas = signal<Array<{ id: number; area_name: string; region_id: number }>>([]);
  branchOptions = signal<DropdownOption[]>([]);
  shiftOptions = signal<DropdownOption[]>([]);
  roleOptions = signal<DropdownOption[]>([]);

  // Computed area options filtered by selected region_id (Cascading!)
  filteredAreaOptions = computed<DropdownOption[]>(() => {
    const selectedRegion = this.formData().region_id;
    if (!selectedRegion) return [];
    return this.allAreas()
      .filter((a) => a.region_id === Number(selectedRegion))
      .map((a) => ({ label: a.area_name, value: a.id }));
  });

  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  ngOnInit(): void {
    this.loadDropdowns();
    this.loadTenantConfig();

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.userId.set(id);
        this.isEdit.set(true);
        this.loadExistingUser(id);
      } else {
        this.isEdit.set(false);
        this.fetchNextAutoCode();
      }
    });
  }

  loadTenantConfig(): void {
    this.api.get<ApiResponse<any>>('user-management/config').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.tenantConfig.set(res.data);
          this.isAutoCode.set(Boolean(res.data.is_auto_user_code));
        }
      },
    });
  }

  loadDropdowns(): void {
    this.api.get<ApiResponse<any>>('user-management/dropdowns').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          // Managers
          this.managerOptions.set(
            res.data.managers.map((m: any) => ({
              label: `${m.user_name} (${m.user_code})`,
              value: m.id,
            }))
          );

          // Regions
          this.regionOptions.set(
            res.data.regions.map((r: any) => ({
              label: r.region_name,
              value: r.id,
            }))
          );

          // All Areas stored for cascading
          this.allAreas.set(res.data.areas || []);

          // Branches
          this.branchOptions.set(
            res.data.branches.map((b: any) => ({
              label: `${b.branch_name} (${b.branch_type || 'Branch'})`,
              value: b.id,
            }))
          );

          // Shifts
          this.shiftOptions.set(
            res.data.shifts.map((s: any) => ({
              label: `${s.shift_name} (${s.start_time} - ${s.end_time})`,
              value: s.id,
            }))
          );

          // Roles
          this.roleOptions.set(
            res.data.roles.map((r: any) => ({
              label: r.c_role_name,
              value: r.c_role_code,
            }))
          );
        }
      },
    });
  }

  loadExistingUser(id: string): void {
    this.isLoading.set(true);
    this.api.get<ApiResponse<any>>(`user-management/${id}`).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          const u = res.data;
          this.formData.set({
            id: u.id,
            employee_id: u.employee_id,
            employee_code: u.employee_code || '',
            user_code: u.user_code,
            user_name: u.user_name,
            email: u.email,
            phone_number: u.phone_number || '',
            reporting_manager_id: u.reporting_manager_id,
            region_id: u.region_id,
            area_id: u.area_id,
            branch_id: u.branch_id,
            shift_id: u.shift_id,
            role_code: u.role_code || 'OPERATOR',
            notes: u.notes || '',
          });

          // Set verified employee info for context
          this.verifiedEmp.set({
            id: u.employee_id,
            employee_code: u.employee_code || '',
            first_name: u.user_name.split(' ')[0] || '',
            last_name: u.user_name.split(' ').slice(1).join(' ') || '',
            full_name: u.user_name,
            email: u.email,
            phone_number: u.phone_number,
            designation_id: u.designation_id,
            designation_name: u.designation_name,
            department_id: null,
            dept_name: u.dept_name,
            branch_id: u.branch_id,
            branch_name: u.branch_name,
            region_id: u.region_id,
            region_name: u.region_name,
            area_id: u.area_id,
            area_name: u.area_name,
            shift_id: u.shift_id,
            shift_name: u.shift_name,
          });
        } else {
          this.toast.error(res.message || 'User profile not found.');
          this.navigateBack();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.error(err.error?.message || 'Failed to load user profile.');
        this.navigateBack();
      },
    });
  }

  // Step 1: Verify Employee Code & Auto-Fill Profile Details
  verifyEmployee(): void {
    const code = this.formData().employee_code.trim();
    if (!code) {
      this.empVerifyError.set('Please enter an employee code to verify.');
      return;
    }

    this.isVerifyingEmp.set(true);
    this.empVerifyError.set(null);

    this.api.get<ApiResponse<any>>(`user-management/validate-employee/${encodeURIComponent(code)}`).subscribe({
      next: (res) => {
        this.isVerifyingEmp.set(false);
        if (res.success && res.data?.is_genuine && !res.data.has_active_user) {
          const emp = res.data.employee;
          this.verifiedEmp.set(emp);
          this.empVerifyError.set(null);

          // Auto-fill user fields from verified employee profile!
          const current = { ...this.formData() };
          current.employee_id = emp.id;
          current.user_name = emp.full_name || `${emp.first_name} ${emp.last_name}`.trim();
          current.email = emp.email || '';
          current.phone_number = emp.phone_number || '';

          // Pre-populate operational territory if configured on employee
          if (emp.region_id) current.region_id = emp.region_id;
          if (emp.area_id) current.area_id = emp.area_id;
          if (emp.branch_id) current.branch_id = emp.branch_id;
          if (emp.shift_id) current.shift_id = emp.shift_id;

          this.formData.set(current);
          this.toast.success(`Employee verified: ${emp.full_name} (${emp.designation_name || 'Staff'})`);
        } else {
          this.verifiedEmp.set(null);
          this.empVerifyError.set(res.message || 'Employee verification failed.');
          this.toast.error(res.message || 'Employee could not be verified.');
        }
      },
      error: (err) => {
        this.isVerifyingEmp.set(false);
        this.verifiedEmp.set(null);
        const msg = err.error?.message || 'Employee not found in Employee Master.';
        this.empVerifyError.set(msg);
        this.toast.error(msg);
      },
    });
  }

  // Step 2: Auto User Code Generation
  fetchNextAutoCode(): void {
    this.isGeneratingCode.set(true);
    this.api.get<ApiResponse<any>>('user-management/next-code').subscribe({
      next: (res) => {
        this.isGeneratingCode.set(false);
        if (res.success && res.data?.code) {
          const current = { ...this.formData() };
          current.user_code = res.data.code;
          this.formData.set(current);

          if (res.data.is_reused) {
            this.codeReusedNote.set('Reusing user code from previously closed account.');
          } else {
            this.codeReusedNote.set(null);
          }
        }
      },
      error: () => {
        this.isGeneratingCode.set(false);
      },
    });
  }

  toggleManualOverride(allow: boolean): void {
    this.isManualOverride.set(allow);
    if (!allow) {
      this.fetchNextAutoCode();
    }
  }

  // Cascading Region Change -> Clears Area
  onRegionChange(regionId: any): void {
    const current = { ...this.formData() };
    current.region_id = regionId ? Number(regionId) : null;
    current.area_id = null; // Reset child area when region changes
    this.formData.set(current);
  }

  onFieldChange(field: keyof UserFormData, val: any): void {
    const current = { ...this.formData() };
    (current as any)[field] = val;
    this.formData.set(current);

    if (this.formErrors()[field]) {
      const errs = { ...this.formErrors() };
      delete errs[field];
      this.formErrors.set(errs);
    }
  }

  validate(): boolean {
    const errors: Record<string, string> = {};
    const d = this.formData();
    const cfg = this.tenantConfig();

    if (!this.isEdit()) {
      if (!d.employee_id) {
        errors['employee_code'] = 'A genuine employee must be verified first.';
      }
    }

    if (!d.user_code.trim()) {
      errors['user_code'] = 'User code is required.';
    }

    if (!d.user_name.trim()) {
      errors['user_name'] = 'User name is required.';
    }

    if (!d.email.trim()) {
      errors['email'] = 'Email address is required.';
    }

    if (cfg?.require_reporting_manager && !d.reporting_manager_id) {
      errors['reporting_manager_id'] = 'Reporting manager is required by tenant policy.';
    }

    if (cfg?.require_region_assignment && !d.region_id) {
      errors['region_id'] = 'Operational region is required by tenant policy.';
    }

    this.formErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  saveUser(): void {
    if (!this.validate()) {
      this.toast.error('Please resolve the highlighted validation errors.');
      return;
    }

    this.isSaving.set(true);
    const data = this.formData();

    if (this.isEdit()) {
      this.api.put<ApiResponse<any>>(`user-management/${this.userId()}`, data).subscribe({
        next: (res) => {
          this.isSaving.set(false);
          if (res.success) {
            this.toast.success('User configuration updated successfully.');
            this.navigateBack();
          } else {
            this.toast.error(res.message || 'Failed to update user.');
          }
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toast.error(err.error?.message || 'Error updating user.');
        },
      });
    } else {
      this.api.post<ApiResponse<any>>('user-management', data).subscribe({
        next: (res) => {
          this.isSaving.set(false);
          if (res.success) {
            this.toast.success(`User "${data.user_code}" provisioned successfully!`);
            this.navigateBack();
          } else {
            this.toast.error(res.message || 'Failed to provision user.');
          }
        },
        error: (err) => {
          this.isSaving.set(false);
          this.toast.error(err.error?.message || 'Error creating user.');
        },
      });
    }
  }

  navigateBack(): void {
    this.router.navigate([`/${this.role()}/user-management`]);
  }
}

