import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { StatusToastifyComponent } from './commonComponents/status-toastify/status-toastify';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, StatusToastifyComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('FleetSphere');
}
