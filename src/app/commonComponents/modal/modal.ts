import { Component, HostListener, computed, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideX } from '@lucide/angular';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, LucideX],
  templateUrl: './modal.html',
})
export class ModalComponent {
  isOpen = model<boolean>(false);
  title = input<string>('');
  subtitle = input<string>('');
  size = input<ModalSize>('md');
  closeOnBackdrop = input<boolean>(true);
  closeOnEsc = input<boolean>(true);
  showCloseButton = input<boolean>(true);

  closed = output<void>();

  sizeClass = computed(() => {
    const map: Record<ModalSize, string> = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-2xl',
      full: 'max-w-5xl',
    };
    return map[this.size()] || 'max-w-md';
  });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen() && this.closeOnEsc()) {
      this.close();
    }
  }

  handleBackdropClick(): void {
    if (this.closeOnBackdrop()) {
      this.close();
    }
  }

  close(): void {
    this.isOpen.set(false);
    this.closed.emit();
  }
}
