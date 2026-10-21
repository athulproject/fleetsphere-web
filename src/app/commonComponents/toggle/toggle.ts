import { Component, input, model, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle.html',
})
export class ToggleComponent {
  checked = model<boolean>(false);
  label = input<string>('');
  description = input<string>('');
  disabled = input<boolean>(false);
  size = input<'sm' | 'md' | 'lg'>('md');

  toggleChange = output<boolean>();

  onToggle(): void {
    if (this.disabled()) return;
    const next = !this.checked();
    this.checked.set(next);
    this.toggleChange.emit(next);
  }
}
