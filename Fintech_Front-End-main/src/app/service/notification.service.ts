import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { NotificationModel } from '../model/notification-model';
import { HttpClient ,HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  url: string = window.env?.GATEWAY_URL || 'http://localhost:8005';

  constructor(private http: HttpClient) {}

  getNotification(): Observable<NotificationModel[]> {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No token found in local storage.');
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<NotificationModel[]>(`${this.url}/notifications`, { headers });
  }
}