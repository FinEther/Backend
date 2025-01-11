import { Injectable } from '@angular/core';
import { MetaMaskService } from './meta-mask.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User } from '../model/user';
import { UserService } from './user.service';
import { Router } from '@angular/router';
import {jwtDecode} from 'jwt-decode';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user: User = this.userService.empty();
  url: string = window.env?.GATEWAY_URL || 'http://localhost:8005';//users
  private tokenKey: string = 'access_token';
  private checkInterval: number = 60 * 1000;
  private monitorInterval: any;

  constructor(
    private metamaskService: MetaMaskService,
    private http: HttpClient,
    private userService: UserService,
    private router: Router
    
  ) 
  {
    this.checkSatut();
    window.addEventListener('storage', (event) => {
      if (event.key === this.tokenKey && !event.newValue) {
        console.log('Token removed from another tab');
        this.handleLogout();
      }
    });
  }
  isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  }

  startTokenMonitor(): void {
    this.monitorInterval = setInterval(() => {
      const token = localStorage.getItem(this.tokenKey);
      if (token && this.isTokenExpired(token)) {
        this.clearToken();
        console.log('Token expired and removed from localStorage');
        this.handleLogout();
      }
    }, this.checkInterval);
  }

  stopTokenMonitor(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  handleLogout(): void {
    this.clearToken();
    window.location.href = '/login';
    Swal.fire({
              title: 'Oops...',
              text: "Session expired",
              icon: "info",
              confirmButtonText: 'OK',
              confirmButtonColor: '#064494',
            });
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      console.log('Attempting login...');
      const response = await firstValueFrom(
        this.http.post<{ access_token: string; token_type: string }>(
          `${this.url}/user/SignIn`,
          new URLSearchParams({ username , password }).toString(), // Form data format
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
      );
  
      console.log('Response from backend:', response);
  
      if (response && response.access_token) {
        localStorage.setItem(this.tokenKey, response.access_token);
        this.startTokenMonitor();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  async loginMeta(): Promise<string | null> {
    const connected = await this.metamaskService.connectWallet();
    if (!connected) return null;

    const account = await firstValueFrom(this.metamaskService.account$);
    if (!account) return null;

    const response = await firstValueFrom(
      this.http.post<{message: string, nonce: string}>(`${this.url}/users/nonce`, { 
        meta_mask_address: account 
      })
    );
    if (!response?.message) return null;

    const signature = await this.metamaskService.signMessage(response.message);

    const token = await this.userService.getUserByAdresse(account, signature);
  
    if (token) {
      console.log('Login successful, token stored.');
      return token;
    }
  
    console.log('Login failed.');
    return null;
  }
  
  

  checkSatut() {
    const createdUser = localStorage.getItem('user');
    if (createdUser) {
      this.user = JSON.parse(createdUser as string);
    }
  }

  logout() {
    this.user = this.userService.empty();
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }

}
