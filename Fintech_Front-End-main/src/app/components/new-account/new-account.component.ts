import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { User } from '../../model/user';
import { UserService } from '../../service/user.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatDatepickerModule} from '@angular/material/datepicker';;
import {provideNativeDateAdapter} from '@angular/material/core';
import { NgIf } from '@angular/common';
import { MetaMaskService } from '../../service/meta-mask.service';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Carte } from '../../model/carte';
import { CompteService } from '../../service/compte.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-new-account',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, NgIf],
  templateUrl: './new-account.component.html',
  styleUrl: './new-account.component.scss'
})
export class NewAccountComponent {
  userInfo!: FormGroup;
  carteInfo!: FormGroup;
  newUser: User = this.userService.empty()
  metaAdresse: string | null = null;
  carte: Carte = this.compteService.emptyCarte();
  check = false; // pour l'affichage du controle metamask
  first = true; // pour l'affichage du premier formulaire, si false le deuxieme formulaire ne s'affiche pas
  passwrd = false; //false lorsque les deux mdp ne correspond pas
  
  constructor(
    private router: Router,
    private fb: FormBuilder,
    private userService: UserService,
    private metaMaskService: MetaMaskService,
    private snackBar: MatSnackBar,
    private compteService: CompteService
  ) { }

  ngOnInit(): void {
    this.userInfo = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      // tele: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      // address: ['', Validators.required],
      // dob: ['', Validators.required],
      // accountType: ['', Validators.required],
      terms: [false, Validators.requiredTrue],
      meta_mask_address: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]]
    });
    this.userInfo.get('meta_mask_address')?.markAsDirty();

    this.carteInfo = this.fb.group({
      account_number: ['', [Validators.required, Validators.pattern('^[0-9]{16}$')]],
      cvv: ['', [Validators.required, Validators.pattern('^[0-9]{3}$')]],
      mois: ['', [Validators.required, Validators.pattern('^[0-9]{2}$'), Validators.min(1), Validators.max(12)]],
      annee: ['', [Validators.required, Validators.pattern('^[0-9]{4}$'), Validators.min(new Date().getFullYear()), Validators.max(new Date().getFullYear() + 10)]],
    });

  }

  checkpassword() {
    if (this.userInfo.get('password')?.value !== this.userInfo.get('confirmPassword')?.value) {
      this.userInfo.get('confirmPassword')?.setErrors({ 'incorrect': true });
      this.passwrd = false;
    } else {
      this.userInfo.get('confirmPassword')?.setErrors(null);
      this.passwrd = true;
    }
  }

  async sendUser() {
    if (this.userInfo.valid && !this.passwrd) {
      this.mapValuesUser();
      console.log('New User:', this.newUser);
      try{
          let result = await this.userService.createUser(this.newUser);
          if(result.access_token){
            this.first = false;
            Swal.fire({
              title: 'Succès!',
              text: 'Compte créé avec succès!',
              icon: 'success',
              confirmButtonText: 'OK',
              confirmButtonColor: '#064494',
              draggable: true
            });
          }
      }catch(e){
        this.snackBar.open('Une erreur s\'est produite lors de la création de votre compte. Veuillez réessayer plus tard.', 'Fermer', { duration: 3000 });
      }
    } else {
      this.invalidKeys();
    }
  }

  async sendCard() {
    if (this.carteInfo.valid) {
      this.mapValuesCarte();
      console.log('Carte:', this.carte);
      try{
        let newCarte = await this.compteService.createCarte(this.carte);
        if (newCarte && newCarte.status === 201) {
          this.snackBar.open('Carte ajoutée avec succès!', 'Close', { duration: 3000 });
          alert('Carte ajoutée avec succès!');
          this.toLogin();
        }
        if(newCarte){
          this.snackBar.open('Carte ajoutée avec succès!', 'Close', { duration: 3000 });
          alert('Carte ajoutée avec succès!');
          this.toLogin();
        }
      }catch(e){
        this.snackBar.open('Une erreur s\'est produite lors de l\'ajout de votre carte. Veuillez réessayer plus tard.', 'Fermer', { duration: 3000 });
      }
    } else {
      this.snackBar.open('Please check the input fields.', 'Close', { duration: 3000 });
    }
  }
  mapValuesUser(): void {
    this.newUser.username = this.userInfo.get('username')?.value;
    this.newUser.full_name = this.userInfo.get('prenom')?.value + ' ' + this.userInfo.get('nom')?.value;
    this.newUser.email = this.userInfo.get('email')?.value;
    this.newUser.meta_mask_address = this.userInfo.get('meta_mask_address')?.value;
    if(!this.passwrd){
      this.newUser.password = this.userInfo.get('password')?.value;
    }
  }

  mapValuesCarte(): void {
    this.carte.account_number = this.carteInfo.get('account_number')?.value;
    this.carte.expiry_date = this.carteInfo.get('mois')?.value + '/' + this.carteInfo.get('annee')?.value.slice(-2);
    this.carte.cvv = this.carteInfo.get('cvv')?.value;
    this.carte.currency = "ETH";
    this.carte.card_type = "Visa";
  }

  async connectMetamask(): Promise<void> {
    try {
      const connected = await this.metaMaskService.connectWallet();
      if (connected) {
        const account = await firstValueFrom(this.metaMaskService.account$);
        if (account) {
          // Update form control instead of directly setting value
          this.userInfo.patchValue({ meta_mask_address: account });
          this.newUser.meta_mask_address = account;
          this.check = true
        } else {
          this.check = false
          throw new Error('No account found');
        }
      } else {
        this.check = false
        throw new Error('Connection failed');
      }
    } catch (error) {
      console.error('MetaMask connection error:', error);
      // Consider adding user notification here
      console.log('MetaMask is not connected. Please connect MetaMask to continue.');
    }
  }

  invalidKeys(){
    console.log('Form is invalid. Please check the input fields.');
      const invalidControlsWithErrors = Object.keys(this.userInfo.controls)
        .filter(key => this.userInfo.get(key)?.invalid)
        .map(key => ({
          key: key,
          errors: this.userInfo.get(key)?.errors
        }));
    console.log('the invalid fields are:', invalidControlsWithErrors);
  }

  toggleInvalidClass(input: string) {
    let formInput = this.userInfo.get(input);
    if (formInput?.invalid &&
      (formInput.dirty || formInput.touched)) {
      return true;
    }
    return false;
  }

  toggleInvalidClass2(input: string) {
    let formInput = this.carteInfo.get(input);
    if (formInput?.invalid &&
      (formInput.dirty || formInput.touched)) {
      return true;
    }
    return false;
  }

  toLogin(){
    this.router.navigateByUrl('/login');
  }

}
