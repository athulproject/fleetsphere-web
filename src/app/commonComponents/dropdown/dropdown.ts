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
import { LucideChevronDown, LucideSearch, LucideCheck, LucideX } from '@lucide/angular';

export interface DropdownOption {
  label: string;
  value: any;
  icon?: any;
  disabled?: boolean;
  description?: string;
}

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideChevronDown, LucideSearch, LucideCheck, LucideX],
  templateUrl: './dropdown.html',
})
export class DropdownComponent {
  private elementRef = inject(ElementRef);

  options = input<DropdownOption[]>([]);
  value = model<any>(null);
  label = input<string>('');
  placeholder = input<string>('Select an option');
  searchable = input<boolean>(false);
  searchPlaceholder = input<string>('Search options...');
  disabled = input<boolean>(false);
  clearable = input<boolean>(false);
  helperText = input<string>('');
  errorText = input<string>('');

  selectionChange = output<any>();

  isOpen = signal<boolean>(false);
  searchQuery = signal<string>('');

  selectedOption = computed(() => {
    const val = this.value();
    return this.options().find(opt => opt.value === val) ?? null;
  });

  filteredOptions = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return this.options();
    return this.options().filter(opt =>
      opt.label.toLowerCase().includes(query) ||
      (opt.description && opt.description.toLowerCase().includes(query))
    );
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

  select(option: DropdownOption): void {
    if (option.disabled) return;
    this.value.set(option.value);
    this.selectionChange.emit(option.value);
    this.isOpen.set(false);
  }

  clear(event?: Event): void {
    if (event) event.stopPropagation();
    this.value.set(null);
    this.selectionChange.emit(null);
  }
}
