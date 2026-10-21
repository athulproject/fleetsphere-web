import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loading.html',
})
export class LoadingComponent {
  mode = input<'spinner' | 'overlay' | 'skeleton'>('spinner');
  message = input<string>('Loading...');
  size = input<'sm' | 'md' | 'lg'>('md');
  fullscreen = input<boolean>(false);
}
