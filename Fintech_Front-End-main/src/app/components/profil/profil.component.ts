import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../model/user';
import { MatFormFieldModule } from '@angular/material/form-field';
import { UserService } from '../../service/user.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.scss'
})
export class ProfilComponent implements OnInit{
  userUpdate!: FormGroup;
  newUser: User = this.userService.empty();
  currentUser: User = this.userService.empty();

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) { }

  
ngOnInit(): void {
  this.chargerUser();
  this.userUpdate = this.fb.group({
    username: ['', Validators.required, [{ disabled: true }]],
    full_name: ['', Validators.required, [{ disabled: true }]],
    email: ['', [Validators.required, Validators.email], [{ disabled: true }]],
  });
}

async chargerUser() {
  try {
    this.currentUser = await firstValueFrom(this.userService.getUser());
  } catch (error) {
    console.error('Error fetching user:', error);
  }
}

  onFormSubmit(): void {
    if (this.userUpdate.valid) {
      this.newUser = this.userUpdate.value;
      console.log('New User:', this.newUser);
      // this.userService.updateUser(this.newUser);
    } else {
      console.log('Form is invalid. Please check the input fields.');
    }
  }

  

}
