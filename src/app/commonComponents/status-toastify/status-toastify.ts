import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusToastService } from './status-toastify.service';

@Component({
  selector: 'app-status-toastify',
  standalone: true,
  imports: [CommonModule],
  template: ``,
})
export class StatusToastifyComponent {
  public toastService = inject(StatusToastService);
}
