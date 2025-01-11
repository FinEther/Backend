import { Injectable } from '@angular/core';
import { User } from '../model/user';
import { HttpClient, HttpResponse,HttpHeaders } from '@angular/common/http';
import { Observable,firstValueFrom } from 'rxjs';
import { MetaMaskService } from './meta-mask.service';
import { Token } from '@angular/compiler';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  url: string = window.env?.GATEWAY_URL || 'http://localhost:8005';
  user: User = this.empty();

  constructor(private http: HttpClient) { }

  getUser(): Observable<User> {
    const token = localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  
    return this.http.get<User>(`${this.url}/users/me`, { headers });
  }

  async createUser(newUser: User): Promise<{"access_token":string, "token_type":String}> {
    try {
      return new Promise((resolve) => {
        this.http.post<{"access_token":string, "token_type":String}>(`${this.url}/user/SignUp`, newUser)
        .subscribe( (jwt) => {
          if(jwt){
            localStorage.setItem('token', jwt.access_token);
            resolve(jwt);
          }
          else{
            throw new Error("Erreur lors de la création de l'utilisateur")
          }
        });
      });
    }catch(error){
      console.error(error);
      throw error;
    }
  }

  async chargerUser(): Promise<User> {
    try {
      this.user = await firstValueFrom(this.getUser());
      return this.user;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }
  

  async getUserBylogin(login: string, mdp: string): Promise<User>{
    return new Promise( (resolve) => {
      this.http.post<User[]>(`${this.url}/auth/login/`, {email: login, mdp: mdp})
        .subscribe(userBackend => {
          if(userBackend && userBackend.length > 0){
            this.user = userBackend[0];
            resolve(this.user);
          }
        });
    });
  }

  async getUserByAdresse(adresse: string, signature: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      this.http.post<{ access_token: string }>(`${this.url}/metamask/verify`, {
        meta_mask_address: adresse,
        signature: signature,
      }).subscribe(
        response => {
          if (response && response.access_token) {
            localStorage.setItem('access_token', response.access_token);
            resolve(response.access_token);
          } else {
            console.log('No token received from backend');
            resolve(null);
          }
        },
        error => {
          console.error('Error during API call:', error);
          reject(error);
        }
      );
    });
  }
  

  updateUser(newUser: User): Observable<User> {
    return this.http.patch<User>(`${this.url}/${newUser.id}`, newUser);
  }

  empty(): User{
    let user: User = {
      id: 404,
      meta_mask_address: "404",
      username: "vide",
      full_name: "vide",
      email: "vide",
      password: "vide"
    }
    return user;
  }

}
