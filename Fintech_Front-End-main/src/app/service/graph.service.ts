import { Injectable } from '@angular/core';
import { HttpClient,HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';
import { GraphData } from '../model/graph-data';

@Injectable({
  providedIn: 'root'
})
export class GraphService {
  url: string = window.env?.GATEWAY_URL || 'http://localhost:8005';


  constructor(private http: HttpClient) { }

  chargeDonneesGraph(): Observable<GraphData[]> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<GraphData[]>(`${this.url}/transactions/graph_data`, { headers });
  }
}
