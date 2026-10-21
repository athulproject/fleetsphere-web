import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../core/services/api.service';
import { AuthService } from '../core/services/auth.service';
import { StatusToastService } from '../commonComponents/status-toastify/status-toastify.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../commonComponents/breadcrumb/breadcrumb';
import { TableComponent, TableColumn } from '../commonComponents/table/table';
import { LoadingComponent } from '../commonComponents/loading/loading';
import type { ApiResponse } from '../core/models/auth.models';
import {
  LucidePlus,
  LucideRefreshCw,
  LucideFilePenLine,
  LucideTrash2,
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
  selector: 'app-dynamic-master-list',
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    TableComponent,
    LucidePlus,
    LucideRefreshCw,
    LucideFilePenLine,
    LucideTrash2,
  ],
  templateUrl: './dynamic-master-list.component.html',
})
export class DynamicMasterListComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private toast = inject(StatusToastService);

  masterCode = signal<string>('');
  header = signal<DynamicMasterHeader | null>(null);
  fields = signal<DynamicMasterField[]>([]);
  records = signal<Record<string, any>[]>([]);
  total = signal<number>(0);
  isLoading = signal<boolean>(false);
  deletingId = signal<any>(null);

  // Role prefix helper
  role = computed(() => this.authService.primaryRole());

  // Breadcrumb items
  breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const h = this.header();
    return [
      { label: 'Masters' },
      { label: h?.list_title || h?.header_name || 'Master List' },
    ];
  });

  // Table Columns mapped from metadata + Actions column
  tableColumns = computed<TableColumn[]>(() => {
    const listCols = this.fields()
      .filter((f) => f.show_in_list)
      .sort((a, b) => a.priority - b.priority);

    const cols: TableColumn[] = listCols.map((f) => ({
      header: f.list_label || f.label,
      accessor: f.dropdown_table ? `${f.column_name}_display` : f.column_name,
      sortable: true,
      cell: (row: any) => {
        // Resolve display label for foreign keys
        if (f.dropdown_table) {
          return row[`${f.column_name}_display`] || row[f.column_name] || '-';
        }
        if (f.field_type === 'toggle') {
          return row[f.column_name] ? 'Active' : 'Inactive';
        }
        return row[f.column_name] ?? '-';
      },
    }));

    // Add Actions column
    cols.push({
      header: 'Actions',
      accessor: '_actions',
      sortable: false,
      align: 'right',
      width: '120px',
    });

    return cols;
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
      .get<ApiResponse<DynamicMasterListResponse>>(`dynamic-master/${code}`)
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.header.set(res.data.header);
            this.fields.set(res.data.fields || []);
            this.records.set(res.data.records || []);
            this.total.set(res.data.total || 0);
          } else {
            this.toast.error(
              res.message || 'Failed to load master metadata.',
              'Loading Error'
            );
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          const msg =
            err.error?.message ||
            err.message ||
            'Could not retrieve master records.';
          this.toast.error(msg, 'Server Error');
        },
      });
  }

  // Navigate to Add New page
  navigateToAdd(): void {
    const role = this.role();
    const code = this.masterCode();
    this.router.navigate([`/${role}/master/${code}/create`]);
  }

  // Navigate to Edit page
  navigateToEdit(row: any, event?: Event): void {
    if (event) event.stopPropagation();
    const role = this.role();
    const code = this.masterCode();
    const pk = this.header()?.primary_key || 'id';
    const id = row[pk];
    if (id !== undefined && id !== null) {
      this.router.navigate([`/${role}/master/${code}/edit/${id}`]);
    }
  }

  // Delete record with confirmation
  deleteRecord(row: any, event?: Event): void {
    if (event) event.stopPropagation();
    const pk = this.header()?.primary_key || 'id';
    const id = row[pk];
    const labelField =
      this.fields().find((f) => f.priority === 2)?.column_name || pk;
    const itemLabel = row[labelField] || `#${id}`;

    if (!confirm(`Are you sure you want to delete "${itemLabel}"?`)) {
      return;
    }

    this.deletingId.set(id);
    this.api
      .delete<ApiResponse<any>>(`dynamic-master/${this.masterCode()}/${id}`)
      .subscribe({
        next: (res) => {
          this.deletingId.set(null);
          if (res.success) {
            this.toast.success(
              res.message || 'Record deleted successfully.',
              'Deleted'
            );
            this.loadMasterData();
          } else {
            this.toast.error(res.message || 'Failed to delete record.');
          }
        },
        error: (err) => {
          this.deletingId.set(null);
          this.toast.error(
            err.error?.message || 'Failed to delete record.',
            'Delete Error'
          );
        },
      });
  }
}
