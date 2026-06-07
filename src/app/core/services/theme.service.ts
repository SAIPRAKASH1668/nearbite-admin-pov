import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'yd_admin_theme';
  readonly mode = signal<ThemeMode>(this.initialMode());

  constructor() {
    this.apply(this.mode());
  }

  toggle(): void {
    this.setTheme(this.mode() === 'dark' ? 'light' : 'dark');
  }

  setTheme(mode: ThemeMode): void {
    this.mode.set(mode);
    localStorage.setItem(this.storageKey, mode);
    this.apply(mode);
  }

  private initialMode(): ThemeMode {
    const stored = localStorage.getItem(this.storageKey);
    return stored === 'light' ? 'light' : 'dark';
  }

  private apply(mode: ThemeMode): void {
    document.body.classList.toggle('theme-light', mode === 'light');
    document.body.classList.toggle('theme-dark', mode === 'dark');
    document.documentElement.style.colorScheme = mode;
  }
}
