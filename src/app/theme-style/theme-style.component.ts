import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  ThemeService,
  HeaderColor,
  MenuColor,
  ColorMode,
  WorkspaceLayout,
  SidebarWidth,
  ACCENT_PALETTES,
  FONT_OPTIONS,
  LAYOUT_OPTIONS,
} from '../core/services/theme.service';
import { AuthService } from '../core/services/auth.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../commonComponents/breadcrumb/breadcrumb';
import { StatusToastService } from '../commonComponents/status-toastify/status-toastify.service';
import { DropdownComponent, DropdownOption } from '../commonComponents/dropdown/dropdown';
import {
  LucideSun,
  LucideMoon,
  LucideCheck,
  LucideRotateCcw,
  LucideSparkles,
} from '@lucide/angular';

@Component({
  selector: 'app-theme-style',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BreadcrumbComponent,
    DropdownComponent,
    LucideSun,
    LucideMoon,
    LucideCheck,
    LucideRotateCcw,
    LucideSparkles,
  ],
  templateUrl: './theme-style.component.html',
  styleUrl: './theme-style.component.css',
})
export class ThemeStyleComponent implements OnInit {
  public themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private toastService = inject(StatusToastService);
  private router = inject(Router);

  role = computed(() => this.authService.primaryRole());

  breadcrumbItems: BreadcrumbItem[] = [{ label: 'Theme Style' }]

  // Options catalogs
  palettes = ACCENT_PALETTES;
  fontOptions = FONT_OPTIONS;
  layoutOptions = LAYOUT_OPTIONS;

  // Dropdown options
  fontDropdownOptions: DropdownOption[] = FONT_OPTIONS.map(f => ({
    label: f.label,
    value: f.value,
  }));

  layoutDropdownOptions: DropdownOption[] = LAYOUT_OPTIONS.map(l => ({
    label: l.name,
    value: l.id,
    description: l.description,
  }));

  // Custom Hex state
  customHex = signal<string>('#187f65');
  saveSuccess = signal<boolean>(false);

  ngOnInit(): void {
    this.customHex.set(this.themeService.accentColor());
    // Load any synced backend preferences
    this.themeService.loadFromBackend();
  }

  // Header Color
  setHeaderColor(val: HeaderColor): void {
    this.themeService.setHeaderColor(val);
  }

  // Menu Color
  setMenuColor(val: MenuColor): void {
    this.themeService.setMenuColor(val);
  }

  // Color Mode (Page light / dark)
  setColorMode(val: ColorMode): void {
    this.themeService.setColorMode(val);
  }

  // Workspace Layout
  setLayout(val: WorkspaceLayout): void {
    this.themeService.setLayout(val);
  }

  // Sidebar Width
  setSidebarWidth(val: SidebarWidth): void {
    this.themeService.setSidebarWidth(val);
  }

  // Font Family
  setFontFamily(val: string): void {
    this.themeService.setFontFamily(val);
  }

  // Accent Color
  selectAccent(hex: string): void {
    this.customHex.set(hex);
    this.themeService.setAccentColor(hex);
  }

  applyCustomHex(): void {
    let hex = this.customHex().trim();
    if (!hex.startsWith('#')) {
      hex = `#${hex}`;
    }
    const isValid = /^#([A-Fa-f0-9]{3}){1,2}$/.test(hex);
    if (!isValid) {
      this.toastService.show('warning', 'Please enter a valid hexadecimal color (e.g. #187f65)', {
        title: 'Invalid Color',
      });
      return;
    }
    this.customHex.set(hex);
    this.themeService.setAccentColor(hex);
    this.toastService.show('success', `Accent color updated to ${hex}`, {
      title: 'Accent Applied',
    });
  }

  async saveChanges(): Promise<void> {
    const success = await this.themeService.saveToBackend();
    if (success) {
      this.saveSuccess.set(true);
      setTimeout(() => this.saveSuccess.set(false), 3000);
      this.toastService.show('success', 'Your workspace theme has been saved successfully.', {
        title: 'Preferences Saved',
      });
    } else {
      this.toastService.show('info', 'Your theme is active and saved locally on this browser.', {
        title: 'Local Preferences Saved',
      });
    }
  }

  resetDefaults(): void {
    this.themeService.resetToDefaults();
    this.customHex.set(this.themeService.accentColor());
    this.toastService.show('info', 'Workspace theme preferences restored to defaults.', {
      title: 'Reset to Default',
    });
  }
}
