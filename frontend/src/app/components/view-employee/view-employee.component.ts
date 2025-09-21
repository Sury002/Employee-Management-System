import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-view-employee',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './view-employee.component.html',
  styles: [`
    .animate-fade-in {
      animation: fadeIn 0.6s ease-out;
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class ViewEmployeeComponent implements OnInit, OnDestroy {
  emp: any;
  id = '';
  isLoading = false;
  isDarkMode = true;
  private themeSub!: Subscription;
  
  constructor(
    private route: ActivatedRoute, 
    private empSvc: EmployeeService, 
    private router: Router,
    private themeService: ThemeService
  ) {
    this.id = this.route.snapshot.paramMap.get('id') || '';
  }
  
  ngOnInit() { 
    this.load(); 
    
    // Subscribe to theme changes
    this.themeSub = this.themeService.darkMode$.subscribe((mode) => {
      this.isDarkMode = mode;
    });
  }
  
  ngOnDestroy() {
    if (this.themeSub) {
      this.themeSub.unsubscribe();
    }
  }
  
  load() { 
    if (!this.id) return;
    this.isLoading = true;
    this.empSvc.get(this.id).subscribe({
      next: (res) => {
        this.emp = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading employee:', err);
        this.isLoading = false;
      }
    }); 
  }
  
  navigateToEdit() { 
    this.router.navigate(['/update-employee', this.id]); 
  }
  
  deleteEmployee() {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;
    
    this.isLoading = true;
    this.empSvc.delete(this.id).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/employees']);
      },
      error: (err) => {
        console.error('Error deleting employee:', err);
        this.isLoading = false;
        alert('Failed to delete employee. Please try again.');
      }
    });
  }
} 