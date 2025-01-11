import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { Component } from '@angular/core';
import { User } from '../../model/user';
import { UserService } from '../../service/user.service';

@Component({
  selector: 'app-top-bar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container">
      <div class="currpage">{{this.current}} </div>
      <div class="user">
        <div class="notification" [routerLink]="['/dashboard']"fragment="notification-element">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="fill: rgba(0, 0, 0, 1);transform: ;msFilter:;"><path d="M12 22a2.98 2.98 0 0 0 2.818-2H9.182A2.98 2.98 0 0 0 12 22zm7-7.414V10c0-3.217-2.185-5.927-5.145-6.742C13.562 2.52 12.846 2 12 2s-1.562.52-1.855 1.258C7.185 4.074 5 6.783 5 10v4.586l-1.707 1.707A.996.996 0 0 0 3 17v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-1a.996.996 0 0 0-.293-.707L19 14.586z"></path></svg>
        </div>
        <div class="name"> {{this.user.username}} </div>
        <div class="usericon" routerLink="/profil">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" style="fill: rgba(0, 0, 0, 1);transform: ;msFilter:;"><path d="M12 2A10.13 10.13 0 0 0 2 12a10 10 0 0 0 4 7.92V20h.1a9.7 9.7 0 0 0 11.8 0h.1v-.08A10 10 0 0 0 22 12 10.13 10.13 0 0 0 12 2zM8.07 18.93A3 3 0 0 1 11 16.57h2a3 3 0 0 1 2.93 2.36 7.75 7.75 0 0 1-7.86 0zm9.54-1.29A5 5 0 0 0 13 14.57h-2a5 5 0 0 0-4.61 3.07A8 8 0 0 1 4 12a8.1 8.1 0 0 1 8-8 8.1 8.1 0 0 1 8 8 8 8 0 0 1-2.39 5.64z"></path><path d="M12 6a3.91 3.91 0 0 0-4 4 3.91 3.91 0 0 0 4 4 3.91 3.91 0 0 0 4-4 3.91 3.91 0 0 0-4-4zm0 6a1.91 1.91 0 0 1-2-2 1.91 1.91 0 0 1 2-2 1.91 1.91 0 0 1 2 2 1.91 1.91 0 0 1-2 2z"></path></svg>
        </div>
      </div>
    </div>
  `,
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {
  user: User = this.userService.empty();
  nom: string = 'naVas';
  prenom: string = 'naVas';
  current: string = 'Dashboard';
  
  constructor(
    private router: Router,
    private userService: UserService
  ){ }

  ngOnInit(){
    this.chargerUserName();
    this.router.events.subscribe(event =>{
      if(event instanceof NavigationEnd){
        let compo = event.urlAfterRedirects.slice(1);
        this.current = compo.charAt(0).toUpperCase() + compo.slice(1).toLowerCase();
      }
    });
  }

  async chargerUserName(){
    this.user = await this.userService.chargerUser();
    // this.nom = this.user.full_name.split(' ')[0].toUpperCase();
    // this.prenom = this.user.full_name.split(' ')[1];
  }

}
