import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EmployeeListComponent } from './components/employee-list/employee-list.component';
import { EmployeeFormComponent } from './components/employee-form/employee-form.component';
import { UpdateEmployeeComponent } from './components/update-employee/update-employee.component';
import { ViewEmployeeComponent } from './components/view-employee/view-employee.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'employees', component: EmployeeListComponent },
  { path: 'add-employee', component: EmployeeFormComponent },
  { path: 'update-employee/:id', component: UpdateEmployeeComponent },
  { path: 'employees/:id', component: ViewEmployeeComponent },
];
