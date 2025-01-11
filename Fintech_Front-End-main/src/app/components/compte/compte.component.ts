import { Component, OnInit ,ChangeDetectorRef } from '@angular/core';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { CompteService } from '../../service/compte.service';
import { Compte } from '../../model/compte';
import { UserService } from '../../service/user.service';
import { User } from '../../model/user';
import { NgStyle } from '@angular/common';
import { Carte } from '../../model/carte';
import { firstValueFrom } from 'rxjs';
import { MetaMaskService } from '../../service/meta-mask.service';

@Component({
  selector: 'app-compte',
  standalone: true,
  imports: [MatProgressBarModule, NgStyle],
  templateUrl: './compte.component.html',
  styleUrls: ['./compte.component.scss']
})
export class CompteComponent implements OnInit{
  carte: Carte = this.compteService.carte;
  compte: Compte = this.compteService.empty();
  user: User = this.userService.empty();
  avancement: number = 0;
  numcarte: string = '404';
  balance: string = "";
  
  // nom: string = '';
  // prenom: string = '';

  constructor(
    public compteService: CompteService,
    private userService: UserService,
    private metaMaskService: MetaMaskService,
    private changeDetectorRef: ChangeDetectorRef
  ){ }

  async ngOnInit(){
    this.chargerCompte();
    this.chargerUser();
    this.chargerCarte();
    this.balance = await this.metaMaskService.getBalance();
    // this.nom = this.user.full_name.split(' ')[0].toUpperCase();
    // this.prenom = this.user.full_name.split(' ')[1];
  }

  async chargerCompte(){
    await this.compteService.getCompte().subscribe(element =>{
      if(element !== null){
        this.compte = element[0];
        this.avancement = Number(((this.compte.paye * 100) / this.compte.pretSold).toFixed(2));
        this.numcarte = this.carte.account_number.replace(/(\d{4})(?=\d)/g, '$1 ');
      }
    });
  }

  async chargerCarte() {
    try {
      const carte = await this.compteService.chargerCarte();
  
      if (carte && carte.account_number) {
        console.log('Carte data:', carte);
        this.carte = carte;
        this.changeDetectorRef.detectChanges();
      } else {
        console.log('No carte data found');
        this.carte = this.compteService.emptyCarte();
      }
    } catch (error) {
      console.error('Error in chargerCarte:', error);
    }
  }
  
  chargerUser() {
    this.userService.getUser().subscribe({
      next: (element) => {
        if (element) {
          this.user = element; // Direct assignment, as it's not an array
          console.log('User fetched successfully:', this.user);
        }
      },
      error: (error) => {
        console.error('Error fetching user:', error);
      },
    });
  }

}
