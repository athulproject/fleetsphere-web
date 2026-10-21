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
import {
  LucideChevronDown,
  LucideChevronUp,
  LucideSearch,
  LucideCheck,
  LucideX,
  LucidePlus,
} from '@lucide/angular';

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
  imports: [
    CommonModule,
    FormsModule,
    LucideChevronDown,
    LucideChevronUp,
    LucideSearch,
    LucideCheck,
    LucideX,
    LucidePlus,
  ],
  templateUrl: './dropdown.html',
})
export class DropdownComponent {
  private elementRef = inject(ElementRef);

  // Configuration Inputs
  options = input<DropdownOption[]>([]);
  value = model<any>(null);
  label = input<string>('');
  placeholder = input<string>('Select an option');
  required = input<boolean>(false);
  showSearch = input<boolean>(true);
  searchPlaceholder = input<string>('Search options...');
  disabled = input<boolean>(false);
  clearable = input<boolean>(false);
  helperText = input<string>('');
  errorMessage = input<string>('');
  loading = input<boolean>(false);

  // Inline Master Creation Support
  allowInlineCreate = input<boolean>(false);
  inlineMasterCode = input<string | null>(null);

  // Outputs
  selectionChange = output<any>();
  inlineCreateClick = output<string | null>();

  // Internal State
  isOpen = signal<boolean>(false);
  searchTerm = signal<string>('');

  selectedOption = computed(() => {
    const val = this.value();
    if (val === null || val === undefined || val === '') return null;
    return (
      this.options().find(
        (opt) => opt.value === val || String(opt.value) === String(val)
      ) ?? null
    );
  });

  filteredOptions = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.options();
    return this.options().filter(
      (opt) =>
        opt.label.toLowerCase().includes(term) ||
        (opt.description && opt.description.toLowerCase().includes(term))
    );
  });

  isOptionSelected(optionValue: any): boolean {
    const val = this.value();
    if (val === null || val === undefined || val === '') return false;
    return optionValue === val || String(optionValue) === String(val);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
      this.searchTerm.set('');
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen.set(false);
    this.searchTerm.set('');
  }

  toggle(): void {
    if (!this.disabled() && !this.loading()) {
      this.isOpen.update((v) => !v);
      if (this.isOpen()) {
        this.searchTerm.set('');
      }
    }
  }

  select(option: DropdownOption, event?: Event): void {
    if (event) event.stopPropagation();
    if (option.disabled) return;
    this.value.set(option.value);
    this.selectionChange.emit(option.value);
    this.isOpen.set(false);
    this.searchTerm.set('');
  }

  clear(event?: Event): void {
    if (event) event.stopPropagation();
    this.value.set(null);
    this.selectionChange.emit(null);
  }

  handleInlineCreate(event: Event): void {
    event.stopPropagation();
    this.isOpen.set(false);
    this.inlineCreateClick.emit(this.inlineMasterCode());
  }
}
