import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private apiUrl = `${environment.apiUrl}/departments`;
  constructor(private http: HttpClient) {}
  getAll() { return this.http.get<any[]>(this.apiUrl); }
}
