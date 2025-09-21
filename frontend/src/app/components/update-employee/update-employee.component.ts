import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentService } from '../../services/department.service'; 
import { ActivatedRoute, Router } from '@angular/router';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-update-employee',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './update-employee.component.html',
  styles: [
    `
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
        animation: fadeIn 0.3s ease-out forwards;
      }
    `,
  ],
})
export class UpdateEmployeeComponent implements OnInit, OnDestroy {
  employeeForm: FormGroup;
  departments: any[] = [];
  isLoading = false;
  id = '';
  isDarkMode = true;
  private themeSub!: Subscription;

  popup = {
    visible: false,
    message: '',
    type: 'success' as 'success' | 'error',
  };

  constructor(
    private fb: FormBuilder, 
    private empSvc: EmployeeService, 
    private deptSvc: DepartmentService, 
    private route: ActivatedRoute, 
    private router: Router,
    private themeService: ThemeService
  ) {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.employeeForm = this.createForm();
  }

  ngOnInit() { 
    this.loadDepartments(); 
    this.loadEmployee(); 
    
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

  createForm() {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^(\+\d{1,3}[- ]?)?\d{10}$/)],
      ],
      dob: ['', [Validators.required, this.ageValidator]],
      department: ['', Validators.required],
      role: ['', Validators.required],
      employmentType: ['', Validators.required],
      hireDate: ['', Validators.required],
      salary: ['', [Validators.min(0)]],
      employeeId: ['', Validators.required],
      line1: ['', Validators.required],
      line2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zip: ['', Validators.required],
      country: ['', Validators.required],
      emergencyContactName: ['', Validators.required],
      emergencyContactPhone: [
        '',
        [Validators.required, Validators.pattern(/^(\+\d{1,3}[- ]?)?\d{10}$/)],
      ],
      emergencyContactRelationship: ['', Validators.required],
    });
  }

  loadDepartments() { 
    this.deptSvc.getAll().subscribe(d => this.departments = d); 
  }

  loadEmployee() {
    if (!this.id) return;
    this.isLoading = true;
    this.empSvc.get(this.id).subscribe({
      next: (data: any) => {
        this.employeeForm.patchValue({
          name: data.name,
          email: data.email,
          phone: data.phone,
          department: data.department?._id || data.department,
          role: data.role,
          employmentType: data.employmentType,
          hireDate: data.hireDate ? new Date(data.hireDate).toISOString().substring(0, 10) : '',
          salary: data.salary,
          employeeId: data.employeeId,
          dob: data.dob ? new Date(data.dob).toISOString().substring(0, 10) : '',
          line1: data.address?.line1,
          line2: data.address?.line2,
          city: data.address?.city,
          state: data.address?.state,
          zip: data.address?.zip,
          country: data.address?.country,
          emergencyContactName: data.emergencyContact?.name,
          emergencyContactPhone: data.emergencyContact?.phone,
          emergencyContactRelationship: data.emergencyContact?.relationship,
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.showPopup('Failed to load employee details', 'error');
        this.router.navigate(['/employees']);
      }
    });
  }

  ageValidator(control: AbstractControl): { [key: string]: boolean } | null {
    if (control.value) {
      const birthDate = new Date(control.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      if (age < 18) {
        return { ageValidator: true };
      }
    }
    return null;
  }

  submit() {
    if (this.employeeForm.invalid) {
      this.employeeForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    const payload = {
      ...this.employeeForm.value,
      salary: this.employeeForm.value.salary
        ? Number(this.employeeForm.value.salary)
        : null,
      address: {
        line1: this.employeeForm.value.line1,
        line2: this.employeeForm.value.line2,
        city: this.employeeForm.value.city,
        state: this.employeeForm.value.state,
        zip: this.employeeForm.value.zip,
        country: this.employeeForm.value.country,
      },
      emergencyContact: {
        name: this.employeeForm.value.emergencyContactName,
        phone: this.employeeForm.value.emergencyContactPhone,
        relationship: this.employeeForm.value.emergencyContactRelationship,
      },
    };

    this.empSvc.update(this.id, payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.showPopup('Employee updated successfully', 'success');
        setTimeout(() => this.router.navigate(['/employees']), 1000);
      },
      error: (err) => {
        this.isLoading = false;
        this.showPopup(
          err.error?.error || 'Employee update failed',
          'error'
        );
      }
    });
  }

  cancel() { 
    this.router.navigate(['/employees']); 
  }

  showPopup(message: string, type: 'success' | 'error') {
     this.popup = { visible: true, message, type };
  }

  closePopup() {
    this.popup.visible = false;
  }
}