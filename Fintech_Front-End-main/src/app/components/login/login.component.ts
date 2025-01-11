import { AuthService } from './../../service/auth.service';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  error: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      mdp: ['', Validators.required]
    });
  }

  get email() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      const { username, mdp } = this.loginForm.value;
      try {
        const check = await this.authService.login(username, mdp);
        
        if (check) {
          await this.router.navigate(['/dashboard']);
          console.log('Login successful');
        } else {
          console.log('Login failed');
        }
      } catch (error) {
        console.error('Submit error:', error);
      }
    }
  }

  async connectMetamask() {
    try {
      this.error = '';
      const result = await this.authService.loginMeta();
      
      if (result) {
        console.log('MetaMask login successful');
        await this.router.navigate(['/dashboard']);
      } else {
        this.error = 'Failed to connect with MetaMask. Please try again.';
        console.log('MetaMask login failed');
      }
    } catch (error) {
      console.error('MetaMask connection error:', error);
      this.error = 'An error occurred while connecting to MetaMask.';
    }
  }

  toNewAcc() {
    this.router.navigate(['/newAccount']);
  }

}
