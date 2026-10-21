import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { StatusToastService } from '../commonComponents/status-toastify/status-toastify.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../commonComponents/breadcrumb/breadcrumb';
import { DropdownComponent, DropdownOption } from '../commonComponents/dropdown/dropdown';
import { ToggleComponent } from '../commonComponents/toggle/toggle';
import { CheckboxComponent } from '../commonComponents/checkbox/checkbox';
import { LoadingComponent } from '../commonComponents/loading/loading';
import type { ApiResponse } from '../core/models/auth.models';
import {
  LucideArrowLeft,
  LucideSave,
  LucideLayers,
} from '@lucide/angular';

export interface DynamicMasterHeader {
  master_id: number;
  master_code: string;
  table_name: string;
  primary_key: string;
  header_name: string;
  list_title: string;
  description: string | null;
}

export interface DynamicMasterField {
  id: number;
  column_name: string;
  label: string;
  field_type: 'text' | 'number' | 'dropdown' | 'toggle' | 'textarea' | 'date';
  priority: number;
  visible: boolean;
  required: boolean;
  readonly: boolean;
  dropdown_table?: string | null;
  dropdown_value_field?: string | null;
  dropdown_label_field?: string | null;
  depends_on?: string | null;
  depends_on_field?: string | null;
  regex?: string | null;
  max_length?: number | null;
  min_length?: number | null;
  show_in_list: boolean;
  list_label?: string | null;
  is_auto_code: boolean;
  code_prefix?: string | null;
  code_length?: number | null;
}

export interface DynamicMasterMetaResponse {
  header: DynamicMasterHeader;
  fields: DynamicMasterField[];
}

@Component({
  selector: 'app-dynamic-master-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
    DropdownComponent,
    ToggleComponent,
    LoadingComponent,
    LucideArrowLeft,
    LucideSave,
    LucideLayers,
  ],
  templateUrl: './dynamic-master-form.component.html',
})
export class DynamicMasterFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private toast = inject(StatusToastService);

  masterCode = signal<string>('');
  recordId = signal<string | null>(null);
  isEdit = signal<boolean>(false);

  header = signal<DynamicMasterHeader | null>(null);
  fields = signal<DynamicMasterField[]>([]);
  formData = signal<Record<string, any>>({});
  formErrors = signal<Record<string, string>>({});
  dropdownOptions = signal<Record<string, DropdownOption[]>>({});

  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  role = computed(() => this.authService.primaryRole());

  listRoute = computed(() => `/${this.role()}/master/${this.masterCode()}`);

  breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const h = this.header();
    return [
      { label: 'Masters' },
      { label: h?.list_title || h?.header_name || 'Master List', to: this.listRoute() },
      { label: this.isEdit() ? 'Edit Record' : 'Create New' },
    ];
  });

  // Filter and sort form fields
  formFields = computed(() => {
    return this.fields()
      .filter((f) => f.visible)
      .sort((a, b) => a.priority - b.priority);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const code = params.get('masterCode');
      const id = params.get('id');

      if (code) {
        this.masterCode.set(code);
        if (id) {
          this.recordId.set(id);
          this.isEdit.set(true);
        } else {
          this.recordId.set(null);
          this.isEdit.set(false);
        }
        this.loadMetadataAndData();
      }
    });
  }

  loadMetadataAndData(): void {
    this.isLoading.set(true);
    const code = this.masterCode();

    // 1. Fetch metadata
    this.api.get<ApiResponse<DynamicMasterMetaResponse>>(`dynamic-master/${code}/metadata`).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.header.set(res.data.header);
          this.fields.set(res.data.fields || []);

          // 2. Load dropdown sources
          this.loadAllDropdownOptions(res.data.fields);

          // 3. Handle Mode: Edit or Create
          if (this.isEdit() && this.recordId()) {
            this.loadExistingRecord(code, this.recordId()!);
          } else {
            this.initCreateForm(res.data.fields);
            this.isLoading.set(false);
          }
        } else {
          this.isLoading.set(false);
          this.toast.error(res.message || 'Failed to load master metadata.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.error(err.error?.message || 'Error loading master schema.');
      },
    });
  }

  initCreateForm(fields: DynamicMasterField[]): void {
    const initial: Record<string, any> = {};
    for (const f of fields) {
      if (f.field_type === 'toggle') {
        initial[f.column_name] = true;
      } else {
        initial[f.column_name] = null;
      }

      // Automatically generate next code for auto-code fields
      if (f.is_auto_code) {
        this.fetchNextAutoCode(f.column_name);
      }
    }
    this.formData.set(initial);
  }

  loadExistingRecord(code: string, id: string): void {
    this.api.get<ApiResponse<Record<string, any>>>(`dynamic-master/${code}/${id}`).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.formData.set({ ...res.data });
        } else {
          this.toast.error(res.message || 'Record not found.');
          this.navigateBack();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.toast.error(err.error?.message || 'Failed to load record details.');
        this.navigateBack();
      },
    });
  }

  fetchNextAutoCode(columnName: string): void {
    this.api
      .get<ApiResponse<{ code: string }>>(`dynamic-master/${this.masterCode()}/next-code/${columnName}`)
      .subscribe({
        next: (res) => {
          if (res.success && res.data?.code) {
            const current = { ...this.formData() };
            current[columnName] = res.data.code;
            this.formData.set(current);
          }
        },
      });
  }

  loadAllDropdownOptions(fields: DynamicMasterField[]): void {
    const dropdownFields = fields.filter(
      (f) =>
        f.field_type === 'dropdown' &&
        f.dropdown_table &&
        f.dropdown_value_field &&
        f.dropdown_label_field
    );

    for (const f of dropdownFields) {
      this.loadDropdownOptionsForField(f.column_name);
    }
  }

  loadDropdownOptionsForField(columnName: string, parentValue?: any): void {
    const query = parentValue ? `?parentValue=${encodeURIComponent(parentValue)}` : '';
    this.api
      .get<ApiResponse<Array<{ value: any; label: string }>>>(
        `dynamic-master/${this.masterCode()}/dropdown/${columnName}${query}`
      )
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const current = { ...this.dropdownOptions() };
            current[columnName] = res.data.map((opt: { value: any; label: string }) => ({
              value: opt.value,
              label: opt.label,
            }));
            this.dropdownOptions.set(current);
          }
        },
      });
  }

  onFieldChange(columnName: string, val: any): void {
    const current = { ...this.formData() };
    current[columnName] = val;
    this.formData.set(current);

    // Clear validation error on change
    if (this.formErrors()[columnName]) {
      const errs = { ...this.formErrors() };
      delete errs[columnName];
      this.formErrors.set(errs);
    }

    // Cascade dependent dropdowns if any
    const dependentField = this.fields().find(
      (f) => f.depends_on && f.depends_on.toLowerCase() === columnName.toLowerCase()
    );
    if (dependentField) {
      this.loadDropdownOptionsForField(dependentField.column_name, val);
    }
  }

  validate(): boolean {
    const errors: Record<string, string> = {};
    const data = this.formData();

    for (const f of this.fields()) {
      if (!f.visible) continue;
      const val = data[f.column_name];

      // Required check
      if (f.required) {
        if (val === undefined || val === null || String(val).trim() === '') {
          errors[f.column_name] = `${f.label} is required.`;
          continue;
        }
      }

      // Min/Max length
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        const strVal = String(val);
        if (f.min_length && strVal.length < f.min_length) {
          errors[f.column_name] = `${f.label} must be at least ${f.min_length} characters.`;
        }
        if (f.max_length && strVal.length > f.max_length) {
          errors[f.column_name] = `${f.label} cannot exceed ${f.max_length} characters.`;
        }
        if (f.regex) {
          const reg = new RegExp(f.regex);
          if (!reg.test(strVal)) {
            errors[f.column_name] = `${f.label} format is invalid.`;
          }
        }
      }
    }

    this.formErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  saveRecord(): void {
    if (!this.validate()) {
      this.toast.error('Please fix validation errors in the form.', 'Validation Error');
      return;
    }

    this.isSaving.set(true);
    const code = this.masterCode();
    const payload = { ...this.formData() };

    const req$ = this.isEdit() && this.recordId()
      ? this.api.put<ApiResponse<any>>(`dynamic-master/${code}/${this.recordId()}`, payload)
      : this.api.post<ApiResponse<any>>(`dynamic-master/${code}`, payload);

    req$.subscribe({
      next: (res) => {
        this.isSaving.set(false);
        if (res.success) {
          const actionWord = this.isEdit() ? 'updated' : 'created';
          this.toast.success(
            res.message || `${this.header()?.header_name || 'Record'} ${actionWord} successfully.`,
            'Success'
          );
          this.navigateBack();
        } else {
          this.toast.error(res.message || 'Failed to save record.');
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.toast.error(
          err.error?.message || err.message || 'Server error while saving.',
          'Save Error'
        );
      },
    });
  }

  navigateBack(): void {
    this.router.navigate([this.listRoute()]);
  }
}
