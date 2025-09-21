import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private base = 'http://localhost:5000/api/employees';
  constructor(private http: HttpClient) {}

  getAll(opts?: { page?: number; limit?: number; q?: string; sortField?: string; sortDir?: string }) {
    let params = new HttpParams();
    if (opts?.page) params = params.set('page', String(opts.page));
    if (opts?.limit) params = params.set('limit', String(opts.limit));
    if (opts?.q) params = params.set('q', opts.q);
    if (opts?.sortField) params = params.set('sortField', opts.sortField);
    if (opts?.sortDir) params = params.set('sortDir', opts.sortDir);
    return this.http.get<{ data: any[]; total: number; page: number; limit: number }>(this.base, { params });
  }

  get(id: string) { return this.http.get(`${this.base}/${id}`); }
  create(payload: any) { return this.http.post(this.base, payload); }
  update(id: string, payload: any) { return this.http.put(`${this.base}/${id}`, payload); }
  delete(id: string) { return this.http.delete(`${this.base}/${id}`); }
}
