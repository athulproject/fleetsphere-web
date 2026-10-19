import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideChevronDown, LucideSearch, LucideX } from '@lucide/angular';

export interface MultiDropdownOption {
  label: string;
  value: any;
  group?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-multiselection-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideChevronDown, LucideSearch, LucideX],
  templateUrl: './multiselection-dropdown.html',
})
export class MultiselectionDropdownComponent {
  private elementRef = inject(ElementRef);

  options = input<MultiDropdownOption[]>([]);
  values = model<any[]>([]);
  label = input<string>('');
  placeholder = input<string>('Select options');
  searchable = input<boolean>(true);
  showSelectAll = input<boolean>(true);
  maxDisplayTags = input<number>(2);
  disabled = input<boolean>(false);
  errorText = input<string>('');
  helperText = input<string>('');

  selectionChange = output<any[]>();

  isOpen = signal<boolean>(false);
  searchQuery = signal<string>('');

  selectedOptions = computed(() => {
    const set = new Set(this.values());
    return this.options().filter(opt => set.has(opt.value));
  });

  filteredOptions = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.options();
    return this.options().filter(opt => opt.label.toLowerCase().includes(q));
  });

  isAllSelected = computed(() => {
    const available = this.options().filter(o => !o.disabled);
    return available.length > 0 && available.every(o => this.values().includes(o.value));
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    if (!this.disabled()) {
      this.isOpen.update(v => !v);
      if (this.isOpen()) {
        this.searchQuery.set('');
      }
    }
  }

  isSelected(value: any): boolean {
    return this.values().includes(value);
  }

  toggleOption(option: MultiDropdownOption, event?: Event): void {
    if (event) event.stopPropagation();
    if (option.disabled) return;

    const current = [...this.values()];
    const index = current.indexOf(option.value);

    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(option.value);
    }

    this.values.set(current);
    this.selectionChange.emit(current);
  }

  removeTag(value: any, event?: Event): void {
    if (event) event.stopPropagation();
    const updated = this.values().filter(v => v !== value);
    this.values.set(updated);
    this.selectionChange.emit(updated);
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      this.values.set([]);
      this.selectionChange.emit([]);
    } else {
      const allValues = this.options().filter(o => !o.disabled).map(o => o.value);
      this.values.set(allValues);
      this.selectionChange.emit(allValues);
    }
  }

  clearAll(event?: Event): void {
    if (event) event.stopPropagation();
    this.values.set([]);
    this.selectionChange.emit([]);
  }
}
