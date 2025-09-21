import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentService } from '../../services/department-service.service';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styles: [`
    .custom-scrollbar-dark::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar-dark::-webkit-scrollbar-track {
      background: rgba(31, 41, 55, 0.5);
      border-radius: 10px;
    }
    .custom-scrollbar-dark::-webkit-scrollbar-thumb {
      background: rgba(99, 102, 241, 0.6);
      border-radius: 10px;
    }
    .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
      background: rgba(99, 102, 241, 0.8);
    }

    .custom-scrollbar-light::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar-light::-webkit-scrollbar-track {
      background: rgba(229, 231, 235, 0.5);
      border-radius: 10px;
    }
    .custom-scrollbar-light::-webkit-scrollbar-thumb {
      background: rgba(99, 102, 241, 0.4);
      border-radius: 10px;
    }
    .custom-scrollbar-light::-webkit-scrollbar-thumb:hover {
      background: rgba(99, 102, 241, 0.6);
    }

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
    .animate-fadeIn {
      animation: fadeIn 0.5s ease-out forwards;
    }
    
    @media (min-width: 475px) {
      .xs\\:grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  totalEmployees = 0;
  departmentCount = 0;
  recentHires = 0;
  avgEmployeesPerDept = 0;
  hasDepartmentData = false;
  recentActivities: any[] = [];
  private chart: any;
  private lastDeptCounts: any = {};
  private themeSub!: Subscription;

  // Track dark mode state
  isDarkMode = true;

  // Chart colors for both themes
  lightColors: string[] = [
    '#EF4444','#F59E0B','#10B981','#3B82F6',
    '#8B5CF6','#EC4899','#14B8A6','#F97316',
    '#6366F1','#84CC16','#06B6D4','#D946EF','#22C55E'
  ];
  darkColors: string[] = this.lightColors
  
  // Chart controls
  chartTypes = ['doughnut', 'pie', 'bar', 'line', 'polarArea', 'radar'];
  selectedChartType: string = 'doughnut';
  chartSizes = ['small', 'medium', 'large'];
  selectedChartSize: string = 'medium';

  constructor(
    private empSvc: EmployeeService, 
    private deptSvc: DepartmentService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
    window.addEventListener('resize', this.handleResize.bind(this));

    // Listen to theme changes
    this.themeSub = this.themeService.darkMode$.subscribe(mode => {
      this.isDarkMode = mode;
      if (this.hasDepartmentData) {
        this.createDepartmentChart(this.lastDeptCounts); // redraw chart with new theme
      }
    });
  }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
    window.removeEventListener('resize', this.handleResize.bind(this));
    if (this.themeSub) this.themeSub.unsubscribe();
  }

  handleResize() {
    if (this.chart && this.hasDepartmentData) {
      this.chart.resize();
    }
  }

  loadDashboardData() {
    this.empSvc.getAll({ page: 1, limit: 1000 }).subscribe((res: { data: any[] }) => {
      const employees = res.data || [];
      this.totalEmployees = employees.length;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      this.recentHires = employees.filter(emp => {
        const hireDate = new Date(emp.createdAt || emp.joinedAt || emp.hireDate || Date.now());
        return hireDate >= thirtyDaysAgo;
      }).length;

      const deptCounts: any = {};
      employees.forEach(emp => {
        const name = emp.department?.name || 'Other';
        deptCounts[name] = (deptCounts[name] || 0) + 1;
      });

      this.departmentCount = Object.keys(deptCounts).length;
      this.avgEmployeesPerDept = this.totalEmployees / (this.departmentCount || 1);

      if (this.departmentCount > 0) {
        this.hasDepartmentData = true;
        this.lastDeptCounts = deptCounts;
        setTimeout(() => this.createDepartmentChart(deptCounts), 100);
      }

      this.generateRecentActivities(employees);
    });

    this.deptSvc.getAll().subscribe((d: any[]) => {
      this.departmentCount = Math.max(this.departmentCount, d.length);
    });
  }

  // Chart generator with theme-aware colors
  createDepartmentChart(deptCounts: { [key: string]: number }) {
    if (this.chart) {
      this.chart.destroy();
    }

    const deptNames = Object.keys(deptCounts);
    const deptValues = Object.values(deptCounts);

    const backgroundColors = deptNames.map((_, i) => 
      (this.isDarkMode ? this.darkColors[i % this.darkColors.length] : this.lightColors[i % this.lightColors.length])
    );

    const ctx = (document.getElementById('deptChart') as HTMLCanvasElement).getContext('2d');

    this.chart = new Chart(ctx!, {
      type: this.selectedChartType as any,
      data: {
        labels: deptNames,
        datasets: [{
          label: 'Employees',
          data: deptValues,
          backgroundColor: backgroundColors,
          borderColor: this.isDarkMode ? 'rgba(209,213,219,0.8)' : 'rgba(31,41,55,0.8)',
          borderWidth: 2,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: window.innerWidth < 640 ? 'bottom' : 'right',
            labels: {
              color: this.isDarkMode ? '#E5E7EB' : '#111827',
              font: { size: window.innerWidth < 640 ? 10 : 12 },
              padding: 15
            }
          }
        },
        scales: this.selectedChartType === 'bar' || this.selectedChartType === 'line'
          ? {
              x: { ticks: { color: this.isDarkMode ? '#E5E7EB' : '#111827' }, grid: { color: this.isDarkMode ? '#374151' : '#D1D5DB' } },
              y: { ticks: { color: this.isDarkMode ? '#E5E7EB' : '#111827' }, grid: { color: this.isDarkMode ? '#374151' : '#D1D5DB' } }
            }
          : {}
      }
    });
  }

  updateChartType() {
    if (this.hasDepartmentData) {
      this.createDepartmentChart(this.lastDeptCounts);
    }
  }

  updateChartSize() {
    setTimeout(() => {
      if (this.chart) this.chart.resize();
    }, 100);
  }

  getChartSizeClass() {
    switch (this.selectedChartSize) {
      case 'small': return 'h-48 md:h-60';
      case 'large': return 'h-96 md:h-[500px]';
      default: return 'h-64 md:h-80';
    }
  }

  generateRecentActivities(employees: any[]) {
    this.recentActivities = [];
    const sorted = [...employees].sort((a, b) => {
      const aTime = Math.max(new Date(a.createdAt || 0).getTime(), new Date(a.updatedAt || 0).getTime());
      const bTime = Math.max(new Date(b.createdAt || 0).getTime(), new Date(b.updatedAt || 0).getTime());
      return bTime - aTime;
    }).slice(0, 10);

    sorted.forEach(emp => {
      const created = new Date(emp.createdAt || 0).getTime();
      const updated = new Date(emp.updatedAt || 0).getTime();
      const now = Date.now();
      if (updated > created + 1000 && updated > now - 30 * 24 * 3600 * 1000) {
        this.recentActivities.push({ type: 'update', message: 'Employee updated: ' + (emp.name || 'Unknown'), timestamp: emp.updatedAt });
      } else if (created > now - 30 * 24 * 3600 * 1000) {
        this.recentActivities.push({ type: 'new', message: 'New employee added: ' + (emp.name || 'Unknown'), timestamp: emp.createdAt });
      }
    });

    this.recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).splice(5);
  }

  getActivityIcon(type: string) {
    switch (type) {
      case 'new': return 'M12 6v6m0 0v6m0-6h6m-6 0H6';
      case 'update': return 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z';
      case 'delete': return 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16';
      default: return 'M12 8v4l3 3';
    }
  }
}