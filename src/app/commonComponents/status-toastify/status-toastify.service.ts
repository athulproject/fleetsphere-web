import { Injectable } from '@angular/core';
import Toastify from 'toastify-js';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  duration?: number;
  close?: boolean;
  gravity?: 'top' | 'bottom';
  position?: 'left' | 'center' | 'right';
  onClick?: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class StatusToastService {

  public show(type: ToastType, message: string, options?: ToastOptions): any {
    const title = options?.title || this.getDefaultTitle(type);
    const duration = options?.duration !== undefined ? options.duration : type === 'error' ? 7000 : 5000;
    const iconSvg = this.getIconSvg(type);

    const safeTitle = this.escapeHtml(title);
    const safeMessage = this.escapeHtml(message);

    const htmlContent = `
      <div class="fs-toast-wrapper">
        <div class="fs-toast-icon">${iconSvg}</div>
        <div class="fs-toast-content">
          <strong class="fs-toast-title">${safeTitle}</strong>
          <p class="fs-toast-message">${safeMessage}</p>
        </div>
      </div>
    `;

    const toastInstance = Toastify({
      text: htmlContent,
      duration: duration,
      close: options?.close !== false,
      gravity: options?.gravity || 'top',
      position: options?.position || 'right',
      stopOnFocus: true,
      escapeMarkup: false,
      className: `toastify-custom-${type}`,
      onClick: options?.onClick,
    });

    toastInstance.showToast();
    return toastInstance;
  }

  public success(message: string, title?: string, duration?: number): any {
    return this.show('success', message, { title: title || 'Success', duration });
  }

  public error(message: string, title?: string, duration?: number): any {
    return this.show('error', message, { title: title || 'Error Occurred', duration: duration ?? 7000 });
  }

  public warning(message: string, title?: string, duration?: number): any {
    return this.show('warning', message, { title: title || 'Warning', duration });
  }

  public info(message: string, title?: string, duration?: number): any {
    return this.show('info', message, { title: title || 'Information', duration });
  }

  private getDefaultTitle(type: ToastType): string {
    switch (type) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error Occurred';
      case 'warning':
        return 'Warning';
      case 'info':
        return 'Notice';
    }
  }

  private getIconSvg(type: ToastType): string {
    switch (type) {
      case 'success':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
      case 'error':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>`;
      case 'warning':
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`;
      case 'info':
      default:
        return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>`;
    }
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
