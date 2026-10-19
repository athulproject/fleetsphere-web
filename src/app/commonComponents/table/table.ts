import {
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideSearch,
  LucideArrowUpDown,
  LucideArrowUp,
  LucideArrowDown,
  LucideChevronLeft,
  LucideChevronRight,
  LucideInbox,
} from '@lucide/angular';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideSearch,
    LucideArrowUpDown,
    LucideArrowUp,
    LucideArrowDown,
    LucideChevronLeft,
    LucideChevronRight,
    LucideInbox,
  ],
  templateUrl: './table.html',
})
export class TableComponent {
  columns = input<TableColumn[]>([]);
  data = input<any[]>([]);
  loading = input<boolean>(false);
  selectable = input<boolean>(false);
  selectedRows = model<any[]>([]);
  pageSize = model<number>(10);
  searchable = input<boolean>(true);
  searchPlaceholder = input<string>('Search table...');
  emptyMessage = input<string>('No records found');
  rowKey = input<string>('id');

  rowClick = output<any>();
  selectionChange = output<any[]>();

  searchQuery = signal<string>('');
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');
  currentPage = signal<number>(1);

  filteredData = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const rows = this.data();
    if (!query) return rows;

    return rows.filter(row =>
      Object.values(row).some(val =>
        String(val ?? '').toLowerCase().includes(query)
      )
    );
  });

  sortedData = computed(() => {
    const rows = [...this.filteredData()];
    const col = this.sortColumn();
    const dir = this.sortDirection();

    if (!col) return rows;

    return rows.sort((a, b) => {
      const valA = a[col];
      const valB = b[col];

      if (valA == null && valB == null) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return dir === 'asc' ? valA - valB : valB - valA;
      }

      return dir === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  });

  totalPages = computed(() => {
    const total = this.sortedData().length;
    const size = this.pageSize();
    return Math.max(1, Math.ceil(total / size));
  });

  paginatedData = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return this.sortedData().slice(start, start + size);
  });

  startItemIndex = computed(() => {
    if (this.sortedData().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  });

  endItemIndex = computed(() => {
    return Math.min(this.currentPage() * this.pageSize(), this.sortedData().length);
  });

  isAllSelected = computed(() => {
    const pageRows = this.paginatedData();
    if (pageRows.length === 0) return false;
    const key = this.rowKey();
    const selectedKeys = new Set(this.selectedRows().map(r => r[key] ?? r));
    return pageRows.every(r => selectedKeys.has(r[key] ?? r));
  });

  toggleSort(column: TableColumn): void {
    if (!column.sortable) return;

    if (this.sortColumn() === column.key) {
      if (this.sortDirection() === 'asc') {
        this.sortDirection.set('desc');
      } else {
        this.sortColumn.set(null);
        this.sortDirection.set('asc');
      }
    } else {
      this.sortColumn.set(column.key);
      this.sortDirection.set('asc');
    }
  }

  isRowSelected(row: any): boolean {
    const key = this.rowKey();
    const targetId = row[key] ?? row;
    return this.selectedRows().some(r => (r[key] ?? r) === targetId);
  }

  toggleRow(row: any, event?: Event): void {
    if (event) event.stopPropagation();
    const key = this.rowKey();
    const targetId = row[key] ?? row;

    const current = [...this.selectedRows()];
    const index = current.findIndex(r => (r[key] ?? r) === targetId);

    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(row);
    }

    this.selectedRows.set(current);
    this.selectionChange.emit(current);
  }

  toggleSelectAll(): void {
    const key = this.rowKey();
    const pageRows = this.paginatedData();

    if (this.isAllSelected()) {
      const pageKeys = new Set(pageRows.map(r => r[key] ?? r));
      const remaining = this.selectedRows().filter(r => !pageKeys.has(r[key] ?? r));
      this.selectedRows.set(remaining);
      this.selectionChange.emit(remaining);
    } else {
      const current = [...this.selectedRows()];
      for (const row of pageRows) {
        const id = row[key] ?? row;
        if (!current.some(r => (r[key] ?? r) === id)) {
          current.push(row);
        }
      }
      this.selectedRows.set(current);
      this.selectionChange.emit(current);
    }
  }

  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(Number(newSize));
    this.currentPage.set(1);
  }

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }
}
