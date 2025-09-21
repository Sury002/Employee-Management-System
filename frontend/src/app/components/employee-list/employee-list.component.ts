import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EmployeeService } from '../../services/employee.service';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, Subscription } from 'rxjs';
import { Sort } from '@angular/material/sort';
import { PageEvent } from '@angular/material/paginator';
import { ThemeService } from '../../services/theme.service'; 

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.css'],
})
export class EmployeeListComponent implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = [
    'name',
    'email',
    'department',
    'role',
    'age',
    'actions',
  ];
  dataSource = new MatTableDataSource<any>([]);
  total = 0;
  pageSize = 10;
  pageIndex = 0;
  q = '';
  sortField = 'createdAt';
  sortDir: 'asc' | 'desc' = 'desc';
  loading = false;
  isDarkMode = true;
  private themeSub!: Subscription;

  private searchSubject = new Subject<string>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private empSvc: EmployeeService, private router: Router,  private themeService: ThemeService) {}

  ngOnInit() {
    this.load();
    this.searchSubject.pipe(debounceTime(400)).subscribe(() => this.search());
    
    // Subscribe to theme changes
    this.themeSub = this.themeService.darkMode$.subscribe(mode => {
      this.isDarkMode = mode;
    });
  }

  ngOnDestroy() {
    if (this.themeSub) {
      this.themeSub.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;

    // Set up paginator change event
    if (this.paginator) {
      this.paginator.page.subscribe((event) => {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.load();
      });
    }
  }

  load() {
    this.loading = true;
    this.empSvc
      .getAll({
        page: this.pageIndex + 1, // backend expects 1-based page
        limit: this.pageSize,
        q: this.q,
        sortField: this.sortField,
        sortDir: this.sortDir,
      })
      .subscribe(
        (res) => {
          this.dataSource.data = res.data || [];
          this.total = res.total || 0;

          // Update paginator length
          if (this.paginator) {
            this.paginator.length = this.total;
          }

          this.loading = false;
        },
        () => (this.loading = false)
      );
  }

  // Add this method to fix the error
  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  calculateAge(dob: string): number {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  }

  onSearchChange(value: string) {
    this.q = value;
    this.searchSubject.next(value);
  }

  search() {
    this.pageIndex = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.load();
  }

  clearSearch() {
    this.q = '';
    this.search();
  }

  onSortChange(event: Sort) {
    this.pageIndex = 0;

    let sortField = event.active;
    let sortDir = event.direction || 'asc';

    // Special case for Age -> actually sort by dob
    if (sortField === 'age') {
      sortField = 'dob';
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    }

    // Special case for Department (nested object)
    if (sortField === 'department') {
      sortField = 'department.name'; // adjust to match backend field
    }

    // Special case for Role (string field)
    if (sortField === 'role') {
      sortField = 'role'; // backend must allow sorting by role
    }

    this.sortField = sortField;
    this.sortDir = sortDir as 'asc' | 'desc';
    this.load();
  }

  goToAddEmployee() {
    this.router.navigate(['/add-employee']);
  }

  view(id: string) {
    this.router.navigate(['/employees', id]);
  }

  edit(id: string) {
    this.router.navigate(['/update-employee', id]);
  }

  confirmDelete(id: string) {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.empSvc.delete(id).subscribe(() => this.load());
    }
  }
}