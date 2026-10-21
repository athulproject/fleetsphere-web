import { Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideCheck } from '@lucide/angular';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [CommonModule, LucideCheck],
  templateUrl: './checkbox.html',
})
export class CheckboxComponent {
  checked = model<boolean>(false);
  label = input<string>('');
  description = input<string>('');
  disabled = input<boolean>(false);
  errorText = input<string>('');

  change = output<boolean>();

  onToggle(): void {
    if (this.disabled()) return;
    const next = !this.checked();
    this.checked.set(next);
    this.change.emit(next);
  }
}
