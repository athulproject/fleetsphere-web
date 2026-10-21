import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/services/api.service';
import { StatusToastService } from '../commonComponents/status-toastify/status-toastify.service';
import { DropdownComponent, DropdownOption } from '../commonComponents/dropdown/dropdown';
import { LoadingComponent } from '../commonComponents/loading/loading';
import type { ApiResponse } from '../core/models/auth.models';
import {
  LucideShield,
  LucideBriefcase,
  LucideUsers,
  LucideSearch,
  LucideRotateCcw,
  LucideLayers,
  LucideSave,
  LucideLayoutDashboard,
  LucideChevronDown,
  LucideChevronUp,
  LucideCheck,
  LucideX,
} from '@lucide/angular';

export interface MenuMappingItem {
  header_id: number;
  header_name: string;
  header_order: number;
  sub_menu_id: number;
  sub_menu_name: string;
  route_path: string;
  icon_name: string;
  sub_order: number;
  is_mapped: boolean;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

@Component({
  selector: 'app-menu-master',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DropdownComponent,
    LoadingComponent,
    LucideShield,
    LucideBriefcase,
    LucideUsers,
    LucideSearch,
    LucideRotateCcw,
    LucideLayers,
    LucideSave,
    LucideLayoutDashboard,
    LucideChevronDown,
    LucideChevronUp,
    LucideX,
  ],
  templateUrl: './menu-master.component.html',
})
export class MenuMasterComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(StatusToastService);

  // Active Mapping Type: 'role' | 'designation' | 'employee'
  activeMappingType = signal<'role' | 'designation' | 'employee'>('role');

  // Role State
  roles = signal<Array<{ role_id: string; role_code: string; role_name: string }>>([]);
  selectedRoleCode = signal<string>('ADMIN');

  // Designation State
  designations = signal<Array<{ designation_id: string; designation_code: string; designation_name: string }>>([]);
  selectedDesignationCode = signal<string>('');

  // Employee State
  employees = signal<Array<{ employee_id: string; employee_code: string; first_name: string; last_name: string; email: string }>>([]);
  selectedEmployeeId = signal<string>('');

  // Loaded Menu Items for current selection
  menuItems = signal<MenuMappingItem[]>([]);
  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  // Category Filtering: 'All Menus' or specific Header Name
  selectedCategory = signal<string>('All Menus');

  // Search Filter
  searchQuery = signal<string>('');

  // Expand All / Collapse All state for granular permissions
  isAllExpanded = signal<boolean>(false);
  expandedCardIds = signal<Set<number>>(new Set());

  // ----------------------------------------------------------------
  // Computed Dropdown Options
  // ----------------------------------------------------------------
  roleOptions = computed<DropdownOption[]>(() => {
    return this.roles().map((r) => ({
      value: r.role_code,
      label: `${r.role_name} (${r.role_code})`,
    }));
  });

  designationOptions = computed<DropdownOption[]>(() => {
    return this.designations().map((d) => ({
      value: d.designation_code,
      label: d.designation_name,
    }));
  });

  employeeOptions = computed<DropdownOption[]>(() => {
    return this.employees().map((e) => ({
      value: e.employee_id,
      label: `${e.employee_code} - ${e.first_name} ${e.last_name || ''} (${e.email || 'No email'})`,
    }));
  });

  // Unique category list derived from current menu items
  categories = computed<string[]>(() => {
    const set = new Set<string>();
    for (const item of this.menuItems()) {
      if (item.header_name) {
        set.add(item.header_name);
      }
    }
    return Array.from(set);
  });

  // Filtered menu items according to selectedCategory and searchQuery
  filteredMenuItems = computed<MenuMappingItem[]>(() => {
    const cat = this.selectedCategory();
    const q = this.searchQuery().trim().toLowerCase();
    let list = this.menuItems();

    if (cat !== 'All Menus') {
      list = list.filter((item) => item.header_name === cat);
    }

    if (q) {
      list = list.filter(
        (item) =>
          item.sub_menu_name.toLowerCase().includes(q) ||
          item.route_path.toLowerCase().includes(q) ||
          item.header_name.toLowerCase().includes(q)
      );
    }

    return list;
  });

  // Selection statistics
  selectedCount = computed<number>(() => {
    return this.menuItems().filter((item) => item.is_mapped).length;
  });

  totalCount = computed<number>(() => {
    return this.menuItems().length;
  });

  // Whether all visible items are selected
  isAllVisibleSelected = computed<boolean>(() => {
    const list = this.filteredMenuItems();
    return list.length > 0 && list.every((item) => item.is_mapped);
  });

  ngOnInit(): void {
    this.loadRoles();
    this.loadDesignations();
    this.loadEmployees();
  }

  // ----------------------------------------------------------------
  // Top Tabs Switcher
  // ----------------------------------------------------------------
  switchMappingType(type: 'role' | 'designation' | 'employee'): void {
    this.activeMappingType.set(type);
    this.selectedCategory.set('All Menus');
    this.searchQuery.set('');

    if (type === 'role') {
      this.loadRoleMappings(this.selectedRoleCode());
    } else if (type === 'designation') {
      if (this.designations().length > 0 && !this.selectedDesignationCode()) {
        this.selectedDesignationCode.set(this.designations()[0].designation_code);
      }
      this.loadRoleMappings(this.selectedDesignationCode() || 'ADMIN');
    } else if (type === 'employee') {
      if (this.employees().length > 0 && !this.selectedEmployeeId()) {
        this.selectedEmployeeId.set(this.employees()[0].employee_id);
      }
      this.loadEmployeeMappings(this.selectedEmployeeId());
    }
  }

  // ----------------------------------------------------------------
  // Data Fetching
  // ----------------------------------------------------------------
  loadRoles(): void {
    this.api.get<ApiResponse<any[]>>('menus/roles').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.roles.set(res.data);
          if (res.data.length > 0 && !this.selectedRoleCode()) {
            this.selectedRoleCode.set(res.data[0].role_code);
          }
          if (this.activeMappingType() === 'role') {
            this.loadRoleMappings(this.selectedRoleCode() || res.data[0]?.role_code);
          }
        }
      },
    });
  }

  loadDesignations(): void {
    this.api.get<ApiResponse<any[]>>('menus/designations').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.designations.set(res.data);
          if (res.data.length > 0 && !this.selectedDesignationCode()) {
            this.selectedDesignationCode.set(res.data[0].designation_code);
          }
        }
      },
    });
  }

  loadEmployees(): void {
    this.api.get<ApiResponse<any[]>>('menus/employees').subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.employees.set(res.data);
          if (res.data.length > 0 && !this.selectedEmployeeId()) {
            this.selectedEmployeeId.set(res.data[0].employee_id);
          }
        }
      },
    });
  }

  onRoleChange(roleCode: string): void {
    this.selectedRoleCode.set(roleCode);
    this.loadRoleMappings(roleCode);
  }

  onDesignationChange(desigCode: string): void {
    this.selectedDesignationCode.set(desigCode);
    this.loadRoleMappings(desigCode);
  }

  onEmployeeChange(employeeId: string): void {
    this.selectedEmployeeId.set(employeeId);
    this.loadEmployeeMappings(employeeId);
  }

  loadRoleMappings(roleCode: string = this.selectedRoleCode()): void {
    if (!roleCode) return;
    this.isLoading.set(true);

    this.api
      .get<ApiResponse<{ roleCode: string; allRows: MenuMappingItem[] }>>(
        `menus/mappings/role/${roleCode}`
      )
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data?.allRows) {
            this.menuItems.set(res.data.allRows);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toast.error(err.error?.message || 'Failed to load mappings.');
        },
      });
  }

  loadEmployeeMappings(employeeId: string = this.selectedEmployeeId()): void {
    if (!employeeId) return;
    this.isLoading.set(true);

    this.api
      .get<ApiResponse<{ employeeId: string; allRows: any[] }>>(
        `menus/mappings/employee/${employeeId}`
      )
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data?.allRows) {
            const normalized: MenuMappingItem[] = res.data.allRows.map((r) => ({
              ...r,
              is_mapped: r.is_granted,
            }));
            this.menuItems.set(normalized);
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          this.toast.error(err.error?.message || 'Failed to load employee mappings.');
        },
      });
  }

  // ----------------------------------------------------------------
  // Selection & Permission Toggles
  // ----------------------------------------------------------------
  toggleMenuSelection(item: MenuMappingItem): void {
    const nextState = !item.is_mapped;
    const updated = this.menuItems().map((m) => {
      if (m.sub_menu_id === item.sub_menu_id) {
        return {
          ...m,
          is_mapped: nextState,
          can_view: nextState,
          can_add: nextState,
          can_edit: nextState,
          can_delete: nextState,
        };
      }
      return m;
    });
    this.menuItems.set(updated);
  }

  toggleSelectAll(checked: boolean): void {
    const visibleSubMenuIds = new Set(this.filteredMenuItems().map((m) => m.sub_menu_id));
    const updated = this.menuItems().map((m) => {
      if (visibleSubMenuIds.has(m.sub_menu_id)) {
        return {
          ...m,
          is_mapped: checked,
          can_view: checked,
          can_add: checked,
          can_edit: checked,
          can_delete: checked,
        };
      }
      return m;
    });
    this.menuItems.set(updated);
  }

  toggleExpandAll(): void {
    this.isAllExpanded.update((v) => !v);
  }

  toggleCardExpand(subMenuId: number): void {
    const current = new Set(this.expandedCardIds());
    if (current.has(subMenuId)) {
      current.delete(subMenuId);
    } else {
      current.add(subMenuId);
    }
    this.expandedCardIds.set(current);
  }

  resetMappings(): void {
    const type = this.activeMappingType();
    if (type === 'role') {
      this.loadRoleMappings(this.selectedRoleCode());
    } else if (type === 'designation') {
      this.loadRoleMappings(this.selectedDesignationCode() || 'ADMIN');
    } else {
      this.loadEmployeeMappings(this.selectedEmployeeId());
    }
    this.toast.info('Mappings reloaded to original state.', 'Reset');
  }

  // ----------------------------------------------------------------
  // Save Mappings
  // ----------------------------------------------------------------
  saveMappings(): void {
    const type = this.activeMappingType();
    this.isSaving.set(true);

    if (type === 'employee') {
      const employeeId = this.selectedEmployeeId();
      const mappings = this.menuItems().map((r) => ({
        sub_menu_id: r.sub_menu_id,
        is_granted: r.is_mapped,
        can_view: r.can_view,
        can_add: r.can_add,
        can_edit: r.can_edit,
        can_delete: r.can_delete,
      }));

      this.api
        .post<ApiResponse<any>>('menus/mappings/employee', {
          employee_id: employeeId,
          mappings,
        })
        .subscribe({
          next: (res) => {
            this.isSaving.set(false);
            if (res.success) {
              this.toast.success(res.message || 'Employee menu access saved.', 'Saved');
            } else {
              this.toast.error(res.message || 'Failed to save employee mappings.');
            }
          },
          error: (err) => {
            this.isSaving.set(false);
            this.toast.error(err.error?.message || 'Error saving employee mappings.');
          },
        });
    } else {
      // Role or Designation mapping
      const roleCode =
        type === 'role' ? this.selectedRoleCode() : this.selectedDesignationCode() || 'ADMIN';
      const mappings = this.menuItems().map((r) => ({
        sub_menu_id: r.sub_menu_id,
        is_mapped: r.is_mapped,
        can_view: r.can_view,
        can_add: r.can_add,
        can_edit: r.can_edit,
        can_delete: r.can_delete,
      }));

      this.api
        .post<ApiResponse<any>>('menus/mappings/role', {
          role_code: roleCode,
          mappings,
        })
        .subscribe({
          next: (res) => {
            this.isSaving.set(false);
            if (res.success) {
              this.toast.success(
                res.message || `Menu access for ${roleCode} saved successfully.`,
                'Saved'
              );
            } else {
              this.toast.error(res.message || 'Failed to save menu access.');
            }
          },
          error: (err) => {
            this.isSaving.set(false);
            this.toast.error(err.error?.message || 'Error saving menu access.');
          },
        });
    }
  }
}
