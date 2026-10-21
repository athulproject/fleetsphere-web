import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { StatusToastService } from '../commonComponents/status-toastify/status-toastify.service';
import type { ApiResponse } from '../core/models/auth.models';
import {
  LucidePlus,
  LucideSearch,
  LucideRefreshCw,
  LucideFilePenLine,
  LucideTrash2,
  LucideCircleCheck,
  LucideXCircle,
  LucideLayers,
  LucideX,
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

export interface DynamicMasterListResponse {
  header: DynamicMasterHeader;
  fields: DynamicMasterField[];
  records: Record<string, any>[];
  total: number;
}

@Component({
  selector: 'app-dynamic-master',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucidePlus,
    LucideSearch,
    LucideRefreshCw,
    LucideFilePenLine,
    LucideTrash2,
    LucideCircleCheck,
    LucideXCircle,
    LucideLayers,
    LucideX,
  ],
  templateUrl: './dynamic-master.component.html',
  styleUrl: './dynamic-master.component.css',
})
export class DynamicMasterComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private toast = inject(StatusToastService);

  masterCode = signal<string>('');
  header = signal<DynamicMasterHeader | null>(null);
  fields = signal<DynamicMasterField[]>([]);
  records = signal<Record<string, any>[]>([]);
  total = signal<number>(0);

  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  searchTerm = signal<string>('');

  // Modal State
  isModalOpen = signal<boolean>(false);
  modalMode = signal<'create' | 'edit'>('create');
  selectedId = signal<any>(null);
  formData = signal<Record<string, any>>({});
  formErrors = signal<Record<string, string>>({});
  dropdownOptions = signal<Record<string, Array<{ value: any; label: string }>>>({});

  // List columns to display (filtered by show_in_list = true, sorted by priority)
  listColumns = computed(() => {
    return this.fields()
      .filter((f) => f.show_in_list)
      .sort((a, b) => a.priority - b.priority);
  });

  // Form fields to display (filtered by visible = true, sorted by priority)
  formFields = computed(() => {
    return this.fields()
      .filter((f) => f.visible)
      .sort((a, b) => a.priority - b.priority);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const code = params.get('masterCode');
      if (code) {
        this.masterCode.set(code);
        this.loadMasterData(code);
      }
    });
  }

  loadMasterData(code: string = this.masterCode()): void {
    if (!code) return;
    this.isLoading.set(true);

    this.api
      .apiCall<ApiResponse<DynamicMasterListResponse>>({
        path: `dynamic-master/${code}`,
        method: 'GET',
        params: this.searchTerm().trim() ? { search: this.searchTerm().trim() } : undefined,
      })
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.header.set(res.data.header);
            this.fields.set(res.data.fields);
            this.records.set(res.data.records);
            this.total.set(res.data.total);
          } else {
            this.toast.error(res.message || 'Failed to load master records');
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          const msg = err.error?.message || 'Failed to load master records';
          this.toast.error(msg, 'Dynamic Master Error');
        },
      });
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.loadMasterData();
  }

  openCreateModal(): void {
    this.modalMode.set('create');
    this.selectedId.set(null);
    this.formErrors.set({});

    const initialData: Record<string, any> = {};
    for (const f of this.formFields()) {
      if (f.field_type === 'toggle') {
        initialData[f.column_name] = true;
      } else {
        initialData[f.column_name] = '';
      }
    }
    this.formData.set(initialData);

    // Load dropdown options for all dropdown fields
    this.loadAllDropdownOptions();

    // Check for auto-code fields
    for (const f of this.formFields()) {
      if (f.is_auto_code) {
        this.api
          .apiCall<ApiResponse<{ code: string }>>({
            path: `dynamic-master/${this.masterCode()}/next-code/${f.column_name}`,
            method: 'GET',
          })
          .subscribe({
            next: (res) => {
              if (res.success && res.data) {
                const current = { ...this.formData() };
                current[f.column_name] = res.data.code;
                this.formData.set(current);
              }
            },
          });
      }
    }

    this.isModalOpen.set(true);
  }

  openEditModal(row: Record<string, any>): void {
    this.modalMode.set('edit');
    const pk = this.header()?.primary_key || 'id';
    this.selectedId.set(row[pk]);
    this.formErrors.set({});

    const editData: Record<string, any> = {};
    for (const f of this.formFields()) {
      editData[f.column_name] = row[f.column_name] !== undefined ? row[f.column_name] : '';
    }
    this.formData.set(editData);

    // Load dropdown options
    this.loadAllDropdownOptions();

    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  loadAllDropdownOptions(): void {
    const dropdownFields = this.formFields().filter((f) => f.field_type === 'dropdown');
    for (const field of dropdownFields) {
      this.loadDropdownOptions(field.column_name);
    }
  }

  loadDropdownOptions(columnName: string, parentVal?: any): void {
    const params = parentVal ? { parentValue: parentVal } : undefined;
    this.api
      .apiCall<ApiResponse<Array<{ value: any; label: string }>>>({
        path: `dynamic-master/${this.masterCode()}/dropdown/${columnName}`,
        method: 'GET',
        params,
      })
      .subscribe({
        next: (res) => {
          if (res.success && res.data) {
            const current = { ...this.dropdownOptions() };
            current[columnName] = res.data;
            this.dropdownOptions.set(current);
          }
        },
      });
  }

  onFieldChange(fieldName: string, value: any): void {
    const current = { ...this.formData() };
    current[fieldName] = value;
    this.formData.set(current);

    // Cascading dropdowns: check if any other field depends on this one!
    const dependentFields = this.formFields().filter((f) => f.depends_on === fieldName);
    for (const dep of dependentFields) {
      this.loadDropdownOptions(dep.column_name, value);
    }
  }

  saveRecord(): void {
    const data = this.formData();
    const errors: Record<string, string> = {};

    // Validate fields
    for (const f of this.formFields()) {
      if (f.required && (data[f.column_name] === undefined || data[f.column_name] === null || data[f.column_name] === '')) {
        errors[f.column_name] = `${f.label} is required`;
      } else if (f.regex && data[f.column_name]) {
        const regex = new RegExp(f.regex);
        if (!regex.test(String(data[f.column_name]))) {
          errors[f.column_name] = `Invalid format for ${f.label}`;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      this.formErrors.set(errors);
      this.toast.warning('Please fix the validation errors before saving.', 'Form Incomplete');
      return;
    }

    this.isSaving.set(true);

    if (this.modalMode() === 'create') {
      this.api
        .apiCall<ApiResponse>({
          path: `dynamic-master/${this.masterCode()}`,
          method: 'POST',
          payload: data,
        })
        .subscribe({
          next: (res) => {
            this.isSaving.set(false);
            if (res.success) {
              this.toast.success(res.message || 'Record created successfully', 'Saved');
              this.closeModal();
              this.loadMasterData();
            } else {
              this.toast.error(res.message || 'Failed to save record');
            }
          },
          error: (err) => {
            this.isSaving.set(false);
            this.toast.error(err.error?.message || 'Error creating record');
          },
        });
    } else {
      const pk = this.selectedId();
      this.api
        .apiCall<ApiResponse>({
          path: `dynamic-master/${this.masterCode()}/${pk}`,
          method: 'PUT',
          payload: data,
        })
        .subscribe({
          next: (res) => {
            this.isSaving.set(false);
            if (res.success) {
              this.toast.success(res.message || 'Record updated successfully', 'Updated');
              this.closeModal();
              this.loadMasterData();
            } else {
              this.toast.error(res.message || 'Failed to update record');
            }
          },
          error: (err) => {
            this.isSaving.set(false);
            this.toast.error(err.error?.message || 'Error updating record');
          },
        });
    }
  }

  deleteRecord(row: Record<string, any>): void {
    const pk = this.header()?.primary_key || 'id';
    const id = row[pk];
    if (!confirm('Are you sure you want to delete this record?')) return;

    this.api
      .apiCall<ApiResponse>({
        path: `dynamic-master/${this.masterCode()}/${id}`,
        method: 'DELETE',
      })
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.toast.success('Record removed successfully', 'Deleted');
            this.loadMasterData();
          } else {
            this.toast.error(res.message || 'Failed to delete record');
          }
        },
        error: (err) => {
          this.toast.error(err.error?.message || 'Error deleting record');
        },
      });
  }

  formatCellValue(col: DynamicMasterField, row: Record<string, any>): string {
    // If a foreign key display column was joined (e.g. parent_id_display), display it!
    const displayVal = row[`${col.column_name}_display`];
    if (displayVal !== undefined && displayVal !== null) {
      return String(displayVal);
    }

    const rawVal = row[col.column_name];
    if (rawVal === undefined || rawVal === null || rawVal === '') {
      return '—';
    }
    return String(rawVal);
  }
}
