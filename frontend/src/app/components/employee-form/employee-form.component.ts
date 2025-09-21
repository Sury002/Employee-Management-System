import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  FormGroup,
} from '@angular/forms';
import { EmployeeService } from '../../services/employee.service';
import { DepartmentService } from '../../services/department.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ThemeService } from '../../services/theme.service'; 
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employee-form.component.html',
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

      /* Enhanced Step Indicator Styles */
      .step-indicator-container {
        padding: 0 1.5rem;
        margin-bottom: 2rem;
      }

      .step {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        z-index: 2;
        transition: all 0.3s ease;
      }

      .step:hover .step-number-container {
        transform: scale(1.1);
      }

      .step-number-container {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.5rem;
        transition: all 0.3s ease;
      }

      .step.active .step-number-container {
        background-color: #4f46e5; /* indigo-600 */
        border-color: #6366f1; /* indigo-500 */
        box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.2);
      }

      .step.completed .step-number-container {
        background-color: #10b981; /* emerald-500 */
        border-color: #34d399; /* emerald-400 */
      }

      .step-number {
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .step.active .step-number {
        color: white;
      }

      .step.completed .step-number {
        color: white;
      }

      .step-label {
        font-size: 0.75rem;
        font-weight: 500;
        color: #9ca3af; /* gray-400 */
        text-align: center;
        margin-top: 0.25rem;
      }

      .step.active .step-label {
        color: rgba(81, 82, 85, 1); /* gray-800 */
        font-weight: 600;
      }

      /* Dark mode override */
      .step.active.dark .step-label {
        color: #e5e7eb; /* gray-200 */
      }

      .step.completed .step-label {
        color: rgba(81, 82, 85, 1); /* gray-800 */
      }

      .step.completed.dark .step-label {
        color: #d1d5db; /* gray-300 */
      }

      /* Responsive adjustments */
      @media (max-width: 640px) {
        .step-label {
          font-size: 0.7rem;
        }

        .step-number-container {
          width: 2rem;
          height: 2rem;
        }
      }

      .form-section {
        display: none;
      }
      .form-section.active {
        display: block;
        animation: fadeIn 0.5s ease-out;
      }
      .navigation-buttons {
        display: flex;
        justify-content: space-between;
        margin-top: 2rem;
      }
    `,
  ],
})
export class EmployeeFormComponent implements OnInit, OnDestroy {
  employeeForm!: FormGroup;
  departments: any[] = [];
  isEditMode = false;
  isLoading = false;
  employeeId: string | null = null;
  currentStep = 1;
  totalSteps = 4;
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
    private router: Router,
    private route: ActivatedRoute,
    private themeService: ThemeService // Inject ThemeService
  ) {
    this.createForm();
  }

  ngOnInit() {
    this.deptSvc.getAll().subscribe((d) => (this.departments = d));

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.employeeId = id;
        this.loadEmployeeData(id);
      }
    });

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
    this.employeeForm = this.fb.group({
      // Personal Information (Step 1)
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [
        '',
        [Validators.required, Validators.pattern(/^(\+\d{1,3}[- ]?)?\d{10}$/)],
      ],
      dob: ['', [Validators.required, this.ageValidator]],

      // Employment Details (Step 2)
      department: ['', Validators.required],
      role: ['', Validators.required],
      employmentType: ['', Validators.required],
      hireDate: ['', Validators.required],
      salary: ['', [Validators.min(0)]],
      employeeId: ['', Validators.required],

      // Address Information (Step 3)
      line1: ['', Validators.required],
      line2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zip: ['', Validators.required],
      country: ['', Validators.required],

      // Emergency Contact (Step 4)
      emergencyContactName: ['', Validators.required],
      emergencyContactPhone: [
        '',
        [Validators.required, Validators.pattern(/^(\+\d{1,3}[- ]?)?\d{10}$/)],
      ],
      emergencyContactRelationship: ['', Validators.required],
    });
  }

  private loadEmployeeData(id: string) {
    this.isLoading = true;
    this.empSvc.get(id).subscribe(
      (emp: any) => {
        this.isLoading = false;
        this.employeeForm.patchValue({
          name: emp.name,
          email: emp.email,
          phone: emp.phone,
          dob: emp.dob ? new Date(emp.dob).toISOString().substring(0, 10) : '',
          department: emp.department?._id || emp.department,
          role: emp.role,
          employmentType: emp.employmentType,
          hireDate: emp.hireDate
            ? new Date(emp.hireDate).toISOString().substring(0, 10)
            : '',
          salary: emp.salary,
          employeeId: emp.employeeId,
          line1: emp.address?.line1,
          line2: emp.address?.line2,
          city: emp.address?.city,
          state: emp.address?.state,
          zip: emp.address?.zip,
          country: emp.address?.country,
          emergencyContactName: emp.emergencyContact?.name,
          emergencyContactPhone: emp.emergencyContact?.phone,
          emergencyContactRelationship: emp.emergencyContact?.relationship,
        });
      },
      () => {
        this.isLoading = false;
        this.showPopup('Failed to load employee details', 'error');
        this.router.navigate(['/employees']);
      }
    );
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

  // Multi-step form navigation methods
  goToStep(step: number) {
    if (step < 1) step = 1;
    if (step > this.totalSteps) step = this.totalSteps;

    // Validate current step before proceeding
    if (step > this.currentStep) {
      if (!this.validateCurrentStep()) {
        return;
      }
    }

    this.currentStep = step;
  }

  nextStep() {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  validateCurrentStep(): boolean {
    let fieldsToValidate: string[] = [];

    switch (this.currentStep) {
      case 1:
        fieldsToValidate = ['name', 'email', 'phone', 'dob'];
        break;
      case 2:
        fieldsToValidate = [
          'department',
          'role',
          'employmentType',
          'hireDate',
          'employeeId',
        ];
        break;
      case 3:
        fieldsToValidate = ['line1', 'city', 'state', 'zip', 'country'];
        break;
      case 4:
        fieldsToValidate = [
          'emergencyContactName',
          'emergencyContactPhone',
          'emergencyContactRelationship',
        ];
        break;
    }

    // Mark fields as touched to trigger validation messages
    fieldsToValidate.forEach((field) => {
      const control = this.employeeForm.get(field);
      if (control) {
        control.markAsTouched();
      }
    });

    // Check if all fields in current step are valid
    const stepValid = fieldsToValidate.every((field) => {
      const control = this.employeeForm.get(field);
      return control ? control.valid : true;
    });

    if (!stepValid) {
      // Scroll to first error
      const firstErrorElement = document.querySelector('.ng-invalid');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }

    return stepValid;
  }

  isStepValid(step: number): boolean {
    let fieldsToCheck: string[] = [];

    switch (step) {
      case 1:
        fieldsToCheck = ['name', 'email', 'phone', 'dob'];
        break;
      case 2:
        fieldsToCheck = [
          'department',
          'role',
          'employmentType',
          'hireDate',
          'employeeId',
        ];
        break;
      case 3:
        fieldsToCheck = ['line1', 'city', 'state', 'zip', 'country'];
        break;
      case 4:
        fieldsToCheck = [
          'emergencyContactName',
          'emergencyContactPhone',
          'emergencyContactRelationship',
        ];
        break;
    }

    return fieldsToCheck.every((field) => {
      const control = this.employeeForm.get(field);
      return control ? control.valid : true;
    });
  }

  // Helper method to get step label text
  getStepLabel(step: number): string {
    switch (step) {
      case 1:
        return 'Personal';
      case 2:
        return 'Employment';
      case 3:
        return 'Address';
      case 4:
        return 'Emergency';
      default:
        return '';
    }
  }

  submit() {
    // Validate the final step before submission
    if (this.currentStep === this.totalSteps && !this.validateCurrentStep()) {
      return;
    }

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

    const operation = this.isEditMode
      ? this.empSvc.update(this.employeeId!, payload)
      : this.empSvc.create(payload);

    operation.subscribe(
      () => {
        this.isLoading = false;
        this.showPopup(
          `Employee ${this.isEditMode ? 'updated' : 'created'} successfully`,
          'success'
        );
        setTimeout(() => this.router.navigate(['/employees']), 1000);
      },
      (err) => {
        this.isLoading = false;
        this.showPopup(
          err.error?.error ||
            `Employee ${this.isEditMode ? 'update' : 'creation'} failed`,
          'error'
        );
      }
    );
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
