import { UserService } from './user.service';
import { firstValueFrom, Observable } from 'rxjs';
import { HttpClient,HttpHeaders,HttpResponse } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { Compte } from '../model/compte';
import { Carte } from '../model/carte';
import { MetaMaskService } from './meta-mask.service';

@Injectable({
  providedIn: 'root'
})
export class CompteService implements OnInit{
  url: string = window.env?.GATEWAY_URL || 'http://localhost:8005';
  solde: string = "0";
  carte: Carte = this.emptyCarte();

  constructor(
    private http: HttpClient,
    private metamaskService: MetaMaskService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.chargerCarte();
  }

  getCompte(): Observable<Compte[]>{
    const token = localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });

    return this.http.get<Compte[]>(`${this.url}/user/account `, { headers });
  }

  getCarte(): Observable<Carte[]> {
    const token = localStorage.getItem('access_token');

    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });

    return this.http.get<Carte[]>(`${this.url}/user/account `, { headers });
  }

  async createCarte(carte: Carte): Promise<HttpResponse<Carte>> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
    try {
      const response = await firstValueFrom(
        this.http.post<Carte>(`${this.url}/user/add_account `, carte, {
          observe: 'response',
          headers: headers
        })
      );
      localStorage.removeItem('token');
      return response;
    } catch (error) {
      console.error('Error creating carte:', error);
      throw error;
    }
  }
  async chargerCarte(): Promise<Carte> {
    const token = localStorage.getItem('access_token');
  
    if (!token) {
      throw new Error('No access token found');
    }
  
    return new Promise((resolve, reject) => {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
      });
  
      this.http.get<Carte>(`${this.url}/user/account `, { headers })
        .subscribe(
          (carte) => {
            if (carte && carte.account_number) {
              this.carte = carte;
              resolve(carte);
            } else {
              resolve(this.emptyCarte());
            }
          },
          (error) => {
            console.error('Error fetching carte:', error);
            reject(error);
          }
        );
    });
  }

  emptyCarte(): Carte{
    let carte: Carte = {
      account_number: 'vide',
      expiry_date: 'vide',
      card_type: 'vide',
      cvv: 'vide',
      currency: 'vide'
    }
    return carte;
  }

  empty(): Compte{
    let compte: Compte = {
      numCompte: 404,
      numCarte: 404,
      money: "vide",
      dateExp: "01/25",
      balance: 404,
      nbrTransaction: 404,
      totalTransaction: 404,
      type: 'vide',
      etat: 'bloquée',
      pretSold: 404,
      paye: 404
    }
    return compte;
  }

}
