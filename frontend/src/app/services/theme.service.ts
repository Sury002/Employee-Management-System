import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private darkMode = new BehaviorSubject<boolean>(true);
  darkMode$ = this.darkMode.asObservable();

  constructor() {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme ? savedTheme === 'dark' : true;
    this.setDarkMode(isDark);
  }

  toggleDarkMode() {
    const current = this.darkMode.value;
    this.setDarkMode(!current);
  }

  setDarkMode(isDark: boolean) {
    this.darkMode.next(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  }
}
