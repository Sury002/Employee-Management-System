import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html'
})
export class AppComponent {
  currentYear = new Date().getFullYear();
  isMobileMenuOpen = false;
  isDarkMode = true;

  constructor(private themeService: ThemeService) {
    this.themeService.darkMode$.subscribe(mode => this.isDarkMode = mode);
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }
}