import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { StatusToastService } from '../commonComponents/status-toastify/status-toastify.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../commonComponents/breadcrumb/breadcrumb';
import { DropdownComponent, DropdownOption } from '../commonComponents/dropdown/dropdown';
import { ToggleComponent } from '../commonComponents/toggle/toggle';
import { LoadingComponent } from '../commonComponents/loading/loading';
import type { ApiResponse } from '../core/models/auth.models';
import {
  LucideSlidersHorizontal,
  LucideSettings,
  LucideSave,
  LucideRotateCcw,
  LucideCheck,
  LucideAlertCircle,
  LucideInfo,
  LucideSearch,
  LucideUsers,
  LucideClock,
  LucideDollarSign,
  LucideFileText,
  LucideCalendar,
  LucideTruck,
  LucideShield,
  LucideSparkles,
  LucideChevronRight,
  LucideLayoutGrid,
} from '@lucide/angular';

export interface ControlModuleItem {
  id: number;
  module_code: string;
  module_name: string;
  icon_name: string;
  category: string;
  description: string;
  display_order: number;
  is_active: boolean;
  settings_count: number;
  last_updated_at?: string;
}

export interface ControlSettingItem {
  id: number;
  module_code: string;
  setting_key: string;
  setting_label: string;
  setting_description: string;
  setting_type: 'toggle' | 'text' | 'number' | 'select';
  setting_value: string;
  default_value: string;
  options_json?: Array<{ label: string; value: string }>;
  group_name: string;
  depends_on_key?: string | null;
  display_order: number;
  is_active: boolean;
  parsed_value?: any;
}

export interface SettingGroup {
  name: string;
  items: ControlSettingItem[];
}

@Component({
  selector: 'app-control-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    BreadcrumbComponent,
    DropdownComponent,
    ToggleComponent,
    LoadingComponent,
    LucideSlidersHorizontal,
    LucideSave,
    LucideRotateCcw,
    LucideCheck,
    LucideAlertCircle,
    LucideSearch,
    LucideUsers,
    LucideClock,
    LucideDollarSign,
    LucideFileText,
    LucideCalendar,
    LucideTruck,
    LucideSparkles,
    LucideChevronRight,
    LucideLayoutGrid,
  ],
  templateUrl: './control-panel.component.html',
  styleUrl: './control-panel.component.css',
})
export class ControlPanelComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private toast = inject(StatusToastService);

  role = computed(() => this.authService.primaryRole());

  breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Options' },
    { label: 'Setup Module', to: `/${this.role()}/setupmodule` },
    { label: 'Control Panel' },
  ];

  // State signals
  modules = signal<ControlModuleItem[]>([]);
  activeModuleCode = signal<string>('user_management');
  selectedModule = signal<ControlModuleItem | null>(null);

  settingGroups = signal<SettingGroup[]>([]);
  formValues = signal<Record<string, any>>({});
  originalValues = signal<Record<string, any>>({});

  isLoadingModules = signal<boolean>(false);
  isLoadingSettings = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isResetting = signal<boolean>(false);

  // Search filter for module tabs
  moduleSearch = signal<string>('');

  // Confirm Reset Modal state
  showResetConfirmModal = signal<boolean>(false);

  // Filtered module list computed
  filteredModules = computed(() => {
    const q = this.moduleSearch().trim().toLowerCase();
    if (!q) return this.modules();
    return this.modules().filter(
      (m) =>
        m.module_name.toLowerCase().includes(q) ||
        m.module_code.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
  });

  // Track if any setting has unsaved modifications
  hasUnsavedChanges = computed(() => {
    const current = this.formValues();
    const original = this.originalValues();
    const keys = Object.keys(current);
    for (const k of keys) {
      if (String(current[k]) !== String(original[k])) {
        return true;
      }
    }
    return false;
  });

  ngOnInit(): void {
    this.loadModules();

    // Listen to query params for pre-selecting module tab (e.g. ?module=user_management)
    this.route.queryParamMap.subscribe((params) => {
      const mod = params.get('module');
      if (mod && mod !== this.activeModuleCode()) {
        this.activeModuleCode.set(mod);
        if (this.modules().length > 0) {
          this.selectModule(mod);
        }
      }
    });
  }

  loadModules(): void {
    this.isLoadingModules.set(true);
    this.api.get<ApiResponse<ControlModuleItem[]>>('control-panel/modules').subscribe({
      next: (res) => {
        this.isLoadingModules.set(false);
        if (res.success && res.data) {
          this.modules.set(res.data);

          // Find current module or select first
          const targetCode = this.activeModuleCode() || res.data[0]?.module_code;
          const found = res.data.find((m) => m.module_code === targetCode) || res.data[0];
          if (found) {
            this.selectModule(found.module_code);
          }
        }
      },
      error: (err) => {
        this.isLoadingModules.set(false);
        this.toast.error(err.error?.message || 'Failed to load control modules.');
      },
    });
  }

  selectModule(moduleCode: string): void {
    this.activeModuleCode.set(moduleCode);
    const mod = this.modules().find((m) => m.module_code === moduleCode) || null;
    this.selectedModule.set(mod);

    // Update query param without reloading page
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { module: moduleCode },
      queryParamsHandling: 'merge',
    });

    this.loadSettingsForModule(moduleCode);
  }

  loadSettingsForModule(moduleCode: string): void {
    this.isLoadingSettings.set(true);
    this.api.get<ApiResponse<{ module: ControlModuleItem; groups: SettingGroup[]; settings: ControlSettingItem[] }>>(
      `control-panel/modules/${moduleCode}`
    ).subscribe({
      next: (res) => {
        this.isLoadingSettings.set(false);
        if (res.success && res.data) {
          this.settingGroups.set(res.data.groups || []);

          // Initialize form values
          const initial: Record<string, any> = {};
          for (const s of res.data.settings || []) {
            if (s.setting_type === 'toggle') {
              initial[s.setting_key] = s.setting_value === 'true';
            } else if (s.setting_type === 'number') {
              initial[s.setting_key] = Number(s.setting_value);
            } else {
              initial[s.setting_key] = s.setting_value;
            }
          }
          this.formValues.set({ ...initial });
          this.originalValues.set({ ...initial });
        }
      },
      error: (err) => {
        this.isLoadingSettings.set(false);
        this.toast.error(err.error?.message || `Failed to load settings for ${moduleCode}.`);
      },
    });
  }

  onSettingChange(key: string, val: any): void {
    const current = { ...this.formValues() };
    current[key] = val;
    this.formValues.set(current);
  }

  isSettingDisabled(setting: ControlSettingItem): boolean {
    if (!setting.depends_on_key) return false;
    const parentVal = this.formValues()[setting.depends_on_key];
    return !parentVal;
  }

  getSettingOptions(setting: ControlSettingItem): DropdownOption[] {
    if (!setting.options_json || !Array.isArray(setting.options_json)) return [];
    return setting.options_json.map((opt) => ({
      label: opt.label,
      value: opt.value,
    }));
  }

  saveSettings(): void {
    const code = this.activeModuleCode();
    if (!code) return;

    this.isSaving.set(true);
    const payload = { settings: this.formValues() };

    this.api.put<ApiResponse<any>>(`control-panel/modules/${code}`, payload).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          this.toast.success(res.message || 'Settings saved successfully.');
          this.originalValues.set({ ...this.formValues() });
        } else {
          this.toast.error(res.message || 'Failed to save settings.');
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error(err.error?.message || 'Error updating module control settings.');
      },
    });
  }

  promptReset(): void {
    this.showResetConfirmModal.set(true);
  }

  confirmReset(): void {
    const code = this.activeModuleCode();
    if (!code) return;

    this.isResetting.set(true);
    this.api.post<ApiResponse<any>>(`control-panel/modules/${code}/reset`, {}).subscribe({
      next: (res) => {
        this.isResetting.set(false);
        this.showResetConfirmModal.set(false);
        if (res.success) {
          this.toast.success(res.message || 'Settings restored to factory defaults.');
          this.loadSettingsForModule(code);
        } else {
          this.toast.error(res.message || 'Failed to reset settings.');
        }
      },
      error: (err) => {
        this.isResetting.set(false);
        this.toast.error(err.error?.message || 'Error resetting module settings.');
      },
    });
  }

  getModuleIcon(iconName: string): any {
    const iconMap: Record<string, any> = {
      Users: LucideUsers,
      Clock: LucideClock,
      DollarSign: LucideDollarSign,
      FileText: LucideFileText,
      Calendar: LucideCalendar,
      Truck: LucideTruck,
      SlidersHorizontal: LucideSlidersHorizontal,
      Settings: LucideSettings,
    };
    return iconMap[iconName] || LucideSlidersHorizontal;
  }
}
